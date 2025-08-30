/**
 * @ai-metadata
 * @component: Ticket Analysis Interfaces
 * @description: Domain interfaces for ticket analysis, duplicate detection, and insights generation
 * @last-update: 2025-01-17
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/analysis-interfaces.md
 * @stability: experimental
 * @edit-permissions: "full"
 * @dependencies: ["../../../types/index.ts", "../../integrations/zendesk/interfaces"]
 * @tests: []
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Defines analysis domain interfaces for ticket processing, duplicate detection, and business insights"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 * 
 * @approval-rules:
 *   - require-dev-approval-for: ["breaking-changes", "analysis-algorithm-changes"]
 *   - require-code-review-for: ["all-changes"]
 *   - require-qa-approval-for: ["production-ready"]
 */

import { TicketAnalysis, TicketMetadata, DuplicateAnalysis, AIInsights } from '../../../types';

/**
 * Ticket Analyzer interface for comprehensive ticket analysis
 */
export interface ITicketAnalyzer {
  /**
   * Analyze a ticket and provide structured insights
   */
  analyzeTicket(ticketContent: string, metadata?: TicketMetadata): Promise<TicketAnalysis>;
  
  /**
   * Batch analyze multiple tickets
   */
  analyzeTickets(tickets: Array<{ content: string; metadata?: TicketMetadata }>): Promise<TicketAnalysis[]>;
  
  /**
   * Validate analysis results
   */
  validateAnalysis(analysis: TicketAnalysis): boolean;
  
  /**
   * Get analysis confidence threshold
   */
  getConfidenceThreshold(): number;
}

/**
 * Duplicate Detector interface for identifying similar tickets
 */
export interface IDuplicateDetector {
  /**
   * Detect if a ticket is a duplicate of existing tickets
   */
  detectDuplicates(ticketContent: string, existingTickets: any[]): Promise<DuplicateAnalysis>;
  
  /**
   * Find similar tickets based on content similarity
   */
  findSimilarTickets(ticketContent: string, ticketPool: any[], threshold?: number): Promise<Array<{
    ticketId: string;
    similarity: number;
    reason: string;
  }>>;
  
  /**
   * Calculate similarity score between two tickets
   */
  calculateSimilarity(ticket1: string, ticket2: string): Promise<number>;
  
  /**
   * Get similarity threshold for duplicate detection
   */
  getSimilarityThreshold(): number;
}

/**
 * Priority Analyzer interface for determining ticket priority
 */
export interface IPriorityAnalyzer {
  /**
   * Analyze and suggest priority for a ticket
   */
  analyzePriority(ticketContent: string, metadata?: TicketMetadata): Promise<{
    suggestedPriority: 'low' | 'normal' | 'high' | 'urgent';
    confidence: number;
    reasoning: string[];
    urgencyIndicators: string[];
  }>;
  
  /**
   * Get priority escalation rules
   */
  getEscalationRules(): Array<{
    condition: string;
    action: string;
    priority: number;
  }>;
}

/**
 * Sentiment Analyzer interface for understanding customer emotions
 */
export interface ISentimentAnalyzer {
  /**
   * Analyze sentiment of ticket content
   */
  analyzeSentiment(text: string): Promise<{
    sentiment: 'frustrated' | 'neutral' | 'happy' | 'angry';
    confidence: number;
    emotionalIndicators: string[];
    intensity: number; // 0-1 scale
  }>;
  
  /**
   * Track sentiment trends over time
   */
  trackSentimentTrends(tickets: Array<{ content: string; timestamp: Date }>): Promise<{
    trend: 'improving' | 'declining' | 'stable';
    averageSentiment: number;
    timeSeriesData: Array<{ date: string; sentiment: number }>;
  }>;
}

/**
 * Category Classifier interface for ticket categorization
 */
export interface ICategoryClassifier {
  /**
   * Classify ticket into appropriate category
   */
  classifyCategory(ticketContent: string): Promise<{
    category: 'technical' | 'billing' | 'general' | 'account' | 'bug' | 'feature' | 'wordpress';
    confidence: number;
    subcategories?: string[];
    keywords: string[];
  }>;
  
  /**
   * Get supported categories
   */
  getSupportedCategories(): string[];
  
  /**
   * Train classifier with new examples
   */
  trainClassifier(examples: Array<{ content: string; category: string }>): Promise<void>;
}

/**
 * Team Assignment interface for routing tickets to appropriate teams
 */
export interface ITeamAssigner {
  /**
   * Suggest team assignment for a ticket
   */
  suggestTeamAssignment(analysis: TicketAnalysis): Promise<{
    suggestedTeam: 'development' | 'support' | 'billing' | 'management';
    confidence: number;
    reasoning: string[];
    alternativeTeams?: string[];
  }>;
  
  /**
   * Get team workload information
   */
  getTeamWorkload(): Promise<Record<string, {
    activeTickets: number;
    averageResponseTime: number;
    capacity: number;
  }>>;
}

/**
 * Insights Generator interface for business intelligence
 */
export interface IInsightsGenerator {
  /**
   * Generate AI insights from ticket data
   */
  generateInsights(tickets: any[], timeframe: string): Promise<AIInsights>;
  
  /**
   * Generate trend analysis
   */
  analyzeTrends(tickets: any[], period: 'daily' | 'weekly' | 'monthly'): Promise<{
    volumeTrend: 'increasing' | 'decreasing' | 'stable';
    priorityTrends: Record<string, number>;
    categoryTrends: Record<string, number>;
    predictions: Array<{
      metric: string;
      prediction: number;
      confidence: number;
    }>;
  }>;
  
  /**
   * Generate alerts based on patterns
   */
  generateAlerts(currentData: any[], historicalData: any[]): Promise<Array<{
    type: 'volume_spike' | 'priority_surge' | 'team_overload' | 'sentiment_decline';
    message: string;
    severity: 'low' | 'medium' | 'high';
    affectedArea: string;
    recommendedActions: string[];
  }>>;
}

/**
 * Analysis Pipeline interface for orchestrating analysis workflow
 */
export interface IAnalysisPipeline {
  /**
   * Execute complete analysis pipeline for a ticket
   */
  executeAnalysis(ticketContent: string, metadata?: TicketMetadata): Promise<{
    analysis: TicketAnalysis;
    duplicateCheck: DuplicateAnalysis;
    teamAssignment: any;
    processingTime: number;
  }>;
  
  /**
   * Configure analysis pipeline steps
   */
  configurePipeline(config: {
    enableDuplicateDetection: boolean;
    enableSentimentAnalysis: boolean;
    enablePriorityAnalysis: boolean;
    enableTeamAssignment: boolean;
  }): void;
  
  /**
   * Get pipeline performance metrics
   */
  getPerformanceMetrics(): Promise<{
    averageProcessingTime: number;
    successRate: number;
    errorRate: number;
    throughput: number;
  }>;
}