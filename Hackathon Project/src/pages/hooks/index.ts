// ============================================================
// LegasistAI - React Hooks (Data Access Layer)
// src/hooks/index.ts
//
// Provides typed React hooks for every backend operation.
// All hooks integrate with Supabase real-time subscriptions
// where appropriate and handle loading/error states uniformly.
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, DOCUMENTS_BUCKET, buildStoragePath } from '../lib/supabase';
import { extractDocumentText } from '../utils/documentProcessor';
import type {
  Document,
  Analysis,
  Clause,
  Folder,
  ChatSession,
  ChatMessage,
  Notification,
  Profile,
  DocumentShare,
} from '../types/database';

// ============================================================
// Shared Types
// ============================================================

export interface HookState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UploadStage {
  stage: 'idle' | 'extracting' | 'uploading' | 'saving' | 'done' | 'error';
  percent: number;
  message: string;
}

// ============================================================
// useProfile
// ============================================================

export function useProfile(): HookState<Profile> & { updateProfile: (updates: Partial<Profile>) => Promise<void> } {
  const [data, setData] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('Not authenticated'); setLoading(false); return; }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setData(profile as Profile);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('profiles')
      // @ts-expect-error Supabase type inference issue
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) throw error;
    await fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch, updateProfile };
}

// ============================================================
// useDocuments — list with real-time updates
// ============================================================

export function useDocuments(folderId?: string | null) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('Not authenticated'); return; }

      let query = supabase
        .from('documents')
        .select(`
          id, title, original_filename, file_type, file_size_bytes,
          page_count, word_count, status, is_favorite, tags,
          text_preview, processing_error, created_at, updated_at,
          folder_id,
          analyses ( id, overall_risk_score, overall_risk_level, document_type )
        `)
        .eq('user_id', user.id)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });

      if (folderId === 'none') {
        query = query.is('folder_id', null);
      } else if (folderId) {
        query = query.eq('folder_id', folderId);
      }

      const { data, error: queryError } = await query;
      if (queryError) throw queryError;
      setDocuments((data ?? []) as unknown as Document[]);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    fetch();

    // Real-time subscription
    const channel = supabase
      .channel('documents-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'documents',
      }, () => { fetch(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetch]);

  const deleteDocument = useCallback(async (documentId: string, filePath: string) => {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([filePath]);
    // @ts-expect-error Supabase type inference issue
    await supabase.from('documents').update({ status: 'deleted' }).eq('id', documentId);
    await fetch();
  }, [fetch]);

  const toggleFavorite = useCallback(async (documentId: string, currentValue: boolean) => {
    // @ts-expect-error Supabase type inference issue
    await supabase.from('documents').update({ is_favorite: !currentValue }).eq('id', documentId);
    setDocuments(prev => prev.map(d => d.id === documentId ? { ...d, is_favorite: !currentValue } : d));
  }, []);

  return { documents, loading, error, refetch: fetch, deleteDocument, toggleFavorite };
}

// ============================================================
// useDocumentUpload — full pipeline: extract → upload → analyze
// ============================================================

export function useDocumentUpload() {
  const [stage, setStage] = useState<UploadStage>({ stage: 'idle', percent: 0, message: '' });

  const upload = useCallback(async (
    file: File,
    options: { title?: string; folderId?: string; tags?: string[]; autoAnalyze?: boolean } = {}
  ): Promise<{ documentId: string } | null> => {
    try {
      // ---- Step 1: Extract text (client-side) ---------------
      setStage({ stage: 'extracting', percent: 10, message: 'Extracting document text…' });

      const extraction = await extractDocumentText(file, (_s: string, pct: number) => {
        setStage(prev => ({ ...prev, percent: 10 + pct * 0.3, message: 'Reading document…' }));
      });

      // ---- Step 2: Upload file to edge function -------------
      setStage({ stage: 'uploading', percent: 45, message: 'Uploading file…' });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('file', file);
      if (options.title) formData.append('title', options.title);
      if (options.folderId) formData.append('folder_id', options.folderId);
      if (options.tags?.length) formData.append('tags', JSON.stringify(options.tags));

      const uploadRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-document`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: formData,
        }
      );

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error ?? 'Upload failed');
      }

      const { document_id } = await uploadRes.json();

      // ---- Step 3: Save extracted text to DB ----------------
      setStage({ stage: 'saving', percent: 65, message: 'Processing document…' });

      await supabase
        .from('documents')
        // @ts-expect-error Supabase type inference issue
        .update({
          extracted_text: extraction.text,
          word_count: extraction.wordCount,
          page_count: extraction.pageCount,
          text_preview: extraction.text.slice(0, 500),
          status: options.autoAnalyze ? 'processing' : 'uploading',
        })
        .eq('id', document_id);

      // ---- Step 4: Trigger AI analysis (optional) ----------
      if (options.autoAnalyze) {
        setStage({ stage: 'saving', percent: 75, message: 'Starting AI analysis…' });

        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-document`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ document_id }),
          }
        );
      } else {
        // Just mark as uploaded
        await supabase
          .from('documents')
          // @ts-expect-error Supabase type inference issue
          .update({ status: 'uploading' })
          .eq('id', document_id);
      }

      setStage({ stage: 'done', percent: 100, message: 'Upload complete!' });
      return { documentId: document_id };

    } catch (err: any) {
      setStage({ stage: 'error', percent: 0, message: err.message ?? 'Upload failed' });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setStage({ stage: 'idle', percent: 0, message: '' });
  }, []);

  return { stage, upload, reset };
}

// ============================================================
// useAnalysis — load full analysis + clauses for a document
// ============================================================

export function useAnalysis(documentId: string | null) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const loadAnalysis = useCallback(async () => {
    if (!documentId) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('analyses')
        .select(`
          *,
          clauses (
            id, original_text, clause_number, page_number, section_title,
            category, risk_level, risk_score, plain_explanation,
            risk_description, implications, requires_action,
            is_non_standard, is_highlighted, key_terms, created_at
          )
        `)
        .eq('document_id', documentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (queryError && queryError.code !== 'PGRST116') throw queryError;
      setAnalysis(data as unknown as Analysis);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => { loadAnalysis(); }, [loadAnalysis]);

  const triggerAnalysis = useCallback(async (force = false) => {
    if (!documentId) return;
    setAnalyzing(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-document`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ document_id: documentId, force_reanalysis: force }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Analysis failed');
      }

      await loadAnalysis();
    } catch (err: any) {
      setError(err.message ?? 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }, [documentId, loadAnalysis]);

  return { analysis, loading, error, analyzing, refetch: loadAnalysis, triggerAnalysis };
}

// ============================================================
// useChat — stateful multi-turn chat with session management
// ============================================================

export function useChat(defaultDocumentIds: string[] = []) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);

  const sendMessage = useCallback(async (
    message: string,
    documentIds: string[] = defaultDocumentIds
  ): Promise<void> => {
    if (!message.trim()) return;
    setLoading(true);
    setError(null);

    // Optimistically add user message
    const tempId = `temp-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: tempId,
      session_id: sessionId ?? '',
      user_id: '',
      role: 'user',
      content: message,
      cited_clauses: [],
      cited_documents: documentIds,
      suggested_questions: [],
      prompt_tokens: null,
      completion_tokens: null,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            session_id: sessionId,
            document_ids: documentIds,
            message,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Chat request failed');
      }

      const data = await res.json();

      if (!sessionId) setSessionId(data.session_id);
      setSuggestedQuestions(data.suggested_questions ?? []);

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: data.message_id ?? `assistant-${Date.now()}`,
        session_id: data.session_id,
        user_id: '',
        role: 'assistant',
        content: data.answer,
        cited_clauses: data.cited_clauses ?? [],
        cited_documents: data.cited_documents ?? [],
        suggested_questions: data.suggested_questions ?? [],
        prompt_tokens: null,
        completion_tokens: null,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [
        ...prev.filter(m => m.id !== tempId),
        assistantMessage,
      ]);

    } catch (err: any) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setError(err.message ?? 'Failed to send message');
    } finally {
      setLoading(false);
    }
  }, [sessionId, defaultDocumentIds]);

  const clearChat = useCallback(() => {
    setSessionId(null);
    setMessages([]);
    setSuggestedQuestions([]);
    setError(null);
  }, []);

  return { sessionId, messages, loading, error, suggestedQuestions, sendMessage, clearChat };
}

// ============================================================
// useFolders — CRUD for folder tree
// ============================================================

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: queryError } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (queryError) throw queryError;
      setFolders((data ?? []) as Folder[]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const createFolder = useCallback(async (name: string, parentId?: string, color?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('folders')
      // @ts-expect-error Supabase type inference issue
      .insert({ user_id: user.id, name, parent_id: parentId ?? null, color: color ?? '#6B7280' })
      .select('*')
      .single();

    if (error) throw error;
    setFolders(prev => [...prev, data as Folder].sort((a, b) => a.name.localeCompare(b.name)));
    return data as Folder;
  }, []);

  const updateFolder = useCallback(async (folderId: string, updates: Partial<Pick<Folder, 'name' | 'color' | 'icon'>>) => {
    // @ts-expect-error Supabase type inference issue
    const { error } = await supabase.from('folders').update(updates).eq('id', folderId);
    if (error) throw error;
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, ...updates } : f));
  }, []);

  const deleteFolder = useCallback(async (folderId: string) => {
    const { error } = await supabase.from('folders').delete().eq('id', folderId);
    if (error) throw error;
    setFolders(prev => prev.filter(f => f.id !== folderId));
  }, []);

  return { folders, loading, error, refetch: fetch, createFolder, updateFolder, deleteFolder };
}

// ============================================================
// useNotifications — real-time notification feed
// ============================================================

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    const items = (data ?? []) as Notification[];
    setNotifications(items);
    setUnreadCount(items.filter(n => !n.is_read).length);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();

    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      }, (payload: any) => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetch]);

  const markRead = useCallback(async (notificationId: string) => {
    await supabase
      .from('notifications')
      // @ts-expect-error Supabase type inference issue
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('notifications')
      // @ts-expect-error Supabase type inference issue
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_read', false);

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, []);

  return { notifications, unreadCount, loading, refetch: fetch, markRead, markAllRead };
}

// ============================================================
// useDocumentSearch — debounced search via edge function
// ============================================================

export function useDocumentSearch() {
  const [results, setResults] = useState<Document[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (params: {
    query?: string;
    status?: string;
    folder_id?: string;
    tags?: string[];
    risk_level?: string;
    is_favorite?: boolean;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    page?: number;
    page_size?: number;
  }) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-documents`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(params),
          }
        );

        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        setResults(data.documents ?? []);
        setTotal(data.total ?? 0);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  return { results, total, loading, error, search };
}

// ============================================================
// useShare — create and manage document share links
// ============================================================

export function useShare() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createShare = useCallback(async (
    documentId: string,
    options: { permission?: 'view' | 'comment'; expiresInDays?: number; sharedWithEmail?: string } = {}
  ): Promise<{ shareUrl: string; shareToken: string } | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-shares`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            document_id: documentId,
            permission: options.permission ?? 'view',
            expires_in_days: options.expiresInDays ?? null,
            shared_with_email: options.sharedWithEmail ?? null,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to create share link');
      }

      const data = await res.json();
      return { shareUrl: data.share_url, shareToken: data.share_token };
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const revokeShare = useCallback(async (shareId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-shares`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ share_id: shareId }),
        }
      );

      return res.ok;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, createShare, revokeShare };
}

// ============================================================
// useAuth — authentication state and methods
// ============================================================

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    signInWithGoogle,
  };
}

// ============================================================
// useAvatarUpload
// ============================================================

export function useAvatarUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadAvatar = useCallback(async (file: File): Promise<string | null> => {
    setUploading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (!file.type.startsWith('image/')) throw new Error('File must be an image');
      if (file.size > 2 * 1024 * 1024) throw new Error('Image must be under 2MB');

      const path = `${user.id}/${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);

      // @ts-expect-error Supabase type inference issue
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);

      return publicUrl;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  return { uploading, error, uploadAvatar };
}
