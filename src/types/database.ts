export type UserRole = 'Admin' | 'Agent' | 'User';
export type TicketStatus = 'Open' | 'In Progress' | 'Resolved';
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category_id: string | null;
  user_id: string;
  assigned_to: string | null;
  ai_summary: string | null;
  ai_classification: string | null;
  ai_suggestions: string | null;
  ai_risk_level: string | null;
  ai_sentiment: string | null;
  created_at: string;
  updated_at: string;
  categories?: Category | null;
}

export interface Comment {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_internal: boolean;
  created_at: string;
  users?: Pick<User, 'full_name' | 'email' | 'role'> | null;
}

export interface Notification {
  id: string;
  user_id: string;
  ticket_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AiLog {
  id: string;
  ticket_id: string;
  prompt: string;
  model_version: string;
  latency_ms: number;
  response_json: Record<string, unknown>;
  created_at: string;
}
