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
