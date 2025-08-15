import { AIService } from './ai.js';
import { ZendeskService } from './zendesk.js';
import { MultiAgentService } from './multi-agent-service.js';
import { AgentRole } from '../types/agents.js';
import { Env, TokenUsage } from '../types/index.js';

export interface NLPIntent {
  intent: string;
  confidence: number;
  entities: Record<string, any>;
  parameters: Record<string, any>;
}

export interface NLPResponse {
  success: boolean;
  message: string;
  data?: any;
  executedTools: string[];
  processingTime: number;
  confidence: number;
  tokenUsage?: TokenUsage;
  aiProvider?: string;
}

export interface ToolMapping {
  name: string;
  description: string;
  keywords: string[];
  service: string;
  method: string;
  parameters: Record<string, any>;
  examples: string[];
}

/**
 * Natural Language Processing Router for @TaskGenie
 * Interprets user queries and routes them to appropriate tools and agents
 */
export class NLPRouter {
  private aiService: AIService;
  private zendeskService: ZendeskService;
  private multiAgentService: MultiAgentService;
  private clickupService: any;
  private env: Env;
  private toolMappings: ToolMapping[];
  private lastTokenUsage?: TokenUsage;

  constructor(
    env: Env,
    aiService: AIService,
    zendeskService: ZendeskService,
    multiAgentService: MultiAgentService,
    clickupService: any
  ) {
    this.env = env;
    this.aiService = aiService;
    this.zendeskService = zendeskService;
    this.multiAgentService = multiAgentService;
    this.clickupService = clickupService;
    this.toolMappings = this.initializeToolMappings();
  }

  /**
   * Main entry point for processing natural language queries
   */
  async processQuery(query: string, userId?: string): Promise<NLPResponse> {
    const startTime = Date.now();
    console.log(`🤖 @TaskGenie processing query: "${query}"`);

    try {
      // Step 1: Check for direct commands first (no AI needed)
      const commandResult = this.tryDirectCommand(query);
      if (commandResult) {
        console.log(`⚡ Direct command processed: ${commandResult.intent} (no AI used)`);
        const processingTime = Date.now() - startTime;
        
        const result = await this.routeToTool(commandResult, query);
        
        return {
          success: true,
          message: result.message,
          data: result.data,
          executedTools: result.executedTools,
          processingTime,
          confidence: 1.0, // Direct commands have 100% confidence
          tokenUsage: { input_tokens: 0, output_tokens: 0, total_tokens: 0, cost: 0, currency: 'USD' },
          aiProvider: 'none'
        };
      }

      // Step 2: Use AI analysis for complex queries
      const intent = await this.analyzeIntent(query);
      console.log(`🎯 Detected intent: ${intent.intent} (confidence: ${intent.confidence})`);

      // Step 3: Route to appropriate tool/service
      const result = await this.routeToTool(intent, query);
      
      const processingTime = Date.now() - startTime;
      
      const response = {
        success: true,
        message: result.message,
        data: result.data,
        executedTools: result.executedTools,
        processingTime,
        confidence: intent.confidence,
        tokenUsage: this.lastTokenUsage || { input_tokens: 0, output_tokens: 0, total_tokens: 0, cost: 0, currency: 'USD' },
        aiProvider: this.env.AI_PROVIDER
      };
      
      console.log('📤 NLP Response with token usage:', response);
      return response;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('❌ NLP Router error:', error);
      
      return {
        success: false,
        message: `Sorry, I encountered an error processing your request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executedTools: [],
        processingTime,
        confidence: 0
      };
    }
  }

  /**
   * Try to match direct commands without AI processing
   * Returns NLPIntent if command is recognized, null otherwise
   */
  private tryDirectCommand(query: string): NLPIntent | null {
    const normalizedQuery = query.toLowerCase().trim();
    
    // Remove @TaskGenie prefix if present
    const cleanQuery = normalizedQuery.replace(/@taskgenie\s*/i, '').trim();
    
    // Define direct command patterns
    const commandPatterns = [
      // Help commands
      { pattern: /^\/?help$/i, intent: 'GET_HELP' },
      { pattern: /^\/?h$/i, intent: 'GET_HELP' },
      
      // Status commands
      { pattern: /^\/?status$/i, intent: 'AGENT_STATUS' },
      { pattern: /^\/?agent\s*status$/i, intent: 'AGENT_STATUS' },
      
      // Insights commands
      { pattern: /^\/?insights$/i, intent: 'GET_INSIGHTS' },
      { pattern: /^\/?metrics$/i, intent: 'GET_INSIGHTS' },
      
      // Ticket count commands
      { pattern: /^\/?count$/i, intent: 'TICKET_COUNT' },
      { pattern: /^\/?tickets$/i, intent: 'TICKET_COUNT' },
      
      // Ticket details with ID (e.g., /ticket 12345, /show 12345)
      { pattern: /^\/?(?:ticket|show)\s+(\d+)$/i, intent: 'TICKET_DETAILS' },
      
      // Ticket status with ID (e.g., /status 12345)
      { pattern: /^\/?status\s+(\d+)$/i, intent: 'TICKET_STATUS' },
      
      // Create task with ticket ID (e.g., /create 12345, /task 12345)
      { pattern: /^\/?(?:create|task)\s+(\d+)$/i, intent: 'CREATE_TASK' },
      
      // Search commands (e.g., /search recent, /find open)
      { pattern: /^\/?(?:search|find)\s+(.+)$/i, intent: 'SEARCH_TICKETS' },
      
      // Analyze commands (e.g., /analyze 12345) - command parsing is direct, AI used only for analysis
      { pattern: /^\/?analyze\s+(\d+)$/i, intent: 'ANALYZE_TICKET' },
    ];
    
    // Check each pattern
    for (const { pattern, intent } of commandPatterns) {
      const match = cleanQuery.match(pattern);
      if (match) {
        const entities: Record<string, any> = {};
        const parameters: Record<string, any> = {};
        
        // Extract entities based on intent
        if (intent === 'TICKET_DETAILS' || intent === 'TICKET_STATUS' || intent === 'CREATE_TASK' || intent === 'ANALYZE_TICKET') {
          if (match[1]) {
            entities.ticketId = match[1];
            parameters.ticketId = match[1];
          }
        } else if (intent === 'SEARCH_TICKETS') {
          if (match[1]) {
            entities.searchTerm = match[1];
            parameters.searchTerm = match[1];
          }
        }
        
        return {
          intent,
          confidence: 1.0,
          entities,
          parameters
        };
      }
    }
    
    return null;
  }

  /**
   * Analyze user intent using AI
   */
  private async analyzeIntent(query: string): Promise<NLPIntent> {
    const prompt = `
Analyze this user query and extract the intent, entities, and parameters.
Query: "${query}"

Available intents:
- GET_TICKET_COUNT: Get number of tickets (open, closed, pending, etc.)
- GET_TICKET_DETAILS: Get details of specific ticket(s)
- GET_TICKET_STATUS: Check status of tickets
- CREATE_CLICKUP_TASK: Create tasks in ClickUp
- ANALYZE_TICKET: Analyze ticket content with AI
- GET_AGENT_STATUS: Check status of AI agents
- ROUTE_TO_AGENT: Route ticket to specific agent
- GET_INSIGHTS: Get AI insights and analytics
- SEARCH_TICKETS: Search for tickets with criteria
- UPDATE_TICKET: Update ticket information
- GET_HELP: Show available commands and help

Respond in JSON format:
{
  "intent": "INTENT_NAME",
  "confidence": 0.95,
  "entities": {
    "status": "open",
    "count": 10,
    "ticket_id": "12345"
  },
  "parameters": {
    "limit": 25,
    "timeframe": "today"
  }
}

Extract relevant entities like:
- ticket_id: specific ticket numbers
- status: ticket status (open, closed, pending, new)
- count/limit: number limits
- timeframe: time periods
- agent_type: specific agent roles
- priority: urgency levels
`;

    try {
      const { response, tokenUsage } = await this.aiService.generateResponseWithUsage(prompt);
      
      // Extract JSON from markdown code blocks if present
      let jsonText = response.trim();
      const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1].trim();
      }
      
      const parsed = JSON.parse(jsonText);
      
      // Store token usage for this request
      this.lastTokenUsage = tokenUsage;
      console.log('🔍 Token usage from AI call:', tokenUsage);
      
      return {
        intent: parsed.intent || 'UNKNOWN',
        confidence: parsed.confidence || 0.5,
        entities: parsed.entities || {},
        parameters: parsed.parameters || {}
      };
    } catch (error) {
      console.error('Intent analysis failed:', error);
      // Fallback to keyword matching
      return this.fallbackIntentAnalysis(query);
    }
  }

  /**
   * Route query to appropriate tool based on intent
   */
  private async routeToTool(intent: NLPIntent, originalQuery: string): Promise<{
    message: string;
    data?: any;
    executedTools: string[];
  }> {
    const executedTools: string[] = [];

    switch (intent.intent) {
      case 'GET_TICKET_COUNT':
        return await this.handleTicketCount(intent, executedTools);
      
      case 'GET_TICKET_DETAILS':
        return await this.handleTicketDetails(intent, executedTools);
      
      case 'GET_TICKET_STATUS':
        return await this.handleTicketStatus(intent, executedTools);
      
      case 'ANALYZE_TICKET':
        return await this.handleTicketAnalysis(intent, executedTools);
      
      case 'CREATE_CLICKUP_TASK':
        return await this.handleCreateTask(intent, executedTools);
      
      case 'GET_AGENT_STATUS':
        return await this.handleAgentStatus(intent, executedTools);
      
      case 'ROUTE_TO_AGENT':
        return await this.handleRouteToAgent(intent, executedTools);
      
      case 'GET_INSIGHTS':
        return await this.handleGetInsights(intent, executedTools);
      
      case 'SEARCH_TICKETS':
        return await this.handleSearchTickets(intent, executedTools);
      
      case 'GET_HELP':
        return await this.handleGetHelp(executedTools);
      
      default:
        return {
          message: `I'm not sure how to handle that request. Try asking me about tickets, tasks, or agents. Type "@TaskGenie help" for available commands.`,
          executedTools
        };
    }
  }

  /**
   * Handle ticket count queries
   */
  private async handleTicketCount(intent: NLPIntent, executedTools: string[]): Promise<{
    message: string;
    data?: any;
    executedTools: string[];
  }> {
    executedTools.push('ZendeskService.getTicketsByStatus');
    
    const status = intent.entities.status || 'open';
    const limit = intent.parameters.limit || 100;
    
    const tickets = await this.zendeskService.getTicketsByStatus([status], limit);
    
    return {
      message: `📊 Found **${tickets.length}** ${status} tickets`,
      data: {
        count: tickets.length,
        status,
        tickets: tickets.slice(0, 5) // Return first 5 for preview
      },
      executedTools
    };
  }

  /**
   * Handle ticket details queries
   */
  private async handleTicketDetails(intent: NLPIntent, executedTools: string[]): Promise<{
    message: string;
    data?: any;
    executedTools: string[];
  }> {
    const ticketId = intent.entities.ticket_id;
    
    if (!ticketId) {
      return {
        message: "Please specify a ticket ID. Example: '@TaskGenie show me ticket 12345'",
        executedTools
      };
    }

    executedTools.push('ZendeskService.getTicket');
    
    const ticket = await this.zendeskService.getTicket(ticketId);
    
    if (!ticket) {
      return {
        message: `❌ Ticket #${ticketId} not found`,
        executedTools
      };
    }

    return {
      message: `🎫 **Ticket #${ticket.id}**\n**Subject:** ${ticket.subject}\n**Status:** ${ticket.status}\n**Priority:** ${ticket.priority}\n**Created:** ${new Date(ticket.created_at).toLocaleDateString()}`,
      data: ticket,
      executedTools
    };
  }

  /**
   * Handle ticket status queries
   */
  private async handleTicketStatus(intent: NLPIntent, executedTools: string[]): Promise<{
    message: string;
    data?: any;
    executedTools: string[];
  }> {
    executedTools.push('ZendeskService.getTicketsByStatus');
    
    const statuses = ['new', 'open', 'pending', 'solved', 'closed'];
    const statusCounts: Record<string, number> = {};
    
    for (const status of statuses) {
      const tickets = await this.zendeskService.getTicketsByStatus([status], 100);
      statusCounts[status] = tickets.length;
    }
    
    const statusReport = Object.entries(statusCounts)
      .map(([status, count]) => `**${status.toUpperCase()}:** ${count}`)
      .join('\n');
    
    return {
      message: `📈 **Ticket Status Overview**\n${statusReport}`,
      data: statusCounts,
      executedTools
    };
  }

  /**
   * Handle ticket analysis requests
   */
  private async handleTicketAnalysis(intent: NLPIntent, executedTools: string[]): Promise<{
    message: string;
    data?: any;
    executedTools: string[];
  }> {
    const ticketId = intent.entities.ticket_id;
    
    if (!ticketId) {
      return {
        message: "Please specify a ticket ID to analyze. Example: '@TaskGenie analyze ticket 12345'",
        executedTools
      };
    }

    executedTools.push('MultiAgentService.processTicket');
    
    try {
      const result = await this.multiAgentService.processTicket(ticketId);
      
      // Format recommendations properly
      let recommendationsText = 'No specific recommendations available';
      if (result.finalRecommendations && result.finalRecommendations.length > 0) {
        const validRecommendations = result.finalRecommendations.filter(rec => rec && rec.trim().length > 0);
        if (validRecommendations.length > 0) {
          recommendationsText = validRecommendations.slice(0, 3).join('\n• ');
          recommendationsText = '• ' + recommendationsText;
        }
      }
      
      // Get workflow details if available
      let workflowDetails = '';
      if (result.workflow && result.workflow.context && result.workflow.context.insights) {
        const insights = result.workflow.context.insights;
        if (insights.length > 0) {
          workflowDetails = '\n\n**Agent Analysis:**\n';
          insights.forEach((insight, index) => {
            if (insight.analysis && insight.analysis.trim().length > 0) {
              workflowDetails += `${index + 1}. **${insight.agentRole}**: ${insight.analysis.substring(0, 200)}${insight.analysis.length > 200 ? '...' : ''}\n`;
            }
          });
        }
      }
      
      const message = `🔍 **Multi-Agent Analysis for Ticket #${ticketId}**\n` +
        `**Confidence:** ${(result.confidence * 100).toFixed(1)}%\n` +
        `**Agents Involved:** ${result.agentsInvolved.join(', ')}\n` +
        `**Handoffs:** ${result.handoffCount}\n\n` +
        `**Recommendations:**\n${recommendationsText}${workflowDetails}`;
      
      return {
        message,
        data: result,
        executedTools
      };
    } catch (error) {
      console.error('Multi-agent analysis failed:', error);
      return {
        message: `❌ Failed to analyze ticket #${ticketId}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: null,
        executedTools
      };
    }
  }

  /**
   * Handle ClickUp task creation
   */
  private async handleCreateTask(intent: NLPIntent, executedTools: string[]): Promise<{
    message: string;
    data?: any;
    executedTools: string[];
  }> {
    const ticketId = intent.entities.ticket_id;
    
    if (!ticketId) {
      return {
        message: "Please specify a ticket ID to create a task from. Example: '@TaskGenie create task from ticket 12345'",
        executedTools
      };
    }

    executedTools.push('MultiAgentService.analyzeAndCreateTasks');
    
    const result = await this.multiAgentService.analyzeAndCreateTasks(ticketId);
    
    return {
      message: `✅ **Created ${result.clickUpTasks.length} ClickUp task(s)** from ticket #${ticketId}\n**Tasks:** ${result.clickUpTasks.map(t => t.name).join(', ')}`,
      data: result,
      executedTools
    };
  }

  /**
   * Handle agent status queries
   */
  private async handleAgentStatus(intent: NLPIntent, executedTools: string[]): Promise<{
    message: string;
    data?: any;
    executedTools: string[];
  }> {
    executedTools.push('MultiAgentService.getAllAgentsStatus');
    
    const agentStatuses = this.multiAgentService.getAllAgentsStatus();
    
    const statusReport = agentStatuses
      .map(agent => `**${agent.role}:** ${agent.status} (${agent.tasksCompleted} tasks)`) 
      .join('\n');
    
    return {
      message: `🤖 **Agent Status Report**\n${statusReport}`,
      data: agentStatuses,
      executedTools
    };
  }

  /**
   * Handle routing to specific agent
   */
  private async handleRouteToAgent(intent: NLPIntent, executedTools: string[]): Promise<{
    message: string;
    data?: any;
    executedTools: string[];
  }> {
    const ticketId = intent.entities.ticket_id;
    const agentType = intent.entities.agent_type as AgentRole;
    
    if (!ticketId || !agentType) {
      return {
        message: "Please specify both ticket ID and agent type. Example: '@TaskGenie route ticket 12345 to software engineer'",
        executedTools
      };
    }

    executedTools.push('MultiAgentService.routeToAgent');
    
    const result = await this.multiAgentService.routeToAgent(ticketId, agentType);
    
    return {
      message: `🎯 **Routed ticket #${ticketId}** to ${agentType.replace('_', ' ').toLowerCase()}`,
      data: result,
      executedTools
    };
  }

  /**
   * Handle insights requests
   */
  private async handleGetInsights(intent: NLPIntent, executedTools: string[]): Promise<{
    message: string;
    data?: any;
    executedTools: string[];
  }> {
    executedTools.push('MultiAgentService.getWorkflowMetrics');
    
    const metrics = this.multiAgentService.getWorkflowMetrics();
    
    return {
      message: `📊 **System Insights**\n**Total Workflows:** ${metrics.totalWorkflows}\n**Success Rate:** ${((metrics.successfulWorkflows / metrics.totalWorkflows) * 100).toFixed(1)}%\n**Avg Processing Time:** ${metrics.averageProcessingTime}ms`,
      data: metrics,
      executedTools
    };
  }

  /**
   * Handle ticket search
   */
  private async handleSearchTickets(intent: NLPIntent, executedTools: string[]): Promise<{
    message: string;
    data?: any;
    executedTools: string[];
  }> {
    executedTools.push('ZendeskService.getOpenTickets');
    
    const limit = intent.parameters.limit || 10;
    const tickets = await this.zendeskService.getOpenTickets(limit);
    
    const ticketList = tickets
      .slice(0, 5)
      .map(t => `• #${t.id}: ${t.subject}`)
      .join('\n');
    
    return {
      message: `🔍 **Found ${tickets.length} tickets**\n${ticketList}${tickets.length > 5 ? '\n...and more' : ''}`,
      data: tickets,
      executedTools
    };
  }

  /**
   * Handle help requests (Natural Language)
   */
  private async handleGetHelp(executedTools: string[]): Promise<{
    message: string;
    data?: any;
    executedTools: string[];
  }> {
    const helpText = `
🧞 **TaskGenie Help**

I'm your AI-powered task automation assistant! Here's what I can do:

**🎯 Core Features:**
• 🎫 Automatically create ClickUp tasks from Zendesk tickets
• 📋 Provide AI-powered ticket summaries and analysis
• 📊 Generate insights and analytics reports
• 🔍 Help you search and find tickets
• 🤖 Answer questions about your workflow
• 🔗 Keep everything connected with smart automation

**🗣️ Natural Language Examples:**
• "How many open tickets are there?"
• "Show me ticket 12345"
• "What's the status of all tickets?"
• "Search for recent tickets"
• "Analyze ticket 12345"
• "Create task from ticket 12345"
• "Route ticket 12345 to software engineer"

**🤖 System Status:**
• "Show agent status"
• "Get system insights"
• "Show workflow metrics"

**💡 Examples:**
• @TaskGenie how many open tickets do we have?
• @TaskGenie analyze ticket 12345 with AI
• @TaskGenie create ClickUp task from ticket 67890
• @TaskGenie show me agent status

🚀 **Ready to boost your productivity?** Just ask me anything in natural language!
`;

    return {
      message: helpText,
      executedTools
    };
  }

  /**
   * Fallback intent analysis using keyword matching
   */
  private fallbackIntentAnalysis(query: string): NLPIntent {
    const lowerQuery = query.toLowerCase();
    
    // Ticket count patterns
    if (lowerQuery.includes('how many') || lowerQuery.includes('count') || lowerQuery.includes('number')) {
      return {
        intent: 'GET_TICKET_COUNT',
        confidence: 0.7,
        entities: {
          status: this.extractStatus(lowerQuery)
        },
        parameters: {}
      };
    }
    
    // Ticket details patterns
    if (lowerQuery.includes('show') || lowerQuery.includes('get') || lowerQuery.includes('details')) {
      const ticketId = this.extractTicketId(lowerQuery);
      return {
        intent: ticketId ? 'GET_TICKET_DETAILS' : 'SEARCH_TICKETS',
        confidence: 0.6,
        entities: { ticket_id: ticketId },
        parameters: {}
      };
    }
    
    // Analysis patterns
    if (lowerQuery.includes('analyze') || lowerQuery.includes('analysis')) {
      return {
        intent: 'ANALYZE_TICKET',
        confidence: 0.8,
        entities: {
          ticket_id: this.extractTicketId(lowerQuery)
        },
        parameters: {}
      };
    }
    
    // Help patterns
    if (lowerQuery.includes('help') || lowerQuery.includes('commands')) {
      return {
        intent: 'GET_HELP',
        confidence: 0.9,
        entities: {},
        parameters: {}
      };
    }
    
    return {
      intent: 'UNKNOWN',
      confidence: 0.3,
      entities: {},
      parameters: {}
    };
  }

  /**
   * Extract ticket ID from query
   */
  private extractTicketId(query: string): string | null {
    const ticketMatch = query.match(/\b(?:ticket\s+)?(\d+)\b/i);
    return ticketMatch ? ticketMatch[1] : null;
  }

  /**
   * Extract status from query
   */
  private extractStatus(query: string): string {
    const statuses = ['open', 'closed', 'pending', 'new', 'solved'];
    for (const status of statuses) {
      if (query.includes(status)) {
        return status;
      }
    }
    return 'open'; // default
  }

  /**
   * Initialize tool mappings for reference
   */
  private initializeToolMappings(): ToolMapping[] {
    return [
      {
        name: 'getTicketCount',
        description: 'Get count of tickets by status',
        keywords: ['how many', 'count', 'number of tickets'],
        service: 'zendesk',
        method: 'getTicketsByStatus',
        parameters: { status: 'string', limit: 'number' },
        examples: ['How many open tickets are there?', 'Count of pending tickets']
      },
      {
        name: 'analyzeTicket',
        description: 'Analyze ticket with AI agents',
        keywords: ['analyze', 'analysis', 'ai', 'insights'],
        service: 'multiAgent',
        method: 'processTicket',
        parameters: { ticketId: 'string' },
        examples: ['Analyze ticket 12345', 'Get AI insights for ticket']
      },
      {
        name: 'createTask',
        description: 'Create ClickUp task from ticket',
        keywords: ['create task', 'clickup', 'task'],
        service: 'multiAgent',
        method: 'analyzeAndCreateTasks',
        parameters: { ticketId: 'string', listId: 'string' },
        examples: ['Create task from ticket 12345', 'Make ClickUp task']
      }
    ];
  }
}