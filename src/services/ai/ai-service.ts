/**
 * @ai-metadata
 * @component: AIService
 * @description: Core AI service for ticket analysis and natural language processing
 * @last-update: 2025-01-15
 * @last-editor: ai-assistant@trae.ai
 * @changelog: ./docs/changelog/ai-service.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["../../types/index.js", "../../utils/token-calculator.js", "./gemini-service.js"]
 * @tests: ["./tests/ai-service.test.ts"]
 * @breaking-changes-risk: medium
 * @review-required: true
 * @ai-context: "Primary AI service that handles ticket analysis, duplicate detection, and NLP tasks"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 * 
 * @approval-rules:
 *   - require-dev-approval-for: ["breaking-changes", "ai-model-changes"]
 *   - require-code-review-for: ["all-changes"]
 *   - require-qa-approval-for: ["production-ready"]
 */

import { AIProvider, AIResponse, Env, TicketAnalysis, TicketMetadata, DuplicateAnalysis, ZendeskTicket, AIInsights, TokenUsage } from '../../types/index';
import { TokenCalculator } from '../../utils/token-calculator';
import { GoogleGeminiProvider } from './gemini-service';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class AIService {
  private provider: AIProvider | null = null;
  private env: Env;
  private model: any;

  constructor(env: Env) {
    this.env = env;
    
    console.log('🤖 Initializing AI Service...');
    console.log(`🔑 AI Provider: ${env.AI_PROVIDER || 'NOT_SET'}`);
    console.log(`🔑 Gemini API Key: ${env.GOOGLE_GEMINI_API_KEY ? 'PRESENT' : 'MISSING'}`);
    
    try {
      this.provider = this.createProvider();
      if (this.provider && this.provider.name === 'googlegemini') {
        const genAI = new GoogleGenerativeAI(this.env.GOOGLE_GEMINI_API_KEY!);
        const modelName = this.env.GEMINI_MODEL || 'gemini-1.5-flash';
        this.model = genAI.getGenerativeModel({ model: modelName });
        console.log(`🤖 Using Gemini model: ${modelName}`);
        console.log(`✅ AI Service initialized successfully with ${this.env.GEMINI_MODEL || 'gemini-1.5-flash'}`);
      }
    } catch (error) {
      console.error('❌ AI provider initialization failed:', error instanceof Error ? error.message : 'Unknown error');
      console.error('🚨 This will cause enhanced workflow to fail and fall back to basic notifications');
      this.provider = null;
    }
  }

  /**
   * Check if AI service is properly initialized and working
   */
  isAvailable(): boolean {
    const hasProvider = this.provider !== null;
    const hasModel = this.model !== null;
    const available = hasProvider && hasModel;
    
    if (!available) {
      console.log('⚠️ AI Service not available - this will cause fallback to basic workflow');
      console.log(`   Provider initialized: ${hasProvider ? '✅' : '❌'}`);
      console.log(`   Model initialized: ${hasModel ? '✅' : '❌'}`);
      if (!hasProvider) {
        console.log(`   AI_PROVIDER: ${this.env.AI_PROVIDER || 'NOT_SET'}`);
        console.log(`   GOOGLE_GEMINI_API_KEY: ${this.env.GOOGLE_GEMINI_API_KEY ? 'PRESENT' : 'MISSING'}`);
      }
    }
    return available;
  }

  /**
   * Test AI service with a simple prompt
   */
  async testConnection(): Promise<boolean> {
    console.log('🧪 Testing AI Service connection...');
    
    if (!this.isAvailable()) {
      console.log('❌ AI Service not available - provider or model not initialized');
      return false;
    }
    
    try {
      console.log('🔄 Sending test prompt to Gemini API...');
      const testResponse = await this.generateResponse('Say "test successful"');
      const success = testResponse.toLowerCase().includes('test successful');
      console.log(`🧪 AI Service test: ${success ? 'PASSED ✅' : 'FAILED ❌'}`);
      if (!success) {
        console.log(`📝 Unexpected response: ${testResponse}`);
      }
      return success;
    } catch (error) {
      console.error('🧪 AI Service test FAILED:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      return false;
    }
  }

  private createProvider(): AIProvider {
    switch (this.env.AI_PROVIDER) {
      case 'googlegemini':
        if (!this.env.GOOGLE_GEMINI_API_KEY) {
          throw new Error('Google Gemini API key is required');
        }
        return new GoogleGeminiProvider(this.env.GOOGLE_GEMINI_API_KEY);
      
      case 'openai':
      case 'openrouter':
        throw new Error(`Provider '${this.env.AI_PROVIDER}' is not currently supported. Only 'googlegemini' is available.`);
      
      default:
        throw new Error(`Unsupported AI provider: ${this.env.AI_PROVIDER}`);
    }
  }

  async summarizeTicket(ticketContent: string): Promise<AIResponse> {
    if (!this.provider) {
      throw new Error('AI provider is not configured');
    }

    try {
      const summary = await this.provider.summarize(ticketContent);
      
      // Calculate token usage and cost
      const tokenUsage = TokenCalculator.calculateUsage(
        this.provider.name,
        ticketContent,
        summary
      );
      
      return {
        summary,
        provider: this.provider.name,
        model: this.env.AI_PROVIDER === 'googlegemini' ? 'gemini-1.5-flash' : undefined,
        timestamp: new Date().toISOString(),
        token_usage: tokenUsage
      };
    } catch (error) {
      console.error('AI summarization error:', error);
      throw error;
    }
  }

  isConfigured(): boolean {
    return this.provider !== null;
  }

  getProviderName(): string {
    return this.provider?.name || 'none';
  }

  // Generate general AI responses for enhanced Q&A
  async generateResponse(prompt: string): Promise<string> {
    if (!this.provider || !this.model) {
      console.error('❌ AI Service not properly initialized');
      throw new Error('AI service not properly initialized - check GOOGLE_GEMINI_API_KEY');
    }

    try {
      console.log('🤖 Generating AI response...');
      console.log(`📝 Prompt length: ${prompt.length} characters`);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ AI response generated successfully');
      console.log(`📝 Response length: ${text.length} characters`);
      
      return text;
    } catch (error) {
      console.error('❌ AI response generation failed:');
      console.error('Error details:', error);
      
      // Check for specific Google AI errors
      if (error instanceof Error) {
        if (error.message.includes('API_KEY')) {
          console.error('🔑 API Key issue detected - check GOOGLE_GEMINI_API_KEY environment variable');
          throw new Error('Google Gemini API key is invalid or missing');
        } else if (error.message.includes('RATE_LIMIT')) {
          console.error('⏰ Rate limit hit - too many requests to Google AI');
          throw new Error('Google Gemini API rate limit exceeded');
        } else if (error.message.includes('QUOTA')) {
          console.error('💰 Quota exceeded - check Google AI billing');
          throw new Error('Google Gemini API quota exceeded');
        }
      }
      
      throw new Error(`AI response generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Generate AI responses with token usage tracking
  async generateResponseWithUsage(prompt: string): Promise<{ response: string; tokenUsage: TokenUsage }> {
    if (!this.provider || !this.model) {
      throw new Error('AI provider is not configured');
    }

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      
      // Calculate token usage and cost
      const tokenUsage = TokenCalculator.calculateUsage(
        this.provider.name,
        prompt,
        responseText
      );
      
      return {
        response: responseText,
        tokenUsage
      };
    } catch (error) {
      console.error('AI response generation error:', error);
      throw error;
    }
  }

  // Phase 1: Enhanced AI Analysis Methods
  async analyzeTicket(ticketContent: string, ticketMetadata?: TicketMetadata): Promise<TicketAnalysis> {
    if (!this.provider) {
      throw new Error('AI provider is not configured');
    }

    try {
      // Clean and validate ticket content
      const cleanedContent = this.cleanTicketContent(ticketContent);
      
      const prompt = `You are an expert technical support analyst. Analyze this support ticket and provide a detailed, structured JSON response.

TICKET CONTENT:
${cleanedContent}

METADATA:
${ticketMetadata ? JSON.stringify(ticketMetadata, null, 2) : 'None'}

Provide analysis in this exact JSON format:
{
  "summary": "Detailed 2-3 sentence summary explaining what the user is experiencing and what they need",
  "priority": "low|normal|high|urgent",
  "category": "technical|billing|general|account|bug|feature|wordpress",
  "sentiment": "frustrated|neutral|happy|angry",
  "urgency_indicators": ["list of urgent keywords found"],
  "suggested_team": "development|support|billing|management",
  "action_items": ["specific actions needed"],
  "estimated_complexity": "simple|medium|complex",
  "confidence_score": 0.95,
  "key_issues": ["main problems identified"],
  "recommended_actions": ["specific next steps"]
}

Analysis Guidelines:
- Create a meaningful summary that explains the actual issue, not generic text
- Identify specific technical problems, user requests, or business needs
- Consider impact on users and business operations for priority
- Look for WordPress-specific terms (plugins, themes, wp-admin, etc.)
- Detect urgency from words like: critical, urgent, down, broken, error, not working
- Provide actionable recommendations based on the issue type

Be specific and avoid generic responses. The summary should help a technical team understand the issue immediately.
Respond with ONLY the JSON object, no additional text.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const analysisText = response.text();
      
      // Clean and validate AI response
      const cleanedResponse = this.cleanAIResponse(analysisText);
      
      // Parse the JSON response
      try {
        const analysis = JSON.parse(cleanedResponse);
        
        // Validate the parsed analysis
        const validatedAnalysis = this.validateAnalysis(analysis, cleanedContent);
        return validatedAnalysis;
      } catch (parseError) {
        console.warn('Failed to parse AI analysis JSON:', {
          error: parseError,
          rawResponse: analysisText.substring(0, 200) + '...',
          cleanedResponse: cleanedResponse.substring(0, 200) + '...'
        });
        // Fallback analysis
        return this.createFallbackAnalysis(cleanedContent);
      }
    } catch (error) {
      console.error('AI ticket analysis error:', error);
      throw new Error('Failed to analyze ticket with AI');
    }
  }

  async detectDuplicates(ticketContent: string, recentTickets: ZendeskTicket[]): Promise<DuplicateAnalysis> {
    if (!this.provider) {
      throw new Error('AI provider is not configured');
    }

    try {
      const recentTicketsText = recentTickets.map(ticket => 
        `ID: ${ticket.id}, Subject: ${ticket.subject}, Description: ${ticket.description.substring(0, 200)}...`
      ).join('\n\n');

      const prompt = `
Analyze if this ticket is a duplicate of any recent tickets:

NEW TICKET:
${ticketContent}

RECENT TICKETS:
${recentTicketsText}

Provide analysis in this JSON format:
{
  "is_duplicate": true/false,
  "similar_tickets": [
    {
      "ticket_id": 123,
      "similarity_score": 0.85,
      "reason": "Similar issue description and keywords"
    }
  ],
  "suggested_action": "merge|link|ignore",
  "confidence": 0.90
}

Respond with ONLY the JSON object.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const analysisText = response.text();
      
      try {
        const analysis = JSON.parse(analysisText.trim());
        return analysis as DuplicateAnalysis;
      } catch (parseError) {
        console.warn('Failed to parse duplicate analysis JSON:', parseError);
        return {
          is_duplicate: false,
          similar_tickets: [],
          suggested_action: 'ignore',
          confidence: 0.0
        };
      }
    } catch (error) {
      console.error('AI duplicate detection error:', error);
      throw new Error('Failed to detect duplicates with AI');
    }
  }

  async generateEnhancedTaskDescription(ticket: ZendeskTicket, analysis: TicketAnalysis): Promise<string> {
    if (!this.provider) {
      throw new Error('AI provider is not configured');
    }

    try {
      const prompt = `
Generate an enhanced task description for ClickUp based on this Zendesk ticket and AI analysis:

TICKET:
Subject: ${ticket.subject}
Description: ${ticket.description}
Priority: ${ticket.priority}
Status: ${ticket.status}

AI ANALYSIS:
${JSON.stringify(analysis, null, 2)}

Create a comprehensive task description that includes:
1. Clear summary of the issue
2. AI insights and recommendations
3. Action items
4. Priority justification
5. Relevant metadata

Format it in markdown for ClickUp.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('AI task description generation error:', error);
      // Fallback to basic description
      return this.createBasicTaskDescription(ticket, analysis);
    }
  }

  async generateDailyInsights(tickets: ZendeskTicket[], timeframe: string): Promise<AIInsights> {
    if (!this.provider) {
      throw new Error('AI provider is not configured');
    }

    try {
      const ticketSummary = tickets.map(ticket => 
        `ID: ${ticket.id}, Priority: ${ticket.priority}, Subject: ${ticket.subject}`
      ).join('\n');

      const prompt = `
Analyze these tickets from ${timeframe} and provide insights:

TICKETS:
${ticketSummary}

Provide analysis in this JSON format:
{
  "period": "${timeframe}",
  "total_tickets": ${tickets.length},
  "trends": {
    "priority_distribution": {"low": 0, "normal": 0, "high": 0, "urgent": 0},
    "category_breakdown": {"technical": 0, "billing": 0, "general": 0},
    "sentiment_analysis": {"frustrated": 0, "neutral": 0, "happy": 0},
    "team_workload": {"development": 0, "support": 0, "billing": 0}
  },
  "alerts": [
    {
      "type": "volume_spike|priority_surge|team_overload|sentiment_decline",
      "message": "Alert description",
      "severity": "low|medium|high",
      "affected_area": "Area description"
    }
  ],
  "recommendations": ["Actionable recommendations"]
}

Respond with ONLY the JSON object.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const analysisText = response.text();
      
      try {
        const insights = JSON.parse(analysisText.trim());
        return insights as AIInsights;
      } catch (parseError) {
        console.warn('Failed to parse insights JSON:', parseError);
        return this.createFallbackInsights(tickets, timeframe);
      }
    } catch (error) {
      console.error('AI insights generation error:', error);
      throw new Error('Failed to generate insights with AI');
    }
  }

  private createFallbackAnalysis(ticketContent: string): TicketAnalysis {
    // Simple keyword-based fallback analysis
    const content = ticketContent.toLowerCase();
    
    let priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal';
    let category: 'technical' | 'billing' | 'general' | 'account' | 'bug' | 'feature' = 'general';
    let sentiment: 'frustrated' | 'neutral' | 'happy' | 'angry' = 'neutral';
    const urgencyIndicators: string[] = [];
    
    // Priority detection
    if (content.includes('urgent') || content.includes('critical') || content.includes('emergency')) {
      priority = 'urgent';
      urgencyIndicators.push('urgent', 'critical', 'emergency');
    } else if (content.includes('important') || content.includes('asap') || content.includes('high priority')) {
      priority = 'high';
      urgencyIndicators.push('important', 'asap', 'high priority');
    }
    
    // Category detection
    if (content.includes('bug') || content.includes('error') || content.includes('broken')) {
      category = 'bug';
    } else if (content.includes('billing') || content.includes('payment') || content.includes('invoice')) {
      category = 'billing';
    } else if (content.includes('technical') || content.includes('api') || content.includes('integration')) {
      category = 'technical';
    } else if (content.includes('feature') || content.includes('enhancement') || content.includes('request')) {
      category = 'feature';
    }
    
    // Sentiment detection
    if (content.includes('frustrated') || content.includes('angry') || content.includes('terrible')) {
      sentiment = 'frustrated';
    } else if (content.includes('happy') || content.includes('great') || content.includes('excellent')) {
      sentiment = 'happy';
    }
    
    // Generate a basic summary from the content
    const summary = this.generateBasicSummary(ticketContent, category, priority);
    
    // Generate action items based on category
    const actionItems = this.generateActionItems(category, priority);
    
    // Map priority to urgency
    let urgency: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (priority === 'urgent') {
      urgency = 'critical';
    } else if (priority === 'high') {
      urgency = 'high';
    } else if (priority === 'normal') {
      urgency = 'medium';
    }

    return {
      summary,
      priority,
      urgency,
      category,
      sentiment,
      urgency_indicators: urgencyIndicators.filter(indicator => content.includes(indicator)),
      suggested_team: category === 'technical' || category === 'bug' ? 'development' : 'support',
      action_items: actionItems,
      estimated_complexity: priority === 'urgent' ? 'complex' : 'medium',
      confidence_score: 0.6
    };
  }

  private cleanTicketContent(content: string): string {
    if (!content || typeof content !== 'string') {
      return 'No content provided';
    }
    
    // Remove HTML tags if present
    const htmlStripped = content.replace(/<[^>]*>/g, ' ');
    
    // Remove excessive whitespace and normalize
    const normalized = htmlStripped.replace(/\s+/g, ' ').trim();
    
    // Limit length to prevent token overflow
    const maxLength = 2000;
    if (normalized.length > maxLength) {
      return normalized.substring(0, maxLength) + '... [content truncated]';
    }
    
    return normalized;
  }

  private cleanAIResponse(response: string): string {
    if (!response || typeof response !== 'string') {
      throw new Error('Invalid AI response');
    }
    
    // Remove any markdown code blocks
    let cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Remove any leading/trailing text that's not JSON
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1 || jsonStart >= jsonEnd) {
      throw new Error('No valid JSON found in AI response');
    }
    
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
    
    return cleaned.trim();
  }

  private validateAnalysis(analysis: any, originalContent: string): TicketAnalysis {
    // Ensure all required fields exist with proper types
    const validated: TicketAnalysis = {
      summary: this.validateString(analysis.summary) || this.generateBasicSummary(originalContent, 'general', 'normal'),
      priority: this.validatePriority(analysis.priority) || 'normal',
      urgency: this.validateUrgency(analysis.urgency) || 'medium',
      category: this.validateCategory(analysis.category) || 'general',
      sentiment: this.validateSentiment(analysis.sentiment) || 'neutral',
      urgency_indicators: Array.isArray(analysis.urgency_indicators) ? analysis.urgency_indicators : [],
      suggested_team: this.validateSuggestedTeam(analysis.suggested_team) || 'support',
      action_items: Array.isArray(analysis.action_items) ? analysis.action_items : ['Review ticket details'],
      estimated_complexity: this.validateComplexity(analysis.estimated_complexity) || 'medium',
      confidence_score: typeof analysis.confidence_score === 'number' ? Math.max(0, Math.min(1, analysis.confidence_score)) : 0.6
    };
    
    return validated;
  }

  private validateString(value: any): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
  }

  private validatePriority(value: any): 'low' | 'normal' | 'high' | 'urgent' | null {
    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    return validPriorities.includes(value) ? value : null;
  }

  private validateCategory(value: any): 'technical' | 'billing' | 'general' | 'account' | 'bug' | 'feature' | null {
    const validCategories = ['technical', 'billing', 'general', 'account', 'bug', 'feature'];
    return validCategories.includes(value) ? value : null;
  }

  private validateSentiment(value: any): 'frustrated' | 'neutral' | 'happy' | 'angry' | null {
    const validSentiments = ['frustrated', 'neutral', 'happy', 'angry'];
    return validSentiments.includes(value) ? value : null;
  }

  private validateUrgency(value: any): 'low' | 'medium' | 'high' | 'critical' | null {
    const validUrgencies = ['low', 'medium', 'high', 'critical'];
    return validUrgencies.includes(value) ? value : null;
  }

  private validateComplexity(value: any): 'simple' | 'medium' | 'complex' | null {
    const validComplexities = ['simple', 'medium', 'complex'];
    return validComplexities.includes(value) ? value : null;
  }

  private validateSuggestedTeam(value: any): 'development' | 'support' | 'billing' | 'management' | null {
    const validTeams = ['development', 'support', 'billing', 'management'];
    return validTeams.includes(value) ? value : null;
  }

  private generateBasicSummary(ticketContent: string, category: string, priority: string): string {
    // Extract first sentence or first 100 characters as base summary
    const firstSentence = ticketContent.split('.')[0];
    const baseSummary = firstSentence.length > 100 ? 
      ticketContent.substring(0, 100) + '...' : 
      firstSentence;
    
    return `${category.charAt(0).toUpperCase() + category.slice(1)} issue with ${priority} priority: ${baseSummary}`;
  }

  private generateActionItems(category: string, priority: string): string[] {
    const baseItems = ['Review ticket details', 'Assign to appropriate team member'];
    
    switch (category) {
      case 'bug':
        return [
          'Investigate and reproduce the issue',
          'Identify root cause and impact',
          'Develop and test fix',
          'Deploy solution and verify'
        ];
      case 'technical':
        return [
          'Analyze technical requirements',
          'Review system architecture',
          'Implement technical solution',
          'Test and validate changes'
        ];
      case 'billing':
        return [
          'Review billing records',
          'Verify payment information',
          'Process billing adjustment if needed',
          'Follow up with customer'
        ];
      case 'feature':
        return [
          'Analyze feature requirements',
          'Estimate development effort',
          'Create implementation plan',
          'Schedule development work'
        ];
      default:
        return priority === 'urgent' ? 
          ['Immediate triage required', ...baseItems, 'Escalate if necessary'] :
          baseItems;
    }
  }

  private createBasicTaskDescription(ticket: ZendeskTicket, analysis: TicketAnalysis): string {
    return `
## 🎫 Ticket Summary
${analysis.summary}

## 📊 AI Analysis
- **Category**: ${analysis.category}
- **Priority**: ${analysis.priority}
- **Sentiment**: ${analysis.sentiment}
- **Complexity**: ${analysis.estimated_complexity}
- **Confidence**: ${(analysis.confidence_score * 100).toFixed(1)}%

## 🎯 Action Items
${analysis.action_items.map(item => `- ${item}`).join('\n')}

## 📋 Original Ticket
**Subject**: ${ticket.subject}
**Description**: ${ticket.description}
**Created**: ${ticket.created_at}
**Zendesk URL**: ${ticket.url}
    `;
  }

  private createFallbackInsights(tickets: ZendeskTicket[], timeframe: string): AIInsights {
    const priorityCount = tickets.reduce((acc, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      period: timeframe,
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