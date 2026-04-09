// ============================================================
// LegasistAI - Edge Function: search-documents
// POST /functions/v1/search-documents
// Full-text search + filtered document listing.
// Supports text search, risk level filter, date range,
// tags, folder, status, and pagination.
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

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
    const body = req.method === 'POST' ? await req.json() : {};

    const {
      query = '',
      status,
      folder_id,
      tags = [],
      date_from,
      date_to,
      risk_level,
      is_favorite,
      sort_by = 'created_at',
      sort_order = 'desc',
      page = 1,
      page_size = DEFAULT_PAGE_SIZE,
    } = body;

    const clampedPageSize = Math.min(Math.max(1, page_size), MAX_PAGE_SIZE);
    const offset = (Math.max(1, page) - 1) * clampedPageSize;

    // ---- Build base query -----------------------------------
    let dbQuery = supabase
      .from('documents')
      .select(`
        id, title, original_filename, file_type, file_size_bytes,
        page_count, word_count, status, is_favorite, tags,
        text_preview, created_at, updated_at,
        folder_id,
        folders ( id, name, color, icon ),
        analyses (
          id, overall_risk_score, overall_risk_level,
          executive_summary, document_type
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .neq('status', 'deleted');

    // ---- Apply filters ---------------------------------------

    // Status filter
    if (status) {
      if (Array.isArray(status)) {
        dbQuery = dbQuery.in('status', status);
      } else {
        dbQuery = dbQuery.eq('status', status);
      }
    }

    // Folder filter
    if (folder_id === 'none') {
      dbQuery = dbQuery.is('folder_id', null);
    } else if (folder_id) {
      dbQuery = dbQuery.eq('folder_id', folder_id);
    }

    // Favorites filter
    if (is_favorite === true) {
      dbQuery = dbQuery.eq('is_favorite', true);
    }

    // Tags filter (documents that contain ALL specified tags)
    if (tags.length > 0) {
      dbQuery = dbQuery.contains('tags', tags);
    }

    // Date range filter
    if (date_from) {
      dbQuery = dbQuery.gte('created_at', date_from);
    }
    if (date_to) {
      dbQuery = dbQuery.lte('created_at', date_to);
    }

    // Full-text search on title and preview
    if (query.trim()) {
      // Use Postgres full-text search
      dbQuery = dbQuery.or(
        `title.ilike.%${query}%,text_preview.ilike.%${query}%,original_filename.ilike.%${query}%`
      );
    }

    // ---- Sorting --------------------------------------------
    const validSortFields = ['created_at', 'updated_at', 'title', 'file_size_bytes', 'word_count'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    const ascending = sort_order === 'asc';
    dbQuery = dbQuery.order(sortField, { ascending });

    // ---- Pagination -----------------------------------------
    dbQuery = dbQuery.range(offset, offset + clampedPageSize - 1);

    // ---- Execute query --------------------------------------
    const { data: documents, error: queryError, count } = await dbQuery;

    if (queryError) {
      console.error('Search query error:', queryError);
      return errorResponse(500, 'Search failed');
    }

    // ---- Post-filter by risk level (requires join data) -----
    let filteredDocs = documents ?? [];
    if (risk_level) {
      filteredDocs = filteredDocs.filter((doc: any) => {
        const analysis = (doc.analyses as any[])?.[0];
        return analysis?.overall_risk_level === risk_level;
      });
    }

    // ---- Format response ------------------------------------
    const formattedDocs = filteredDocs.map((doc: any) => {
      const analysis = (doc.analyses as any[])?.[0] ?? null;
      return {
        id: doc.id,
        title: doc.title,
        original_filename: doc.original_filename,
        file_type: doc.file_type,
        file_size_bytes: doc.file_size_bytes,
        page_count: doc.page_count,
        word_count: doc.word_count,
        status: doc.status,
        is_favorite: doc.is_favorite,
        tags: doc.tags,
        text_preview: doc.text_preview,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        folder: doc.folders ?? null,
        analysis: analysis
          ? {
              id: analysis.id,
              overall_risk_score: analysis.overall_risk_score,
              overall_risk_level: analysis.overall_risk_level,
              executive_summary: analysis.executive_summary,
              document_type: analysis.document_type,
            }
          : null,
      };
    });

    // ---- Log search event -----------------------------------
    if (query.trim()) {
      await supabase.from('user_events').insert({
        user_id: user.id,
        event_type: 'document_searched',
        metadata: {
          query: query.slice(0, 100),
          result_count: filteredDocs.length,
          filters: { status, folder_id, risk_level, tags },
        },
      }).catch(() => {});
    }

    return jsonResponse(200, {
      documents: formattedDocs,
      total: count ?? 0,
      page: Math.max(1, page),
      page_size: clampedPageSize,
      total_pages: Math.ceil((count ?? 0) / clampedPageSize),
    });

  } catch (err) {
    console.error('Unexpected error in search-documents:', err);
    return errorResponse(500, 'An unexpected error occurred');
  }
});

// ---- Helpers ------------------------------------------------

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(status: number, message: string): Response {
  return jsonResponse(status, { error: message });
}
