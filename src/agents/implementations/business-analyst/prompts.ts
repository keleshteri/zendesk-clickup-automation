/**
 * Business Analyst Agent Prompts
 * Centralized prompt templates for business analysis tasks
 */

export const BusinessAnalystPrompts = {
  // Requirement Elicitation Questions
  requirementElicitation: {
    functionalRequirements: `
As a Business Analyst, I need to gather functional requirements. Please help me understand:

1. **Core Functionality**:
   - What specific actions should users be able to perform?
   - What are the main workflows or processes involved?
   - What inputs are required and what outputs are expected?

2. **User Interactions**:
   - Who are the primary users of this system?
   - What are their roles and responsibilities?
   - How do they currently perform these tasks?

3. **Business Rules**:
   - What validation rules must be enforced?
   - Are there any conditional logic requirements?
   - What are the exception handling scenarios?

4. **Integration Points**:
   - What external systems need to be integrated?
   - What data needs to be exchanged?
   - What are the communication protocols?

Please provide detailed responses for each area.
    `,

    nonFunctionalRequirements: `
I need to understand the non-functional requirements:

1. **Performance Requirements**:
   - What are the expected response times?
   - How many concurrent users should the system support?
   - What are the throughput requirements?

2. **Security Requirements**:
   - What authentication methods are required?
   - What authorization levels are needed?
   - Are there any compliance requirements (GDPR, HIPAA, etc.)?

3. **Scalability & Reliability**:
   - What are the expected growth patterns?
   - What is the acceptable downtime?
   - What are the backup and recovery requirements?

4. **Usability Requirements**:
   - What devices/browsers need to be supported?
   - Are there accessibility requirements?
   - What is the expected user experience level?

Please elaborate on each requirement with specific metrics where possible.
    `,

    stakeholderNeeds: `
To understand stakeholder needs, I need to explore:

1. **Primary Stakeholders**:
   - Who are the key decision makers?
   - What are their main concerns and priorities?
   - How will success be measured from their perspective?

2. **End Users**:
   - What are their current pain points?
   - What would make their work more efficient?
   - What training or support will they need?

3. **Technical Stakeholders**:
   - What are the technical constraints?
   - What existing systems must be considered?
   - What are the maintenance and support requirements?

4. **Business Impact**:
   - What business problems are we solving?
   - What are the expected benefits and ROI?
   - What are the risks if this project fails?

Please provide insights into each stakeholder group.
    `
  },

  // Process Analysis Templates
  processAnalysis: {
    currentStateAnalysis: `
Let's analyze the current state process:

## Current Process Analysis

### Process Overview
- **Process Name**: [Name]
- **Process Owner**: [Owner]
- **Frequency**: [How often is this process executed?]
- **Duration**: [How long does it typically take?]

### Process Steps
1. **Step 1**: [Description]
   - **Responsible Party**: [Who performs this step?]
   - **Inputs**: [What is needed to start this step?]
   - **Outputs**: [What is produced?]
   - **Tools/Systems**: [What tools are used?]
   - **Pain Points**: [What issues exist?]

2. **Step 2**: [Continue for each step...]

### Issues & Inefficiencies
- **Bottlenecks**: [Where do delays occur?]
- **Manual Tasks**: [What could be automated?]
- **Error-Prone Areas**: [Where do mistakes happen?]
- **Resource Waste**: [What resources are underutilized?]

### Metrics
- **Cycle Time**: [Total time from start to finish]
- **Processing Time**: [Actual work time]
- **Error Rate**: [Percentage of errors]
- **Cost per Transaction**: [If applicable]

Please fill in the details for the process you want to analyze.
    `,

    futureStateDesign: `
Let's design the future state process:

## Future State Process Design

### Vision Statement
[Describe the ideal future state in 2-3 sentences]

### Improved Process Steps
1. **Step 1**: [Optimized description]
   - **Automation Opportunities**: [What can be automated?]
   - **Efficiency Gains**: [How is this better?]
   - **Technology Enablers**: [What technology supports this?]

2. **Step 2**: [Continue for each step...]

### Key Improvements
- **Eliminated Steps**: [What steps are no longer needed?]
- **Automated Tasks**: [What is now automated?]
- **Reduced Handoffs**: [How are handoffs minimized?]
- **Enhanced Controls**: [What new controls are added?]

### Expected Benefits
- **Time Savings**: [Quantify time reduction]
- **Cost Reduction**: [Estimate cost savings]
- **Quality Improvement**: [How is quality enhanced?]
- **User Experience**: [How is UX improved?]

### Implementation Considerations
- **Change Management**: [What changes are needed?]
- **Training Requirements**: [What training is needed?]
- **Risk Mitigation**: [What risks need to be addressed?]

Please design the optimized future state process.
    `,

    gapAnalysis: `
Let's perform a gap analysis:

## Gap Analysis Framework

### Current vs Future State Comparison

| Aspect | Current State | Future State | Gap | Priority |
|--------|---------------|--------------|-----|----------|
| Process Time | [Current] | [Target] | [Difference] | [High/Med/Low] |
| Manual Tasks | [Current] | [Target] | [Difference] | [High/Med/Low] |
| Error Rate | [Current] | [Target] | [Difference] | [High/Med/Low] |
| User Satisfaction | [Current] | [Target] | [Difference] | [High/Med/Low] |

### Technology Gaps
- **Missing Systems**: [What systems are needed?]
- **Integration Gaps**: [What integrations are missing?]
- **Data Gaps**: [What data is unavailable?]
- **Capability Gaps**: [What capabilities are missing?]

### Organizational Gaps
- **Skills Gaps**: [What skills are needed?]
- **Resource Gaps**: [What resources are needed?]
- **Process Gaps**: [What processes are missing?]
- **Governance Gaps**: [What governance is needed?]

### Recommendations
1. **Quick Wins**: [What can be done immediately?]
2. **Short-term (1-3 months)**: [What can be done soon?]
3. **Medium-term (3-6 months)**: [What requires more time?]
4. **Long-term (6+ months)**: [What is a longer-term goal?]

Please complete the gap analysis for your process.
    `
  },

  // Report Generation Formats
  reportGeneration: {
    requirementsDocument: `
# Business Requirements Document

## Executive Summary
[Provide a high-level overview of the project and its business value]

## Project Overview
- **Project Name**: [Name]
- **Project Sponsor**: [Sponsor]
- **Business Analyst**: [BA Name]
- **Date**: [Date]
- **Version**: [Version]

## Business Objectives
### Primary Objectives
1. [Objective 1 with success criteria]
2. [Objective 2 with success criteria]
3. [Objective 3 with success criteria]

### Success Metrics
- [Metric 1]: [Target value]
- [Metric 2]: [Target value]
- [Metric 3]: [Target value]

## Stakeholder Analysis
### Primary Stakeholders
| Stakeholder | Role | Interest | Influence | Requirements |
|-------------|------|----------|-----------|-------------|
| [Name] | [Role] | [Interest] | [High/Med/Low] | [Key requirements] |

## Functional Requirements
### [Feature Area 1]
**REQ-001**: [Requirement description]
- **Priority**: [High/Medium/Low]
- **Acceptance Criteria**: 
  - [Criteria 1]
  - [Criteria 2]
- **Dependencies**: [Any dependencies]

## Non-Functional Requirements
### Performance
- [Performance requirement with metrics]

### Security
- [Security requirement with specifics]

### Usability
- [Usability requirement with criteria]

## Assumptions and Constraints
### Assumptions
- [Assumption 1]
- [Assumption 2]

### Constraints
- [Constraint 1]
- [Constraint 2]

## Risks and Mitigation
| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|--------------------|
| [Risk 1] | [High/Med/Low] | [High/Med/Low] | [Strategy] |

## Appendices
- [Supporting documents, diagrams, etc.]
    `,

    processDocumentation: `
# Process Documentation

## Process Overview
- **Process Name**: [Name]
- **Process Owner**: [Owner]
- **Document Version**: [Version]
- **Last Updated**: [Date]

## Purpose and Scope
### Purpose
[Why does this process exist?]

### Scope
- **In Scope**: [What is included]
- **Out of Scope**: [What is excluded]

## Process Flow
### High-Level Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Detailed Process Steps
#### Step 1: [Step Name]
- **Description**: [Detailed description]
- **Responsible Party**: [Who performs this]
- **Inputs**: [What is needed]
- **Outputs**: [What is produced]
- **Duration**: [How long it takes]
- **Tools/Systems**: [What tools are used]
- **Decision Points**: [Any decisions to be made]

## Roles and Responsibilities
| Role | Responsibilities |
|------|------------------|
| [Role 1] | [Responsibilities] |
| [Role 2] | [Responsibilities] |

## Key Performance Indicators
- **Cycle Time**: [Target time]
- **Quality Metrics**: [Quality measures]
- **Volume Metrics**: [Volume measures]

## Exception Handling
### Common Exceptions
1. **Exception**: [Description]
   - **Cause**: [Why it happens]
   - **Resolution**: [How to resolve]

## Related Documents
- [List of related procedures, policies, etc.]

## Revision History
| Version | Date | Changes | Author |
|---------|------|---------|--------|
| [1.0] | [Date] | [Initial version] | [Author] |
    `,

    statusReport: `
# Project Status Report

## Report Summary
- **Project**: [Project Name]
- **Reporting Period**: [Date Range]
- **Report Date**: [Date]
- **Business Analyst**: [BA Name]

## Executive Summary
[2-3 sentence summary of current status and key highlights]

## Overall Status
- **Schedule**: 🟢 On Track / 🟡 At Risk / 🔴 Behind
- **Budget**: 🟢 On Track / 🟡 At Risk / 🔴 Over Budget
- **Scope**: 🟢 On Track / 🟡 Changes / 🔴 Major Changes
- **Quality**: 🟢 Good / 🟡 Concerns / 🔴 Issues

## Accomplishments This Period
- [Achievement 1]
- [Achievement 2]
- [Achievement 3]

## Requirements Status
### Completed Requirements
- [REQ-001]: [Requirement name] - ✅ Complete
- [REQ-002]: [Requirement name] - ✅ Complete

### In Progress Requirements
- [REQ-003]: [Requirement name] - 🔄 In Progress (75% complete)
- [REQ-004]: [Requirement name] - 🔄 In Progress (50% complete)

### Upcoming Requirements
- [REQ-005]: [Requirement name] - 📅 Planned for next sprint

## Issues and Risks
### Current Issues
| Issue | Impact | Status | Owner | Target Resolution |
|-------|--------|--------|-------|------------------|
| [Issue 1] | [High/Med/Low] | [Open/In Progress] | [Owner] | [Date] |

### Risks
| Risk | Probability | Impact | Mitigation | Owner |
|------|-------------|--------|------------|-------|
| [Risk 1] | [High/Med/Low] | [High/Med/Low] | [Strategy] | [Owner] |

## Metrics and KPIs
- **Requirements Completion**: [X]% ([Y] of [Z] requirements)
- **Stakeholder Satisfaction**: [Rating]/10
- **Change Requests**: [Number] this period

## Next Period Focus
- [Priority 1]
- [Priority 2]
- [Priority 3]

## Decisions Needed
- [Decision 1] - Required by [Date]
- [Decision 2] - Required by [Date]
    `
  },

  // Stakeholder Interview Guides
  stakeholderInterviews: {
    executiveInterview: `
# Executive Stakeholder Interview Guide

## Pre-Interview Preparation
- **Interviewee**: [Name, Title]
- **Date/Time**: [Scheduled time]
- **Duration**: [Expected duration - typically 30-45 minutes]
- **Objective**: Understand strategic vision and high-level requirements

## Opening (5 minutes)
"Thank you for your time. I'm conducting stakeholder interviews to ensure we fully understand the business needs and strategic objectives for this project. Your insights will help shape our approach and ensure we deliver value that aligns with organizational goals."

## Strategic Vision Questions (15 minutes)
1. **Business Strategy Alignment**
   - How does this project align with our overall business strategy?
   - What strategic objectives will this project help achieve?
   - How does this fit into our digital transformation roadmap?

2. **Success Definition**
   - How will you measure the success of this project?
   - What would make this project a 'home run' for the organization?
   - What are the key performance indicators you'll be watching?

3. **Business Impact**
   - What business problems are we solving?
   - What opportunities are we trying to capture?
   - What's the expected ROI or business value?

## Requirements and Priorities (15 minutes)
4. **Critical Requirements**
   - What are the 'must-have' capabilities?
   - What would be 'nice-to-have' but not essential?
   - Are there any non-negotiable requirements?

5. **Timeline and Constraints**
   - Are there any critical deadlines we must meet?
   - What budget constraints should we be aware of?
   - Are there any regulatory or compliance requirements?

6. **Risk Tolerance**
   - What are your biggest concerns about this project?
   - What could cause this project to fail?
   - How much risk are you comfortable with?

## Stakeholder Dynamics (5 minutes)
7. **Key Stakeholders**
   - Who else should I be talking to?
   - Who are the key decision makers?
   - Are there any stakeholders with concerns I should address?

## Closing (5 minutes)
8. **Final Thoughts**
   - Is there anything else you think I should know?
   - What questions should I be asking that I haven't?
   - How would you like to stay informed about progress?

## Follow-up Actions
- [ ] Send summary of key points
- [ ] Schedule follow-up if needed
- [ ] Share relevant documentation
    `,

    endUserInterview: `
# End User Interview Guide

## Pre-Interview Preparation
- **Interviewee**: [Name, Role]
- **Date/Time**: [Scheduled time]
- **Duration**: [Expected duration - typically 45-60 minutes]
- **Objective**: Understand current processes, pain points, and user needs

## Opening (5 minutes)
"Thank you for taking the time to speak with me. I'm working to understand how you currently perform your work and what improvements would make your job easier and more efficient. Your insights are crucial for designing a solution that truly meets your needs."

## Current State Analysis (20 minutes)
1. **Role and Responsibilities**
   - Can you walk me through your typical day?
   - What are your main responsibilities related to [process area]?
   - How long have you been doing this type of work?

2. **Current Process**
   - Can you walk me through how you currently [perform specific task]?
   - What tools or systems do you use?
   - How long does this typically take?
   - How often do you perform this task?

3. **Pain Points and Challenges**
   - What are the most frustrating parts of your current process?
   - Where do you experience delays or bottlenecks?
   - What causes you to make mistakes or rework?
   - What takes longer than it should?

## User Needs and Preferences (15 minutes)
4. **Ideal Solution**
   - If you could wave a magic wand, how would this process work?
   - What would make your job significantly easier?
   - What features or capabilities would be most valuable?

5. **Workflow Integration**
   - How does this process connect to other parts of your work?
   - Who do you collaborate with on these tasks?
   - What information do you need from others?
   - What information do you provide to others?

6. **Technology Comfort**
   - How comfortable are you with learning new systems?
   - What systems do you currently use that you like/dislike?
   - Do you prefer mobile, desktop, or web-based tools?

## Solution Validation (10 minutes)
7. **Feature Prioritization**
   - If we could only build 3 features, which would be most important?
   - What would you be willing to give up to get the most important features?
   - Are there any features that would actually make things worse?

8. **Change Management**
   - What concerns do you have about changing the current process?
   - What would help you adopt a new system?
   - What training or support would you need?

## Closing (10 minutes)
9. **Additional Insights**
   - Are there other people I should talk to who do similar work?
   - What questions should I be asking that I haven't?
   - Is there anything else you think would be helpful for me to know?

10. **Follow-up**
    - Would you be willing to review designs or prototypes?
    - How would you prefer I follow up with you?

## Post-Interview Actions
- [ ] Document key insights
- [ ] Identify process improvement opportunities
- [ ] Note feature requirements
- [ ] Schedule follow-up sessions if needed
    `,

    technicalStakeholderInterview: `
# Technical Stakeholder Interview Guide

## Pre-Interview Preparation
- **Interviewee**: [Name, Technical Role]
- **Date/Time**: [Scheduled time]
- **Duration**: [Expected duration - typically 60 minutes]
- **Objective**: Understand technical constraints, architecture, and implementation considerations

## Opening (5 minutes)
"Thank you for your time. I need to understand the technical landscape and constraints that will impact our solution design. Your expertise will help ensure we create a solution that's technically sound and integrates well with existing systems."

## Current Technical Environment (20 minutes)
1. **System Architecture**
   - Can you give me an overview of the current system architecture?
   - What are the key systems and how do they interact?
   - What technologies and platforms are we currently using?

2. **Integration Points**
   - What systems will need to integrate with the new solution?
   - What are the current integration patterns and protocols?
   - Are there any integration challenges or limitations?

3. **Data Architecture**
   - Where does the relevant data currently reside?
   - What are the data quality and consistency issues?
   - What are the data governance and security requirements?

## Technical Constraints and Requirements (20 minutes)
4. **Performance Requirements**
   - What are the performance expectations?
   - What are the current system performance benchmarks?
   - Are there any scalability requirements?

5. **Security and Compliance**
   - What security requirements must be met?
   - Are there compliance standards we need to adhere to?
   - What are the authentication and authorization requirements?

6. **Infrastructure Constraints**
   - What infrastructure limitations should we be aware of?
   - Are there preferred technologies or platforms?
   - What are the deployment and hosting requirements?

## Implementation Considerations (10 minutes)
7. **Development Standards**
   - What development standards and practices should we follow?
   - Are there coding standards or architectural patterns to use?
   - What testing and quality assurance processes are required?

8. **Maintenance and Support**
   - Who will maintain and support the new solution?
   - What documentation and knowledge transfer is needed?
   - What are the backup and disaster recovery requirements?

## Risk Assessment (5 minutes)
9. **Technical Risks**
   - What technical risks are you most concerned about?
   - Are there any technologies or approaches to avoid?
   - What could cause technical delays or issues?

## Closing (5 minutes)
10. **Collaboration**
    - How would you like to be involved in the technical design?
    - Who else from the technical team should I speak with?
    - What's the best way to get technical questions answered?

## Follow-up Actions
- [ ] Document technical requirements
- [ ] Create technical constraint matrix
- [ ] Schedule architecture review sessions
- [ ] Identify additional technical stakeholders
    `
  },

  // Analysis Templates
  analysisTemplates: {
    swotAnalysis: `
# SWOT Analysis Template

## Project/Initiative: [Name]
## Analysis Date: [Date]
## Analyst: [Name]

### Strengths (Internal Positive Factors)
- **Organizational Strengths**:
  - [What advantages does the organization have?]
  - [What resources are available?]
  - [What capabilities exist?]

- **Project Strengths**:
  - [What makes this project likely to succeed?]
  - [What expertise is available?]
  - [What support exists?]

### Weaknesses (Internal Negative Factors)
- **Organizational Weaknesses**:
  - [What areas need improvement?]
  - [What resources are lacking?]
  - [What capabilities are missing?]

- **Project Weaknesses**:
  - [What could hinder project success?]
  - [What skills or resources are missing?]
  - [What internal challenges exist?]

### Opportunities (External Positive Factors)
- **Market Opportunities**:
  - [What market trends favor this initiative?]
  - [What external factors create opportunities?]
  - [What timing advantages exist?]

- **Technology Opportunities**:
  - [What new technologies can be leveraged?]
  - [What integration opportunities exist?]
  - [What innovation possibilities are there?]

### Threats (External Negative Factors)
- **Market Threats**:
  - [What market changes could impact the project?]
  - [What competitive threats exist?]
  - [What economic factors could affect success?]

- **Technical Threats**:
  - [What technology risks exist?]
  - [What security or compliance threats are there?]
  - [What integration challenges might arise?]

## Strategic Implications
### SO Strategies (Strength-Opportunity)
- [How can we use strengths to take advantage of opportunities?]

### WO Strategies (Weakness-Opportunity)
- [How can we overcome weaknesses to pursue opportunities?]

### ST Strategies (Strength-Threat)
- [How can we use strengths to avoid threats?]

### WT Strategies (Weakness-Threat)
- [How can we minimize weaknesses and avoid threats?]

## Action Items
1. [Action based on analysis]
2. [Action based on analysis]
3. [Action based on analysis]
    `,

    riskAssessment: `
# Risk Assessment Matrix

## Project: [Project Name]
## Assessment Date: [Date]
## Analyst: [Name]

## Risk Categories

### Technical Risks
| Risk ID | Risk Description | Probability | Impact | Risk Score | Mitigation Strategy | Owner |
|---------|------------------|-------------|--------|------------|--------------------|---------|
| T001 | [Technical risk 1] | [H/M/L] | [H/M/L] | [Score] | [Strategy] | [Owner] |
| T002 | [Technical risk 2] | [H/M/L] | [H/M/L] | [Score] | [Strategy] | [Owner] |

### Business Risks
| Risk ID | Risk Description | Probability | Impact | Risk Score | Mitigation Strategy | Owner |
|---------|------------------|-------------|--------|------------|--------------------|---------|
| B001 | [Business risk 1] | [H/M/L] | [H/M/L] | [Score] | [Strategy] | [Owner] |
| B002 | [Business risk 2] | [H/M/L] | [H/M/L] | [Score] | [Strategy] | [Owner] |

### Operational Risks
| Risk ID | Risk Description | Probability | Impact | Risk Score | Mitigation Strategy | Owner |
|---------|------------------|-------------|--------|------------|--------------------|---------|
| O001 | [Operational risk 1] | [H/M/L] | [H/M/L] | [Score] | [Strategy] | [Owner] |
| O002 | [Operational risk 2] | [H/M/L] | [H/M/L] | [Score] | [Strategy] | [Owner] |

## Risk Scoring
- **Probability**: High (3), Medium (2), Low (1)
- **Impact**: High (3), Medium (2), Low (1)
- **Risk Score**: Probability × Impact

## Risk Heat Map
\`\`\`
        Low Impact  Med Impact  High Impact
High Prob    3         6          9
Med Prob     2         4          6
Low Prob     1         2          3
\`\`\`

## Risk Response Strategies
### High Priority Risks (Score 6-9)
- [Risk ID]: [Detailed mitigation plan]

### Medium Priority Risks (Score 3-4)
- [Risk ID]: [Monitoring and contingency plan]

### Low Priority Risks (Score 1-2)
- [Risk ID]: [Accept and monitor]

## Risk Monitoring Plan
- **Review Frequency**: [Weekly/Monthly]
- **Risk Owner Meetings**: [Schedule]
- **Escalation Criteria**: [When to escalate]
- **Reporting**: [How risks are reported]
    `
  }
};

// Export individual prompt categories for easier access
export const {
  requirementElicitation,
  processAnalysis,
  reportGeneration,
  stakeholderInterviews,
  analysisTemplates
} = BusinessAnalystPrompts;

// Helper function to get prompts by category
export function getBusinessAnalystPrompts(category: keyof typeof BusinessAnalystPrompts) {
  return BusinessAnalystPrompts[category];
}

// Helper function to get specific prompt
export function getSpecificPrompt(
  category: keyof typeof BusinessAnalystPrompts,
  promptName: string
) {
  const categoryPrompts = BusinessAnalystPrompts[category] as Record<string, string>;
  return categoryPrompts[promptName];
}