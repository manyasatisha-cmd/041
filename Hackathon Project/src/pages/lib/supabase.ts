// ============================================================
// LegasistAI - Supabase Client
// src/lib/supabase.ts
// ============================================================

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[LegasistAI] Missing Supabase env vars.\n' +
    'Create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'legasistai_auth',
  },
  global: {
    headers: { 'x-application-name': 'legasistai' },
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});

// ---- Constants -------------------------------------------

export const DOCUMENTS_BUCKET = 'documents';
export const AVATARS_BUCKET = 'avatars';

// ---- Storage helpers ------------------------------------

/**
 * Build a user-scoped storage path.
 * Pattern: {userId}/{uuid}-{sanitizedFilename}
 */
export function buildStoragePath(userId: string, filename: string): string {
  const uuid = crypto.randomUUID();
  const sanitized = filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .toLowerCase()
    .slice(0, 80);
  return `${userId}/${uuid}-${sanitized}`;
}

/**
 * Get a signed URL (1-hour expiry) for a private document.
 */
export async function getSignedDocumentUrl(filePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(filePath, 3600);

  if (error || !data) {
    console.error('[Supabase] Failed to create signed URL:', error);
    return null;
  }
  return data.signedUrl;
}

/**
 * Get a public URL for an avatar (avatars bucket is public).
 */
export function getAvatarUrl(filePath: string): string {
  const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Call a Supabase Edge Function with the current user's JWT.
 */
export async function callEdgeFunction<T = unknown>(
  functionName: string,
  body: unknown,
  method: 'GET' | 'POST' | 'DELETE' = 'POST'
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const res = await fetch(
    `${supabaseUrl}/functions/v1/${functionName}`,
    {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: method !== 'GET' ? JSON.stringify(body) : undefined,
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error ?? `Edge function ${functionName} failed (${res.status})`);
  }

  return res.json() as Promise<T>;
}

/**
 * Track a client-side analytics event (fire-and-forget).
 */
export async function trackEvent(
  eventType: string,
  metadata: Record<string, unknown> = {},
  resourceType?: string,
  resourceId?: string
): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`${supabaseUrl}/functions/v1/track-analytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ event_type: eventType, metadata, resource_type: resourceType, resource_id: resourceId }),
    });
  } catch {
    // Analytics must never break the app
  }
}
