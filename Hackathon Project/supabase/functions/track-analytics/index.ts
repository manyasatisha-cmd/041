// ============================================================
// LegasistAI - Edge Function: track-analytics
// POST /functions/v1/track-analytics
// Server-side event logging. Captures IP address and
// user agent that the client cannot self-report reliably.
// Fails silently — never blocks main product flows.
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Events allowed from the client (whitelist to prevent spam)
const ALLOWED_EVENTS = new Set([
  'page_view',
  'document_uploaded',
  'document_viewed',
  'analysis_viewed',
  'analysis_started',
  'chat_opened',
  'chat_message_sent',
  'document_shared',
  'document_downloaded',
  'document_deleted',
  'report_exported',
  'settings_updated',
  'onboarding_step_completed',
  'subscription_page_viewed',
  'upgrade_clicked',
  'feature_used',
]);

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Always return 204 — analytics must never block the app
  const respond = () => new Response(null, { status: 204, headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { event_type, resource_type, resource_id, metadata = {} } = body;

    if (!event_type || !ALLOWED_EVENTS.has(event_type)) {
      return respond(); // Silently ignore unknown events
    }

    // ---- Get user if authenticated (optional) ---------------
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    if (authHeader) {
      const supabaseAnon = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await supabaseAnon.auth.getUser().catch(() => ({ data: { user: null } }));
      userId = user?.id ?? null;
    }

    // ---- Use service role for insert (bypasses RLS for logs) -
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ---- Capture request metadata ---------------------------
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || null;

    const userAgent = req.headers.get('user-agent')?.slice(0, 500) || null;

    // ---- Insert event ---------------------------------------
    await supabaseAdmin.from('user_events').insert({
      user_id: userId,
      event_type,
      resource_type: resource_type || null,
      resource_id: resource_id || null,
      metadata: {
        ...metadata,
        _source: 'client',
        _timestamp: new Date().toISOString(),
      },
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    return respond();

  } catch (err) {
    // Swallow all errors — analytics must not break the app
    console.error('track-analytics error (suppressed):', err);
    return respond();
  }
});
