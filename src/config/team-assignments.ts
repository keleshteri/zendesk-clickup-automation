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

// Team Members Configuration
export const TEAM_MEMBERS: TeamMember[] = [
  // Owner/Founder
  {
    name: "Steve",
    slackId: "UGK1YA9EE",
    role: "owner",
    specialties: ["leadership", "strategy", "business_decisions"],
  },

  // Project Managers
  {
    name: "Talha",
    slackId: "UGJ9606V6",
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
    slackId: "U07G3Q6DE1K",
    role: "pm",
    specialties: ["project_management", "technical_coordination", "planning"],
  },

  // Engineers/Developers
  {
    name: "Mike Keleshetri",
    slackId: "U0570RF4CHG",
    role: "engineer",
    specialties: [
      "software_development",
      "devops",
      "javascript",
      "react",
      "node.js",
      "api",
      "frontend",
      "backend",
    ],
  },
  {
    name: "Samuel Sena",
    slackId: "U03115JMADR",
    role: "engineer",
    specialties: [
      "wordpress",
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
    slackId: "U08TGG2RQPM",
    role: "wordpress",
    specialties: ["wordpress", "php", "woocommerce", "themes", "plugins"],
  },
  {
    name: "Pat Mayo",
    slackId: "U08MCUF919T",
    role: "wordpress",
    specialties: ["wordpress", "php", "woocommerce", "themes", "plugins"],
  },

  // HR/Executive Assistant
  {
    name: "Camille",
    slackId: "U0508K1V51P",
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
        engineers: ["@mike", "@samuel"],
        projectManagers: ["@talha", "@francis"],
        message: "CRITICAL BUG - immediate attention required",
      },
      high: {
        engineers: ["@mike", "@samuel"],
        projectManagers: ["@talha"],
        message: "High priority bug - please review ASAP",
      },
      medium: {
        engineers: ["@mike"],
        projectManagers: ["@talha"],
        message: "Bug reported - please investigate",
      },
      low: {
        engineers: ["@samuel"],
        projectManagers: [],
        message: "Low priority bug logged",
      },
    },

    // Feature requests
    feature: {
      critical: {
        engineers: ["@mike", "@sam"],
        projectManagers: ["@talha", "@francis"],
        message: "Critical feature request - needs immediate planning",
      },
      high: {
        engineers: ["@mike"],
        projectManagers: ["@talha"],
        message: "High priority feature - please review requirements",
      },
      medium: {
        engineers: ["@mike"],
        projectManagers: ["@talha"],
        message: "Feature request for consideration",
      },
      low: {
        engineers: [],
        projectManagers: ["@francis"],
        message: "Feature request logged for future planning",
      },
    },

    // WordPress-related tickets
    wordpress: {
      critical: {
        engineers: ["@dimple", "@pat", "@samuel"],
        projectManagers: ["@talha", "@francis"],
        message: "CRITICAL WordPress issue - immediate attention needed",
      },
      high: {
        engineers: ["@dimple", "@pat"],
        projectManagers: ["@talha"],
        message: "WordPress issue - please look at this ticket",
      },
      medium: {
        engineers: ["@dimple"],
        projectManagers: ["@talha"],
        message: "WordPress ticket needs review",
      },
      low: {
        engineers: ["@pat"],
        projectManagers: [],
        message: "WordPress maintenance item",
      },
    },

    // Deployment/Infrastructure
    deployment: {
      critical: {
        engineers: ["@mike", "@samuel"],
        projectManagers: ["@talha", "@francis"],
        message: "CRITICAL deployment issue - all hands on deck",
      },
      high: {
        engineers: ["@mike", "@samuel"],
        projectManagers: ["@talha"],
        message: "Deployment issue needs immediate attention",
      },
      medium: {
        engineers: ["@samuel"],
        projectManagers: ["@talha"],
        message: "Infrastructure ticket for review",
      },
      low: {
        engineers: ["@samuel"],
        projectManagers: [],
        message: "Infrastructure maintenance",
      },
    },

    // General/Other tickets
    general: {
      critical: {
        engineers: ["@mike", "@sam"],
        projectManagers: ["@talha", "@francis"],
        message: "Critical ticket - needs immediate triage",
      },
      high: {
        engineers: ["@mike"],
        projectManagers: ["@talha"],
        message: "High priority ticket - please review",
      },
      medium: {
        engineers: ["@mike"],
        projectManagers: ["@talha"],
        message: "Ticket needs review and assignment",
      },
      low: {
        engineers: [],
        projectManagers: ["@francis"],
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
  urgency: string
): { engineers: string[]; projectManagers: string[]; message: string } => {
  const normalizedCategory = category.toLowerCase();
  const normalizedUrgency = urgency.toLowerCase();

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
    engineers: ["@mike"],
    projectManagers: ["@talha"],
    message: "Ticket needs review and assignment",
  };
};

export const formatMentionMessage = (
  category: string,
  urgency: string,
  ticketId?: string
): string => {
  const mentions = getMentionsForTicket(category, urgency);
  const engineerMentions = mentions.engineers.join(" ");
  const pmMentions = mentions.projectManagers.join(" ");

  let message = "";

  if (engineerMentions) {
    message += `${engineerMentions} ${mentions.message}`;
  }

  if (pmMentions) {
    if (message) message += "\n";
    message += `cc: ${pmMentions} please take note`;
  }

  if (ticketId) {
    message += ` (Ticket #${ticketId})`;
  }

  return message;
};

// Export default configuration
export default TEAM_ASSIGNMENTS;
