/**
 * Team Assignment Configuration
 * Maps ticket categories and urgency levels to appropriate team members
 * Enhanced with project-aware team assignment capabilities
 */

import { 
  getProjectAwareTeamAssignment, 
  logProjectDetection, 
  TicketData, 
  ProjectDetectionResult 
} from './project-mappings';

export interface TeamMember {
  name: string;
  slackId: string;
  role:
    | "engineer"
    | "pm"
    | "devops"
    | "qa"
    | "wordpress"
    | "business_analyst"
    | "hr"
    | "owner";
  specialties: string[];
}

export interface TeamAssignment {
  engineers: TeamMember[];
  projectManagers: TeamMember[];
  mentions: {
    [category: string]: {
      [urgency: string]: {
        engineers: string[];
        projectManagers: string[];
        message: string;
      };
    };
  };
}

import { SLACK_IDS } from './slack-ids';

// Team Members Configuration
export const TEAM_MEMBERS: TeamMember[] = [
  // Owner/Founder
  {
    name: "Steve",
    slackId: SLACK_IDS.STEVE,
    role: "owner",
    specialties: ["leadership", "strategy", "business_decisions"],
  },

  // Project Managers
  {
    name: "Talha",
    slackId: SLACK_IDS.TALHA,
    role: "pm",
    specialties: [
      "leadership",
      "strategy",
      "business_decisions",
      "project_management",
      "coordination",
      "client_communication",
    ],
  },
  {
    name: "Francis Sto. Tomas",
    slackId: SLACK_IDS.FRANCIS,
    role: "pm",
    specialties: ["project_management", "technical_coordination", "planning"],
  },

  // Engineers/Developers
  {
    name: "Mike Keleshetri",
    slackId: SLACK_IDS.MIKE,
    role: "engineer",
    specialties: [
      "software_development",
      "devops",
      "javascript",
      "node.js",
      "api",
      "backend",
    ],
  },
  {
    name: "Samuel Sena",
    slackId: SLACK_IDS.SAMUEL,
    role: "engineer",
    specialties: [
      "wordpress",
      "javascript",
      "php",
      "wordpress_development",
      "wordpress_plugins",
      "wordpress_theme",
      "wordpress_optimization",
      "wordpress_security",
      "wordpress_woocommerce",
      "wordpress_php",
      "siteground",
      "wordpress_hosting",
      "siteground_wordpress",
      "mysql",
      "devops",
      "backend",
      "database",
      "api",
      "performance",
      "security",
    ],
  },

  // WordPress Specialists
  {
    name: "Dimple Rubiato",
    slackId: SLACK_IDS.DIMPLE,
    role: "wordpress",
    specialties: ["wordpress", "php", "woocommerce", "themes", "plugins"],
  },
  {
    name: "Pat Mayo",
    slackId: SLACK_IDS.PAT,
    role: "wordpress",
    specialties: ["wordpress", "php", "woocommerce", "themes", "plugins"],
  },

  // HR/Executive Assistant
  {
    name: "Camille",
    slackId: SLACK_IDS.CAMILLE,
    role: "hr",
    specialties: ["hr", "executive_assistance", "administration"],
  },
];

// Team Assignment Rules
export const TEAM_ASSIGNMENTS: TeamAssignment = {
  engineers: TEAM_MEMBERS.filter((member) =>
    ["engineer", "wordpress", "devops"].includes(member.role)
  ),
  projectManagers: TEAM_MEMBERS.filter((member) => member.role === "pm"),

  mentions: {
    // Bug-related tickets
    bug: {
      critical: {
        engineers: [`<@${SLACK_IDS.SAMUEL}>`, `<@${SLACK_IDS.PAT}>`],
        projectManagers: [`<@${SLACK_IDS.TALHA}>`, `<@${SLACK_IDS.FRANCIS}>`],
        message: "CRITICAL BUG - immediate attention required",
      },
      high: {
        engineers: [`<@${SLACK_IDS.SAMUEL}>`, `<@${SLACK_IDS.PAT}>`],
        projectManagers: [`<@${SLACK_IDS.TALHA}>`, `<@${SLACK_IDS.FRANCIS}>`],
        message: "High priority bug - please review ASAP",
      },
      medium: {
        engineers: [`<@${SLACK_IDS.SAMUEL}>`, `<@${SLACK_IDS.PAT}>`],
        projectManagers: [`<@${SLACK_IDS.TALHA}>`, `<@${SLACK_IDS.FRANCIS}>`],
        message: "Bug reported - please investigate",
      },
      low: {
        engineers: [`<@${SLACK_IDS.SAMUEL}>`, `<@${SLACK_IDS.PAT}>`],
        projectManagers: [],
        message: "Low priority bug logged",
      },
    },

    // Feature requests
    feature: {
      critical: {
        engineers: [`<@${SLACK_IDS.SAMUEL}>`, `<@${SLACK_IDS.PAT}>`],
        projectManagers: [`<@${SLACK_IDS.TALHA}>`, `<@${SLACK_IDS.FRANCIS}>`],
        message: "Critical feature request - needs immediate planning",
      },
      high: {
        engineers: [`<@${SLACK_IDS.SAMUEL}>`],
        projectManagers: [`<@${SLACK_IDS.TALHA}>`, `<@${SLACK_IDS.FRANCIS}>`],
        message: "High priority feature - please review requirements",
      },
      medium: {
        engineers: [`<@${SLACK_IDS.SAMUEL}>`],
        projectManagers: [`<@${SLACK_IDS.TALHA}>`, `<@${SLACK_IDS.FRANCIS}>`],
        message: "Feature request for consideration",
      },
      low: {
        engineers: [],
        projectManagers: [`<@${SLACK_IDS.FRANCIS}>`],
        message: "Feature request logged for future planning",
      },
    },

    // WordPress-related tickets
    wordpress: {
      critical: {
        engineers: [`<@${SLACK_IDS.DIMPLE}>`, `<@${SLACK_IDS.PAT}>`, `<@${SLACK_IDS.SAMUEL}>`],
        projectManagers: [`<@${SLACK_IDS.TALHA}>`, `<@${SLACK_IDS.FRANCIS}>`],
        message: "CRITICAL WordPress issue - immediate attention needed",
      },
      high: {
        engineers: [`<@${SLACK_IDS.DIMPLE}>`, `<@${SLACK_IDS.PAT}>`],
        projectManagers: [`<@${SLACK_IDS.TALHA}>`, `<@${SLACK_IDS.FRANCIS}>`],
        message: "WordPress issue - please look at this ticket",
      },
      medium: {
        engineers: [`<@${SLACK_IDS.DIMPLE}>`],
        projectManagers: [`<@${SLACK_IDS.TALHA}>`, `<@${SLACK_IDS.FRANCIS}>`],
        message: "WordPress ticket needs review",
      },
      low: {
        engineers: [`<@${SLACK_IDS.PAT}>`],
        projectManagers: [],
        message: "WordPress maintenance item",
      },
    },

    // Deployment/Infrastructure
    deployment: {
      critical: {
        engineers: [`<@${SLACK_IDS.SAMUEL}>`, `<@${SLACK_IDS.PAT}>`],
        projectManagers: [`<@${SLACK_IDS.TALHA}>`, `<@${SLACK_IDS.FRANCIS}>`],
        message: "CRITICAL deployment issue - all hands on deck",
      },
      high: {
        engineers: [`<@${SLACK_IDS.SAMUEL}>`, `<@${SLACK_IDS.PAT}>`],
        projectManagers: [`<@${SLACK_IDS.TALHA}>`, `<@${SLACK_IDS.FRANCIS}>`],
        message: "Deployment issue needs immediate attention",
      },
      medium: {
        engineers: [`<@${SLACK_IDS.SAMUEL}>`],
        projectManagers: [`<@${SLACK_IDS.TALHA}>`, `<@${SLACK_IDS.FRANCIS}>`],
        message: "Infrastructure ticket for review",
      },
      low: {
        engineers: [`<@${SLACK_IDS.SAMUEL}>`],
        projectManagers: [],
        message: "Infrastructure maintenance",
      },
    },

    // General/Other tickets
    general: {
      critical: {
        engineers: [`<@${SLACK_IDS.SAMUEL}>`, `<@${SLACK_IDS.PAT}>`],
        projectManagers: [`<@${SLACK_IDS.TALHA}>`, `<@${SLACK_IDS.FRANCIS}>`],
        message: "Critical ticket - needs immediate triage",
      },
      high: {
        engineers: [`<@${SLACK_IDS.SAMUEL}>`],
        projectManagers: [`<@${SLACK_IDS.TALHA}>`, `<@${SLACK_IDS.FRANCIS}>`],
        message: "High priority ticket - please review",
      },
      medium: {
        engineers: [`<@${SLACK_IDS.SAMUEL}>`],
        projectManagers: [`<@${SLACK_IDS.TALHA}>`, `<@${SLACK_IDS.FRANCIS}>`],
        message: "Ticket needs review and assignment",
      },
      low: {
        engineers: [],
        projectManagers: [`<@${SLACK_IDS.FRANCIS}>`],
        message: "General ticket logged",
      },
    },
  },
};

// Utility functions
export const getTeamMembersByRole = (
  role: TeamMember["role"]
): TeamMember[] => {
  return TEAM_MEMBERS.filter((member) => member.role === role);
};

export const getTeamMemberBySlackId = (
  slackId: string
): TeamMember | undefined => {
  return TEAM_MEMBERS.find((member) => member.slackId === slackId);
};

export const getMentionsForTicket = (
  category: string,
  urgency: string,
  agentRole?: string,
  ticketContent?: string,
  ticketData?: TicketData
): { engineers: string[]; projectManagers: string[]; message: string; projectInfo?: any } => {
  const normalizedCategory = category.toLowerCase();
  const normalizedUrgency = urgency.toLowerCase();

  // NEW: Project-aware team assignment
  if (ticketData) {
    const projectAssignment = getProjectAwareTeamAssignment(ticketData);
    logProjectDetection(ticketData, projectAssignment.detection);
    
    if (projectAssignment.detection.projectId) {
      const engineers = projectAssignment.engineers.map(id => `<@${id}>`);
      const projectManager = `<@${projectAssignment.projectManager}>`;
      
      return {
        engineers,
        projectManagers: [projectManager],
        message: `${projectAssignment.project.client} project assignment (${projectAssignment.detection.confidence.toFixed(1)}% confidence)`,
        projectInfo: {
          ...projectAssignment.project,
          detection: projectAssignment.detection,
          businessContext: projectAssignment.businessContext
        }
      };
    }
  }

  // Enhanced logic: Use agent role to determine specialized team members
  if (agentRole && ticketContent) {
    const specializedMentions = getSpecializedMentions(agentRole, normalizedCategory, normalizedUrgency, ticketContent);
    if (specializedMentions) {
      return specializedMentions;
    }
  }

  // Try exact match first
  if (TEAM_ASSIGNMENTS.mentions[normalizedCategory]?.[normalizedUrgency]) {
    return TEAM_ASSIGNMENTS.mentions[normalizedCategory][normalizedUrgency];
  }

  // Fallback to general category
  if (TEAM_ASSIGNMENTS.mentions.general[normalizedUrgency]) {
    return TEAM_ASSIGNMENTS.mentions.general[normalizedUrgency];
  }

  // Final fallback
  return {
    engineers: [`<@${SLACK_IDS.SAMUEL}>`],
    projectManagers: [`<@${SLACK_IDS.TALHA}>`],
    message: "Ticket needs review and assignment",
  };
};

export const formatMentionMessage = (
  category: string,
  urgency: string,
  ticketId?: string,
  agentRole?: string,
  agentRecommendations?: string[],
  ticketContent?: string,
  ticketData?: TicketData
): string => {
  const mentions = getMentionsForTicket(category, urgency, agentRole, ticketContent, ticketData);
  const engineerMentions = mentions.engineers.join(" ");
  const pmMentions = mentions.projectManagers.join(" ");

  let message = "";

  // Add project context if available
  if (mentions.projectInfo) {
    message += `👥 **Team Assignment**\n`;
    message += `${engineerMentions} investigate ${category} issue (Client: ${mentions.projectInfo.client}, Project: ${mentions.projectInfo.name})\n`;
    message += `📋 **Detection:** ${mentions.projectInfo.detection.reasoning}\n\n`;
  } else {
    // Add agent context if available
    if (agentRole) {
      message += `🤖 **${agentRole.replace('_', ' ')} Analysis Complete**\n`;
    }

    if (engineerMentions) {
      message += `${engineerMentions} ${mentions.message}`;
    }
  }

  if (pmMentions) {
    if (message && !mentions.projectInfo) message += "\n";
    if (mentions.projectInfo) {
      message += `cc: ${pmMentions} - monitor ${mentions.projectInfo.client} project progress and coordinate with client\n\n`;
    } else {
      message += `cc: ${pmMentions} please take note`;
    }
  }

  // Add agent recommendations if available
  if (agentRecommendations && agentRecommendations.length > 0) {
    message += "\n\n📋 **Key Recommendations:**";
    agentRecommendations.slice(0, 3).forEach((rec, index) => {
      message += `\n${index + 1}. ${rec}`;
    });
  }

  if (ticketId) {
    message += `\n\n🎫 Ticket #${ticketId}`;
  }

  return message;
};

/**
 * Enhanced team assignment message generation with specific issue extraction and business context
 */
export const generateEnhancedTeamAssignmentMessage = (
  category: string,
  urgency: string,
  ticketId: string,
  ticketSubject: string,
  ticketDescription: string,
  agentRole?: string,
  agentRecommendations?: string[],
  estimatedTime?: string,
  agentFeedback?: any,
  metrics?: {
    confidence?: number;
    processingTime?: number;
    agentsInvolved?: string[];
  },
  ticketData?: TicketData
): string => {
  const ticketContent = `${ticketSubject} ${ticketDescription}`;
  const ticket = { id: ticketId, subject: ticketSubject, description: ticketDescription };
  
  // Create ticket data for project detection if not provided
  const detectionData: TicketData = ticketData || {
    subject: ticketSubject,
    description: ticketDescription
  };
  
  // Use new helper functions for enhanced analysis
  const specificIssue = extractSpecificIssue(ticket);
  const extractedTimeEstimate = extractTimeEstimate(agentFeedback) || estimatedTime;
  const urgentTimeline = formatUrgentTimeline(urgency, extractedTimeEstimate);
  const businessImpact = getBusinessImpactContext(ticketDescription);
  const stakeholderContext = getStakeholderContext(businessImpact);
  const specificGoal = generateSpecificGoal(specificIssue, ticketContent);
  const mentions = getMentionsForTicket(category, urgency, agentRole, ticketContent, detectionData);
  
  // Keep Slack mentions in proper format for actual mentions
  const engineers = mentions.engineers.join(' ');
  
  // Format PM mentions for CC - keep proper Slack format
  const pms = mentions.projectManagers.join(' ');
  
  // Enhanced message structure with project awareness
  let message = '';
  
  if (mentions.projectInfo) {
    // Project-aware message format
    message += `🎯 **Issue Identified:** ${specificIssue}\n\n`;
    message += `📋 **Objective:** ${specificGoal}\n\n`;
    message += `⏰ **Timeline:** ${urgentTimeline}\n\n`;
    message += `💼 **Business Impact:** ${businessImpact}\n`;
    message += `📊 **Stakeholder Action:** ${stakeholderContext}\n\n`;
    message += `👥 **Team Assignment:**\n${engineers} investigate ${specificIssue} urgently\n`;
    message += `(Client: ${mentions.projectInfo.client}, Project: ${mentions.projectInfo.name})\n\n`;
    
    if (pms) {
      message += `cc: ${pms} - monitor ${mentions.projectInfo.client} project progress and coordinate with client\n\n`;
    }
    
    // Add project detection details
    message += `📋 **Detection:** ${mentions.projectInfo.detection.reasoning}\n\n`;
  } else {
    // Fallback to original format for unknown projects
    message += `🎯 **Issue Identified:** ${specificIssue}\n\n`;
    message += `📋 **Objective:** ${specificGoal}\n\n`;
    message += `⏰ **Timeline:** ${urgentTimeline}\n\n`;
    message += `💼 **Business Impact:** ${businessImpact}\n`;
    message += `📊 **Stakeholder Action:** ${stakeholderContext}\n\n`;
    message += `👥 **Team Assignment:**\n${engineers} investigate ${specificIssue} urgently\n\n`;
    
    if (pms) {
      message += `cc: ${pms} - ${stakeholderContext}\n\n`;
    }
  }
  
  // Generate contextual footer based on urgency and business impact
  let footer = '';
  if (urgency === 'critical' || businessImpact.includes('critical')) {
    footer = generateSmartFooter(
      metrics?.confidence || 0.8,
      metrics?.processingTime || 500,
      metrics?.agentsInvolved || [agentRole || 'AI'],
      ticketId
    );
  } else if (urgency === 'high' || urgency === 'urgent' || businessImpact.includes('deadline')) {
    footer = generateProfessionalFooter(
      category,
      urgency,
      mentions.engineers,
      mentions.projectManagers,
      ticketId
    );
  } else {
    footer = generateMinimalFooter(ticketId);
  }
  
  message += footer;
  
  return message;
};

/**
 * Extract issue description from ticket content with enhanced business awareness
 */
export const extractIssueDescription = (ticketContent: string, category: string): string => {
  const content = ticketContent.toLowerCase();
  
  // Critical system errors with business impact
  if (content.includes('analytics') && content.includes('500')) {
    return 'Analytics Dashboard 500 Error - Quarterly Reports Blocked';
  }
  if (content.includes('database') && content.includes('connection')) {
    return 'Database Connection Failure - Operations Impact';
  }
  if (content.includes('payment') && content.includes('error')) {
    return 'Payment Processing Error - Revenue Impact';
  }
  
  // WordPress specific with business context
  if (content.includes('wordpress') && content.includes('crash')) {
    return 'WordPress Plugin Crash - Site Functionality Affected';
  }
  if (content.includes('wordpress') && content.includes('update')) {
    return 'WordPress Update Issue - Compatibility Problems';
  }
  if (content.includes('wordpress') && content.includes('plugin')) {
    return 'WordPress Plugin Issue - Site Impact';
  }
  if (content.includes('wordpress') && content.includes('theme')) {
    return 'WordPress Theme Issue - Display Problems';
  }
  
  // API and integration issues
  if (content.includes('api') && content.includes('500')) {
    return 'API 500 Error - System Integration Failure';
  }
  if (content.includes('api') && content.includes('timeout')) {
    return 'API Timeout - Integration Performance Issue';
  }
  if (content.includes('api') && content.includes('error')) {
    return 'API Error - Integration Disruption';
  }
  if (content.includes('webhook') && content.includes('fail')) {
    return 'Webhook Failure - Automated Workflow Disruption';
  }
  
  // Deployment issues
  if (content.includes('deployment') && content.includes('fail')) {
    return 'Deployment Failure - Release Blocked';
  }
  if (content.includes('deploy') && content.includes('error')) {
    return 'Deployment Error - System Update Failed';
  }
  
  // Database issues
  if (content.includes('database') && content.includes('slow')) {
    return 'Database Performance Issue - System Slowdown';
  }
  if (content.includes('database') && content.includes('error')) {
    return 'Database Error - Data Access Problem';
  }
  
  // Performance and availability
  if (content.includes('server') && content.includes('down')) {
    return 'Server Outage - Customer Access Affected';
  }
  if (content.includes('server') && content.includes('error')) {
    return 'Server Error - Service Disruption';
  }
  if (content.includes('slow') && content.includes('response')) {
    return 'Performance Issue - User Experience Degraded';
  }
  if (content.includes('timeout')) {
    return 'System Timeout - Service Availability Issue';
  }
  
  // Security concerns
  if (content.includes('security') && content.includes('breach')) {
    return 'Security Breach - Immediate Attention Required';
  }
  if (content.includes('unauthorized') && content.includes('access')) {
    return 'Unauthorized Access - Security Incident';
  }
  if (content.includes('security')) {
    return 'Security Issue - Protocol Review Required';
  }
  
  // Business-critical keywords
  if (content.includes('checkout') && content.includes('error')) {
    return 'Checkout Error - Revenue Loss Risk';
  }
  if (content.includes('login') && content.includes('fail')) {
    return 'Login Failure - User Access Issue';
  }
  if (content.includes('email') && content.includes('not')) {
    return 'Email Service Issue - Communication Disruption';
  }
  
  // Performance issues
  if (content.includes('slow') || content.includes('performance')) {
    return 'Performance Issue - System Optimization Needed';
  }
  
  // Enhanced category-based fallbacks with business context
  switch(category.toLowerCase()) {
    case 'bug':
      if (content.includes('critical') || content.includes('urgent')) {
        return 'Critical System Bug - Business Impact';
      }
      return 'Application Bug - Functionality Issue';
    case 'feature':
      if (content.includes('deadline') || content.includes('urgent')) {
        return 'Urgent Feature Implementation - Deadline Critical';
      }
      return 'Feature Development Request';
    case 'support':
      if (content.includes('customer') || content.includes('client')) {
        return 'Customer Support Issue - Client Impact';
      }
      return 'Technical Support Request';
    case 'security':
      return 'Security Issue - Protocol Review Required';
    case 'performance':
      return 'Performance Issue - System Optimization Needed';
    default:
      if (content.includes('error') || content.includes('fail')) {
        return 'System Error - Technical Investigation Required';
      }
      return `${category} issue - Analysis Needed`;
  }
};

/**
 * Generate specific goal based on issue and business context
 */
export const generateSpecificGoal = (issue: string, ticketContent: string): string => {
  const content = ticketContent.toLowerCase();
  
  // Deadline-based goals
  if (content.includes('deadline') && content.includes('friday')) {
    return 'Restore system access before Friday quarterly deadline';
  }
  if (content.includes('deadline') && content.includes('monday')) {
    return 'Resolve issue before Monday business deadline';
  }
  if (content.includes('deadline')) {
    return 'Resolve issue before upcoming deadline';
  }
  
  // Customer impact goals
  if (content.includes('customer') && content.includes('down')) {
    return 'Restore customer service functionality immediately';
  }
  if (content.includes('customer') && content.includes('access')) {
    return 'Restore customer access to platform';
  }
  
  // Report/Analytics goals
  if (content.includes('report') && content.includes('urgent')) {
    return 'Enable report generation for business deadline';
  }
  if (content.includes('analytics') && content.includes('dashboard')) {
    return 'Restore dashboard access for analytics reporting';
  }
  
  // E-commerce goals
  if (content.includes('checkout') || content.includes('payment')) {
    return 'Restore checkout functionality to prevent revenue loss';
  }
  
  // General goals based on issue type
  if (issue.includes('500 error') || issue.includes('crash')) {
    return `Resolve ${issue} and restore normal operations`;
  }
  if (issue.includes('performance')) {
    return `Optimize ${issue} and improve system performance`;
  }
  if (issue.includes('security')) {
    return `Address ${issue} and secure system integrity`;
  }
  
  return `Resolve ${issue} and restore normal operations`;
};

/**
 * Format timeline with urgency indicators and time estimates
 */
export const formatTimelineWithUrgency = (urgency: string, estimatedTime?: string): string => {
  const timeEstimate = estimatedTime || 'TBD';
  
  switch(urgency.toLowerCase()) {
    case 'critical':
      return `🚨 CRITICAL (target: ${timeEstimate})`;
    case 'urgent':
    case 'high':
      return `⚡ URGENT (target: ${timeEstimate})`;
    case 'medium':
      return `🔥 HIGH (target: ${timeEstimate})`;
    case 'low':
      return `📅 ${timeEstimate}`;
    default:
      return `📅 ${timeEstimate}`;
  }
};

/**
 * Create TicketData from Zendesk webhook payload
 */
export const createTicketDataFromZendesk = (zendeskTicket: any): TicketData => {
  return {
    organization: zendeskTicket.organization?.name || zendeskTicket.organization_id?.toString(),
    requesterEmail: zendeskTicket.requester?.email || zendeskTicket.requester_email,
    tags: zendeskTicket.tags || [],
    subject: zendeskTicket.subject,
    description: zendeskTicket.description,
    customFields: zendeskTicket.custom_fields || {}
  };
};

/**
 * Enhanced team assignment with project detection for external use
 */
export const getProjectAwareTeamMentions = (
  category: string,
  urgency: string,
  zendeskTicket: any,
  agentRole?: string,
  ticketContent?: string
) => {
  const ticketData = createTicketDataFromZendesk(zendeskTicket);
  return getMentionsForTicket(category, urgency, agentRole, ticketContent, ticketData);
};

/**
 * Generate project-aware enhanced message for external use
 */
export const generateProjectAwareMessage = (
  category: string,
  urgency: string,
  ticketId: string,
  ticketSubject: string,
  ticketDescription: string,
  zendeskTicket: any,
  agentRole?: string,
  agentRecommendations?: string[],
  estimatedTime?: string,
  agentFeedback?: any,
  metrics?: {
    confidence?: number;
    processingTime?: number;
    agentsInvolved?: string[];
  }
): string => {
  const ticketData = createTicketDataFromZendesk(zendeskTicket);
  return generateEnhancedTeamAssignmentMessage(
    category,
    urgency,
    ticketId,
    ticketSubject,
    ticketDescription,
    agentRole,
    agentRecommendations,
    estimatedTime,
    agentFeedback,
    metrics,
    ticketData
  );
};

/**
 * Get business impact context for PM CC messages
 */
export const getBusinessImpactContext = (ticketContent: string): string => {
  const content = ticketContent.toLowerCase();
  
  if (content.includes('deadline')) return 'deadline at risk, please monitor progress';
  if (content.includes('customer')) return 'customer impact, please track resolution';
  if (content.includes('revenue') || content.includes('sales')) return 'revenue impact, escalate if needed';
  if (content.includes('critical')) return 'critical system issue, immediate attention required';
  if (content.includes('outage') || content.includes('down')) return 'service outage, restore ASAP';
  if (content.includes('security')) return 'security concern, follow incident protocol';
  if (content.includes('data') && content.includes('loss')) return 'potential data loss, investigate urgently';
  if (content.includes('payment') || content.includes('checkout')) return 'payment system affected, revenue at risk';
  if (content.includes('login') || content.includes('access')) return 'user access issue, restore functionality';
  if (content.includes('performance') || content.includes('slow')) return 'performance degradation, optimize system';
  
  return 'standard support issue, monitor resolution';
};

/**
 * Extract specific issue from ticket with enhanced business awareness
 */
export const extractSpecificIssue = (ticket: any): string => {
  const content = `${ticket.subject || ''} ${ticket.description || ''}`.toLowerCase();
  
  // Critical system errors
  if (content.includes('analytics') && content.includes('500')) return 'Analytics 500 error blocking quarterly reports';
  if (content.includes('database') && content.includes('connection')) return 'Database connection failure affecting operations';
  if (content.includes('payment') && content.includes('error')) return 'Payment processing error impacting revenue';
  
  // WordPress specific issues
  if (content.includes('wordpress') && content.includes('crash')) return 'WordPress plugin crash affecting site functionality';
  if (content.includes('wordpress') && content.includes('update')) return 'WordPress update causing compatibility issues';
  
  // API and integration issues
  if (content.includes('api') && content.includes('timeout')) return 'API timeout affecting system integrations';
  if (content.includes('webhook') && content.includes('fail')) return 'Webhook failure disrupting automated workflows';
  
  // Performance and availability
  if (content.includes('server') && content.includes('down')) return 'Server outage affecting customer access';
  if (content.includes('slow') && content.includes('response')) return 'Slow response times degrading user experience';
  
  // Security concerns
  if (content.includes('security') && content.includes('breach')) return 'Security breach requiring immediate attention';
  if (content.includes('unauthorized') && content.includes('access')) return 'Unauthorized access attempt detected';
  
  // Fallback to generic issue extraction
  if (content.includes('error')) return 'System error requiring investigation';
  if (content.includes('bug')) return 'Application bug affecting functionality';
  if (content.includes('issue')) return 'Technical issue requiring resolution';
  
  return 'System issue requiring technical review';
};

/**
 * Format urgent timeline with business context and escalation indicators
 */
export const formatUrgentTimeline = (urgency: string, timeEstimate: string): string => {
  const estimate = timeEstimate || 'TBD';
  
  switch(urgency.toLowerCase()) {
    case 'critical':
      return `🚨 CRITICAL - ${estimate} (escalate if not resolved within 1 hour)`;
    case 'urgent':
    case 'high':
      return `⚡ URGENT - ${estimate} (business deadline at risk)`;
    case 'medium':
      return `🔥 HIGH PRIORITY - ${estimate} (monitor progress closely)`;
    case 'low':
      return `📅 STANDARD - ${estimate} (complete within business hours)`;
    default:
      return `📅 ${estimate} (standard timeline)`;
  }
};

/**
 * Get stakeholder context for enhanced communication
 */
export const getStakeholderContext = (businessImpact: string): string => {
  const impact = businessImpact.toLowerCase();
  
  if (impact.includes('deadline')) return 'deadline impact - coordinate with business stakeholders';
  if (impact.includes('customer')) return 'customer impact - notify support team and track resolution';
  if (impact.includes('revenue')) return 'revenue impact - escalate to leadership if needed';
  if (impact.includes('critical')) return 'critical business impact - all hands on deck';
  if (impact.includes('outage')) return 'service outage - coordinate incident response';
  if (impact.includes('security')) return 'security concern - follow incident response protocol';
  
  return 'monitor progress and provide updates';
};

/**
 * Extract time estimate from agent feedback with intelligent parsing
 */
export const extractTimeEstimate = (agentFeedback: any): string => {
  if (!agentFeedback) return '2-4 hours';
  
  let feedback = '';
  if (typeof agentFeedback === 'string') {
    feedback = agentFeedback.toLowerCase();
  } else if (Array.isArray(agentFeedback)) {
    feedback = agentFeedback.join(' ').toLowerCase();
  } else if (agentFeedback.estimatedTime) {
    return agentFeedback.estimatedTime;
  } else if (agentFeedback.analysis) {
    feedback = agentFeedback.analysis.toLowerCase();
  }
  
  // Extract time patterns from feedback
  const timePatterns = [
    /(?:est[.:]*\s*)?([0-9]+(?:-[0-9]+)?\s*(?:hour|hr)s?)/i,
    /(?:est[.:]*\s*)?([0-9]+(?:-[0-9]+)?\s*(?:minute|min)s?)/i,
    /(?:est[.:]*\s*)?([0-9]+(?:-[0-9]+)?\s*(?:day)s?)/i,
    /(?:target[.:]*\s*)?([0-9]+(?:-[0-9]+)?\s*(?:hour|hr)s?)/i
  ];
  
  for (const pattern of timePatterns) {
    const match = feedback.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  // Complexity-based estimates
  if (feedback.includes('complex') || feedback.includes('difficult')) return '4-8 hours';
  if (feedback.includes('simple') || feedback.includes('quick')) return '1-2 hours';
  if (feedback.includes('critical') || feedback.includes('urgent')) return '1-3 hours';
  if (feedback.includes('investigation') || feedback.includes('debug')) return '2-6 hours';
  
  return '2-4 hours';
};

/**
 * Generate smart footer with AI confidence and processing metrics
 */
export const generateSmartFooter = (
  confidence: number,
  processingTime: number,
  agentsInvolved: string[],
  ticketId: string
): string => {
  const confidenceEmoji = confidence >= 0.9 ? '🎯' : confidence >= 0.7 ? '✅' : '⚠️';
  const timeFormatted = processingTime < 1000 ? `${processingTime}ms` : `${(processingTime / 1000).toFixed(1)}s`;
  
  let footer = `\n\n${confidenceEmoji} **AI Analysis** (${(confidence * 100).toFixed(0)}% confidence)`;
  footer += `\n⚡ Processed in ${timeFormatted} by ${agentsInvolved.length} agent${agentsInvolved.length > 1 ? 's' : ''}`;
  footer += `\n🎫 #${ticketId} | 🤖 Enhanced Workflow v2.0`;
  
  return footer;
};

/**
 * Generate professional footer with business context
 */
export const generateProfessionalFooter = (
  category: string,
  urgency: string,
  teamMembers: string[],
  projectManagers: string[],
  ticketId: string
): string => {
  const urgencyIcon = urgency === 'critical' ? '🚨' : urgency === 'high' ? '⚡' : '📋';
  
  let footer = `\n\n${urgencyIcon} **${urgency.toUpperCase()} ${category.toUpperCase()} TICKET**`;
  footer += `\n👥 Assigned: ${teamMembers.length} engineer${teamMembers.length > 1 ? 's' : ''}`;
  
  if (projectManagers.length > 0) {
    footer += ` | 📊 PM: ${projectManagers.length}`;
  }
  
  footer += `\n🎫 Ticket #${ticketId} | 🔄 Auto-assigned via Enhanced Workflow`;
  
  return footer;
};

/**
 * Generate minimal footer with essential information only
 */
export const generateMinimalFooter = (ticketId: string): string => {
  return `\n\n🎫 #${ticketId} | 🤖 Auto-assigned`;
};

/**
 * Generate feature-rich footer with comprehensive details
 */
export const generateFeatureFooter = (
  confidence: number,
  processingTime: number,
  agentsInvolved: string[],
  category: string,
  urgency: string,
  teamMembers: string[],
  projectManagers: string[],
  ticketId: string,
  agentFeedback?: string
): string => {
  const confidenceEmoji = confidence >= 0.9 ? '🎯' : confidence >= 0.7 ? '✅' : '⚠️';
  const urgencyIcon = urgency === 'critical' ? '🚨' : urgency === 'high' ? '⚡' : '📋';
  const timeFormatted = processingTime < 1000 ? `${processingTime}ms` : `${(processingTime / 1000).toFixed(1)}s`;
  
  let footer = `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  footer += `\n${urgencyIcon} **${urgency.toUpperCase()} ${category.toUpperCase()}** | ${confidenceEmoji} ${(confidence * 100).toFixed(0)}% confidence`;
  footer += `\n👥 **Team**: ${teamMembers.length} engineer${teamMembers.length > 1 ? 's' : ''}`;
  
  if (projectManagers.length > 0) {
    footer += ` + ${projectManagers.length} PM${projectManagers.length > 1 ? 's' : ''}`;
  }
  
  footer += `\n⚡ **Processing**: ${timeFormatted} (${agentsInvolved.join(', ')})`;
  
  if (agentFeedback) {
    footer += `\n💡 **Insight**: ${agentFeedback}`;
  }
  
  footer += `\n🎫 **Ticket**: #${ticketId} | 🤖 **System**: Enhanced Workflow v2.0`;
  footer += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  
  return footer;
};

/**
 * Get specialized team mentions based on agent analysis
 */
export const getSpecializedMentions = (
  agentRole: string,
  category: string,
  urgency: string,
  ticketContent: string
): { engineers: string[]; projectManagers: string[]; message: string } | null => {
  const content = ticketContent.toLowerCase();
  
  // WordPress-specific logic
  if (agentRole === 'WORDPRESS_DEVELOPER' || content.includes('wordpress') || content.includes('wp-')) {
    const wpMentions = TEAM_ASSIGNMENTS.mentions.wordpress[urgency];
    if (wpMentions) {
      return {
        ...wpMentions,
        message: `WordPress specialist assigned - ${wpMentions.message}`
      };
    }
  }
  
  // DevOps-specific logic
  if (agentRole === 'DEVOPS' || content.includes('deployment') || content.includes('server') || content.includes('infrastructure')) {
    const deployMentions = TEAM_ASSIGNMENTS.mentions.deployment[urgency];
    if (deployMentions) {
      return {
        ...deployMentions,
        message: `DevOps specialist assigned - ${deployMentions.message}`
      };
    }
  }
  
  // Software Engineer for technical issues
  if (agentRole === 'SOFTWARE_ENGINEER' || content.includes('500 error') || content.includes('api') || content.includes('bug')) {
    const bugMentions = TEAM_ASSIGNMENTS.mentions.bug[urgency];
    if (bugMentions) {
      return {
        ...bugMentions,
        message: `Software Engineer assigned - ${bugMentions.message}`
      };
    }
  }
  
  return null;
};

// Export default configuration
export default TEAM_ASSIGNMENTS;
