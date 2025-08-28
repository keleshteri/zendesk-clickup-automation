/**
 * @ai-metadata
 * @component: Shared Types
 * @description: Shared TypeScript type definitions used across the application
 * @last-update: 2025-01-17
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["./env.ts", "../services/integrations/zendesk/interfaces", "../services/integrations/clickup/interfaces"]
 * @tests: []
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Central barrel export for shared types and re-exports from domain-specific interfaces"
 */

// Re-export environment types
export { Env } from './env';

// Re-export domain-specific types
export type { ZendeskUser, ZendeskTicket, ZendeskWebhookPayload, ZendeskApiResponse } from '../services/integrations/zendesk/interfaces';
export type { ClickUpUser, ClickUpTask, ClickUpWebhook } from '../services/integrations/clickup/interfaces';
export type { OAuthTokens, ClickUpOAuthResponse, UserOAuthData } from '../services/integrations/clickup/interfaces';

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
  urgency: 'low' | 'medium' | 'high' | 'critical';
  category: 'technical' | 'billing' | 'general' | 'account' | 'bug' | 'feature';
  sentiment: 'frustrated' | 'neutral' | 'happy' | 'angry';
  urgency_indicators: string[];
  suggested_team: 'development' | 'support' | 'billing' | 'management';
  action_items: string[];
  estimated_complexity: 'simple' | 'medium' | 'complex';
  confidence_score: number;
  recommendedAgent?: string;
  enhancedInsights?: {
    ticketComplexity: 'low' | 'medium' | 'high';
    estimatedResolutionTime: string;
    businessImpact: 'low' | 'medium' | 'high';
  };
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