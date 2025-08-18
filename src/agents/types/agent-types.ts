export type AgentRole = 
  | 'PROJECT_MANAGER'
  | 'SOFTWARE_ENGINEER' 
  | 'WORDPRESS_DEVELOPER'
  | 'BUSINESS_ANALYST'
  | 'QA_TESTER'
  | 'DEVOPS';

export const AgentRoleValues = {
  PROJECT_MANAGER: 'PROJECT_MANAGER' as const,
  SOFTWARE_ENGINEER: 'SOFTWARE_ENGINEER' as const,
  WORDPRESS_DEVELOPER: 'WORDPRESS_DEVELOPER' as const,
  BUSINESS_ANALYST: 'BUSINESS_ANALYST' as const,
  QA_TESTER: 'QA_TESTER' as const,
  DEVOPS: 'DEVOPS' as const
} as const;

export const ALL_AGENT_ROLES: AgentRole[] = [
  'PROJECT_MANAGER',
  'SOFTWARE_ENGINEER',
  'WORDPRESS_DEVELOPER',
  'BUSINESS_ANALYST',
  'QA_TESTER',
  'DEVOPS'
];

export interface AgentCapability {
  role: AgentRole;
  specializations: string[];
  tools: string[];
  maxConcurrentTasks: number;
}

export interface WorkflowState {
  ticketId: number;
  currentAgent: AgentRole;
  previousAgents: AgentRole[];
  context: {
    ticket: any;
    insights: AgentAnalysis[];
    recommendations: string[];
    confidence: number;
  };
  isComplete: boolean;
  handoffReason: string;
}

export interface TaskAssignment {
  agentRole: AgentRole;
  task: string;
  timestamp: string;
  result?: string;
  nextAgent?: AgentRole;
  confidence?: number;
  reasoning?: string;
}

export interface AgentAnalysis {
  agentRole: AgentRole;
  analysis: string;
  confidence: number;
  recommendedActions: string[];
  nextAgent?: AgentRole;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  estimatedTime?: string;
  complexity?: 'simple' | 'medium' | 'complex';
}

export interface MultiAgentResponse {
  ticketId: number;
  workflow: WorkflowState;
  finalRecommendations: string[];
  confidence: number;
  processingTimeMs: number;
  agentsInvolved: AgentRole[];
  handoffCount: number;
  agentAnalyses?: AgentAnalysis[];
}

export interface AgentMetrics {
  agentRole: AgentRole;
  tasksCompleted: number;
  averageTime: string;
  successRate: number;
  currentWorkload: number;
  specializations: string[];
}

export interface WorkflowMetrics {
  totalWorkflows: number;
  successfulWorkflows: number;
  averageProcessingTime: number;
  agentUtilization: Map<AgentRole, {
    tasksHandled: number;
    averageConfidence: number;
    successRate: number;
    averageProcessingTime: number;
  }>;
  handoffCount: number;
  lastUpdated: string;
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => Promise<any>;
}

export interface AgentMemory {
  ticketId: number;
  interactions: Array<{
    agent: AgentRole;
    action: string;
    result: string;
    timestamp: string;
  }>;
  context: Record<string, any>;
  learnings: string[];
}