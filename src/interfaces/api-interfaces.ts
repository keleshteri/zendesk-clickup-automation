/**
 * @ai-metadata
 * @component: APIInterfaces
 * @description: Core API interface definitions for the application
 * @last-update: 2025-01-17
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/api-interfaces.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: []
 * @tests: []
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Centralized API interface definitions including task mapping, responses, integrations, AI providers, and ticket analysis"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - dev-approved-by: ""
 *   - dev-approved-date: ""
 *   - code-review-approved: false
 *   - code-review-approved-by: ""
 *   - code-review-date: ""
 *   - qa-approved: false
 *   - qa-approved-by: ""
 *   - qa-approved-date: ""
 * 
 * @approval-rules:
 *   - require-dev-approval-for: ["breaking-changes", "security-related"]
 *   - require-code-review-for: ["all-changes"]
 *   - require-qa-approval-for: ["production-ready"]
 */

// Task and Mapping Interfaces
export interface TaskMapping {
  zendesk_ticket_id: number;
  clickup_task_id: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'archived';
}

// API Response Interfaces
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

// Integration Configuration
export interface IntegrationConfig {
  zendesk: {
    subdomain: string;
    email: string;
    apiToken: string;
    webhookUrl?: string;
    enabled: boolean;
  };
  clickup: {
    apiToken: string;
    teamId: string;
    spaceId?: string;
    listId?: string;
    webhookUrl?: string;
    enabled: boolean;
  };
  slack?: {
    botToken: string;
    signingSecret: string;
    appToken?: string;
    enabled: boolean;
  };
}

// AI Provider Interfaces
export interface AIProvider {
  name: string;
  model?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
  summarize(content: string): Promise<string>;
  analyzeTicket?(ticket: any): Promise<TicketAnalysis>;
  detectDuplicates?(tickets: any[]): Promise<DuplicateAnalysis>;
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
  token_usage: TokenUsage;
}

// Ticket Analysis Interfaces
export interface TicketMetadata {
  id: string;
  subject: string;
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: string;
  tags: string[];
  requester: {
    id: string;
    name: string;
    email: string;
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
  customFields?: Record<string, any>;
}

export interface TicketAnalysis {
  summary: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  category: 'technical' | 'billing' | 'general' | 'account' | 'bug' | 'feature' | 'wordpress';
  sentiment: 'frustrated' | 'neutral' | 'happy' | 'angry';
  urgency_indicators: string[];
  suggested_team: 'development' | 'support' | 'billing' | 'management';
  action_items: string[];
  estimated_complexity: 'simple' | 'medium' | 'complex';
  confidence_score: number; // 0-1
  key_issues?: string[];
  recommended_actions?: string[];
  recommendedAgent?: string;
}

export interface DuplicateAnalysis {
  is_duplicate: boolean;
  confidence: number; // 0-1
  similar_tickets?: Array<{
    ticketId: string;
    similarity: number; // 0-1
    reason: string;
  }>;
  analysis_method?: string;
  suggested_action?: string;
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

// Assignment and Priority Interfaces
export interface AssignmentRule {
  id: string;
  name: string;
  conditions: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex';
    value: string;
  }>;
  actions: Array<{
    type: 'assign' | 'setPriority' | 'addTag' | 'setStatus';
    value: string;
  }>;
  priority: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssignmentRecommendation {
  ticketId: string;
  recommendedAssignee: {
    id: string;
    name: string;
    email: string;
    confidence: number; // 0-1
    reason: string;
  };
  alternativeAssignees: Array<{
    id: string;
    name: string;
    email: string;
    confidence: number; // 0-1
    reason: string;
  }>;
  generatedAt: Date;
}

export interface PriorityAdjustment {
  ticketId: string;
  currentPriority: 'low' | 'normal' | 'high' | 'urgent';
  recommendedPriority: 'low' | 'normal' | 'high' | 'urgent';
  reason: string;
  confidence: number; // 0-1
  factors: Array<{
    factor: string;
    impact: 'increase' | 'decrease';
    weight: number; // 0-1
  }>;
  generatedAt: Date;
}