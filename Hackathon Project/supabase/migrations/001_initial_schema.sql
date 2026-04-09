-- ============================================================
-- LegasistAI - Initial Database Schema
-- Phase 6: Core Backend Integration and Database
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE document_status AS ENUM (
  'uploading',
  'processing',
  'completed',
  'failed',
  'deleted'
);

CREATE TYPE risk_level AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

CREATE TYPE clause_category AS ENUM (
  'obligations',
  'rights',
  'penalties',
  'termination',
  'payment',
  'confidentiality',
  'liability',
  'dispute_resolution',
  'intellectual_property',
  'general'
);

CREATE TYPE sharing_permission AS ENUM (
  'view',
  'comment'
);

CREATE TYPE subscription_tier AS ENUM (
  'free',
  'pro',
  'enterprise'
);

CREATE TYPE notification_type AS ENUM (
  'analysis_complete',
  'document_shared',
  'risk_alert',
  'deadline_reminder',
  'system'
);

-- ============================================================
-- USERS PROFILE TABLE
-- (extends Supabase auth.users)
-- ============================================================

CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  full_name       TEXT,
  avatar_url      TEXT,
  company         TEXT,
  job_title       TEXT,
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT UNIQUE,
  documents_used  INTEGER NOT NULL DEFAULT 0,
  documents_limit INTEGER NOT NULL DEFAULT 5,      -- free tier limit
  storage_used_bytes BIGINT NOT NULL DEFAULT 0,
  storage_limit_bytes BIGINT NOT NULL DEFAULT 52428800, -- 50MB free
  preferences     JSONB NOT NULL DEFAULT '{
    "emailNotifications": true,
    "riskAlerts": true,
    "weeklyDigest": false,
    "language": "en"
  }'::jsonb,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  last_seen_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FOLDERS TABLE
-- ============================================================

CREATE TABLE public.folders (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id   UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  color       TEXT DEFAULT '#6B7280',
  icon        TEXT DEFAULT 'folder',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT folders_name_length CHECK (char_length(name) BETWEEN 1 AND 100)
);

-- ============================================================
-- DOCUMENTS TABLE
-- ============================================================

CREATE TABLE public.documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  folder_id       UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_path       TEXT NOT NULL,           -- Supabase Storage path
  file_size_bytes BIGINT NOT NULL,
  file_type       TEXT NOT NULL,           -- 'pdf', 'docx', 'txt'
  mime_type       TEXT NOT NULL,
  page_count      INTEGER,
  word_count      INTEGER,
  status          document_status NOT NULL DEFAULT 'uploading',
  is_favorite     BOOLEAN NOT NULL DEFAULT false,
  tags            TEXT[] DEFAULT '{}',
  extracted_text  TEXT,                    -- Raw extracted text
  text_preview    TEXT,                    -- First ~500 chars for quick preview
  processing_error TEXT,
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Full-text search index on documents
CREATE INDEX documents_text_search_idx ON public.documents
  USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(text_preview, '')));

CREATE INDEX documents_user_id_idx ON public.documents(user_id);
CREATE INDEX documents_folder_id_idx ON public.documents(folder_id);
CREATE INDEX documents_status_idx ON public.documents(status);
CREATE INDEX documents_tags_idx ON public.documents USING gin(tags);

-- ============================================================
-- ANALYSES TABLE
-- Stores the full AI-generated analysis for a document
-- ============================================================

CREATE TABLE public.analyses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id     UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Executive Summary
  plain_summary       TEXT,               -- Plain-English summary of the whole doc
  executive_summary   TEXT,               -- Short executive summary
  document_type       TEXT,               -- e.g. "Service Agreement", "NDA"
  parties_involved    JSONB DEFAULT '[]', -- [{name, role}]
  
  -- Risk Overview
  overall_risk_score  NUMERIC(4,2),       -- 0–100
  overall_risk_level  risk_level,
  risk_summary        TEXT,
  
  -- Key Dates & Numbers
  effective_date      TEXT,
  expiration_date     TEXT,
  key_financial_terms JSONB DEFAULT '[]', -- [{label, value, currency}]
  key_dates           JSONB DEFAULT '[]', -- [{label, date, description}]
  
  -- Recommendations
  recommendations     JSONB DEFAULT '[]', -- [{priority, title, description, action}]
  negotiation_points  JSONB DEFAULT '[]', -- [{clause, issue, suggestion}]
  
  -- Decision Framework
  proceed_factors     TEXT[],
  caution_factors     TEXT[],
  
  -- Metadata
  ai_model_used       TEXT DEFAULT 'gpt-4o',
  prompt_tokens       INTEGER,
  completion_tokens   INTEGER,
  processing_duration_ms INTEGER,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX analyses_document_id_idx ON public.analyses(document_id);
CREATE INDEX analyses_user_id_idx ON public.analyses(user_id);

-- ============================================================
-- CLAUSES TABLE
-- Individual clauses extracted and analyzed from documents
-- ============================================================

CREATE TABLE public.clauses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id     UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  analysis_id     UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  
  -- Source
  original_text   TEXT NOT NULL,          -- Original clause text
  clause_number   INTEGER,                -- Position in document
  page_number     INTEGER,
  section_title   TEXT,                   -- e.g. "Section 4.2"
  
  -- Classification
  category        clause_category NOT NULL DEFAULT 'general',
  risk_level      risk_level NOT NULL DEFAULT 'low',
  risk_score      NUMERIC(4,2),           -- 0–100
  
  -- Simplified Analysis
  plain_explanation TEXT NOT NULL,        -- Plain-English explanation
  risk_description  TEXT,                 -- Why this is risky (if applicable)
  implications      TEXT,                 -- What this means for the user
  
  -- Flags
  requires_action BOOLEAN NOT NULL DEFAULT false,
  is_non_standard BOOLEAN NOT NULL DEFAULT false,
  is_highlighted  BOOLEAN NOT NULL DEFAULT false,
  
  -- Key Terms in this clause
  key_terms       JSONB DEFAULT '[]',     -- [{term, definition}]
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX clauses_document_id_idx ON public.clauses(document_id);
CREATE INDEX clauses_analysis_id_idx ON public.clauses(analysis_id);
CREATE INDEX clauses_risk_level_idx ON public.clauses(risk_level);
CREATE INDEX clauses_category_idx ON public.clauses(category);

-- ============================================================
-- CHAT SESSIONS TABLE
-- ============================================================

CREATE TABLE public.chat_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL DEFAULT 'New Chat',
  document_ids    UUID[] DEFAULT '{}',    -- Documents in context
  message_count   INTEGER NOT NULL DEFAULT 0,
  is_archived     BOOLEAN NOT NULL DEFAULT false,
  last_message_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX chat_sessions_user_id_idx ON public.chat_sessions(user_id);

-- ============================================================
-- CHAT MESSAGES TABLE
-- ============================================================

CREATE TABLE public.chat_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content         TEXT NOT NULL,
  
  -- Source references (which clauses/sections the AI cited)
  cited_clauses   UUID[] DEFAULT '{}',
  cited_documents UUID[] DEFAULT '{}',
  
  -- Suggested follow-up questions
  suggested_questions TEXT[] DEFAULT '{}',
  
  -- Token tracking
  prompt_tokens   INTEGER,
  completion_tokens INTEGER,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX chat_messages_session_id_idx ON public.chat_messages(session_id);

-- ============================================================
-- QUESTIONS & ANSWERS TABLE
-- Standalone Q&A tied directly to a document
-- ============================================================

CREATE TABLE public.document_qna (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id     UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question        TEXT NOT NULL,
  answer          TEXT NOT NULL,
  cited_clauses   UUID[] DEFAULT '{}',
  is_saved        BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX document_qna_document_id_idx ON public.document_qna(document_id);
CREATE INDEX document_qna_user_id_idx ON public.document_qna(user_id);

-- ============================================================
-- DOCUMENT SHARING TABLE
-- ============================================================

CREATE TABLE public.document_shares (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id     UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  owner_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  share_token     TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  shared_with_email TEXT,                 -- NULL = public link
  permission      sharing_permission NOT NULL DEFAULT 'view',
  expires_at      TIMESTAMPTZ,
  accessed_count  INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX document_shares_document_id_idx ON public.document_shares(document_id);
CREATE INDEX document_shares_token_idx ON public.document_shares(share_token);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================

CREATE TABLE public.notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type            notification_type NOT NULL,
  title           TEXT NOT NULL,
  message         TEXT NOT NULL,
  data            JSONB DEFAULT '{}',     -- Extra payload (document_id, etc.)
  is_read         BOOLEAN NOT NULL DEFAULT false,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX notifications_user_id_unread_idx ON public.notifications(user_id, is_read);

-- ============================================================
-- USER ANALYTICS / AUDIT LOG TABLE
-- ============================================================

CREATE TABLE public.user_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type      TEXT NOT NULL,          -- e.g. 'document_uploaded', 'analysis_viewed'
  resource_type   TEXT,                   -- 'document', 'analysis', 'chat'
  resource_id     UUID,
  metadata        JSONB DEFAULT '{}',
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX user_events_user_id_idx ON public.user_events(user_id);
CREATE INDEX user_events_event_type_idx ON public.user_events(event_type);
CREATE INDEX user_events_created_at_idx ON public.user_events(created_at);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER folders_updated_at BEFORE UPDATE ON public.folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER analyses_updated_at BEFORE UPDATE ON public.analyses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER chat_sessions_updated_at BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update chat session message count and last_message_at
CREATE OR REPLACE FUNCTION update_chat_session_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_sessions
  SET
    message_count = message_count + 1,
    last_message_at = NOW(),
    updated_at = NOW()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_chat_message_inserted
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_chat_session_on_message();

-- Update user storage usage when document is inserted/deleted
CREATE OR REPLACE FUNCTION update_user_storage()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
    SET storage_used_bytes = storage_used_bytes + NEW.file_size_bytes,
        documents_used = documents_used + 1
    WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status != 'deleted' THEN
    UPDATE public.profiles
    SET storage_used_bytes = GREATEST(0, storage_used_bytes - OLD.file_size_bytes),
        documents_used = GREATEST(0, documents_used - 1)
    WHERE id = OLD.user_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_document_change
  AFTER INSERT OR DELETE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION update_user_storage();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_qna ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only read/update their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Folders: full CRUD for own folders
CREATE POLICY "folders_own" ON public.folders
  USING (auth.uid() = user_id);

-- Documents: own documents + shared documents (view)
CREATE POLICY "documents_own" ON public.documents
  USING (auth.uid() = user_id);

CREATE POLICY "documents_shared_view" ON public.documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.document_shares ds
      WHERE ds.document_id = id
        AND ds.is_active = true
        AND (ds.expires_at IS NULL OR ds.expires_at > NOW())
        AND (ds.shared_with_email IS NULL OR ds.shared_with_email = (
          SELECT email FROM auth.users WHERE auth.users.id = auth.uid()
        ))
    )
  );

-- Analyses: own analyses
CREATE POLICY "analyses_own" ON public.analyses
  USING (auth.uid() = user_id);

-- Clauses: accessible if user owns the parent document
CREATE POLICY "clauses_via_document" ON public.clauses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_id AND d.user_id = auth.uid()
    )
  );

-- Chat sessions & messages: own only
CREATE POLICY "chat_sessions_own" ON public.chat_sessions
  USING (auth.uid() = user_id);

CREATE POLICY "chat_messages_own" ON public.chat_messages
  USING (auth.uid() = user_id);

-- Q&A: own only
CREATE POLICY "document_qna_own" ON public.document_qna
  USING (auth.uid() = user_id);

-- Shares: owner can manage; shared users can view
CREATE POLICY "document_shares_owner" ON public.document_shares
  USING (auth.uid() = owner_id);

-- Notifications: own only
CREATE POLICY "notifications_own" ON public.notifications
  USING (auth.uid() = user_id);

-- Events: own only (insert + select)
CREATE POLICY "user_events_own" ON public.user_events
  USING (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKETS SETUP (run via Supabase dashboard or CLI)
-- ============================================================

-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES
--   ('documents', 'documents', false, 52428800, -- 50MB
--    ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']),
--   ('avatars', 'avatars', true, 2097152, -- 2MB
--    ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- Storage RLS policies (run separately)
-- CREATE POLICY "documents_upload_own" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "documents_select_own" ON storage.objects
--   FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "documents_delete_own" ON storage.objects
--   FOR DELETE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
