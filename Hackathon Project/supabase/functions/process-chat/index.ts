// ============================================================
// LegasistAI - Edge Function: process-chat
// POST /functions/v1/process-chat
// Handles contextual Q&A conversations grounded in document
// analyses. Maintains multi-turn conversation history.
// Supports both single-document and multi-document context.
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o';
const MAX_CONTEXT_CHARS = 15000;   // How much document text to send
const MAX_HISTORY_PAIRS = 10;      // Last N user+assistant pairs to include

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

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

    // ---- Parse request body ---------------------------------
    const body = await req.json();
    const {
      session_id,
      document_ids = [],
      message,
    }: {
      session_id?: string;
      document_ids: string[];
      message: string;
    } = body;

    if (!message?.trim()) return errorResponse(400, 'Message is required');
    if (message.length > 2000) return errorResponse(400, 'Message too long (max 2000 chars)');

    // ---- Resolve or create session --------------------------
    let sessionId = session_id;

    if (!sessionId) {
      const title = message.slice(0, 60) + (message.length > 60 ? '…' : '');
      const { data: newSession, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          title,
          document_ids,
          is_archived: false,
        })
        .select('id')
        .single();

      if (sessionError || !newSession) {
        return errorResponse(500, 'Failed to create chat session');
      }
      sessionId = newSession.id;
    } else {
      // Verify session ownership
      const { data: existingSession } = await supabase
        .from('chat_sessions')
        .select('id, user_id')
        .eq('id', sessionId)
        .single();

      if (!existingSession || existingSession.user_id !== user.id) {
        return errorResponse(403, 'Session not found or access denied');
      }
    }

    // ---- Build document context -----------------------------
    const documentContext = await buildDocumentContext(supabase, user.id, document_ids, MAX_CONTEXT_CHARS);

    // ---- Fetch conversation history -------------------------
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(MAX_HISTORY_PAIRS * 2); // Each pair = 1 user + 1 assistant

    const conversationHistory = (history ?? []).map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // ---- Build messages for OpenAI --------------------------
    const systemPrompt = buildSystemPrompt(documentContext, document_ids.length);

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationHistory,
      { role: 'user' as const, content: message },
    ];

    // ---- Save user message to DB ----------------------------
    const { data: userMsg, error: userMsgError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        role: 'user',
        content: message,
        cited_clauses: [],
        cited_documents: document_ids,
        suggested_questions: [],
      })
      .select('id')
      .single();

    if (userMsgError) {
      console.error('Failed to save user message:', userMsgError);
    }

    // ---- Call OpenAI ----------------------------------------
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!;
    const aiResult = await callOpenAI(openaiKey, messages, {
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 1500,
    });

    const usage = aiResult.usage ?? {};
    const rawContent = aiResult.choices?.[0]?.message?.content ?? '{}';

    let parsed: ChatAIResponse;
    try {
      parsed = JSON.parse(cleanJSON(rawContent));
    } catch {
      // Fallback: treat the raw text as the answer
      parsed = {
        answer: rawContent,
        suggested_questions: [],
        cited_clause_ids: [],
      };
    }

    const answer = parsed.answer || 'I could not generate a response. Please try rephrasing your question.';
    const suggestedQuestions = parsed.suggested_questions ?? [];
    const citedClauseIds = parsed.cited_clause_ids ?? [];

    // ---- Save assistant message to DB -----------------------
    const { data: assistantMsg } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        role: 'assistant',
        content: answer,
        cited_clauses: citedClauseIds,
        cited_documents: document_ids,
        suggested_questions: suggestedQuestions,
        prompt_tokens: usage.prompt_tokens ?? null,
        completion_tokens: usage.completion_tokens ?? null,
      })
      .select('id')
      .single();

    // ---- Update session last_message_at ---------------------
    await supabase
      .from('chat_sessions')
      .update({
        last_message_at: new Date().toISOString(),
        document_ids,
      })
      .eq('id', sessionId);

    // ---- Log analytics --------------------------------------
    await supabase.from('user_events').insert({
      user_id: user.id,
      event_type: 'chat_message_sent',
      resource_type: 'chat_session',
      resource_id: sessionId,
      metadata: {
        document_count: document_ids.length,
        message_length: message.length,
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
      },
    }).catch(() => {});

    return jsonResponse(200, {
      session_id: sessionId,
      message_id: assistantMsg?.id ?? null,
      answer,
      cited_clauses: citedClauseIds,
      cited_documents: document_ids,
      suggested_questions: suggestedQuestions,
    });

  } catch (err) {
    console.error('Unexpected error in process-chat:', err);
    return errorResponse(500, 'An unexpected error occurred');
  }
});

// ============================================================
// Document Context Builder
// ============================================================

async function buildDocumentContext(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  documentIds: string[],
  maxChars: number
): Promise<string> {
  if (!documentIds.length) {
    return 'No specific document selected. Answer based on general legal knowledge.';
  }

  const parts: string[] = [];
  let totalChars = 0;
  const charsPerDoc = Math.floor(maxChars / documentIds.length);

  for (const docId of documentIds) {
    if (totalChars >= maxChars) break;

    // Fetch document + its analysis + top clauses
    const { data: doc } = await supabase
      .from('documents')
      .select(`
        id, title, file_type, word_count, created_at,
        text_preview,
        analyses (
          executive_summary, plain_summary, overall_risk_score,
          overall_risk_level, risk_summary, document_type,
          parties_involved, key_financial_terms, key_dates,
          recommendations, negotiation_points,
          clauses (
            id, original_text, plain_explanation, risk_level,
            risk_score, category, section_title, risk_description,
            implications, requires_action, key_terms
          )
        )
      `)
      .eq('id', docId)
      .eq('user_id', userId)
      .single();

    if (!doc) continue;

    const analysis = (doc.analyses as any)?.[0];

    let docContext = `\n=== DOCUMENT: ${doc.title} ===\n`;
    docContext += `Type: ${doc.file_type?.toUpperCase()} | Words: ${doc.word_count ?? 'unknown'}\n`;

    if (analysis) {
      docContext += `Document Type: ${analysis.document_type || 'Unknown'}\n`;
      docContext += `Risk Level: ${analysis.overall_risk_level || 'unknown'} (score: ${analysis.overall_risk_score ?? 'N/A'})\n\n`;

      if (analysis.executive_summary) {
        docContext += `SUMMARY:\n${analysis.executive_summary}\n\n`;
      }

      if (analysis.risk_summary) {
        docContext += `RISK OVERVIEW:\n${analysis.risk_summary}\n\n`;
      }

      if (analysis.parties_involved?.length) {
        docContext += `PARTIES:\n`;
        (analysis.parties_involved as any[]).forEach((p: any) => {
          docContext += `  - ${p.name} (${p.role})\n`;
        });
        docContext += '\n';
      }

      if (analysis.key_financial_terms?.length) {
        docContext += `KEY FINANCIAL TERMS:\n`;
        (analysis.key_financial_terms as any[]).forEach((t: any) => {
          docContext += `  - ${t.label}: ${t.value}${t.currency ? ' ' + t.currency : ''}\n`;
        });
        docContext += '\n';
      }

      if (analysis.clauses?.length) {
        docContext += `CLAUSES (sorted by risk):\n`;
        const sortedClauses = [...(analysis.clauses as any[])]
          .sort((a, b) => (b.risk_score ?? 0) - (a.risk_score ?? 0))
          .slice(0, 20);

        for (const clause of sortedClauses) {
          if (totalChars + docContext.length >= charsPerDoc) break;
          docContext += `\n[${clause.risk_level?.toUpperCase()} RISK | ${clause.category}]`;
          if (clause.section_title) docContext += ` ${clause.section_title}`;
          docContext += `\n  Original: "${clause.original_text?.slice(0, 200)}${clause.original_text?.length > 200 ? '...' : ''}"\n`;
          docContext += `  Meaning: ${clause.plain_explanation}\n`;
          if (clause.risk_description) docContext += `  Risk: ${clause.risk_description}\n`;
          if (clause.implications) docContext += `  Implications: ${clause.implications}\n`;
          if (clause.requires_action) docContext += `  ⚠ ACTION REQUIRED\n`;
        }
      }
    } else if (doc.text_preview) {
      docContext += `CONTENT PREVIEW:\n${doc.text_preview}\n`;
    }

    parts.push(docContext.slice(0, charsPerDoc));
    totalChars += docContext.length;
  }

  return parts.join('\n') || 'Document content unavailable. Answer based on general legal knowledge.';
}

// ============================================================
// System Prompt Builder
// ============================================================

function buildSystemPrompt(documentContext: string, docCount: number): string {
  return `You are LegasistAI, an expert legal document assistant helping users understand their legal documents in plain English.

You have access to ${docCount > 0 ? `${docCount} document(s)` : 'no specific documents'} provided in context below.

DOCUMENT CONTEXT:
${documentContext}

YOUR ROLE:
- Answer questions about the documents accurately and in plain English
- Point out risks and important implications the user should know
- Suggest negotiation points when relevant
- Be specific — reference actual clause text when answering
- Never give legal advice — you provide legal information and education
- Always remind users to consult a qualified attorney for important decisions

RESPONSE FORMAT:
Return ONLY a valid JSON object with this structure:
{
  "answer": "Your detailed plain-English answer (supports markdown for formatting)",
  "suggested_questions": ["Follow-up question 1", "Follow-up question 2", "Follow-up question 3"],
  "cited_clause_ids": ["clause-uuid-1", "clause-uuid-2"]
}

Keep answers clear and concise. Use bullet points for lists. Be honest when you don't have enough information.`;
}

// ============================================================
// Helpers
// ============================================================

async function callOpenAI(
  apiKey: string,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: Record<string, unknown> = {}
) {
  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 1500,
      ...options,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${err}`);
  }

  return res.json();
}

function cleanJSON(raw: string): string {
  return raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
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

// ---- Types --------------------------------------------------

interface ChatAIResponse {
  answer: string;
  suggested_questions: string[];
  cited_clause_ids: string[];
}
