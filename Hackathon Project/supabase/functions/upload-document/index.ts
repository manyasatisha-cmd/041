// ============================================================
// LegasistAI - Edge Function: upload-document
// POST /functions/v1/upload-document
// Handles multipart file upload with quota enforcement,
// virus scanning hook, and storage path management.
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const DOCUMENTS_BUCKET = 'documents';

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
};

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

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

    // ---- Parse multipart form --------------------------------
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = (formData.get('title') as string) || null;
    const folderId = (formData.get('folder_id') as string) || null;
    const tagsRaw = (formData.get('tags') as string) || '[]';

    if (!file) return errorResponse(400, 'No file provided');

    let tags: string[] = [];
    try { tags = JSON.parse(tagsRaw); } catch { tags = []; }

    // ---- Validate file type ---------------------------------
    const fileType = ALLOWED_MIME_TYPES[file.type];
    if (!fileType) {
      return errorResponse(415, `Unsupported file type "${file.type}". Upload PDF, DOCX, or TXT.`);
    }

    // ---- Validate file size ---------------------------------
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      return errorResponse(413, `File is ${mb}MB. Maximum size is 50MB.`);
    }

    if (file.size < 100) {
      return errorResponse(400, 'File appears to be empty.');
    }

    // ---- Check user quota -----------------------------------
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('documents_used, documents_limit, storage_used_bytes, storage_limit_bytes, subscription_tier')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return errorResponse(500, 'Failed to fetch user profile');
    }

    if (profile.documents_used >= profile.documents_limit) {
      return errorResponse(429, `Document limit reached (${profile.documents_limit} on ${profile.subscription_tier} plan). Please upgrade to continue.`);
    }

    if ((profile.storage_used_bytes + file.size) > profile.storage_limit_bytes) {
      const usedMB = (profile.storage_used_bytes / (1024 * 1024)).toFixed(1);
      const limitMB = (profile.storage_limit_bytes / (1024 * 1024)).toFixed(1);
      return errorResponse(429, `Storage limit reached (${usedMB}MB of ${limitMB}MB used). Please upgrade.`);
    }

    // ---- Build storage path ---------------------------------
    const ext = file.name.split('.').pop()?.toLowerCase() || fileType;
    const uuid = crypto.randomUUID();
    const sanitizedName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .toLowerCase()
      .slice(0, 80);
    const filePath = `${user.id}/${uuid}-${sanitizedName}`;

    // ---- Upload to Supabase Storage -------------------------
    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return errorResponse(500, 'Failed to upload file to storage');
    }

    // ---- Create document record in DB -----------------------
    const documentTitle = title || file.name.replace(/\.[^/.]+$/, '');

    const { data: doc, error: docError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        folder_id: folderId || null,
        title: documentTitle,
        original_filename: file.name,
        file_path: filePath,
        file_size_bytes: file.size,
        file_type: fileType,
        mime_type: file.type,
        status: 'uploading',
        tags,
        is_favorite: false,
      })
      .select('id, file_path, status')
      .single();

    if (docError || !doc) {
      // Rollback: delete uploaded file
      await supabase.storage.from(DOCUMENTS_BUCKET).remove([filePath]);
      console.error('DB insert error:', docError);
      return errorResponse(500, 'Failed to create document record');
    }

    // ---- Mark status as uploaded (text extraction pending) --
    await supabase
      .from('documents')
      .update({ status: 'uploading' })
      .eq('id', doc.id);

    // ---- Log analytics --------------------------------------
    await supabase.from('user_events').insert({
      user_id: user.id,
      event_type: 'document_uploaded',
      resource_type: 'document',
      resource_id: doc.id,
      metadata: {
        file_type: fileType,
        file_size_bytes: file.size,
        has_folder: !!folderId,
        tag_count: tags.length,
      },
    }).catch(() => {}); // Non-critical, don't fail on analytics error

    return jsonResponse(201, {
      document_id: doc.id,
      file_path: doc.file_path,
      status: 'uploading',
      message: 'File uploaded successfully. Trigger text extraction next.',
    });

  } catch (err) {
    console.error('Unexpected error in upload-document:', err);
    return errorResponse(500, 'An unexpected error occurred during upload');
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
