# Project Manager Agent 📋

This directory contains the Project Manager agent implementation, specialized in project planning, coordination, resource management, and delivery oversight.

## Purpose

The Project Manager agent provides:
- Project planning and scheduling
- Resource allocation and management
- Risk assessment and mitigation
- Progress tracking and reporting
- Stakeholder communication and coordination

## Agent Capabilities

### Project Planning
- **Project Scope Definition**: Define project objectives and deliverables
- **Work Breakdown Structure**: Break down projects into manageable tasks
- **Timeline Planning**: Create realistic project schedules and milestones
- **Dependency Management**: Identify and manage task dependencies

### Resource Management
- **Team Allocation**: Assign team members to appropriate tasks
- **Capacity Planning**: Balance workload across team members
- **Skill Matching**: Match tasks with team member expertise
- **Resource Optimization**: Optimize resource utilization and efficiency

### Risk Management
- **Risk Identification**: Identify potential project risks and issues
- **Risk Assessment**: Evaluate risk probability and impact
- **Mitigation Planning**: Develop risk mitigation strategies
- **Contingency Planning**: Create backup plans for critical risks

### Progress Monitoring
- **Task Tracking**: Monitor individual task progress and completion
- **Milestone Monitoring**: Track milestone achievement and delays
- **Performance Metrics**: Calculate project performance indicators
- **Status Reporting**: Generate regular project status reports

## File Structure

### `project-manager.ts`
Main agent implementation containing:
- Project planning and scheduling logic
- Resource allocation algorithms
- Risk management workflows
- Progress tracking and reporting systems

### `prompts.ts`
Agent-specific prompts for:
- Project planning templates
- Risk assessment questionnaires
- Status report formats
- Stakeholder communication templates

### `workflows.ts`
Predefined workflows for:
- Project initiation procedures
- Planning and scheduling processes
- Risk management workflows
- Project closure procedures

## Key Workflows

### Project Initiation Workflow
1. **Project Charter**: Create project charter and objectives
2. **Stakeholder Analysis**: Identify and analyze project stakeholders
3. **Scope Definition**: Define project scope and boundaries
4. **Success Criteria**: Establish project success metrics
5. **Approval**: Obtain project approval and authorization

### Project Planning Workflow
1. **Work Breakdown**: Break down project into tasks and subtasks
2. **Estimation**: Estimate effort, duration, and resources
3. **Scheduling**: Create project timeline and milestones
4. **Resource Planning**: Allocate team members and resources
5. **Risk Planning**: Identify risks and mitigation strategies

### Execution Monitoring Workflow
1. **Progress Tracking**: Monitor task completion and progress
2. **Issue Management**: Identify and resolve project issues
3. **Change Management**: Handle scope and requirement changes
4. **Quality Assurance**: Ensure deliverable quality standards
5. **Communication**: Provide regular updates to stakeholders

### Project Closure Workflow
1. **Deliverable Review**: Validate all project deliverables
2. **Stakeholder Acceptance**: Obtain formal acceptance from stakeholders
3. **Lessons Learned**: Document project lessons and best practices
4. **Resource Release**: Release team members and resources
5. **Project Archive**: Archive project documentation and artifacts

## Integration Points

### ClickUp Integration
- Create and manage project workspaces
- Assign tasks to team members
- Track task progress and completion
- Generate project reports and dashboards

### Zendesk Integration
- Monitor customer feedback and support requests
- Identify project-related customer issues
- Track customer satisfaction metrics
- Coordinate support and development efforts

### Communication Platforms
- Slack integration for team communication
- Email automation for stakeholder updates
- Calendar integration for meeting scheduling
- Document sharing and collaboration

## Usage Examples

### Project Planning
```typescript
const projectManager = new ProjectManagerAgent();

// Create new project plan
const project = await projectManager.createProject({
  name: 'Zendesk-ClickUp Integration',
  description: 'Automate ticket synchronization between platforms',
  duration: '12 weeks',
  team: ['developer-1', 'developer-2', 'qa-tester'],
  priority: 'high'
});

// Generate work breakdown structure
const wbs = await projectManager.createWorkBreakdown(project.id, {
  phases: ['analysis', 'development', 'testing', 'deployment'],
  granularity: 'task-level'
});
```

### Resource Management
```typescript
// Allocate team resources
const allocation = await projectManager.allocateResources({
  projectId: project.id,
  requirements: {
    'frontend-developer': 1,
    'backend-developer': 2,
    'qa-tester': 1
  },
  constraints: {
    availability: 'full-time',
    duration: '12 weeks'
  }
});

// Optimize resource utilization
const optimization = await projectManager.optimizeResources({
  projects: [project.id],
  objectives: ['minimize-cost', 'maximize-efficiency']
});
```

### Progress Monitoring
```typescript
// Track project progress
const progress = await projectManager.trackProgress(project.id);

// Generate status report
const report = await projectManager.generateStatusReport({
  projectId: project.id,
  period: 'weekly',
  recipients: ['stakeholder-1', 'team-lead']
});

// Identify project risks
const risks = await projectManager.assessRisks(project.id);
```

## Specialized Features

### Agile Project Management
- Sprint planning and management
- Backlog prioritization
- Velocity tracking and forecasting
- Retrospective facilitation

### Waterfall Project Management
- Phase gate management
- Sequential milestone tracking
- Formal approval processes
- Comprehensive documentation

### Hybrid Methodologies
- Flexible methodology adaptation
- Custom workflow creation
- Methodology mixing and matching
- Best practice recommendations

### Portfolio Management
- Multi-project coordination
- Resource sharing across projects
- Portfolio-level reporting
- Strategic alignment tracking

## Project Metrics and KPIs

### Schedule Performance
- Schedule Performance Index (SPI)
- Schedule variance analysis
- Critical path monitoring
- Milestone achievement rate

### Cost Performance
- Cost Performance Index (CPI)
- Budget variance tracking
- Earned value analysis
- Return on investment (ROI)

### Quality Metrics
- Defect density tracking
- Quality gate compliance
- Customer satisfaction scores
- Deliverable acceptance rate

### Team Performance
- Team velocity and productivity
- Resource utilization rates
- Team satisfaction and morale
- Skill development tracking

## Risk Management

### Risk Categories
- Technical risks (complexity, dependencies)
- Resource risks (availability, skills)
- Schedule risks (delays, dependencies)
- Business risks (requirements, stakeholders)

### Risk Assessment
- Probability and impact analysis
- Risk scoring and prioritization
- Risk trend monitoring
- Early warning indicators

### Mitigation Strategies
- Risk avoidance techniques
- Risk mitigation plans
- Contingency planning
- Risk transfer options

## Communication and Reporting

### Stakeholder Communication
- Automated status updates
- Customized reporting dashboards
- Meeting facilitation and minutes
- Issue escalation procedures

### Project Documentation
- Project charter and scope documents
- Work breakdown structures
- Risk registers and mitigation plans
- Lessons learned repositories

### Performance Dashboards
- Real-time project status
- Resource utilization views
- Risk and issue tracking
- Milestone and deliverable status