export type PlatformId = "genesys" | "five9" | "nice";
export type CallDirection = "inbound" | "outbound";
export type CallStatus = "active" | "held" | "ended" | "transferred";
export type AgentStatus = "available" | "busy" | "away" | "offline";
export type Speaker = "agent" | "customer";
export type SentimentLabel = "positive" | "neutral" | "negative" | "urgent";

export interface TranscriptTurn {
  speaker: Speaker;
  text: string;
  timestamp: string;
  confidence: number;
  language: string;
}

export interface UniversalCall {
  call_id: string;
  session_id: string;
  start_time: string;
  end_time?: string;
  duration_seconds: number;
  direction: CallDirection;
  status: CallStatus;
  recording_url?: string;
  transcript: TranscriptTurn[];
  sentiment_score: number;
  summary: string;
}

export interface UniversalAgent {
  agent_id: string;
  name: string;
  email: string;
  status: AgentStatus;
  skills: string[];
  current_call_id: string | null;
  queue_id: string;
}

export interface UniversalCustomer {
  customer_id: string;
  phone_number: string;
  name: string | null;
  email: string | null;
  account_id: string | null;
  history: CallSummary[];
  crm_data: Record<string, unknown>;
}

export interface CallSummary {
  call_id: string;
  date: string;
  outcome: string;
  summary: string;
}

export interface RoutingState {
  queue_id: string;
  queue_name: string;
  wait_time_seconds: number;
  priority: number;
  skills_required: string[];
  ivr_path: string[];
}

export interface KbArticle {
  title: string;
  url: string;
  confidence: number;
  excerpt: string;
}

export interface AssistPolicy {
  language: "es" | "en";
  sensitivity: number;
  includeCompliance: boolean;
}

export interface AiAssistRequest {
  platform: PlatformId;
  call: UniversalCall;
  agent: UniversalAgent;
  customer: UniversalCustomer;
  routing: RoutingState;
  policy: AssistPolicy;
}

export interface AiAssistResponse {
  suggested_response: string;
  kb_articles: KbArticle[];
  next_best_action: string;
  escalation_flag: boolean;
  compliance_alerts: string[];
  sentiment_score: number;
  sentiment_label: SentimentLabel;
  summary: string;
  risk_factors: string[];
  recommended_disposition: string;
  confidence: number;
  source: "openai" | "demo";
  model: string | null;
  generated_at: string;
}

export interface PlatformAdapter {
  name: string;
  platform: PlatformId;
  normalizeCall(raw: Record<string, unknown>): UniversalCall;
  normalizeAgent(raw: Record<string, unknown>): UniversalAgent;
  normalizeCustomer(raw: Record<string, unknown>): UniversalCustomer;
}
