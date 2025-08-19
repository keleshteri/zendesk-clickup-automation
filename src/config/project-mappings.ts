/**
 * Project Mappings Configuration
 * Maps client projects to specific team members and provides project detection logic
 */

import { SLACK_IDS } from './slack-ids';
import type { TeamMember } from './team-assignments';

export interface ProjectMapping {
  id: string;
  name: string;
  client: string;
  domain: string;
  description: string;
  keywords: string[];
  teamAssignment: {
    engineers: string[]; // Slack IDs
    projectManager: string; // Slack ID
    specialties: string[];
  };
  businessContext: {
    priority: 'high' | 'medium' | 'low';
    slaHours: number;
    escalationPath: string[];
  };
}

export interface ProjectDetectionResult {
  projectId: string | null;
  confidence: number;
  detectionMethods: {
    organization: { score: number; match: string | null };
    emailDomain: { score: number; match: string | null };
    clientTags: { score: number; match: string | null };
    domainInContent: { score: number; match: string | null };
    keywords: { score: number; matches: string[] };
  };
  reasoning: string;
}

export interface TicketData {
  organization?: string;
  requesterEmail?: string;
  tags?: string[];
  subject?: string;
  description?: string;
  customFields?: Record<string, any>;
}

// Project Mappings Configuration
export const PROJECT_MAPPINGS: ProjectMapping[] = [
  {
    id: 'pfiaa-analytics',
    name: 'PFIAA Analytics Dashboard',
    client: 'PFIAA',
    domain: 'pfiaa.com.au',
    description: 'Analytics Dashboard and General Support for PFIAA',
    keywords: ['analytics', 'dashboard', 'reports', 'data', 'metrics', 'charts'],
    teamAssignment: {
      engineers: [SLACK_IDS.PAT, SLACK_IDS.SAMUEL], // Pat + Sam (specialists)
      projectManager: SLACK_IDS.FRANCIS,
      specialties: ['analytics', 'dashboard', 'data_visualization', 'api']
    },
    businessContext: {
      priority: 'high',
      slaHours: 4,
      escalationPath: [SLACK_IDS.FRANCIS, SLACK_IDS.TALHA, SLACK_IDS.STEVE]
    }
  },
  {
    id: 'pfiaa-general',
    name: 'PFIAA General Support',
    client: 'PFIAA',
    domain: 'pfiaa.com.au',
    description: 'General Support for PFIAA',
    keywords: ['support', 'general', 'help', 'issue'],
    teamAssignment: {
      engineers: [SLACK_IDS.SAMUEL, SLACK_IDS.PAT],
      projectManager: SLACK_IDS.FRANCIS,
      specialties: ['general_support', 'troubleshooting']
    },
    businessContext: {
      priority: 'medium',
      slaHours: 8,
      escalationPath: [SLACK_IDS.FRANCIS, SLACK_IDS.TALHA]
    }
  },
  {
    id: 'opea-membership',
    name: 'OPEA Membership Platform',
    client: 'OPEA',
    domain: 'opea.net.au',
    description: 'Membership Platform for OPEA',
    keywords: ['membership', 'members', 'registration', 'login', 'profile', 'subscription'],
    teamAssignment: {
      engineers: [SLACK_IDS.DIMPLE, SLACK_IDS.PAT], // WordPress specialists
      projectManager: SLACK_IDS.TALHA,
      specialties: ['wordpress', 'membership', 'user_management', 'woocommerce']
    },
    businessContext: {
      priority: 'high',
      slaHours: 6,
      escalationPath: [SLACK_IDS.TALHA, SLACK_IDS.STEVE]
    }
  },
  {
    id: 'csdaa-resources',
    name: 'CSDAA Resource Management',
    client: 'CSDAA',
    domain: 'csdaa.org',
    description: 'Resource Management System for CSDAA',
    keywords: ['resource', 'resources', 'management', 'content', 'library', 'documents'],
    teamAssignment: {
      engineers: [SLACK_IDS.SAMUEL, SLACK_IDS.PAT],
      projectManager: SLACK_IDS.TALHA,
      specialties: ['resource_management', 'content_management', 'api']
    },
    businessContext: {
      priority: 'high',
      slaHours: 6,
      escalationPath: [SLACK_IDS.TALHA, SLACK_IDS.STEVE]
    }
  },
  {
    id: 'csdaa-membership',
    name: 'CSDAA Membership System',
    client: 'CSDAA',
    domain: 'csdaa.org',
    description: 'Membership System for CSDAA',
    keywords: ['membership', 'members', 'registration', 'login', 'profile'],
    teamAssignment: {
      engineers: [SLACK_IDS.SAMUEL, SLACK_IDS.DIMPLE],
      projectManager: SLACK_IDS.TALHA,
      specialties: ['membership', 'user_management', 'wordpress']
    },
    businessContext: {
      priority: 'high',
      slaHours: 6,
      escalationPath: [SLACK_IDS.TALHA, SLACK_IDS.STEVE]
    }
  },
  {
    id: 'apal-general',
    name: 'APAL General Support',
    client: 'APAL',
    domain: 'apal.org.au',
    description: 'General Support for APAL',
    keywords: ['support', 'general', 'help', 'issue'],
    teamAssignment: {
      engineers: [SLACK_IDS.SAMUEL, SLACK_IDS.PAT],
      projectManager: SLACK_IDS.FRANCIS,
      specialties: ['general_support', 'troubleshooting']
    },
    businessContext: {
      priority: 'medium',
      slaHours: 12,
      escalationPath: [SLACK_IDS.FRANCIS, SLACK_IDS.TALHA]
    }
  },
  {
    id: 'auroma-general',
    name: 'Auroma General Support',
    client: 'Auroma',
    domain: 'auroma.com.au',
    description: 'General Support for Auroma',
    keywords: ['support', 'general', 'help', 'issue'],
    teamAssignment: {
      engineers: [SLACK_IDS.SAMUEL, SLACK_IDS.PAT],
      projectManager: SLACK_IDS.FRANCIS,
      specialties: ['general_support', 'troubleshooting']
    },
    businessContext: {
      priority: 'medium',
      slaHours: 12,
      escalationPath: [SLACK_IDS.FRANCIS, SLACK_IDS.TALHA]
    }
  },
  {
    id: 'caaa-general',
    name: 'CAAA General Support',
    client: 'CAAA',
    domain: 'caaa.com.au',
    description: 'General Support for CAAA',
    keywords: ['support', 'general', 'help', 'issue'],
    teamAssignment: {
      engineers: [SLACK_IDS.SAMUEL, SLACK_IDS.PAT],
      projectManager: SLACK_IDS.FRANCIS,
      specialties: ['general_support', 'troubleshooting']
    },
    businessContext: {
      priority: 'medium',
      slaHours: 12,
      escalationPath: [SLACK_IDS.FRANCIS, SLACK_IDS.TALHA]
    }
  },
  {
    id: 'fbia-general',
    name: 'FBIA General Support',
    client: 'FBIA',
    domain: 'fbia.org.au',
    description: 'General Support for FBIA',
    keywords: ['support', 'general', 'help', 'issue'],
    teamAssignment: {
      engineers: [SLACK_IDS.SAMUEL, SLACK_IDS.PAT],
      projectManager: SLACK_IDS.FRANCIS,
      specialties: ['general_support', 'troubleshooting']
    },
    businessContext: {
      priority: 'medium',
      slaHours: 12,
      escalationPath: [SLACK_IDS.FRANCIS, SLACK_IDS.TALHA]
    }
  },
  {
    id: 'murrayphn-general',
    name: 'Murrayphn General Support',
    client: 'Murrayphn',
    domain: 'murrayphn.org.au',
    description: 'General Support for Murrayphn',
    keywords: ['support', 'general', 'help', 'issue'],
    teamAssignment: {
      engineers: [SLACK_IDS.SAMUEL, SLACK_IDS.PAT],
      projectManager: SLACK_IDS.FRANCIS,
      specialties: ['general_support', 'troubleshooting']
    },
    businessContext: {
      priority: 'medium',
      slaHours: 12,
      escalationPath: [SLACK_IDS.FRANCIS, SLACK_IDS.TALHA]
    }
  },
  {
    id: 'ot-network-general',
    name: 'Occupational Therapy Network General Support',
    client: 'Occupational Therapy Network',
    domain: 'ot-network.com.au',
    description: 'General Support for Occupational Therapy Network',
    keywords: ['support', 'general', 'help', 'issue', 'therapy', 'occupational'],
    teamAssignment: {
      engineers: [SLACK_IDS.SAMUEL, SLACK_IDS.PAT],
      projectManager: SLACK_IDS.FRANCIS,
      specialties: ['general_support', 'troubleshooting']
    },
    businessContext: {
      priority: 'medium',
      slaHours: 12,
      escalationPath: [SLACK_IDS.FRANCIS, SLACK_IDS.TALHA]
    }
  },
  {
    id: 'nexio-general',
    name: 'Nexio General Support',
    client: 'Nexio',
    domain: 'nexio.com.au',
    description: 'General Support for Nexio',
    keywords: ['support', 'general', 'help', 'issue'],
    teamAssignment: {
      engineers: [SLACK_IDS.SAMUEL, SLACK_IDS.PAT],
      projectManager: SLACK_IDS.FRANCIS,
      specialties: ['general_support', 'troubleshooting']
    },
    businessContext: {
      priority: 'medium',
      slaHours: 12,
      escalationPath: [SLACK_IDS.FRANCIS, SLACK_IDS.TALHA]
    }
  },
  {
    id: 'inhsu-general',
    name: 'INHSU General Support',
    client: 'INHSU',
    domain: 'inhsu.org',
    description: 'General Support for INHSU',
    keywords: ['support', 'general', 'help', 'issue'],
    teamAssignment: {
      engineers: [SLACK_IDS.SAMUEL, SLACK_IDS.PAT],
      projectManager: SLACK_IDS.FRANCIS,
      specialties: ['general_support', 'troubleshooting']
    },
    businessContext: {
      priority: 'medium',
      slaHours: 12,
      escalationPath: [SLACK_IDS.FRANCIS, SLACK_IDS.TALHA]
    }
  },
  {
    id: 'bys-general',
    name: 'BYS General Support',
    client: 'BYS',
    domain: 'www.bys.com.au',
    description: 'General Support for BYS',
    keywords: ['support', 'general', 'help', 'issue'],
    teamAssignment: {
      engineers: [SLACK_IDS.SAMUEL, SLACK_IDS.PAT],
      projectManager: SLACK_IDS.FRANCIS,
      specialties: ['general_support', 'troubleshooting']
    },
    businessContext: {
      priority: 'medium',
      slaHours: 12,
      escalationPath: [SLACK_IDS.FRANCIS, SLACK_IDS.TALHA]
    }
  },
  {
    id: 'qld-artsbook-general',
    name: 'QLD Artsbook General Support',
    client: 'QLD Artsbook',
    domain: 'www.qldartsbook.com.au',
    description: 'General Support for QLD Artsbook',
    keywords: ['support', 'general', 'help', 'issue', 'arts', 'book'],
    teamAssignment: {
      engineers: [SLACK_IDS.SAMUEL, SLACK_IDS.PAT],
      projectManager: SLACK_IDS.FRANCIS,
      specialties: ['general_support', 'troubleshooting']
    },
    businessContext: {
      priority: 'medium',
      slaHours: 12,
      escalationPath: [SLACK_IDS.FRANCIS, SLACK_IDS.TALHA]
    }
  },
  {
    id: 'super-random-general',
    name: 'Super Random General Support',
    client: 'Super Random',
    domain: 'superrandom.com.au',
    description: 'General Support for Super Random',
    keywords: ['support', 'general', 'help', 'issue'],
    teamAssignment: {
      engineers: [SLACK_IDS.SAMUEL, SLACK_IDS.PAT],
      projectManager: SLACK_IDS.FRANCIS,
      specialties: ['general_support', 'troubleshooting']
    },
    businessContext: {
      priority: 'medium',
      slaHours: 12,
      escalationPath: [SLACK_IDS.FRANCIS, SLACK_IDS.TALHA]
    }
  },
  {
    id: 'eco-pup-general',
    name: 'Eco Pup General Support',
    client: 'Eco Pup',
    domain: 'eco-pup.com.au',
    description: 'General Support for Eco Pup',
    keywords: ['support', 'general', 'help', 'issue', 'eco', 'pup'],
    teamAssignment: {
      engineers: [SLACK_IDS.SAMUEL, SLACK_IDS.PAT],
      projectManager: SLACK_IDS.FRANCIS,
      specialties: ['general_support', 'troubleshooting']
    },
    businessContext: {
      priority: 'medium',
      slaHours: 12,
      escalationPath: [SLACK_IDS.FRANCIS, SLACK_IDS.TALHA]
    }
  },
  {
    id: 'gfa-general',
    name: 'GFA General Support',
    client: 'GFA',
    domain: 'www.gfa.net.au',
    description: 'General Support for GFA',
    keywords: ['support', 'general', 'help', 'issue'],
    teamAssignment: {
      engineers: [SLACK_IDS.SAMUEL, SLACK_IDS.PAT],
      projectManager: SLACK_IDS.FRANCIS,
      specialties: ['general_support', 'troubleshooting']
    },
    businessContext: {
      priority: 'medium',
      slaHours: 12,
      escalationPath: [SLACK_IDS.FRANCIS, SLACK_IDS.TALHA]
    }
  },
  {
    id: 'tyrolit-general',
    name: 'Tyrolit General Support',
    client: 'Tyrolit',
    domain: 'tyrolit.com',
    description: 'General Support for Tyrolit',
    keywords: ['support', 'general', 'help', 'issue'],
    teamAssignment: {
      engineers: [SLACK_IDS.SAMUEL, SLACK_IDS.PAT],
      projectManager: SLACK_IDS.FRANCIS,
      specialties: ['general_support', 'troubleshooting']
    },
    businessContext: {
      priority: 'medium',
      slaHours: 12,
      escalationPath: [SLACK_IDS.FRANCIS, SLACK_IDS.TALHA]
    }
  },
  {
    id: 'td-automotive-general',
    name: 'TD Automotive General Support',
    client: 'TD Automotive',
    domain: 'tdautomotive.net.au',
    description: 'General Support for TD Automotive',
    keywords: ['support', 'general', 'help', 'issue', 'automotive', 'car'],
    teamAssignment: {
      engineers: [SLACK_IDS.SAMUEL, SLACK_IDS.PAT],
      projectManager: SLACK_IDS.FRANCIS,
      specialties: ['general_support', 'troubleshooting']
    },
    businessContext: {
      priority: 'medium',
      slaHours: 12,
      escalationPath: [SLACK_IDS.FRANCIS, SLACK_IDS.TALHA]
    }
  },
  {
    id: 'ironbark-general',
    name: 'Ironbark General Support',
    client: 'Ironbark',
    domain: 'ironbark.org.au',
    description: 'General Support for Ironbark',
    keywords: ['support', 'general', 'help', 'issue'],
    teamAssignment: {
      engineers: [SLACK_IDS.SAMUEL, SLACK_IDS.PAT],
      projectManager: SLACK_IDS.FRANCIS,
      specialties: ['general_support', 'troubleshooting']
    },
    businessContext: {
      priority: 'medium',
      slaHours: 12,
      escalationPath: [SLACK_IDS.FRANCIS, SLACK_IDS.TALHA]
    }
  },
  {
    id: 'hoctor-general',
    name: 'Hoctor General Support',
    client: 'Hoctor',
    domain: 'hoctor.com.au',
    description: 'General Support for Hoctor',
    keywords: ['support', 'general', 'help', 'issue'],
    teamAssignment: {
      engineers: [SLACK_IDS.SAMUEL, SLACK_IDS.PAT],
      projectManager: SLACK_IDS.FRANCIS,
      specialties: ['general_support', 'troubleshooting']
    },
    businessContext: {
      priority: 'medium',
      slaHours: 12,
      escalationPath: [SLACK_IDS.FRANCIS, SLACK_IDS.TALHA]
    }
  },
  {
    id: 'from-paddock-to-plate-general',
    name: 'From Paddock to Plate General Support',
    client: 'From Paddock to Plate',
    domain: 'frompaddocktoplate.com.au',
    description: 'General Support for From Paddock to Plate',
    keywords: ['support', 'general', 'help', 'issue', 'paddock', 'plate', 'food'],
    teamAssignment: {
      engineers: [SLACK_IDS.SAMUEL, SLACK_IDS.PAT],
      projectManager: SLACK_IDS.FRANCIS,
      specialties: ['general_support', 'troubleshooting']
    },
    businessContext: {
      priority: 'medium',
      slaHours: 12,
      escalationPath: [SLACK_IDS.FRANCIS, SLACK_IDS.TALHA]
    }
  },
  {
    id: 'feedworks-general',
    name: 'Feedworks General Support',
    client: 'Feedworks',
    domain: 'feedworks.com.au',
    description: 'General Support for Feedworks',
    keywords: ['support', 'general', 'help', 'issue', 'feed', 'works'],
    teamAssignment: {
      engineers: [SLACK_IDS.SAMUEL, SLACK_IDS.PAT],
      projectManager: SLACK_IDS.FRANCIS,
      specialties: ['general_support', 'troubleshooting']
    },
    businessContext: {
      priority: 'medium',
      slaHours: 12,
      escalationPath: [SLACK_IDS.FRANCIS, SLACK_IDS.TALHA]
    }
  },
  {
    id: '2dam-creative-general',
    name: '2 Dam Creative General Support',
    client: '2 Dam Creative',
    domain: '2damcreative.com.au',
    description: 'General Support for 2 Dam Creative',
    keywords: ['support', 'general', 'help', 'issue', 'creative', 'design'],
    teamAssignment: {
      engineers: [SLACK_IDS.SAMUEL, SLACK_IDS.PAT],
      projectManager: SLACK_IDS.FRANCIS,
      specialties: ['general_support', 'troubleshooting']
    },
    businessContext: {
      priority: 'medium',
      slaHours: 12,
      escalationPath: [SLACK_IDS.FRANCIS, SLACK_IDS.TALHA]
    }
  },
  {
    id: 'super-city-concrete-general',
    name: 'Super City Concrete General Support',
    client: 'Super City Concrete',
    domain: 'supercityconcrete.com.au',
    description: 'General Support for Super City Concrete',
    keywords: ['support', 'general', 'help', 'issue', 'concrete', 'construction'],
    teamAssignment: {
      engineers: [SLACK_IDS.SAMUEL, SLACK_IDS.PAT],
      projectManager: SLACK_IDS.FRANCIS,
      specialties: ['general_support', 'troubleshooting']
    },
    businessContext: {
      priority: 'medium',
      slaHours: 12,
      escalationPath: [SLACK_IDS.FRANCIS, SLACK_IDS.TALHA]
    }
  },
  {
    id: 'seoc-general',
    name: 'SEOC General Support',
    client: 'SEOC',
    domain: 'seoc.org.au',
    description: 'General Support for SEOC',
    keywords: ['support', 'general', 'help', 'issue'],
    teamAssignment: {
      engineers: [SLACK_IDS.SAMUEL, SLACK_IDS.PAT],
      projectManager: SLACK_IDS.FRANCIS,
      specialties: ['general_support', 'troubleshooting']
    },
    businessContext: {
      priority: 'medium',
      slaHours: 12,
      escalationPath: [SLACK_IDS.FRANCIS, SLACK_IDS.TALHA]
    }
  }
];

// Detection weights (must sum to 100)
const DETECTION_WEIGHTS = {
  organization: 40,
  emailDomain: 35,
  clientTags: 30,
  domainInContent: 25,
  keywords: 20
} as const;

// Minimum confidence threshold for project match
const MIN_CONFIDENCE_THRESHOLD = 30;

/**
 * Detect project based on ticket data using multiple methods with weighted scoring
 */
export const detectProject = (ticketData: TicketData): ProjectDetectionResult => {
  // Track scores for each project individually
  const projectScores = new Map<string, {
    totalConfidence: number;
    specificityScore: number;
    detectionMethods: {
      organization: { score: number; match: string | null };
      emailDomain: { score: number; match: string | null };
      clientTags: { score: number; match: string | null };
      domainInContent: { score: number; match: string | null };
      keywords: { score: number; matches: string[] };
    };
  }>();

  // Initialize all projects with zero scores
  for (const project of PROJECT_MAPPINGS) {
    projectScores.set(project.id, {
      totalConfidence: 0,
      specificityScore: 0,
      detectionMethods: {
        organization: { score: 0, match: null },
        emailDomain: { score: 0, match: null },
        clientTags: { score: 0, match: null },
        domainInContent: { score: 0, match: null },
        keywords: { score: 0, matches: [] }
      }
    });
  }

  const reasoningParts: string[] = [];

  // Method 1: Organization Name Detection (40% weight)
  if (ticketData.organization) {
    const orgName = ticketData.organization.toLowerCase();
    
    // First, try to find exact matches (highest priority)
    let exactMatchFound = false;
    for (const project of PROJECT_MAPPINGS) {
      const clientName = project.client.toLowerCase();
      const exactMatch = orgName === clientName;
      
      if (exactMatch) {
        const projectData = projectScores.get(project.id)!;
        projectData.detectionMethods.organization.score = DETECTION_WEIGHTS.organization;
        projectData.detectionMethods.organization.match = project.client;
        projectData.totalConfidence += DETECTION_WEIGHTS.organization;
        projectData.specificityScore += 90;
        reasoningParts.push(`Organization match: ${project.client} (${project.id})`);
        exactMatchFound = true;
        break; // Only allow one exact match
      }
    }
    
    // If no exact match found, try contains matches
    if (!exactMatchFound) {
      for (const project of PROJECT_MAPPINGS) {
        const clientName = project.client.toLowerCase();
        const containsMatch = orgName.includes(clientName);
        
        if (containsMatch) {
          const projectData = projectScores.get(project.id)!;
          projectData.detectionMethods.organization.score = DETECTION_WEIGHTS.organization;
          projectData.detectionMethods.organization.match = project.client;
          projectData.totalConfidence += DETECTION_WEIGHTS.organization;
          projectData.specificityScore += 70; // Lower specificity for contains match
          reasoningParts.push(`Organization match: ${project.client} (${project.id})`);
          break; // Only allow one contains match
        }
      }
    }
  }

  // Method 2: Email Domain Detection (35% weight)
  if (ticketData.requesterEmail) {
    const email = ticketData.requesterEmail.toLowerCase();
    
    for (const project of PROJECT_MAPPINGS) {
      if (email.includes(project.domain.toLowerCase())) {
        const projectData = projectScores.get(project.id)!;
        projectData.detectionMethods.emailDomain.score = DETECTION_WEIGHTS.emailDomain;
        projectData.detectionMethods.emailDomain.match = project.domain;
        projectData.totalConfidence += DETECTION_WEIGHTS.emailDomain;
        projectData.specificityScore += 100;
        reasoningParts.push(`Email domain match: ${project.domain} (${project.id})`);
        break; // Only allow one email domain match
      }
    }
  }

  // Method 3: Client Tags Detection (30% weight)
  if (ticketData.tags && ticketData.tags.length > 0) {
    const tags = ticketData.tags.map(tag => tag.toLowerCase());
    
    for (const project of PROJECT_MAPPINGS) {
      const clientTag = `client: ${project.client.toLowerCase()}`;
      if (tags.some(tag => tag.includes(clientTag) || tag.includes(project.client.toLowerCase()))) {
        const projectData = projectScores.get(project.id)!;
        projectData.detectionMethods.clientTags.score = DETECTION_WEIGHTS.clientTags;
        projectData.detectionMethods.clientTags.match = project.client;
        projectData.totalConfidence += DETECTION_WEIGHTS.clientTags;
        projectData.specificityScore += 80;
        reasoningParts.push(`Client tag match: ${project.client} (${project.id})`);
      }
    }
  }

  // Method 4: Domain in Content Detection (25% weight)
  const content = `${ticketData.subject || ''} ${ticketData.description || ''}`.toLowerCase();
  if (content) {
    for (const project of PROJECT_MAPPINGS) {
      if (content.includes(project.domain.toLowerCase())) {
        const projectData = projectScores.get(project.id)!;
        projectData.detectionMethods.domainInContent.score = DETECTION_WEIGHTS.domainInContent;
        projectData.detectionMethods.domainInContent.match = project.domain;
        projectData.totalConfidence += DETECTION_WEIGHTS.domainInContent;
        projectData.specificityScore += 70;
        reasoningParts.push(`Domain in content: ${project.domain} (${project.id})`);
      }
    }
  }

  // Method 5: Keywords Detection (20% weight)
  if (content) {
    for (const project of PROJECT_MAPPINGS) {
      const keywordMatches: string[] = [];
      for (const keyword of project.keywords) {
        if (content.includes(keyword.toLowerCase())) {
          keywordMatches.push(keyword);
        }
      }
      
      if (keywordMatches.length > 0) {
        const keywordScore = Math.min(DETECTION_WEIGHTS.keywords, 
                                    (keywordMatches.length / project.keywords.length) * DETECTION_WEIGHTS.keywords);
        
        const projectData = projectScores.get(project.id)!;
        projectData.detectionMethods.keywords.score = keywordScore;
        projectData.detectionMethods.keywords.matches = keywordMatches;
        projectData.totalConfidence += keywordScore;
        projectData.specificityScore += 10;
        reasoningParts.push(`Keywords match: ${keywordMatches.join(', ')} (${project.id})`);
      }
    }
  }

  // Find the project with the highest total score
  // In case of ties, prioritize projects with more specific matches (email domain, organization)
  let bestProjectId: string | null = null;
  let totalConfidence = 0;
  let bestSpecificityScore = 0;
  let bestDetectionMethods = {
    organization: { score: 0, match: null as string | null },
    emailDomain: { score: 0, match: null as string | null },
    clientTags: { score: 0, match: null as string | null },
    domainInContent: { score: 0, match: null as string | null },
    keywords: { score: 0, matches: [] as string[] }
  };
  
  // Debug: Log all project scores before selection
  const debugScores: any[] = [];
  for (const [projectId, projectData] of projectScores.entries()) {
    debugScores.push({
      projectId,
      confidence: projectData.totalConfidence,
      specificity: projectData.specificityScore,
      orgMatch: projectData.detectionMethods.organization.match,
      emailMatch: projectData.detectionMethods.emailDomain.match
    });
    
    // Select project if it has higher score, or same score but higher specificity
    if (projectData.totalConfidence > totalConfidence || 
        (projectData.totalConfidence === totalConfidence && projectData.specificityScore > bestSpecificityScore)) {
      totalConfidence = projectData.totalConfidence;
      bestProjectId = projectId;
      bestSpecificityScore = projectData.specificityScore;
      bestDetectionMethods = projectData.detectionMethods;
    }
  }
  
  // Force console output for debugging
  if (typeof process !== 'undefined' && process.stdout) {
    process.stdout.write(`\n[FORCE DEBUG] All scores: ${JSON.stringify(debugScores, null, 2)}\n`);
    process.stdout.write(`[FORCE DEBUG] Selected: ${bestProjectId} with ${totalConfidence}% confidence\n`);
  }
  
  const projectId = totalConfidence >= MIN_CONFIDENCE_THRESHOLD ? bestProjectId : null;
  
  let reasoning = '';
  if (projectId) {
    reasoning = `Project detected with ${totalConfidence.toFixed(1)}% confidence. Methods: ${reasoningParts.filter(part => part.includes(`(${projectId})`)).join(', ')}`;
  } else {
    reasoning = `No project match found (${totalConfidence.toFixed(1)}% < ${MIN_CONFIDENCE_THRESHOLD}% threshold). Falling back to general support.`;
  }

  return {
    projectId,
    confidence: totalConfidence,
    detectionMethods: bestDetectionMethods,
    reasoning
  };
};

/**
 * Get project mapping by ID
 */
export const getProjectMapping = (projectId: string): ProjectMapping | null => {
  return PROJECT_MAPPINGS.find(project => project.id === projectId) || null;
};

/**
 * Get all projects for a specific client
 */
export const getProjectsByClient = (clientName: string): ProjectMapping[] => {
  return PROJECT_MAPPINGS.filter(project => 
    project.client.toLowerCase() === clientName.toLowerCase()
  );
};

/**
 * Get fallback team assignment for unknown projects
 */
export const getFallbackTeamAssignment = () => {
  return {
    engineers: [SLACK_IDS.SAMUEL, SLACK_IDS.PAT],
    projectManager: SLACK_IDS.TALHA,
    specialties: ['general_support', 'troubleshooting'],
    businessContext: {
      priority: 'medium' as const,
      slaHours: 24,
      escalationPath: [SLACK_IDS.TALHA, SLACK_IDS.STEVE]
    }
  };
};

/**
 * Enhanced project-aware team assignment
 */
export const getProjectAwareTeamAssignment = (ticketData: TicketData) => {
  const detection = detectProject(ticketData);
  
  if (detection.projectId) {
    const project = getProjectMapping(detection.projectId);
    if (project) {
      return {
        ...project.teamAssignment,
        businessContext: project.businessContext,
        detection,
        project: {
          id: project.id,
          name: project.name,
          client: project.client
        }
      };
    }
  }
  
  return {
    ...getFallbackTeamAssignment(),
    detection,
    project: {
      id: 'general-support',
      name: 'General Support',
      client: 'Unknown'
    }
  };
};

/**
 * Log project detection for debugging
 */
export const logProjectDetection = (ticketData: TicketData, detection: ProjectDetectionResult) => {
  console.log('🔍 Project Detection Analysis:', {
    ticketInfo: {
      organization: ticketData.organization,
      email: ticketData.requesterEmail,
      tags: ticketData.tags,
      subject: ticketData.subject?.substring(0, 50) + '...'
    },
    detection: {
      projectId: detection.projectId,
      confidence: `${detection.confidence.toFixed(1)}%`,
      reasoning: detection.reasoning
    },
    methodScores: {
      organization: `${detection.detectionMethods.organization.score}% (${detection.detectionMethods.organization.match || 'no match'})`,
      emailDomain: `${detection.detectionMethods.emailDomain.score}% (${detection.detectionMethods.emailDomain.match || 'no match'})`,
      clientTags: `${detection.detectionMethods.clientTags.score}% (${detection.detectionMethods.clientTags.match || 'no match'})`,
      domainInContent: `${detection.detectionMethods.domainInContent.score}% (${detection.detectionMethods.domainInContent.match || 'no match'})`,
      keywords: `${detection.detectionMethods.keywords.score}% (${detection.detectionMethods.keywords.matches.join(', ') || 'no matches'})`
    }
  });
};