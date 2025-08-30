/**
 * @ai-metadata
 * @component: GeminiTicketAnalyzer
 * @description: Google Gemini implementation for ticket analysis including duplicate detection and priority analysis
 * @last-update: 2025-01-15
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/gemini-analysis.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["@google/generative-ai", "../interfaces/analysis.ts"]
 * @tests: ["./tests/gemini-analysis.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: true
 * @ai-context: "Ticket analysis domain implementation for Google Gemini with duplicate detection and priority analysis"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  ITicketAnalyzer, 
  IDuplicateDetector, 
  IPriorityAnalyzer,
  ISentimentAnalyzer,
  ICategoryClassifier,
  IInsightsGenerator
} from '../interfaces/analysis';
import { TicketAnalysis, DuplicateAnalysis, AIInsights } from '../../../types';
import { ZendeskTicket } from '../../integrations/zendesk/interfaces';

export class GeminiTicketAnalyzer implements ITicketAnalyzer {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private duplicateDetector: IDuplicateDetector;
  private priorityAnalyzer: IPriorityAnalyzer;
  private sentimentAnalyzer: ISentimentAnalyzer;
  private categoryClassifier: ICategoryClassifier;
  private insightsGenerator: IInsightsGenerator;

  constructor(apiKey: string, modelName: string = 'gemini-1.5-flash') {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: modelName });
    
    this.duplicateDetector = new GeminiDuplicateDetector(this.model);
    this.priorityAnalyzer = new GeminiPriorityAnalyzer(this.model);
    this.sentimentAnalyzer = new GeminiSentimentAnalyzer(this.model);
    this.categoryClassifier = new GeminiCategoryClassifier(this.model);
    this.insightsGenerator = new GeminiInsightsGenerator(this.model);
  }

  // Expose internal analyzers for external access
  get duplicateDetectorInstance(): IDuplicateDetector {
    return this.duplicateDetector;
  }

  get insightsGeneratorInstance(): IInsightsGenerator {
    return this.insightsGenerator;
  }

  async analyzeTicket(ticketContent: string, metadata?: any): Promise<TicketAnalysis> {
    // Convert ZendeskTicket to string content for interface compatibility
    const ticket = typeof ticketContent === 'string' ? 
      { subject: 'Ticket', description: ticketContent, priority: 'normal' } as ZendeskTicket :
      ticketContent as ZendeskTicket;
    try {
      const prompt = `Analyze this Zendesk ticket and provide a structured analysis:\n\n` +
        `Subject: ${ticket.subject}\n` +
        `Description: ${ticket.description}\n` +
        `Priority: ${ticket.priority || 'Normal'}\n` +
        `Tags: ${ticket.tags?.join(', ') || 'None'}\n\n` +
        `Please provide:\n` +
        `1. Priority level (urgent, high, normal, low)\n` +
        `2. Category (bug, feature, support, maintenance)\n` +
        `3. Complexity (simple, moderate, complex)\n` +
        `4. Estimated time to resolve\n` +
        `5. Recommended agent type\n` +
        `6. Key insights and reasoning\n` +
        `7. Confidence score (0-100)\n\n` +
        `Format as JSON with fields: priority, category, complexity, estimatedTime, recommendedAgent, insights, reasoning, confidence`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON response
      try {
        const analysis = JSON.parse(text.replace(/```json|```/g, '').trim());
        return {
          summary: analysis.summary || 'Standard ticket requiring attention',
          priority: analysis.priority || 'normal',
          urgency: analysis.urgency || 'medium',
          category: analysis.category || 'general',
          sentiment: analysis.sentiment || 'neutral',
          urgency_indicators: analysis.urgency_indicators || [],
          suggested_team: analysis.suggested_team || 'support',
          action_items: analysis.action_items || ['Review ticket'],
          estimated_complexity: analysis.estimated_complexity || 'medium',
          confidence_score: analysis.confidence_score || 0.75,
          recommendedAgent: analysis.recommendedAgent || 'PROJECT_MANAGER'
        };
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return this.createFallbackAnalysis(ticket, text);
      }
    } catch (error) {
      console.error('Ticket analysis error:', error);
      throw new Error('Failed to analyze ticket');
    }
  }

  async detectDuplicates(ticketContent: string, existingTickets: any[]): Promise<DuplicateAnalysis> {
    const tickets = [{ description: ticketContent }, ...existingTickets] as ZendeskTicket[];
    return this.duplicateDetector.detectDuplicates(tickets[0]?.description || '', tickets);
  }

  async analyzeTickets(tickets: Array<{ content: string; metadata?: any }>): Promise<TicketAnalysis[]> {
    const results: TicketAnalysis[] = [];
    for (const ticket of tickets) {
      const analysis = await this.analyzeTicket(ticket.content, ticket.metadata);
      results.push(analysis);
    }
    return results;
  }

  validateAnalysis(analysis: TicketAnalysis): boolean {
    return !!(analysis.summary && analysis.priority && analysis.category);
  }

  getConfidenceThreshold(): number {
    return 0.7;
  }

  async analyzePriority(ticketContent: string, metadata?: any): Promise<{
    suggestedPriority: 'low' | 'normal' | 'high' | 'urgent';
    confidence: number;
    reasoning: string[];
    urgencyIndicators: string[];
  }> {
    return this.priorityAnalyzer.analyzePriority(ticketContent, metadata);
  }

  async analyzeSentiment(text: string): Promise<{
    sentiment: 'frustrated' | 'neutral' | 'happy' | 'angry';
    confidence: number;
    emotionalIndicators: string[];
    intensity: number;
  }> {
    return this.sentimentAnalyzer.analyzeSentiment(text);
  }

  async classifyCategory(ticketContent: string): Promise<{
    category: 'technical' | 'billing' | 'general' | 'account' | 'bug' | 'feature' | 'wordpress';
    confidence: number;
    subcategories?: string[];
    keywords: string[];
  }> {
    return this.categoryClassifier.classifyCategory(ticketContent);
  }

  async generateInsights(tickets: any[], timeframe: string): Promise<AIInsights> {
    return this.insightsGenerator.generateInsights(tickets, timeframe);
  }

  private createFallbackAnalysis(ticket: ZendeskTicket, responseText: string): TicketAnalysis {
    return {
      summary: responseText.substring(0, 200) + '...',
      priority: ticket.priority || 'normal',
      urgency: 'medium',
      category: 'general',
      sentiment: 'neutral',
      urgency_indicators: [],
      suggested_team: 'support',
      action_items: ['Review ticket details'],
      estimated_complexity: 'medium',
      confidence_score: 0.5,
      recommendedAgent: 'PROJECT_MANAGER'
    };
  }
}

export class GeminiDuplicateDetector implements IDuplicateDetector {
  constructor(private model: any) {}

  async detectDuplicates(ticketContent: string, existingTickets: any[]): Promise<DuplicateAnalysis> {
    const tickets = [{ description: ticketContent }, ...existingTickets] as ZendeskTicket[];
    return this.detectDuplicatesInternal(tickets);
  }

  private async detectDuplicatesInternal(tickets: ZendeskTicket[]): Promise<DuplicateAnalysis> {
    try {
      if (tickets.length < 2) {
        return {
          is_duplicate: false,
          similar_tickets: [],
          suggested_action: 'ignore',
          confidence: 1.0
        };
      }

      const ticketSummaries = tickets.map(ticket => 
        `ID: ${ticket.id}, Subject: ${ticket.subject}, Description: ${ticket.description?.substring(0, 200)}...`
      ).join('\n\n');

      const prompt = `Analyze these Zendesk tickets for potential duplicates:\n\n${ticketSummaries}\n\n` +
        `Look for tickets with similar subjects, descriptions, or issues. ` +
        `Return a JSON response with:\n` +
        `- hasDuplicates: boolean\n` +
        `- duplicateGroups: array of arrays containing ticket IDs that are duplicates\n` +
        `- confidence: number (0-100)\n` +
        `- reasoning: string explaining the analysis`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        const analysis = JSON.parse(text.replace(/```json|```/g, '').trim());
        return {
          is_duplicate: analysis.is_duplicate || false,
          similar_tickets: analysis.similar_tickets || [],
          suggested_action: analysis.suggested_action || 'ignore',
          confidence: analysis.confidence || 0.5
        };
      } catch (parseError) {
        return {
          is_duplicate: false,
          similar_tickets: [],
          suggested_action: 'ignore',
          confidence: 0.0
        };
      }
    } catch (error) {
      console.error('Duplicate detection error:', error);
      throw new Error('Failed to detect duplicates');
    }
  }

  async findSimilarTickets(ticketContent: string, ticketPool: any[], threshold?: number): Promise<Array<{
    ticketId: string;
    similarity: number;
    reason: string;
  }>> {
    const analysis = await this.detectDuplicates(ticketContent, ticketPool);
    return analysis.similar_tickets.map((id, index) => ({
      ticketId: id.toString(),
      similarity: 0.8,
      reason: 'Content similarity detected'
    }));
  }

  async calculateSimilarity(ticket1: string, ticket2: string): Promise<number> {
    // Simple similarity calculation based on common words
    const words1 = ticket1.toLowerCase().split(/\s+/);
    const words2 = ticket2.toLowerCase().split(/\s+/);
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    return intersection.length / union.length;
  }

  getSimilarityThreshold(): number {
    return 0.7;
  }
}

export class GeminiPriorityAnalyzer implements IPriorityAnalyzer {
  constructor(private model: any) {}

  async analyzePriority(ticketContent: string, metadata?: any): Promise<{
    suggestedPriority: 'low' | 'normal' | 'high' | 'urgent';
    confidence: number;
    reasoning: string[];
    urgencyIndicators: string[];
  }> {
    try {
      const prompt = `Analyze the priority of this ticket:\n\n` +
        `Content: ${ticketContent}\n\n` +
        `Determine the appropriate priority level (urgent, high, normal, low) based on:\n` +
        `- Impact on business operations\n` +
        `- Urgency of resolution needed\n` +
        `- Customer impact\n` +
        `- Technical complexity\n\n` +
        `Respond with JSON: {"suggestedPriority": "level", "confidence": 0.85, "reasoning": ["reason1", "reason2"], "urgencyIndicators": ["indicator1", "indicator2"]}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        const analysis = JSON.parse(text.replace(/```json|```/g, '').trim());
        return {
          suggestedPriority: analysis.suggestedPriority || 'normal',
          confidence: analysis.confidence || 0.5,
          reasoning: Array.isArray(analysis.reasoning) ? analysis.reasoning : [analysis.reasoning || 'Standard priority assessment'],
          urgencyIndicators: Array.isArray(analysis.urgencyIndicators) ? analysis.urgencyIndicators : []
        };
      } catch (parseError) {
        return {
          suggestedPriority: 'normal',
          confidence: 0.3,
          reasoning: ['Fallback priority assessment'],
          urgencyIndicators: []
        };
      }
    } catch (error) {
      console.error('Priority analysis error:', error);
      throw new Error('Failed to analyze priority');
    }
  }

  getEscalationRules(): Array<{
    condition: string;
    action: string;
    priority: number;
  }> {
    return [
      {
        condition: 'Contains keywords: urgent, critical, down, outage',
        action: 'Escalate to urgent priority',
        priority: 1
      },
      {
        condition: 'Customer mentions business impact',
        action: 'Escalate to high priority',
        priority: 2
      },
      {
        condition: 'Security-related keywords detected',
        action: 'Escalate to high priority and notify security team',
        priority: 2
      },
      {
        condition: 'VIP customer or enterprise account',
        action: 'Escalate priority by one level',
        priority: 3
      }
    ];
  }
}

export class GeminiSentimentAnalyzer implements ISentimentAnalyzer {
  constructor(private model: any) {}

  async analyzeSentiment(text: string): Promise<{
    sentiment: 'frustrated' | 'neutral' | 'happy' | 'angry';
    confidence: number;
    emotionalIndicators: string[];
    intensity: number;
  }> {
    try {
      const prompt = `Analyze the sentiment of this text:\n\n"${text}"\n\n` +
        `Determine:\n` +
        `- Sentiment: frustrated, neutral, happy, angry\n` +
        `- Confidence: 0-1 scale\n` +
        `- Emotional indicators: array of keywords that indicate emotion\n` +
        `- Intensity: 0-1 scale of emotional intensity\n\n` +
        `Respond with JSON: {"sentiment": "frustrated", "confidence": 0.85, "emotionalIndicators": ["upset", "disappointed"], "intensity": 0.7}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text_response = response.text();
      
      try {
        const analysis = JSON.parse(text_response.replace(/```json|```/g, '').trim());
        return {
          sentiment: analysis.sentiment || 'neutral',
          confidence: analysis.confidence || 0.5,
          emotionalIndicators: analysis.emotionalIndicators || [],
          intensity: analysis.intensity || 0.0
        };
      } catch (parseError) {
        return {
          sentiment: 'neutral',
          confidence: 0.3,
          emotionalIndicators: [],
          intensity: 0.0
        };
      }
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      throw new Error('Failed to analyze sentiment');
    }
  }

  async trackSentimentTrends(tickets: Array<{ content: string; timestamp: Date }>): Promise<{
    trend: 'improving' | 'declining' | 'stable';
    averageSentiment: number;
    timeSeriesData: Array<{ date: string; sentiment: number }>;
  }> {
    try {
      // Analyze sentiment for each ticket
      const sentimentData = await Promise.all(
        tickets.map(async (ticket) => {
          const analysis = await this.analyzeSentiment(ticket.content);
          return {
            date: ticket.timestamp.toISOString().split('T')[0],
            sentiment: analysis.intensity,
            timestamp: ticket.timestamp
          };
        })
      );

      // Calculate average sentiment
      const averageSentiment = sentimentData.reduce((sum, data) => sum + data.sentiment, 0) / sentimentData.length;

      // Group by date and calculate daily averages
      const dailyData = sentimentData.reduce((acc, data) => {
        if (!acc[data.date]) {
          acc[data.date] = { total: 0, count: 0 };
        }
        acc[data.date].total += data.sentiment;
        acc[data.date].count += 1;
        return acc;
      }, {} as Record<string, { total: number; count: number }>);

      const timeSeriesData = Object.entries(dailyData)
        .map(([date, data]) => ({
          date,
          sentiment: data.total / data.count
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Determine trend
      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      if (timeSeriesData.length >= 2) {
        const firstHalf = timeSeriesData.slice(0, Math.floor(timeSeriesData.length / 2));
        const secondHalf = timeSeriesData.slice(Math.floor(timeSeriesData.length / 2));
        
        const firstAvg = firstHalf.reduce((sum, data) => sum + data.sentiment, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, data) => sum + data.sentiment, 0) / secondHalf.length;
        
        const difference = secondAvg - firstAvg;
        if (difference > 0.1) {
          trend = 'improving';
        } else if (difference < -0.1) {
          trend = 'declining';
        }
      }

      return {
        trend,
        averageSentiment,
        timeSeriesData
      };
    } catch (error) {
      console.error('Sentiment trend analysis error:', error);
      throw new Error('Failed to analyze sentiment trends');
    }
  }
}

export class GeminiCategoryClassifier implements ICategoryClassifier {
  constructor(private model: any) {}

  getSupportedCategories(): string[] {
    return ['technical', 'billing', 'general', 'account', 'bug', 'feature', 'wordpress'];
  }

  async trainClassifier(examples: Array<{ content: string; category: string }>): Promise<void> {
    // Training implementation would go here
    console.log(`Training classifier with ${examples.length} examples`);
  }

  async classifyCategory(ticketContent: string): Promise<{
    category: 'technical' | 'billing' | 'general' | 'account' | 'bug' | 'feature' | 'wordpress';
    confidence: number;
    subcategories?: string[];
    keywords: string[];
  }> {
    try {
      const prompt = `Classify this ticket into a category:\n\n${ticketContent}\n\nCategories: technical, billing, general, account, bug, feature, wordpress\n\nReturn JSON with category, confidence (0-1), subcategories array, and keywords array.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        const analysis = JSON.parse(text.replace(/```json|```/g, '').trim());
        return {
          category: analysis.category || 'general',
          confidence: analysis.confidence || 0.5,
          subcategories: analysis.subcategories || [],
          keywords: analysis.keywords || []
        };
      } catch (parseError) {
        return {
          category: 'general',
          confidence: 0.3,
          subcategories: [],
          keywords: []
        };
      }
    } catch (error) {
      console.error('Category classification error:', error);
      throw new Error('Failed to classify category');
    }
  }
}

export class GeminiInsightsGenerator implements IInsightsGenerator {
  constructor(private model: any) {}

  async generateInsights(tickets: ZendeskTicket[]): Promise<AIInsights> {
    try {
      if (tickets.length === 0) {
        return {
          period: 'current',
          total_tickets: 0,
          trends: {
            priority_distribution: {},
            category_breakdown: {},
            sentiment_analysis: {},
            team_workload: {}
          },
          alerts: [],
          recommendations: ['No tickets to analyze']
        };
      }

      const ticketData = tickets.map(ticket => ({
        id: ticket.id,
        subject: ticket.subject,
        priority: ticket.priority || 'normal',
        tags: ticket.tags || [],
        created: ticket.created_at
      }));

      const prompt = `Analyze these Zendesk tickets and provide insights:\n\n` +
        `${JSON.stringify(ticketData, null, 2)}\n\n` +
        `Provide a JSON response with:\n` +
        `- period: time period analyzed\n` +
        `- total_tickets: number of tickets\n` +
        `- trends: object with priority_distribution, category_breakdown, sentiment_analysis, team_workload\n` +
        `- alerts: array of alert objects\n` +
        `- recommendations: array of actionable recommendations`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        const insights = JSON.parse(text.replace(/```json|```/g, '').trim());
        return {
          period: insights.period || 'current',
          total_tickets: tickets.length,
          trends: insights.trends || {
            priority_distribution: {},
            category_breakdown: {},
            sentiment_analysis: {},
            team_workload: {}
          },
          alerts: insights.alerts || [],
          recommendations: insights.recommendations || ['Review ticket trends']
        };
      } catch (parseError) {
        return this.createFallbackInsights(tickets);
      }
    } catch (error) {
      console.error('Insights generation error:', error);
      throw new Error('Failed to generate insights');
    }
  }

  async analyzeTrends(tickets: any[], period: 'daily' | 'weekly' | 'monthly'): Promise<{
    volumeTrend: 'increasing' | 'decreasing' | 'stable';
    priorityTrends: Record<string, number>;
    categoryTrends: Record<string, number>;
    predictions: Array<{
      metric: string;
      prediction: number;
      confidence: number;
    }>;
  }> {
    try {
      const prompt = `Analyze trends in these tickets over ${period} period:\n\n${JSON.stringify(tickets.slice(0, 20), null, 2)}\n\nReturn JSON with volumeTrend, priorityTrends, categoryTrends, and predictions.`;
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        const trends = JSON.parse(text.replace(/```json|```/g, '').trim());
        return {
          volumeTrend: trends.volumeTrend || 'stable',
          priorityTrends: trends.priorityTrends || {},
          categoryTrends: trends.categoryTrends || {},
          predictions: trends.predictions || []
        };
      } catch (parseError) {
        return {
          volumeTrend: 'stable',
          priorityTrends: {},
          categoryTrends: {},
          predictions: []
        };
      }
    } catch (error) {
      console.error('Trend analysis error:', error);
      return {
        volumeTrend: 'stable',
        priorityTrends: {},
        categoryTrends: {},
        predictions: []
      };
    }
  }

  async generateAlerts(currentData: any[], historicalData: any[]): Promise<Array<{
    type: 'volume_spike' | 'priority_surge' | 'team_overload' | 'sentiment_decline';
    message: string;
    severity: 'low' | 'medium' | 'high';
    affectedArea: string;
    recommendedActions: string[];
  }>> {
    try {
      const prompt = `Compare current data with historical data and generate alerts:\n\nCurrent: ${JSON.stringify(currentData.slice(0, 10), null, 2)}\n\nHistorical: ${JSON.stringify(historicalData.slice(0, 10), null, 2)}\n\nReturn JSON array of alerts with type, message, severity, affectedArea, and recommendedActions.`;
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        const alerts = JSON.parse(text.replace(/```json|```/g, '').trim());
        return Array.isArray(alerts) ? alerts : [];
      } catch (parseError) {
        return [];
      }
    } catch (error) {
      console.error('Alert generation error:', error);
      return [];
    }
  }

  private createFallbackInsights(tickets: ZendeskTicket[]): AIInsights {
    const priorityCount = tickets.reduce((acc, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      period: 'current',
      total_tickets: tickets.length,
      trends: {
        priority_distribution: priorityCount,
        category_breakdown: { general: tickets.length },
        sentiment_analysis: { neutral: tickets.length },
        team_workload: { support: tickets.length }
      },
      alerts: [],
      recommendations: ['Review ticket trends and adjust team capacity as needed']
    };
  }
}