// ============================================================
// LegasistAI - TypeScript Database Types
// Auto-synced with Supabase schema
// ============================================================

export type DocumentStatus = 'uploading' | 'processing' | 'completed' | 'failed' | 'deleted';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ClauseCategory =
  | 'obligations'
  | 'rights'
  | 'penalties'
  | 'termination'
  | 'payment'
  | 'confidentiality'
  | 'liability'
  | 'dispute_resolution'
  | 'intellectual_property'
  | 'general';
export type SharingPermission = 'view' | 'comment';
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';
export type NotificationType =
  | 'analysis_complete'
  | 'document_shared'
  | 'risk_alert'
  | 'deadline_reminder'
  | 'system';

// ---- Profiles ------------------------------------------------

export interface UserPreferences {
  emailNotifications: boolean;
  riskAlerts: boolean;
  weeklyDigest: boolean;
  language: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  company: string | null;
  job_title: string | null;
  subscription_tier: SubscriptionTier;
  stripe_customer_id: string | null;
  documents_used: number;
  documents_limit: number;
  storage_used_bytes: number;
  storage_limit_bytes: number;
  preferences: UserPreferences;
  onboarding_completed: boolean;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---- Folders ------------------------------------------------

export interface Folder {
  id: string;
  user_id: string;
  parent_id: string | null;
  name: string;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
  // Joined
  children?: Folder[];
  document_count?: number;
}

// ---- Documents -----------------------------------------------

export interface Document {
  id: string;
  user_id: string;
  folder_id: string | null;
  title: string;
  original_filename: string;
  file_path: string;
  file_size_bytes: number;
  file_type: 'pdf' | 'docx' | 'txt';
  mime_type: string;
  page_count: number | null;
  word_count: number | null;
  status: DocumentStatus;
  is_favorite: boolean;
  tags: string[];
  extracted_text: string | null;
  text_preview: string | null;
  processing_error: string | null;
  processing_started_at: string | null;
  processing_completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  analysis?: Analysis;
  folder?: Folder;
}

// ---- Analyses ------------------------------------------------

export interface PartyInvolved {
  name: string;
  role: string;
}

export interface KeyFinancialTerm {
  label: string;
  value: string;
  currency?: string;
}

export interface KeyDate {
  label: string;
  date: string;
  description: string;
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
}

export interface NegotiationPoint {
  clause: string;
  issue: string;
  suggestion: string;
}

export interface Analysis {
  id: string;
  document_id: string;
  user_id: string;
  plain_summary: string | null;
  executive_summary: string | null;
  document_type: string | null;
  parties_involved: PartyInvolved[];
  overall_risk_score: number | null;
  overall_risk_level: RiskLevel | null;
  risk_summary: string | null;
  effective_date: string | null;
  expiration_date: string | null;
  key_financial_terms: KeyFinancialTerm[];
  key_dates: KeyDate[];
  recommendations: Recommendation[];
  negotiation_points: NegotiationPoint[];
  proceed_factors: string[];
  caution_factors: string[];
  ai_model_used: string;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  processing_duration_ms: number | null;
  created_at: string;
  updated_at: string;
  // Joined
  clauses?: Clause[];
}

// ---- Clauses -------------------------------------------------

export interface KeyTerm {
  term: string;
  definition: string;
}

export interface Clause {
  id: string;
  document_id: string;
  analysis_id: string;
  original_text: string;
  clause_number: number | null;
  page_number: number | null;
  section_title: string | null;
  category: ClauseCategory;
  risk_level: RiskLevel;
  risk_score: number | null;
  plain_explanation: string;
  risk_description: string | null;
  implications: string | null;
  requires_action: boolean;
  is_non_standard: boolean;
  is_highlighted: boolean;
  key_terms: KeyTerm[];
  created_at: string;
}

// ---- Chat ---------------------------------------------------

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  document_ids: string[];
  message_count: number;
  is_archived: boolean;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  messages?: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  cited_clauses: string[];
  cited_documents: string[];
  suggested_questions: string[];
  prompt_tokens: number | null;
  completion_tokens: number | null;
  created_at: string;
}

// ---- Q&A ----------------------------------------------------

export interface DocumentQnA {
  id: string;
  document_id: string;
  user_id: string;
  question: string;
  answer: string;
  cited_clauses: string[];
  is_saved: boolean;
  created_at: string;
}

// ---- Sharing ------------------------------------------------

export interface DocumentShare {
  id: string;
  document_id: string;
  owner_id: string;
  share_token: string;
  shared_with_email: string | null;
  permission: SharingPermission;
  expires_at: string | null;
  accessed_count: number;
  last_accessed_at: string | null;
  is_active: boolean;
  created_at: string;
}

// ---- Notifications ------------------------------------------

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

// ---- API Request/Response Types ----------------------------

export interface UploadDocumentRequest {
  file: File;
  title?: string;
  folder_id?: string;
  tags?: string[];
}

export interface UploadDocumentResponse {
  document_id: string;
  file_path: string;
  status: DocumentStatus;
}

export interface AnalyzeDocumentRequest {
  document_id: string;
  force_reanalysis?: boolean;
}

export interface AnalyzeDocumentResponse {
  analysis_id: string;
  status: 'started' | 'completed' | 'failed';
  message?: string;
}

export interface ChatMessageRequest {
  session_id?: string;           // null = new session
  document_ids: string[];
  message: string;
  conversation_history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface ChatMessageResponse {
  session_id: string;
  message_id: string;
  answer: string;
  cited_clauses: string[];
  cited_documents: string[];
  suggested_questions: string[];
}

export interface SearchDocumentsRequest {
  query: string;
  status?: DocumentStatus;
  folder_id?: string;
  tags?: string[];
  date_from?: string;
  date_to?: string;
  risk_level?: RiskLevel;
  page?: number;
  page_size?: number;
}

export interface SearchDocumentsResponse {
  documents: Document[];
  total: number;
  page: number;
  page_size: number;
}

// ---- Update/Insert types (exclude readonly fields) --------

export type UpdateProfile = Omit<Partial<Profile>, 'id' | 'created_at'>;
export type InsertProfile = Omit<Partial<Profile>, 'id' | 'created_at' | 'updated_at'>;

export type UpdateFolder = Omit<Partial<Folder>, 'id' | 'created_at' | 'updated_at'>;
export type InsertFolder = Omit<Partial<Folder>, 'id' | 'created_at' | 'updated_at' | 'children' | 'document_count'>;

export type UpdateDocument = Omit<Partial<Document>, 'id' | 'created_at' | 'analysis' | 'folder'>;
export type InsertDocument = Omit<Partial<Document>, 'id' | 'created_at' | 'updated_at' | 'analysis' | 'folder'>;

export type UpdateAnalysis = Omit<Partial<Analysis>, 'id' | 'created_at' | 'clauses'>;
export type InsertAnalysis = Omit<Partial<Analysis>, 'id' | 'created_at' | 'updated_at' | 'clauses'>;

export type UpdateNotification = Omit<Partial<Notification>, 'id' | 'created_at'>;
export type InsertNotification = Omit<Partial<Notification>, 'id' | 'created_at'>;

// ---- Supabase Database type (for typed client) ------------

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: InsertProfile; Update: UpdateProfile };
      folders: { Row: Folder; Insert: InsertFolder; Update: UpdateFolder };
      documents: { Row: Document; Insert: InsertDocument; Update: UpdateDocument };
      analyses: { Row: Analysis; Insert: InsertAnalysis; Update: UpdateAnalysis };
      clauses: { Row: Clause; Insert: Partial<Clause>; Update: Partial<Clause> };
      chat_sessions: { Row: ChatSession; Insert: Partial<ChatSession>; Update: Partial<ChatSession> };
      chat_messages: { Row: ChatMessage; Insert: Partial<ChatMessage>; Update: Partial<ChatMessage> };
      document_qna: { Row: DocumentQnA; Insert: Partial<DocumentQnA>; Update: Partial<DocumentQnA> };
      document_shares: { Row: DocumentShare; Insert: Partial<DocumentShare>; Update: Partial<DocumentShare> };
      notifications: { Row: Notification; Insert: InsertNotification; Update: UpdateNotification };
      user_events: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
    };
  };
};
