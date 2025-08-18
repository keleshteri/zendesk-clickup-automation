/**
 * Team Assignment Configuration
 * Maps ticket categories and urgency levels to appropriate team members
 */

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

// Slack User ID Constants
const SLACK_IDS = {
  STEVE: "UGK1YA9EE",
  TALHA: "UGJ9606V6", 
  FRANCIS: "U07G3Q6DE1K",
  MIKE: "U0570RF4CHG",
  SAMUEL: "U03115JMADR",
  DIMPLE: "U08TGG2RQPM",
  PAT: "U08MCUF919T",
  CAMILLE: "U0508K1V51P"
} as const;

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
        engineers: [`<@${SLACK_IDS.MIKE}>`, `<@${SLACK_IDS.SAMUEL}>`],
        projectManagers: [`<@${SLACK_IDS.TALHA}>`, `<@${SLACK_IDS.FRANCIS}>`],
        message: "CRITICAL BUG - immediate attention required",
      },
      high: {
        engineers: [`<@${SLACK_IDS.MIKE}>`, `<@${SLACK_IDS.SAMUEL}>`],
        projectManagers: [`<@${SLACK_IDS.TALHA}>`],
        message: "High priority bug - please review ASAP",
      },
      medium: {
        engineers: [`<@${SLACK_IDS.MIKE}>`],
        projectManagers: [`<@${SLACK_IDS.TALHA}>`],
        message: "Bug reported - please investigate",
      },
      low: {
        engineers: [`<@${SLACK_IDS.SAMUEL}>`],
        projectManagers: [],
        message: "Low priority bug logged",
      },
    },

    // Feature requests
    feature: {
      critical: {
        engineers: [`<@${SLACK_IDS.MIKE}>`, `<@${SLACK_IDS.SAMUEL}>`],
        projectManagers: [`<@${SLACK_IDS.TALHA}>`, `<@${SLACK_IDS.FRANCIS}>`],
        message: "Critical feature request - needs immediate planning",
      },
      high: {
        engineers: [`<@${SLACK_IDS.MIKE}>`],
        projectManagers: [`<@${SLACK_IDS.TALHA}>`],
        message: "High priority feature - please review requirements",
      },
      medium: {
        engineers: [`<@${SLACK_IDS.MIKE}>`],
        projectManagers: [`<@${SLACK_IDS.TALHA}>`],
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
        projectManagers: [`<@${SLACK_IDS.TALHA}>`],
        message: "WordPress issue - please look at this ticket",
      },
      medium: {
        engineers: [`<@${SLACK_IDS.DIMPLE}>`],
        projectManagers: [`<@${SLACK_IDS.TALHA}>`],
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
        engineers: [`<@${SLACK_IDS.MIKE}>`, `<@${SLACK_IDS.SAMUEL}>`],
        projectManagers: [`<@${SLACK_IDS.TALHA}>`, `<@${SLACK_IDS.FRANCIS}>`],
        message: "CRITICAL deployment issue - all hands on deck",
      },
      high: {
        engineers: [`<@${SLACK_IDS.MIKE}>`, `<@${SLACK_IDS.SAMUEL}>`],
        projectManagers: [`<@${SLACK_IDS.TALHA}>`],
        message: "Deployment issue needs immediate attention",
      },
      medium: {
        engineers: [`<@${SLACK_IDS.SAMUEL}>`],
        projectManagers: [`<@${SLACK_IDS.TALHA}>`],
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
        engineers: [`<@${SLACK_IDS.MIKE}>`, `<@${SLACK_IDS.SAMUEL}>`],
        projectManagers: [`<@${SLACK_IDS.TALHA}>`, `<@${SLACK_IDS.FRANCIS}>`],
        message: "Critical ticket - needs immediate triage",
      },
      high: {
        engineers: [`<@${SLACK_IDS.MIKE}>`],
        projectManagers: [`<@${SLACK_IDS.TALHA}>`],
        message: "High priority ticket - please review",
      },
      medium: {
        engineers: [`<@${SLACK_IDS.MIKE}>`],
        projectManagers: [`<@${SLACK_IDS.TALHA}>`],
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
  ticketContent?: string
): { engineers: string[]; projectManagers: string[]; message: string } => {
  const normalizedCategory = category.toLowerCase();
  const normalizedUrgency = urgency.toLowerCase();

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
    engineers: [`<@${SLACK_IDS.MIKE}>`],
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
  ticketContent?: string
): string => {
  const mentions = getMentionsForTicket(category, urgency, agentRole, ticketContent);
  const engineerMentions = mentions.engineers.join(" ");
  const pmMentions = mentions.projectManagers.join(" ");

  let message = "";

  // Add agent context if available
  if (agentRole) {
    message += `🤖 **${agentRole.replace('_', ' ')} Analysis Complete**\n`;
  }

  if (engineerMentions) {
    message += `${engineerMentions} ${mentions.message}`;
  }

  if (pmMentions) {
    if (message) message += "\n";
    message += `cc: ${pmMentions} please take note`;
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
  estimatedTime?: string
): string => {
  const ticketContent = `${ticketSubject} ${ticketDescription}`;
  const mentions = getMentionsForTicket(category, urgency, agentRole, ticketContent);
  
  // Extract specific issue from ticket
  const issue = extractIssueDescription(ticketContent, category);
  
  // Format engineer mentions (remove < > brackets for cleaner display)
  const engineers = mentions.engineers.map(mention => mention.replace(/[<>]/g, '')).join(' ');
  
  // Format PM mentions for CC
  const pms = mentions.projectManagers.map(mention => mention.replace(/[<>]/g, '')).join(' ');
  
  // Create timeline with context
  const timeline = formatTimelineWithUrgency(urgency, estimatedTime);
  
  // Generate specific goal
  const goal = generateSpecificGoal(issue, ticketContent);
  
  // Get business impact context
  const businessImpact = getBusinessImpactContext(ticketContent);
  
  let message = `👥 **Team Assignment**\n`;
  message += `${engineers} investigate ${issue} urgently\n`;
  message += `🎯 **Goal**: ${goal}\n`;
  message += `⏰ **Timeline**: ${timeline}`;
  
  if (pms && businessImpact) {
    message += `\ncc: ${pms} - ${businessImpact}`;
  } else if (pms) {
    message += `\ncc: ${pms} - please monitor progress`;
  }
  
  return message;
};

/**
 * Extract specific issue description from ticket content
 */
export const extractIssueDescription = (ticketContent: string, category: string): string => {
  const content = ticketContent.toLowerCase();
  
  // Analytics issues
  if (content.includes('analytics') && content.includes('500')) return 'Analytics 500 error';
  if (content.includes('analytics') && content.includes('error')) return 'Analytics error';
  
  // WordPress issues
  if (content.includes('wordpress') && content.includes('crash')) return 'WordPress plugin crash';
  if (content.includes('wordpress') && content.includes('plugin')) return 'WordPress plugin issue';
  if (content.includes('wordpress') && content.includes('theme')) return 'WordPress theme issue';
  
  // Deployment issues
  if (content.includes('deployment') && content.includes('fail')) return 'deployment failure';
  if (content.includes('deploy') && content.includes('error')) return 'deployment error';
  
  // Database issues
  if (content.includes('database') && content.includes('slow')) return 'database performance issue';
  if (content.includes('database') && content.includes('error')) return 'database error';
  
  // API issues
  if (content.includes('api') && content.includes('500')) return 'API 500 error';
  if (content.includes('api') && content.includes('error')) return 'API error';
  
  // Server issues
  if (content.includes('server') && content.includes('down')) return 'server outage';
  if (content.includes('server') && content.includes('error')) return 'server error';
  
  // Performance issues
  if (content.includes('slow') || content.includes('performance')) return 'performance issue';
  
  // Security issues
  if (content.includes('security') || content.includes('breach')) return 'security issue';
  
  // Fallback to category + issue
  return `${category} issue`;
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
 * Get business impact context for PM CC messages
 */
export const getBusinessImpactContext = (ticketContent: string): string => {
  const content = ticketContent.toLowerCase();
  
  if (content.includes('deadline')) return 'deadline at risk, please monitor progress';
  if (content.includes('customer')) return 'customer impact, please track resolution';
  if (content.includes('revenue') || content.includes('sales')) return 'revenue impact, escalate if needed';
  if (content.includes('critical') || content.includes('urgent')) return 'critical issue, please monitor closely';
  if (content.includes('outage') || content.includes('down')) return 'service outage, please coordinate response';
  
  return 'please take note and monitor progress';
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
