/**
 * Agent Capabilities Configuration
 * Defines capabilities, keywords, and settings for each agent type
 */

import { AgentRole } from '../types/agents';

// Agent Capability Definitions
export interface AgentCapability {
  role: AgentRole;
  name: string;
  description: string;
  keywords: string[];
  specialties: string[];
  confidenceThreshold: number;
  maxProcessingTime: number;
  priority: number; // Lower number = higher priority
}

// Agent Capabilities Configuration
export const AGENT_CAPABILITIES: Record<AgentRole, AgentCapability> = {
  'SOFTWARE_ENGINEER': {
    role: 'SOFTWARE_ENGINEER',
    name: 'Software Engineer',
    description: 'Handles technical issues, bugs, feature requests, and development tasks',
    keywords: [
      'bug', 'error', 'crash', 'exception', 'code', 'development', 'feature',
      'api', 'database', 'server', 'client', 'frontend', 'backend', 'integration',
      'deployment', 'performance', 'optimization', 'security', 'authentication',
      'authorization', 'testing', 'debugging', 'refactoring', 'architecture'
    ],
    specialties: [
      'Bug fixes and troubleshooting',
      'Feature development and enhancement',
      'Code review and optimization',
      'API integration and development',
      'Database design and queries',
      'Performance optimization',
      'Security implementation'
    ],
    confidenceThreshold: 0.8,
    maxProcessingTime: 45000,
    priority: 1
  },
  'DEVOPS': {
    role: 'DEVOPS',
    name: 'DevOps Engineer',
    description: 'Manages infrastructure, deployment, monitoring, and operational issues',
    keywords: [
      'deployment', 'infrastructure', 'server', 'cloud', 'aws', 'azure', 'gcp',
      'docker', 'kubernetes', 'ci/cd', 'pipeline', 'monitoring', 'logging',
      'scaling', 'load', 'performance', 'uptime', 'downtime', 'backup',
      'security', 'network', 'firewall', 'ssl', 'certificate', 'domain'
    ],
    specialties: [
      'Infrastructure management and scaling',
      'CI/CD pipeline setup and optimization',
      'Monitoring and alerting systems',
      'Cloud platform management',
      'Container orchestration',
      'Security and compliance',
      'Backup and disaster recovery'
    ],
    confidenceThreshold: 0.75,
    maxProcessingTime: 40000,
    priority: 2
  },
  'QA_TESTER': {
    role: 'QA_TESTER',
    name: 'QA Tester',
    description: 'Handles testing, quality assurance, and validation issues',
    keywords: [
      'test', 'testing', 'qa', 'quality', 'validation', 'verification',
      'regression', 'automation', 'manual', 'functional', 'integration',
      'unit', 'e2e', 'end-to-end', 'performance', 'load', 'stress',
      'usability', 'accessibility', 'compatibility', 'browser', 'mobile'
    ],
    specialties: [
      'Test case design and execution',
      'Automated testing frameworks',
      'Regression testing strategies',
      'Performance and load testing',
      'Cross-browser compatibility testing',
      'Mobile and responsive testing',
      'Accessibility compliance testing'
    ],
    confidenceThreshold: 0.7,
    maxProcessingTime: 35000,
    priority: 3
  },
  'PROJECT_MANAGER': {
    role: 'PROJECT_MANAGER',
    name: 'Project Manager',
    description: 'Manages project coordination, timelines, and stakeholder communication',
    keywords: [
      'project', 'timeline', 'deadline', 'milestone', 'planning', 'coordination',
      'stakeholder', 'communication', 'meeting', 'status', 'progress',
      'resource', 'allocation', 'budget', 'scope', 'requirement', 'priority',
      'risk', 'issue', 'escalation', 'delivery', 'release', 'sprint'
    ],
    specialties: [
      'Project planning and scheduling',
      'Resource allocation and management',
      'Stakeholder communication',
      'Risk assessment and mitigation',
      'Progress tracking and reporting',
      'Team coordination and leadership',
      'Scope and requirement management'
    ],
    confidenceThreshold: 0.65,
    maxProcessingTime: 30000,
    priority: 4
  },
  'BUSINESS_ANALYST': {
    role: 'BUSINESS_ANALYST',
    name: 'Business Analyst',
    description: 'Analyzes business requirements, processes, and strategic decisions',
    keywords: [
      'requirements', 'specification', 'analysis', 'data', 'analytics',
      'report', 'dashboard', 'metrics', 'kpi', 'process', 'workflow',
      'optimization', 'efficiency', 'cost', 'budget', 'roi', 'investment',
      'stakeholder', 'business', 'strategy', 'planning', 'market', 'user'
    ],
    specialties: [
      'Business requirement analysis',
      'Process optimization and design',
      'Data analysis and reporting',
      'KPI and metrics definition',
      'Stakeholder requirement gathering',
      'Cost-benefit analysis',
      'Strategic planning support'
    ],
    confidenceThreshold: 0.6,
    maxProcessingTime: 35000,
    priority: 5
  },
  'WORDPRESS_DEVELOPER': {
    role: 'WORDPRESS_DEVELOPER',
    name: 'WordPress Developer',
    description: 'Specializes in WordPress development, themes, plugins, and customization',
    keywords: [
      'wordpress', 'wp', 'theme', 'plugin', 'customization', 'php',
      'mysql', 'css', 'javascript', 'gutenberg', 'block', 'shortcode',
      'hook', 'filter', 'action', 'template', 'page', 'post', 'custom',
      'field', 'meta', 'taxonomy', 'widget', 'menu', 'admin', 'dashboard'
    ],
    specialties: [
      'WordPress theme development and customization',
      'Plugin development and integration',
      'Custom post types and fields',
      'WordPress security and optimization',
      'Gutenberg block development',
      'WooCommerce customization',
      'WordPress multisite management'
    ],
    confidenceThreshold: 0.75,
    maxProcessingTime: 40000,
    priority: 6
  }
};

// Agent Selection Configuration
export const AGENT_SELECTION_CONFIG = {
  DEFAULT_AGENT: 'SOFTWARE_ENGINEER' as AgentRole,
  FALLBACK_AGENT: 'PROJECT_MANAGER' as AgentRole,
  MIN_CONFIDENCE_THRESHOLD: 0.5,
  MAX_AGENTS_PER_TICKET: 3,
  PROCESSING_TIMEOUT: 60000, // 1 minute
  RETRY_ATTEMPTS: 2
};

// Agent Workflow Configuration
export const AGENT_WORKFLOW_CONFIG = {
  ANALYSIS_STEPS: [
    'ticket_parsing',
    'keyword_analysis',
    'confidence_calculation',
    'agent_selection',
    'task_generation',
    'recommendation_creation'
  ],
  COLLABORATION_RULES: {
    'SOFTWARE_ENGINEER': ['DEVOPS', 'QA_TESTER'],
    'DEVOPS': ['SOFTWARE_ENGINEER'],
    'QA_TESTER': ['SOFTWARE_ENGINEER', 'DEVOPS'],
    'PROJECT_MANAGER': ['SOFTWARE_ENGINEER', 'DEVOPS', 'QA_TESTER', 'BUSINESS_ANALYST'],
    'BUSINESS_ANALYST': ['PROJECT_MANAGER', 'SOFTWARE_ENGINEER'],
    'WORDPRESS_DEVELOPER': ['SOFTWARE_ENGINEER', 'DEVOPS']
  },
  ESCALATION_RULES: {
    LOW_CONFIDENCE: 'PROJECT_MANAGER',
    COMPLEX_ISSUE: ['SOFTWARE_ENGINEER', 'DEVOPS'],
    BUSINESS_CRITICAL: 'BUSINESS_ANALYST'
  }
};

// Agent Performance Metrics
export const AGENT_METRICS = {
  TRACKING_ENABLED: true,
  METRICS: [
    'processing_time',
    'confidence_score',
    'success_rate',
    'task_completion_rate',
    'user_satisfaction'
  ],
  PERFORMANCE_THRESHOLDS: {
    MIN_SUCCESS_RATE: 0.8,
    MAX_PROCESSING_TIME: 60000,
    MIN_CONFIDENCE: 0.6
  }
};