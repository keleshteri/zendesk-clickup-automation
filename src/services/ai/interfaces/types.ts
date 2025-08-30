/**
 * @ai-metadata
 * @component: AI Domain Types
 * @description: Type definitions for AI domain operations including NLP, analysis, and response generation
 * @last-update: 2025-01-17
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/ai-domain-types.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["../../../types/index.ts", "../../../interfaces/api-interfaces.ts"]
 * @tests: []
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Defines types for AI operations - NLP processing, ticket analysis, response generation"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 * 
 * @approval-rules:
 *   - require-dev-approval-for: ["breaking-changes", "type-changes"]
 *   - require-code-review-for: ["all-changes"]
 *   - require-qa-approval-for: ["production-ready"]
 */

import { TokenUsage } from '../../../interfaces/api-interfaces';

// Re-export core types from main types module
export {
  UserIntent,
  NLPResponse,
  ContextualResponse,
  TicketAnalysis,
  TicketMetadata,
  DuplicateAnalysis,
  AIInsights,
  TokenUsage,
  AIResponse,
  AIProvider
} from '../../../types';

// AI Service Domain Types

/**
 * AI Model Configuration
 */
export interface AIModelConfig {
  name: string;
  provider: string;
  version?: string;
  maxTokens: number;
  temperature: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  timeout: number;
}

/**
 * AI Processing Context
 */
export interface AIProcessingContext {
  sessionId: string;
  userId?: string;
  conversationId?: string;
  timestamp: Date;
  metadata: Record<string, any>;
  previousInteractions?: any[];
}

/**
 * AI Operation Metrics
 */
export interface AIOperationMetrics {
  operationType: string;
  startTime: Date;
  endTime: Date;
  processingTime: number;
  tokenUsage: TokenUsage;
  success: boolean;
  errorType?: string;
  modelUsed: string;
  inputSize: number;
  outputSize: number;
}

/**
 * AI Service Health Status
 */
export interface AIServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  provider: string;
  model: string;
  lastChecked: Date;
  responseTime: number;
  errorRate: number;
  uptime: number;
  issues: string[];
}

/**
 * AI Training Data
 */
export interface AITrainingData {
  id: string;
  input: string;
  expectedOutput: any;
  actualOutput?: any;
  feedback?: 'positive' | 'negative' | 'neutral';
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * AI Model Performance
 */
export interface AIModelPerformance {
  modelName: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  averageResponseTime: number;
  throughput: number;
  errorRate: number;
  lastEvaluated: Date;
  testDataSize: number;
}

/**
 * AI Prompt Template
 */
export interface AIPromptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template: string;
  variables: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object';
    required: boolean;
    description: string;
    defaultValue?: any;
  }>;
  examples: Array<{
    input: Record<string, any>;
    expectedOutput: string;
  }>;
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * AI Processing Pipeline Stage
 */
export interface AIPipelineStage {
  id: string;
  name: string;
  description: string;
  order: number;
  enabled: boolean;
  config: Record<string, any>;
  inputSchema: any;
  outputSchema: any;
  dependencies: string[];
  timeout: number;
}

/**
 * AI Processing Result
 */
export interface AIProcessingResult<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    processingTime: number;
    tokenUsage?: TokenUsage;
    modelUsed: string;
    confidence?: number;
    stages: Array<{
      name: string;
      duration: number;
      success: boolean;
      error?: string;
    }>;
  };
  timestamp: Date;
}

/**
 * AI Cache Entry
 */
export interface AICacheEntry {
  key: string;
  value: any;
  ttl: number;
  createdAt: Date;
  accessCount: number;
  lastAccessed: Date;
  tags: string[];
  size: number;
}

/**
 * AI Rate Limit Info
 */
export interface AIRateLimitInfo {
  provider: string;
  endpoint: string;
  limit: number;
  remaining: number;
  resetTime: Date;
  windowSize: number;
  currentUsage: number;
}

/**
 * AI Error Types
 */
export type AIErrorType = 
  | 'PROVIDER_UNAVAILABLE'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INVALID_API_KEY'
  | 'MODEL_NOT_FOUND'
  | 'TIMEOUT'
  | 'QUOTA_EXCEEDED'
  | 'INVALID_INPUT'
  | 'PROCESSING_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * AI Error Details
 */
export interface AIError {
  type: AIErrorType;
  message: string;
  code?: string;
  provider?: string;
  model?: string;
  retryable: boolean;
  timestamp: Date;
  context?: Record<string, any>;
  originalError?: any;
}

/**
 * AI Feature Flags
 */
export interface AIFeatureFlags {
  enableAdvancedAnalysis: boolean;
  enableDuplicateDetection: boolean;
  enableSentimentAnalysis: boolean;
  enableAutoResponse: boolean;
  enableMultiLanguage: boolean;
  enablePersonalization: boolean;
  enableCaching: boolean;
  enableMetrics: boolean;
  enableDebugMode: boolean;
}

/**
 * AI Configuration
 */
export interface AIConfiguration {
  providers: Record<string, {
    enabled: boolean;
    config: Record<string, any>;
    models: AIModelConfig[];
    rateLimits: Record<string, number>;
  }>;
  features: AIFeatureFlags;
  cache: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  monitoring: {
    enabled: boolean;
    metricsInterval: number;
    healthCheckInterval: number;
  };
  fallback: {
    enabled: boolean;
    provider: string;
    model: string;
  };
}

/**
 * AI Audit Log Entry
 */
export interface AIAuditLogEntry {
  id: string;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  operation: string;
  provider: string;
  model: string;
  input: {
    type: string;
    size: number;
    hash: string;
  };
  output: {
    type: string;
    size: number;
    hash: string;
  };
  tokenUsage: TokenUsage;
  processingTime: number;
  success: boolean;
  error?: string;
  metadata: Record<string, any>;
}

/**
 * AI Analytics Data
 */
export interface AIAnalyticsData {
  timeframe: {
    start: Date;
    end: Date;
  };
  usage: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    totalTokensUsed: number;
    totalCost: number;
  };
  performance: {
    averageAccuracy: number;
    averageConfidence: number;
    modelPerformance: Record<string, AIModelPerformance>;
  };
  trends: {
    requestVolume: Array<{ date: string; count: number }>;
    errorRate: Array<{ date: string; rate: number }>;
    responseTime: Array<{ date: string; time: number }>;
  };
  topErrors: Array<{
    type: AIErrorType;
    count: number;
    percentage: number;
  }>;
}