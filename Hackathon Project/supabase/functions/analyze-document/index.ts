// ============================================================
// LegasistAI - Edge Function: analyze-document
// POST /functions/v1/analyze-document
// Orchestrates the full AI analysis pipeline for a document
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o';
const MAX_CHUNK_CHARS = 12000; // ~3000 tokens per chunk
const DOCUMENTS_BUCKET = 'documents';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // ---- Auth -----------------------------------------------
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return errorResponse(401, 'Unauthorized');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return errorResponse(401, 'Unauthorized');

    const { document_id, force_reanalysis = false } = await req.json();
    if (!document_id) return errorResponse(400, 'document_id is required');

    // ---- Fetch document -------------------------------------
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', document_id)
      .eq('user_id', user.id)
      .single();

    if (docError || !doc) return errorResponse(404, 'Document not found');

    if (!force_reanalysis && doc.status === 'completed') {
      return jsonResponse(200, { analysis_id: null, status: 'completed', message: 'Already analyzed' });
    }

    // ---- Mark as processing ---------------------------------
    await supabase
      .from('documents')
      .update({ status: 'processing', processing_started_at: new Date().toISOString() })
      .eq('id', document_id);

    // ---- Extract text from storage (TXT/already-extracted) --
    let documentText = doc.extracted_text ?? '';

    if (!documentText) {
      // For TXT files: download and read directly
      if (doc.file_type === 'txt') {
        const { data: fileData, error: dlError } = await supabase.storage
          .from(DOCUMENTS_BUCKET)
          .download(doc.file_path);

        if (dlError || !fileData) {
          await markFailed(supabase, document_id, 'Failed to download document');
          return errorResponse(500, 'Failed to download document');
        }
        documentText = await fileData.text();
      } else {
        // For PDF/DOCX: text extraction happens client-side (PDF.js / mammoth)
        // and should have been stored already. If missing, fail gracefully.
        await markFailed(supabase, document_id, 'Document text not yet extracted');
        return errorResponse(422, 'Document text extraction required before analysis');
      }
    }

    if (!documentText || documentText.trim().length < 50) {
      await markFailed(supabase, document_id, 'Document text is too short or empty');
      return errorResponse(422, 'Document appears to be empty or unreadable');
    }

    // ---- Update word count and preview ----------------------
    const wordCount = documentText.split(/\s+/).filter(Boolean).length;
    const textPreview = documentText.trim().slice(0, 500);
    await supabase
      .from('documents')
      .update({ word_count: wordCount, text_preview: textPreview })
      .eq('id', document_id);

    // ---- Chunk document if large ----------------------------
    const chunks = chunkText(documentText, MAX_CHUNK_CHARS);

    const openaiKey = Deno.env.get('OPENAI_API_KEY')!;
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;

    // ---- Phase 1: Executive Analysis (full doc summary) -----
    const executiveResult = await callOpenAI(openaiKey, [
      { role: 'system', content: SYSTEM_PROMPT_EXECUTIVE },
      {
        role: 'user',
        content: `Analyze this legal document and respond with valid JSON only:\n\n---\n${documentText.slice(0, MAX_CHUNK_CHARS * 2)}\n---`,
      },
    ]);

    totalPromptTokens += executiveResult.usage?.prompt_tokens ?? 0;
    totalCompletionTokens += executiveResult.usage?.completion_tokens ?? 0;

    let executiveParsed: ExecutiveAnalysis;
    try {
      const raw = executiveResult.choices[0].message.content ?? '{}';
      executiveParsed = JSON.parse(cleanJSON(raw));
    } catch {
      await markFailed(supabase, document_id, 'Failed to parse executive analysis response');
      return errorResponse(500, 'AI analysis parsing failed');
    }

    // ---- Phase 2: Clause-level analysis per chunk -----------
    const allClauses: RawClause[] = [];

    for (let i = 0; i < Math.min(chunks.length, 5); i++) {
      const chunkResult = await callOpenAI(openaiKey, [
        { role: 'system', content: SYSTEM_PROMPT_CLAUSES },
        {
          role: 'user',
          content: `Extract and analyze clauses from this section of the document. Respond with JSON only:\n\n---\n${chunks[i]}\n---`,
        },
      ]);

      totalPromptTokens += chunkResult.usage?.prompt_tokens ?? 0;
      totalCompletionTokens += chunkResult.usage?.completion_tokens ?? 0;

      try {
        const raw = chunkResult.choices[0].message.content ?? '{"clauses":[]}';
        const parsed = JSON.parse(cleanJSON(raw)) as { clauses: RawClause[] };
        allClauses.push(...(parsed.clauses ?? []));
      } catch {
        console.warn(`Failed to parse clause chunk ${i + 1}/${chunks.length}`);
      }
    }

    // ---- Compute overall risk score -------------------------
    const riskScore = computeRiskScore(allClauses);
    const riskLevel = riskScoreToLevel(riskScore);

    // ---- Insert Analysis record -----------------------------
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .insert({
        document_id,
        user_id: user.id,
        plain_summary: executiveParsed.plain_summary,
        executive_summary: executiveParsed.executive_summary,
        document_type: executiveParsed.document_type,
        parties_involved: executiveParsed.parties_involved ?? [],
        overall_risk_score: riskScore,
        overall_risk_level: riskLevel,
        risk_summary: executiveParsed.risk_summary,
        effective_date: executiveParsed.effective_date ?? null,
        expiration_date: executiveParsed.expiration_date ?? null,
        key_financial_terms: executiveParsed.key_financial_terms ?? [],
        key_dates: executiveParsed.key_dates ?? [],
        recommendations: executiveParsed.recommendations ?? [],
        negotiation_points: executiveParsed.negotiation_points ?? [],
        proceed_factors: executiveParsed.proceed_factors ?? [],
        caution_factors: executiveParsed.caution_factors ?? [],
        ai_model_used: MODEL,
        prompt_tokens: totalPromptTokens,
        completion_tokens: totalCompletionTokens,
        processing_duration_ms: Date.now() - startTime,
      })
      .select('id')
      .single();

    if (analysisError || !analysis) {
      await markFailed(supabase, document_id, 'Failed to save analysis');
      return errorResponse(500, 'Failed to save analysis');
    }

    // ---- Insert Clauses -------------------------------------
    if (allClauses.length > 0) {
      const clauseRows = allClauses.slice(0, 100).map((c, i) => ({
        document_id,
        analysis_id: analysis.id,
        original_text: c.original_text,
        clause_number: i + 1,
        page_number: c.page_number ?? null,
        section_title: c.section_title ?? null,
        category: c.category ?? 'general',
        risk_level: c.risk_level ?? 'low',
        risk_score: c.risk_score ?? 0,
        plain_explanation: c.plain_explanation ?? '',
        risk_description: c.risk_description ?? null,
        implications: c.implications ?? null,
        requires_action: c.requires_action ?? false,
        is_non_standard: c.is_non_standard ?? false,
        is_highlighted: (c.risk_level === 'high' || c.risk_level === 'critical'),
        key_terms: c.key_terms ?? [],
      }));

      await supabase.from('clauses').insert(clauseRows);
    }

    // ---- Mark document as completed -------------------------
    await supabase
      .from('documents')
      .update({
        status: 'completed',
        processing_completed_at: new Date().toISOString(),
      })
      .eq('id', document_id);

    // ---- Create analysis_complete notification --------------
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'analysis_complete',
      title: 'Analysis Complete',
      message: `Your document "${doc.title}" has been analyzed.`,
      data: { document_id, analysis_id: analysis.id, risk_level: riskLevel },
    });

    // ---- Log analytics event --------------------------------
    await supabase.from('user_events').insert({
      user_id: user.id,
      event_type: 'analysis_completed',
      resource_type: 'analysis',
      resource_id: analysis.id,
      metadata: {
        document_id,
        risk_score: riskScore,
        clause_count: allClauses.length,
        duration_ms: Date.now() - startTime,
      },
    });

    return jsonResponse(200, {
      analysis_id: analysis.id,
      status: 'completed',
      overall_risk_score: riskScore,
      overall_risk_level: riskLevel,
      clause_count: allClauses.length,
      processing_duration_ms: Date.now() - startTime,
    });
  } catch (err) {
    console.error('Unexpected error in analyze-document:', err);
    return errorResponse(500, 'An unexpected error occurred during analysis');
  }
});

// ============================================================
// AI Prompts
// ============================================================

const SYSTEM_PROMPT_EXECUTIVE = `You are an expert legal analyst specializing in plain-language document review.
Analyze the provided legal document and return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "plain_summary": "string - 2-4 paragraph plain English summary anyone can understand",
  "executive_summary": "string - 2-3 sentence high-level overview",
  "document_type": "string - e.g. Service Agreement, NDA, Employment Contract",
  "parties_involved": [{"name": "string", "role": "string"}],
  "risk_summary": "string - overview of the main risks",
  "effective_date": "string or null",
  "expiration_date": "string or null",
  "key_financial_terms": [{"label": "string", "value": "string", "currency": "string or null"}],
  "key_dates": [{"label": "string", "date": "string", "description": "string"}],
  "recommendations": [{"priority": "high|medium|low", "title": "string", "description": "string", "action": "string"}],
  "negotiation_points": [{"clause": "string", "issue": "string", "suggestion": "string"}],
  "proceed_factors": ["string"],
  "caution_factors": ["string"]
}
Be precise, accurate, and focus on protecting the reader's interests.`;

const SYSTEM_PROMPT_CLAUSES = `You are an expert legal analyst. Extract individual clauses from the provided legal document section.
Return ONLY a valid JSON object with this structure:
{
  "clauses": [
    {
      "original_text": "string - exact clause text",
      "section_title": "string or null - section heading",
      "page_number": "number or null",
      "category": "obligations|rights|penalties|termination|payment|confidentiality|liability|dispute_resolution|intellectual_property|general",
      "risk_level": "low|medium|high|critical",
      "risk_score": "number 0-100",
      "plain_explanation": "string - plain English explanation",
      "risk_description": "string or null - why this clause is risky",
      "implications": "string or null - practical implications",
      "requires_action": "boolean",
      "is_non_standard": "boolean - true if unusual or one-sided",
      "key_terms": [{"term": "string", "definition": "string"}]
    }
  ]
}
Focus on clauses that have material impact. Skip boilerplate like "This agreement is governed by..."`;

// ============================================================
// Helpers
// ============================================================

async function callOpenAI(apiKey: string, messages: Array<{ role: string; content: string }>) {
  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.1,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${err}`);
  }

  return res.json();
}

function chunkText(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  let pos = 0;
  while (pos < text.length) {
    // Try to break at paragraph boundary
    let end = Math.min(pos + chunkSize, text.length);
    if (end < text.length) {
      const boundary = text.lastIndexOf('\n\n', end);
      if (boundary > pos + chunkSize * 0.5) end = boundary;
    }
    chunks.push(text.slice(pos, end));
    pos = end;
  }
  return chunks;
}

function cleanJSON(raw: string): string {
  return raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

function computeRiskScore(clauses: RawClause[]): number {
  if (!clauses.length) return 0;
  const weights = { critical: 100, high: 75, medium: 40, low: 10 };
  const total = clauses.reduce((sum, c) => sum + (c.risk_score ?? weights[c.risk_level ?? 'low']), 0);
  return Math.min(100, Math.round(total / clauses.length));
}

function riskScoreToLevel(score: number): string {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}

async function markFailed(supabase: ReturnType<typeof createClient>, documentId: string, reason: string) {
  await supabase
    .from('documents')
    .update({ status: 'failed', processing_error: reason })
    .eq('id', documentId);
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(status: number, message: string): Response {
  return jsonResponse(status, { error: message });
}

// ---- Types (internal to this function) ----------------------

interface ExecutiveAnalysis {
  plain_summary?: string;
  executive_summary?: string;
  document_type?: string;
  parties_involved?: Array<{ name: string; role: string }>;
  risk_summary?: string;
  effective_date?: string;
  expiration_date?: string;
  key_financial_terms?: Array<{ label: string; value: string; currency?: string }>;
  key_dates?: Array<{ label: string; date: string; description: string }>;
  recommendations?: Array<{ priority: string; title: string; description: string; action: string }>;
  negotiation_points?: Array<{ clause: string; issue: string; suggestion: string }>;
  proceed_factors?: string[];
  caution_factors?: string[];
}

interface RawClause {
  original_text: string;
  section_title?: string;
  page_number?: number;
  category?: string;
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  risk_score?: number;
  plain_explanation?: string;
  risk_description?: string;
  implications?: string;
  requires_action?: boolean;
  is_non_standard?: boolean;
  key_terms?: Array<{ term: string; definition: string }>;
}
