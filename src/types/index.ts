export interface Env {
  // Zendesk Configuration
  ZENDESK_DOMAIN: string;
  ZENDESK_EMAIL: string;
  ZENDESK_TOKEN: string;
  
  // ClickUp Configuration  
  CLICKUP_TOKEN?: string; // Optional - for direct API token usage
  CLICKUP_LIST_ID: string;
  CLICKUP_TEAM_ID?: string;
  CLICKUP_SPACE_ID?: string;
  
  // ClickUp OAuth Configuration
  CLICKUP_CLIENT_ID: string;
  CLICKUP_CLIENT_SECRET: string;
  CLICKUP_REDIRECT_URI: string;
  
  // Slack Configuration
  SLACK_BOT_TOKEN: string;
  SLACK_SIGNING_SECRET: string;
  SLACK_APP_TOKEN?: string;
  
  // Phase 1: Enhanced Slack Channels
  SLACK_MANAGEMENT_CHANNEL?: string;
  SLACK_DEVELOPMENT_CHANNEL?: string;
  SLACK_SUPPORT_CHANNEL?: string;
  SLACK_BILLING_CHANNEL?: string;
  SLACK_DEFAULT_CHANNEL?: string;
  
  // AI Provider Configuration
  AI_PROVIDER: 'googlegemini' | 'openai' | 'openrouter';
  GOOGLE_GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  OPENAI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
  
  // KV Storage
  TASK_MAPPING?: KVNamespace;
  
  // Optional
  ENVIRONMENT?: string;
  WEBHOOK_SECRET?: string;
}

// Zendesk Types
export interface ZendeskUser {
  id: number;
  name: string;
  email: string;
}

export interface ZendeskTicket {
  id: number;
  url: string;
  subject: string;
  description: string;
  raw_subject: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'new' | 'open' | 'pending' | 'solved' | 'closed';
  requester_id: number;
  assignee_id?: number;
  organization_id?: number;
  group_id?: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  external_id?: string;
}

export interface ZendeskWebhook {
  type: string;
  ticket?: ZendeskTicket;
  detail?: ZendeskTicket; // New webhook format uses 'detail' instead of 'ticket'
  current_user?: ZendeskUser;
  account?: {
    subdomain: string;
  };
}

export interface ZendeskWebhookPayload {
  type: string;
  ticket?: ZendeskTicket;
  current_user?: ZendeskUser;
  account?: {
    subdomain: string;
  };
}

export interface ZendeskApiResponse<T = any> {
  ticket?: T;
  tickets?: T[];
  users?: ZendeskUser[];
  count?: number;
  next_page?: string;
  previous_page?: string;
}

// ClickUp Types
export interface ClickUpUser {
  id: number;
  username: string;
  email: string;
  color: string;
  initials?: string;
  profilePicture?: string;
}

export interface ClickUpStatus {
  id: string;
  status: string;
  color: string;
  orderindex: number;
  type: 'open' | 'closed' | 'custom';
}

export interface ClickUpPriority {
  id: string;
  priority: string;
  color: string;
  orderindex: string;
}

export interface ClickUpTask {
  id: string;
  custom_id?: string;
  name: string;
  text_content?: string;
  description: string;
  status: ClickUpStatus;
  orderindex: string;
  date_created: string;
  date_updated: string;
  date_closed?: string;
  creator: ClickUpUser;
  assignees: ClickUpUser[];
  tags: Array<{
    name: string;
    tag_fg?: string;
    tag_bg?: string;
  }>;
  priority?: ClickUpPriority;
  due_date?: string;
  start_date?: string;
  time_estimate?: number;
  time_spent?: number;
  custom_fields: Array<{
    id: string;
    name: string;
    type: string;
    value: any;
  }>;
  list: {
    id: string;
    name: string;
  };
  folder: {
    id: string;
    name: string;
  };
  space: {
    id: string;
  };
  url: string;
}

export interface ClickUpWebhook {
  event: string;
  task_id: string;
  webhook_id: string;
  history_items?: Array<{
    id: string;
    type: number;
    date: string;
    field: string;
    parent_id: string;
    data: any;
    source: string;
    user: ClickUpUser;
    before?: any;
    after?: any;
  }>;
}

export interface ClickUpWebhookPayload {
  event: string;
  task_id: string;
  webhook_id: string;
  history_items?: Array<{
    id: string;
    type: number;
    date: string;
    field: string;
    parent_id: string;
    data: any;
    source: string;
    user: ClickUpUser;
    before?: any;
    after?: any;
  }>;
}

export interface ClickUpComment {
  id: string;
  comment: Array<{
    text: string;
  }>;
  comment_text: string;
  user: {
    id: number;
    username: string;
    email?: string;
    source?: string;
  };
  date: string;
}

// Task Mapping Types
export interface TaskMapping {
  zendesk_ticket_id: number;
  clickup_task_id: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'archived';
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: boolean;
  context?: string;
  timestamp: string;
}

export interface WebhookResponse {
  status: 'received' | 'processed' | 'error';
  message: string;
  data?: any;
  timestamp: string;
}

// Configuration Types
export interface IntegrationConfig {
  zendesk: {
    domain: string;
    email: string;
    token: string;
  };
  clickup: {
    token: string;
    list_id: string;
    team_id?: string;
    space_id?: string;
  };
  slack: {
    bot_token: string;
    signing_secret: string;
    app_token?: string;
  };
  ai: {
    provider: 'googlegemini' | 'openai' | 'openrouter';
    api_key: string;
    model?: string;
  };
  features: {
    auto_create_tasks: boolean;
    sync_status: boolean;
    sync_comments: boolean;
    sync_priority: boolean;
    ai_summarization: boolean;
  };
}

// Slack Types
export interface SlackEvent {
  type: string;
  channel: string;
  user: string;
  text?: string;
  ts: string;
  thread_ts?: string;
  // For member_joined_channel events
  inviter?: string;
  // For app_mention events
  bot_id?: string;
  // Additional properties for enhanced functionality
  channel_type?: 'channel' | 'group' | 'im' | 'mpim';
  team?: string;
}

export interface SlackMessage {
  channel: string;
  text: string;
  thread_ts?: string;
  blocks?: any[];
  user: string;
  ts: string;
}

export interface SlackApiResponse {
  ok: boolean;
  error?: string;
  channel?: string;
  ts?: string;
  message?: {
    text: string;
    user: string;
    ts: string;
    thread_ts?: string;
  };
}

export interface TaskGenieContext {
  ticketId?: string;
  zendesk_ticket_id?: number;
  clickup_task_id?: string;
  slack_thread_ts?: string;
  channel: string;
  threadTs: string;
  user_id?: string;
  channel_id?: string;
  awaiting_summarization?: boolean;
}

// AI Provider Types
export interface AIProvider {
  name: 'googlegemini' | 'openai' | 'openrouter';
  summarize(text: string): Promise<string>;
}

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost: number;
  currency: string;
}

export interface AIResponse {
  summary: string;
  provider: string;
  model?: string;
  timestamp: string;
  token_usage?: TokenUsage;
}

// Phase 1: Enhanced AI Analysis Types
export interface TicketMetadata {
  requester_email?: string;
  organization?: string;
  previous_tickets_count?: number;
  customer_tier?: 'free' | 'pro' | 'enterprise';
  business_hours?: boolean;
}

export interface TicketAnalysis {
  summary: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'general' | 'account' | 'bug' | 'feature';
  sentiment: 'frustrated' | 'neutral' | 'happy' | 'angry';
  urgency_indicators: string[];
  suggested_team: 'development' | 'support' | 'billing' | 'management';
  action_items: string[];
  estimated_complexity: 'simple' | 'medium' | 'complex';
  confidence_score: number;
}

export interface DuplicateAnalysis {
  is_duplicate: boolean;
  similar_tickets: Array<{
    ticket_id: number;
    similarity_score: number;
    reason: string;
  }>;
  suggested_action: 'merge' | 'link' | 'ignore';
  confidence: number;
}

export interface AIInsights {
  period: string;
  total_tickets: number;
  trends: {
    priority_distribution: Record<string, number>;
    category_breakdown: Record<string, number>;
    sentiment_analysis: Record<string, number>;
    team_workload: Record<string, number>;
  };
  alerts: Array<{
    type: 'volume_spike' | 'priority_surge' | 'team_overload' | 'sentiment_decline';
    message: string;
    severity: 'low' | 'medium' | 'high';
    affected_area: string;
  }>;
  recommendations: string[];
}

export interface AssignmentRule {
  condition: {
    category?: string[];
    priority?: string[];
    keywords?: string[];
    sentiment?: string[];
    complexity?: string[];
  };
  action: {
    assign_to_team: string;
    notify_manager?: boolean;
    escalate?: boolean;
    priority_adjustment?: 'increase' | 'decrease';
  };
  weight: number;
}

export interface AssignmentRecommendation {
  team: string;
  confidence: number;
  reason: string;
  escalate: boolean;
  notify_manager: boolean;
  priority_adjustment?: 'increase' | 'decrease';
}

export interface PriorityAdjustment {
  original_priority: string;
  suggested_priority: string;
  reason: string;
  confidence: number;
}

// OAuth Types
export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
  scope?: string;
  expires_at?: number; // calculated expiration timestamp
}

export interface ClickUpOAuthResponse {
  access_token: string;
  token_type: string;
}

export interface UserOAuthData {
  user_id: string;
  team_id?: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  authorized_at: string;
  scopes?: string[];
}