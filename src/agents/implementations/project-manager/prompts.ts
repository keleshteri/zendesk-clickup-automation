/**
 * Project Manager Agent Prompts
 * Comprehensive templates for project planning, risk assessment, status reporting, and team coordination
 */

export const ProjectManagerPrompts = {
  // Project Planning Templates
  projectPlanning: {
    projectInitiation: `
# Project Initiation Template

## Project Overview
- **Project Name**: [Project Name]
- **Project Description**: [Brief description of the project]
- **Business Justification**: [Why this project is needed]
- **Success Criteria**: [How success will be measured]

## Stakeholders
- **Project Sponsor**: [Name and role]
- **Project Manager**: [Name and contact]
- **Key Stakeholders**: [List of stakeholders and their roles]
- **End Users**: [Who will use the final product]

## Scope Definition
- **In Scope**: [What is included in the project]
- **Out of Scope**: [What is explicitly excluded]
- **Assumptions**: [Key assumptions being made]
- **Constraints**: [Limitations and restrictions]

## Timeline and Milestones
- **Project Start Date**: [Date]
- **Project End Date**: [Date]
- **Key Milestones**: [Major deliverables and dates]
- **Critical Path**: [Dependencies and critical activities]
    `,

    workBreakdownStructure: `
# Work Breakdown Structure (WBS) Template

## Level 1: Project Phases
1. **Initiation Phase**
   - 1.1 Project Charter Development
   - 1.2 Stakeholder Identification
   - 1.3 Initial Risk Assessment

2. **Planning Phase**
   - 2.1 Detailed Project Planning
   - 2.2 Resource Allocation
   - 2.3 Communication Plan

3. **Execution Phase**
   - 3.1 Development Activities
   - 3.2 Quality Assurance
   - 3.3 Progress Monitoring

4. **Monitoring & Control Phase**
   - 4.1 Performance Tracking
   - 4.2 Change Management
   - 4.3 Risk Mitigation

5. **Closure Phase**
   - 5.1 Final Deliverables
   - 5.2 Project Documentation
   - 5.3 Lessons Learned

## Task Details Template
- **Task ID**: [Unique identifier]
- **Task Name**: [Descriptive name]
- **Description**: [Detailed description]
- **Duration**: [Estimated time]
- **Dependencies**: [Prerequisites]
- **Resources**: [Required resources]
- **Deliverables**: [Expected outputs]
    `,

    resourcePlanning: `
# Resource Planning Template

## Human Resources
- **Team Structure**: [Organizational chart]
- **Roles and Responsibilities**: [RACI matrix]
- **Skill Requirements**: [Required competencies]
- **Training Needs**: [Skill gaps and training plans]

## Technical Resources
- **Hardware Requirements**: [Servers, workstations, etc.]
- **Software Requirements**: [Applications, licenses, etc.]
- **Infrastructure**: [Network, security, etc.]
- **Tools and Equipment**: [Development tools, testing equipment]

## Budget Planning
- **Personnel Costs**: [Salaries, contractors]
- **Technology Costs**: [Hardware, software, licenses]
- **Operational Costs**: [Facilities, utilities, travel]
- **Contingency**: [Risk buffer]

## Resource Allocation Timeline
- **Phase 1**: [Resources needed and timeline]
- **Phase 2**: [Resources needed and timeline]
- **Phase 3**: [Resources needed and timeline]
    `
  },

  // Risk Assessment Guides
  riskAssessment: {
    riskIdentification: `
# Risk Identification Template

## Risk Categories
1. **Technical Risks**
   - Technology complexity
   - Integration challenges
   - Performance issues
   - Security vulnerabilities

2. **Project Management Risks**
   - Schedule delays
   - Budget overruns
   - Resource unavailability
   - Scope creep

3. **Business Risks**
   - Market changes
   - Regulatory changes
   - Stakeholder conflicts
   - Business priority shifts

4. **External Risks**
   - Vendor dependencies
   - Third-party integrations
   - Economic factors
   - Natural disasters

## Risk Assessment Matrix
| Risk ID | Risk Description | Probability | Impact | Risk Score | Mitigation Strategy |
|---------|------------------|-------------|--------|------------|--------------------|
| R001    | [Description]    | [H/M/L]     | [H/M/L]| [Score]    | [Strategy]         |
    `,

    riskMitigation: `
# Risk Mitigation Planning Template

## Risk Response Strategies
1. **Avoid**: Eliminate the risk by changing the project plan
2. **Mitigate**: Reduce the probability or impact of the risk
3. **Transfer**: Shift the risk to a third party
4. **Accept**: Acknowledge the risk and prepare contingency plans

## Mitigation Plan Template
- **Risk ID**: [Unique identifier]
- **Risk Description**: [Detailed description]
- **Risk Owner**: [Person responsible]
- **Response Strategy**: [Avoid/Mitigate/Transfer/Accept]
- **Mitigation Actions**: [Specific steps to take]
- **Contingency Plan**: [What to do if risk occurs]
- **Monitoring Approach**: [How to track the risk]
- **Review Schedule**: [When to reassess]
    `,

    riskMonitoring: `
# Risk Monitoring Template

## Risk Status Dashboard
| Risk ID | Current Status | Probability Change | Impact Change | Action Required |
|---------|----------------|-------------------|---------------|------------------|
| R001    | [Status]       | [↑/↓/→]          | [↑/↓/→]       | [Yes/No]        |

## Risk Indicators
- **Early Warning Signs**: [Indicators that risk is materializing]
- **Trigger Events**: [Events that would activate contingency plans]
- **Monitoring Frequency**: [How often to review]
- **Escalation Criteria**: [When to escalate to management]

## Risk Review Questions
1. Have any new risks been identified?
2. Have existing risk probabilities or impacts changed?
3. Are mitigation strategies working effectively?
4. Do any risks need to be escalated?
5. Are there any risks that can be closed?
    `
  },

  // Status Reporting Formats
  statusReporting: {
    weeklyStatusReport: `
# Weekly Project Status Report

**Project**: [Project Name]
**Reporting Period**: [Start Date] - [End Date]
**Report Date**: [Date]
**Project Manager**: [Name]

## Executive Summary
- **Overall Status**: 🟢 Green / 🟡 Yellow / 🔴 Red
- **Key Accomplishments**: [Major achievements this week]
- **Upcoming Milestones**: [Next major deliverables]
- **Issues Requiring Attention**: [Critical issues]

## Progress Summary
- **Planned vs Actual**: [Comparison of planned vs actual progress]
- **Completed Tasks**: [List of completed tasks]
- **In Progress Tasks**: [Current work items]
- **Upcoming Tasks**: [Next week's priorities]

## Budget Status
- **Budget Utilized**: [Percentage and amount]
- **Forecast to Complete**: [Projected final cost]
- **Variance**: [Over/under budget amount]

## Schedule Status
- **Schedule Performance**: [On time/ahead/behind]
- **Critical Path Status**: [Any delays on critical path]
- **Milestone Status**: [Upcoming milestone dates]

## Issues and Risks
- **New Issues**: [Issues identified this week]
- **Resolved Issues**: [Issues closed this week]
- **Top Risks**: [Highest priority risks]
- **Risk Changes**: [Changes in risk status]

## Team Status
- **Team Morale**: [High/Medium/Low]
- **Resource Utilization**: [Team capacity usage]
- **Skill Gaps**: [Any training needs]

## Next Week's Focus
- **Priority 1**: [Most important objective]
- **Priority 2**: [Second priority]
- **Priority 3**: [Third priority]
    `,

    milestoneReport: `
# Milestone Status Report

**Milestone**: [Milestone Name]
**Target Date**: [Original target date]
**Actual/Forecast Date**: [Actual or projected completion]
**Status**: [Completed/On Track/At Risk/Delayed]

## Milestone Objectives
- **Primary Deliverables**: [What should be delivered]
- **Success Criteria**: [How success is measured]
- **Dependencies**: [What this milestone depends on]

## Progress Assessment
- **Completion Percentage**: [% complete]
- **Work Completed**: [Specific accomplishments]
- **Work Remaining**: [Outstanding tasks]
- **Quality Assessment**: [Quality of deliverables]

## Issues and Challenges
- **Current Blockers**: [What's preventing progress]
- **Resource Constraints**: [Any resource limitations]
- **Technical Challenges**: [Technical difficulties]
- **External Dependencies**: [Third-party dependencies]

## Recovery Plan (if behind schedule)
- **Root Cause Analysis**: [Why the delay occurred]
- **Recovery Actions**: [Steps to get back on track]
- **Resource Adjustments**: [Additional resources needed]
- **Revised Timeline**: [New target dates]

## Lessons Learned
- **What Went Well**: [Positive outcomes]
- **Areas for Improvement**: [What could be better]
- **Process Changes**: [Recommended improvements]
    `,

    executiveDashboard: `
# Executive Dashboard Template

## Project Health Overview
| Metric | Status | Trend | Target | Actual |
|--------|--------|-------|--------|---------|
| Schedule | 🟢/🟡/🔴 | ↑/↓/→ | [Date] | [Date] |
| Budget | 🟢/🟡/🔴 | ↑/↓/→ | [Amount] | [Amount] |
| Quality | 🟢/🟡/🔴 | ↑/↓/→ | [Target] | [Actual] |
| Scope | 🟢/🟡/🔴 | ↑/↓/→ | [Baseline] | [Current] |

## Key Performance Indicators
- **Schedule Performance Index (SPI)**: [Value]
- **Cost Performance Index (CPI)**: [Value]
- **Quality Metrics**: [Defect rates, test coverage]
- **Team Productivity**: [Velocity, throughput]

## Critical Success Factors
1. **Factor 1**: [Status and description]
2. **Factor 2**: [Status and description]
3. **Factor 3**: [Status and description]

## Top 3 Risks
1. **Risk 1**: [Description and mitigation]
2. **Risk 2**: [Description and mitigation]
3. **Risk 3**: [Description and mitigation]

## Decisions Needed
- **Decision 1**: [Description and deadline]
- **Decision 2**: [Description and deadline]
- **Decision 3**: [Description and deadline]
    `
  },

  // Team Coordination Prompts
  teamCoordination: {
    teamMeetings: `
# Team Meeting Templates

## Daily Standup Template
**Duration**: 15 minutes
**Participants**: Core team members

### Agenda
1. **What did you accomplish yesterday?**
2. **What will you work on today?**
3. **Are there any blockers or impediments?**
4. **Any dependencies or coordination needed?**

### Meeting Notes Template
- **Date**: [Date]
- **Attendees**: [List of attendees]
- **Key Updates**: [Summary of progress]
- **Blockers Identified**: [Issues raised]
- **Action Items**: [Follow-up tasks]
- **Next Meeting**: [Date and time]

## Sprint Planning Template
**Duration**: 2-4 hours
**Participants**: Development team, Product Owner, Scrum Master

### Agenda
1. **Sprint Goal Definition**
2. **Backlog Review and Prioritization**
3. **Capacity Planning**
4. **Task Breakdown and Estimation**
5. **Sprint Commitment**

### Planning Outputs
- **Sprint Goal**: [What we aim to achieve]
- **Sprint Backlog**: [Selected user stories/tasks]
- **Team Capacity**: [Available hours/story points]
- **Definition of Done**: [Completion criteria]
    `,

    communicationPlan: `
# Communication Plan Template

## Stakeholder Communication Matrix
| Stakeholder | Information Needs | Frequency | Method | Responsible |
|-------------|------------------|-----------|--------|--------------|
| Executive Sponsor | High-level status | Monthly | Dashboard | PM |
| Project Team | Detailed updates | Daily | Standup | PM |
| End Users | Feature updates | Bi-weekly | Newsletter | BA |

## Communication Channels
1. **Formal Channels**
   - Project status reports
   - Steering committee meetings
   - Milestone reviews
   - Change control board

2. **Informal Channels**
   - Team chat (Slack/Teams)
   - Hallway conversations
   - Coffee meetings
   - Social events

## Escalation Matrix
- **Level 1**: Team Lead (Response: 4 hours)
- **Level 2**: Project Manager (Response: 8 hours)
- **Level 3**: Program Manager (Response: 24 hours)
- **Level 4**: Executive Sponsor (Response: 48 hours)

## Communication Guidelines
- **Response Times**: [Expected response times by channel]
- **Meeting Etiquette**: [Guidelines for effective meetings]
- **Documentation Standards**: [How to document decisions]
- **Conflict Resolution**: [Process for resolving disagreements]
    `,

    changeManagement: `
# Change Management Template

## Change Request Form
- **Change ID**: [Unique identifier]
- **Requested By**: [Name and role]
- **Date Submitted**: [Date]
- **Priority**: [High/Medium/Low]

### Change Description
- **Current State**: [How things work now]
- **Proposed Change**: [What should change]
- **Justification**: [Why the change is needed]
- **Impact Assessment**: [Effects on scope, schedule, budget]

### Change Analysis
- **Technical Impact**: [Technical implications]
- **Schedule Impact**: [Effect on timeline]
- **Budget Impact**: [Cost implications]
- **Resource Impact**: [Effect on team]
- **Risk Assessment**: [New risks introduced]

### Change Decision
- **Decision**: [Approved/Rejected/Deferred]
- **Decision Date**: [Date]
- **Decision Maker**: [Name and role]
- **Conditions**: [Any conditions for approval]
- **Implementation Plan**: [How to implement]

## Change Control Process
1. **Change Identification**: [How changes are identified]
2. **Change Documentation**: [How to document changes]
3. **Impact Assessment**: [How to assess impact]
4. **Change Approval**: [Approval process and authority]
5. **Change Implementation**: [How to implement changes]
6. **Change Verification**: [How to verify success]
    `
  },

  // Performance Tracking
  performanceTracking: {
    kpiDashboard: `
# Key Performance Indicators (KPI) Dashboard

## Project Performance Metrics
1. **Schedule Performance**
   - Planned vs Actual milestones
   - Schedule Performance Index (SPI)
   - Critical path variance
   - Milestone success rate

2. **Cost Performance**
   - Budget vs Actual spend
   - Cost Performance Index (CPI)
   - Burn rate analysis
   - Forecast at completion

3. **Quality Performance**
   - Defect density
   - Test coverage
   - Customer satisfaction
   - Rework percentage

4. **Team Performance**
   - Team velocity
   - Resource utilization
   - Team satisfaction
   - Knowledge transfer effectiveness

## Performance Tracking Template
| KPI | Target | Actual | Variance | Trend | Action Required |
|-----|--------|--------|----------|-------|------------------|
| SPI | 1.0 | [Value] | [%] | ↑/↓/→ | [Yes/No] |
| CPI | 1.0 | [Value] | [%] | ↑/↓/→ | [Yes/No] |
    `
  }
};

export default ProjectManagerPrompts;