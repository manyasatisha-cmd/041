// ============================================================
// LegasistAI - Edge Function: manage-shares
// POST /functions/v1/manage-shares   → create a share link
// GET  /functions/v1/manage-shares?token=xxx → resolve a share
// DELETE /functions/v1/manage-shares → revoke a share
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);

    // ---- Public share resolution (no auth required) ---------
    if (req.method === 'GET') {
      const token = url.searchParams.get('token');
      if (!token) return errorResponse(400, 'Share token is required');

      // Use service role to read share (no auth needed for public links)
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const { data: share, error: shareError } = await supabaseAdmin
        .from('document_shares')
        .select(`
          id, permission, expires_at, is_active, accessed_count,
          documents (
            id, title, file_type, word_count, status, text_preview,
            analyses (
              executive_summary, plain_summary, overall_risk_score,
              overall_risk_level, risk_summary, document_type,
              recommendations, key_dates,
              clauses (
                id, plain_explanation, risk_level, risk_score,
                category, section_title, requires_action
              )
            )
          )
        `)
        .eq('share_token', token)
        .single();

      if (shareError || !share) return errorResponse(404, 'Share link not found');
      if (!share.is_active) return errorResponse(410, 'Share link has been revoked');
      if (share.expires_at && new Date(share.expires_at) < new Date()) {
        return errorResponse(410, 'Share link has expired');
      }

      // Increment access count
      await supabaseAdmin
        .from('document_shares')
        .update({
          accessed_count: (share.accessed_count ?? 0) + 1,
          last_accessed_at: new Date().toISOString(),
        })
        .eq('share_token', token);

      return jsonResponse(200, {
        permission: share.permission,
        document: share.documents,
      });
    }

    // ---- Auth required for create / delete ------------------
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return errorResponse(401, 'Unauthorized');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return errorResponse(401, 'Unauthorized');

    // ---- Create share ---------------------------------------
    if (req.method === 'POST') {
      const {
        document_id,
        permission = 'view',
        shared_with_email = null,
        expires_in_days = null,
      } = await req.json();

      if (!document_id) return errorResponse(400, 'document_id is required');

      // Verify document ownership
      const { data: doc } = await supabase
        .from('documents')
        .select('id, title')
        .eq('id', document_id)
        .eq('user_id', user.id)
        .single();

      if (!doc) return errorResponse(404, 'Document not found');

      const expiresAt = expires_in_days
        ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data: share, error: shareError } = await supabase
        .from('document_shares')
        .insert({
          document_id,
          owner_id: user.id,
          shared_with_email,
          permission,
          expires_at: expiresAt,
          is_active: true,
        })
        .select('id, share_token, permission, expires_at')
        .single();

      if (shareError || !share) {
        return errorResponse(500, 'Failed to create share link');
      }

      const baseUrl = Deno.env.get('APP_URL') ?? 'https://legasistai.com';
      const shareUrl = `${baseUrl}/shared/${share.share_token}`;

      // Notify if shared with specific email
      if (shared_with_email) {
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'document_shared',
          title: 'Document Shared',
          message: `You shared "${doc.title}" with ${shared_with_email}`,
          data: { document_id, share_id: share.id },
        }).catch(() => {});
      }

      return jsonResponse(201, {
        share_id: share.id,
        share_token: share.share_token,
        share_url: shareUrl,
        permission: share.permission,
        expires_at: share.expires_at,
      });
    }

    // ---- Revoke share ---------------------------------------
    if (req.method === 'DELETE') {
      const { share_id } = await req.json();
      if (!share_id) return errorResponse(400, 'share_id is required');

      const { error } = await supabase
        .from('document_shares')
        .update({ is_active: false })
        .eq('id', share_id)
        .eq('owner_id', user.id);

      if (error) return errorResponse(500, 'Failed to revoke share');

      return jsonResponse(200, { message: 'Share link revoked successfully' });
    }

    return errorResponse(405, 'Method not allowed');

  } catch (err) {
    console.error('Unexpected error in manage-shares:', err);
    return errorResponse(500, 'An unexpected error occurred');
  }
});

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(status: number, message: string): Response {
  return jsonResponse(status, { error: message });
}
