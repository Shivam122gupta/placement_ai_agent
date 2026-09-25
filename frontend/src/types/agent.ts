export interface ToolCallAudit {
  tool_name: string;
  params: Record<string, any>;
  result_summary: string;
  is_error: boolean;
  latency_ms: number;
}

export interface PendingConfirmation {
  confirmation_token: string;
  tool_name: string;
  params: Record<string, any>;
  warning_message: string;
}

export interface AgentChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  tool_audits?: ToolCallAudit[];
  pending_confirmation?: PendingConfirmation | null;
}

export interface AgentChatRequest {
  message: string;
  session_id?: string;
}

export interface AgentChatResponse {
  session_id: string;
  status: 'COMPLETED' | 'WAITING_CONFIRMATION' | 'FAILED';
  response: string;
  tool_audits: ToolCallAudit[];
  pending_confirmation?: PendingConfirmation | null;
  step_count: number;
}

export interface ActionConfirmationRequest {
  session_id: string;
  tool_name: string;
  params: Record<string, any>;
  decision: 'approve' | 'reject';
}

export interface AgentHistoryItem {
  id: string;
  session_id: string;
  initial_prompt: string;
  status: string;
  total_steps: number;
  total_latency_ms: number;
  tool_calls: string[];
  final_response: string;
  created_at: string;
}
