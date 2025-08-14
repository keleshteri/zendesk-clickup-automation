import { AgentRole, WorkflowState, AgentAnalysis, AgentTool, AgentMemory } from '../../types/agents.js';
import { ZendeskTicket } from '../../types/index.js';

export abstract class BaseAgent {
  public id: string;
  protected role: AgentRole;
  protected capabilities: string[];
  protected tools: AgentTool[];
  protected memory: Map<number, AgentMemory>;
  protected maxConcurrentTasks: number;
  protected currentTasks: Set<number>;
  protected tasksProcessed: number = 0;
  protected successfulTasks: number = 0;
  protected totalProcessingTime: number = 0;

  constructor(
    role: AgentRole, 
    capabilities: string[], 
    tools: AgentTool[] = [],
    maxConcurrentTasks: number = 5
  ) {
    this.id = `agent-${role.toLowerCase()}-${Date.now()}`;
    this.role = role;
    this.capabilities = capabilities;
    this.tools = tools;
    this.memory = new Map();
    this.maxConcurrentTasks = maxConcurrentTasks;
    this.currentTasks = new Set();
  }

  /**
   * Analyze a ticket and provide insights specific to this agent's domain
   */
  abstract analyze(ticket: ZendeskTicket, context?: any): Promise<AgentAnalysis>;

  /**
   * Execute a specific task assigned to this agent
   */
  abstract execute(task: string | ZendeskTicket, context?: any): Promise<any>;

  /**
   * Determine if this agent should hand off to another agent
   */
  abstract shouldHandoff(context: any): Promise<AgentRole | null>;

  /**
   * Check if this agent can handle a specific ticket type
   */
  abstract canHandle(ticket: ZendeskTicket): Promise<boolean>;

  /**
   * Get the agent's role
   */
  getRole(): AgentRole {
    return this.role;
  }

  /**
   * Get the agent's capabilities
   */
  getCapabilities(): string[] {
    return this.capabilities;
  }

  /**
   * Get available tools for this agent
   */
  getTools(): AgentTool[] {
    return this.tools;
  }

  /**
   * Check if agent can take on more tasks
   */
  canAcceptTask(): boolean {
    return this.currentTasks.size < this.maxConcurrentTasks;
  }

  /**
   * Add a task to the agent's workload
   */
  addTask(ticketId: number): boolean {
    if (this.canAcceptTask()) {
      this.currentTasks.add(ticketId);
      return true;
    }
    return false;
  }

  /**
   * Remove a task from the agent's workload
   */
  completeTask(ticketId: number): void {
    this.currentTasks.delete(ticketId);
  }

  /**
   * Get current workload
   */
  getCurrentWorkload(): number {
    return this.currentTasks.size;
  }

  /**
   * Store interaction in memory
   */
  protected storeMemory(ticketId: number, action: string, result: string, context?: any): void {
    if (!this.memory.has(ticketId)) {
      this.memory.set(ticketId, {
        ticketId,
        interactions: [],
        context: context || {},
        learnings: []
      });
    }

    const memory = this.memory.get(ticketId)!;
    memory.interactions.push({
      agent: this.role,
      action,
      result,
      timestamp: new Date().toISOString()
    });

    // Update context if provided
    if (context) {
      memory.context = { ...memory.context, ...context };
    }
  }

  /**
   * Retrieve memory for a specific ticket
   */
  protected getMemory(ticketId: number): AgentMemory | undefined {
    return this.memory.get(ticketId);
  }

  /**
   * Add a learning to the agent's memory
   */
  protected addLearning(ticketId: number, learning: string): void {
    const memory = this.memory.get(ticketId);
    if (memory) {
      memory.learnings.push(learning);
    }
  }

  /**
   * Get agent performance metrics
   */
  getMetrics(): {
    currentWorkload: number;
    maxCapacity: number;
    utilizationRate: number;
    totalTasksHandled: number;
    tasksProcessed: number;
    successRate: number;
    averageProcessingTime: number;
  } {
    return {
      currentWorkload: this.currentTasks.size,
      maxCapacity: this.maxConcurrentTasks,
      utilizationRate: this.currentTasks.size / this.maxConcurrentTasks,
      totalTasksHandled: this.memory.size,
      tasksProcessed: this.tasksProcessed,
      successRate: this.tasksProcessed > 0 ? this.successfulTasks / this.tasksProcessed : 0,
      averageProcessingTime: this.tasksProcessed > 0 ? this.totalProcessingTime / this.tasksProcessed : 0
    };
  }

  /**
   * Execute a tool by name
   */
  protected async executeTool(toolName: string, parameters: any): Promise<any> {
    const tool = this.tools.find(t => t.name === toolName);
    if (!tool) {
      throw new Error(`Tool '${toolName}' not found for agent '${this.role}'`);
    }

    try {
      return await tool.execute(parameters);
    } catch (error) {
      console.error(`Error executing tool '${toolName}':`, error);
      throw error;
    }
  }

  /**
   * Generate a confidence score for handling a specific ticket
   */
  protected calculateConfidence(ticket: ZendeskTicket): number {
    const content = `${ticket.subject} ${ticket.description}`.toLowerCase();
    let confidence = 0;

    // Base confidence on capability keywords
    for (const capability of this.capabilities) {
      const keywords = this.getKeywordsForCapability(capability);
      for (const keyword of keywords) {
        if (content.includes(keyword.toLowerCase())) {
          confidence += 0.2;
        }
      }
    }

    // Cap confidence at 1.0
    return Math.min(confidence, 1.0);
  }

  /**
   * Get keywords associated with a capability
   */
  protected abstract getKeywordsForCapability(capability: string): string[];

  /**
   * Format analysis result
   */
  protected formatAnalysis(
    analysis: string,
    confidence: number,
    recommendedActions: string[],
    nextAgent?: AgentRole,
    priority?: 'low' | 'normal' | 'high' | 'urgent',
    estimatedTime?: string,
    complexity?: 'simple' | 'medium' | 'complex'
  ): AgentAnalysis {
    return {
      agentRole: this.role,
      analysis,
      confidence,
      recommendedActions,
      nextAgent,
      priority,
      estimatedTime,
      complexity
    };
  }
}