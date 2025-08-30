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
export * from './env';

// Re-export centralized API interfaces
export * from '../interfaces/api-interfaces';

// Re-export AI domain interfaces
export * from '../services/ai/interfaces/core';
export * from '../services/ai/interfaces/nlp';
export * from '../services/ai/interfaces/analysis';
export * from '../services/ai/interfaces/response';

// Natural Language Understanding Types
export interface UserIntent {
  category: 'zendesk_query' | 'zendesk_action' | 'clickup_create' | 'clickup_query' | 'general';
  action: string;
  entities: {
    ticketId?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    timeframe?: string;
    taskName?: string;
    description?: string;
    userId?: string;
    status?: string;
    assignee?: string;
  };
  confidence: number;
}

export interface NLPResponse {
  intent: UserIntent;
  originalText: string;
  processedAt: string;
  processingTime: number;
}

export interface ContextualResponse {
  text: string;
  actionRequired: boolean;
  suggestedActions?: string[];
  followUpQuestions?: string[];
  confidence: number;
}