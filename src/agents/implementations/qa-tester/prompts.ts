/**
 * QA Tester Agent Prompts
 * Comprehensive templates for test case creation, bug reporting, testing strategies, and quality assessment
 */

export const QATesterPrompts = {
  // Test Case Templates
  testCases: {
    functionalTestCase: `
# Functional Test Case Template

**Test Case ID**: [TC_XXX]
**Test Case Title**: [Descriptive title]
**Module/Feature**: [Feature being tested]
**Priority**: [High/Medium/Low]
**Severity**: [Critical/Major/Minor/Trivial]

## Test Objective
**Purpose**: [What this test aims to verify]
**Business Rule**: [Business logic being validated]

## Preconditions
- [Condition 1: System state before test]
- [Condition 2: Required data setup]
- [Condition 3: User permissions needed]

## Test Data
- **Valid Data**: [Examples of valid inputs]
- **Invalid Data**: [Examples of invalid inputs]
- **Boundary Values**: [Edge cases to test]

## Test Steps
| Step | Action | Expected Result |
|------|--------|------------------|
| 1 | [User action] | [Expected system response] |
| 2 | [User action] | [Expected system response] |
| 3 | [User action] | [Expected system response] |

## Expected Results
- **Primary Result**: [Main expected outcome]
- **Secondary Results**: [Additional expected behaviors]
- **UI Validation**: [Visual elements to verify]
- **Data Validation**: [Database/API changes to verify]

## Postconditions
- [System state after test completion]
- [Data cleanup requirements]

## Test Environment
- **Browser**: [Chrome/Firefox/Safari/Edge]
- **OS**: [Windows/Mac/Linux]
- **Device**: [Desktop/Mobile/Tablet]
- **Resolution**: [Screen resolution if relevant]
    `,

    apiTestCase: `
# API Test Case Template

**Test Case ID**: [API_TC_XXX]
**API Endpoint**: [HTTP Method] [URL]
**Test Category**: [Functional/Security/Performance]

## Test Objective
**Purpose**: [What API behavior is being tested]
**Business Logic**: [Business rule being validated]

## Request Details
**HTTP Method**: [GET/POST/PUT/DELETE/PATCH]
**Endpoint**: [Full URL path]
**Headers**: 
\`\`\`json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer [token]",
  "Custom-Header": "value"
}
\`\`\`

**Request Body** (if applicable):
\`\`\`json
{
  "field1": "value1",
  "field2": "value2"
}
\`\`\`

**Query Parameters**:
- param1: [value]
- param2: [value]

## Expected Response
**Status Code**: [200/201/400/401/404/500]
**Response Headers**: [Expected headers]
**Response Body**:
\`\`\`json
{
  "status": "success",
  "data": {
    "field1": "expected_value",
    "field2": "expected_value"
  },
  "message": "Operation completed successfully"
}
\`\`\`

## Validation Points
- **Status Code**: [Verify correct HTTP status]
- **Response Time**: [Performance threshold]
- **Data Accuracy**: [Verify response data]
- **Schema Validation**: [JSON schema compliance]
- **Error Handling**: [Error response format]

## Test Variations
1. **Valid Request**: [Normal successful scenario]
2. **Invalid Data**: [Malformed request body]
3. **Missing Headers**: [Required headers omitted]
4. **Authentication**: [Invalid/expired tokens]
5. **Authorization**: [Insufficient permissions]
    `,

    performanceTestCase: `
# Performance Test Case Template

**Test Case ID**: [PERF_TC_XXX]
**Test Type**: [Load/Stress/Volume/Spike]
**Component**: [System component being tested]

## Performance Objectives
**Response Time**: [Target response time]
**Throughput**: [Requests per second]
**Concurrent Users**: [Number of simultaneous users]
**Duration**: [Test execution time]

## Test Scenario
**User Journey**: [Typical user workflow]
**Load Pattern**: [Constant/Ramp-up/Spike]
**Data Volume**: [Amount of test data]

## Test Configuration
**Load Generators**: [Number and location]
**Test Environment**: [Hardware specifications]
**Network Conditions**: [Bandwidth, latency]
**Database Size**: [Amount of test data]

## Performance Criteria
| Metric | Target | Threshold | Critical |
|--------|--------|-----------|----------|
| Response Time | [ms] | [ms] | [ms] |
| Throughput | [req/s] | [req/s] | [req/s] |
| Error Rate | [%] | [%] | [%] |
| CPU Usage | [%] | [%] | [%] |
| Memory Usage | [%] | [%] | [%] |

## Monitoring Points
- **Application Metrics**: [Response times, error rates]
- **System Metrics**: [CPU, memory, disk I/O]
- **Database Metrics**: [Query performance, connections]
- **Network Metrics**: [Bandwidth utilization, latency]

## Success Criteria
- All response times within target thresholds
- Error rate below acceptable limit
- System resources within normal ranges
- No memory leaks or performance degradation
    `
  },

  // Bug Report Formats
  bugReporting: {
    bugReportTemplate: `
# Bug Report Template

**Bug ID**: [BUG_XXX]
**Date Reported**: [Date]
**Reported By**: [Tester name]
**Assigned To**: [Developer name]
**Status**: [New/Open/In Progress/Resolved/Closed]

## Bug Summary
**Title**: [Concise description of the issue]
**Severity**: [Critical/High/Medium/Low]
**Priority**: [P1/P2/P3/P4]
**Component**: [Module/Feature affected]
**Version**: [Software version]

## Environment Details
**Operating System**: [Windows 10/macOS/Linux]
**Browser**: [Chrome 91.0/Firefox 89.0/Safari 14.1]
**Device**: [Desktop/Mobile/Tablet]
**Screen Resolution**: [1920x1080]
**Network**: [WiFi/Ethernet/Mobile]

## Bug Description
**Issue**: [Detailed description of what went wrong]
**Expected Behavior**: [What should have happened]
**Actual Behavior**: [What actually happened]
**Impact**: [How this affects users/business]

## Steps to Reproduce
1. [First step]
2. [Second step]
3. [Third step]
4. [Continue until bug occurs]

**Reproducibility**: [Always/Sometimes/Rarely]
**Frequency**: [How often it occurs]

## Test Data Used
- **Input Data**: [Specific data that caused the issue]
- **User Account**: [Test account details]
- **Configuration**: [Specific settings]

## Evidence
**Screenshots**: [Attach relevant screenshots]
**Videos**: [Screen recordings if helpful]
**Logs**: [Error logs, console output]
**Network Traces**: [API calls, network activity]

## Workaround
**Temporary Solution**: [If any workaround exists]
**Limitations**: [Workaround limitations]

## Additional Information
**Related Bugs**: [Links to similar issues]
**Test Case Reference**: [Related test case ID]
**Requirements**: [Related requirement documents]
    `,

    defectClassification: `
# Defect Classification Guide

## Severity Levels
**Critical (S1)**
- System crashes or becomes unusable
- Data loss or corruption
- Security vulnerabilities
- Complete feature failure

**High (S2)**
- Major feature not working as expected
- Significant performance issues
- Workaround exists but difficult
- Affects multiple users

**Medium (S3)**
- Minor feature issues
- Cosmetic problems affecting usability
- Easy workaround available
- Affects limited users

**Low (S4)**
- Cosmetic issues
- Documentation errors
- Enhancement requests
- Minimal user impact

## Priority Levels
**P1 - Critical**
- Must be fixed immediately
- Blocks testing or release
- No workaround available

**P2 - High**
- Should be fixed in current release
- Important for user experience
- Workaround may exist

**P3 - Medium**
- Can be fixed in next release
- Moderate impact on users
- Acceptable workaround exists

**P4 - Low**
- Nice to have fix
- Minimal impact
- Can be deferred

## Bug Categories
1. **Functional**: Feature not working as designed
2. **UI/UX**: User interface and experience issues
3. **Performance**: Speed, responsiveness problems
4. **Security**: Vulnerabilities, access control
5. **Compatibility**: Browser, OS, device issues
6. **Data**: Data integrity, validation problems
7. **Integration**: API, third-party service issues
8. **Usability**: User experience problems
    `,

    bugTriageProcess: `
# Bug Triage Process

## Triage Steps
1. **Initial Review**
   - Verify bug reproducibility
   - Check for duplicates
   - Validate environment details
   - Assess completeness of report

2. **Classification**
   - Assign severity level
   - Set priority
   - Categorize bug type
   - Identify affected components

3. **Assignment**
   - Route to appropriate team
   - Assign to specific developer
   - Set target resolution date
   - Add to sprint/backlog

4. **Communication**
   - Notify stakeholders
   - Update bug tracking system
   - Schedule review meetings
   - Document decisions

## Triage Criteria
**Accept Bug If:**
- Clearly reproducible
- Valid business impact
- Complete information provided
- Not a duplicate
- Within project scope

**Reject Bug If:**
- Cannot reproduce
- Working as designed
- Duplicate of existing bug
- Out of scope
- Insufficient information

## Escalation Matrix
- **P1 Bugs**: Immediate escalation to team lead
- **P2 Bugs**: Daily review with project manager
- **P3 Bugs**: Weekly triage meeting
- **P4 Bugs**: Monthly backlog review
    `
  },

  // Testing Strategy Guides
  testingStrategy: {
    testPlanTemplate: `
# Test Plan Template

## Test Plan Overview
**Project**: [Project name]
**Version**: [Software version]
**Test Manager**: [Name]
**Start Date**: [Date]
**End Date**: [Date]

## Test Objectives
- **Primary Objectives**: [Main testing goals]
- **Success Criteria**: [How success is measured]
- **Exit Criteria**: [When testing is complete]

## Scope of Testing
**In Scope:**
- [Feature 1: Description]
- [Feature 2: Description]
- [Feature 3: Description]

**Out of Scope:**
- [Excluded feature 1]
- [Excluded feature 2]
- [Third-party integrations]

## Test Approach
**Testing Types:**
- Functional Testing
- Integration Testing
- Performance Testing
- Security Testing
- Usability Testing
- Compatibility Testing

**Testing Levels:**
- Unit Testing (Developer responsibility)
- Integration Testing
- System Testing
- User Acceptance Testing

## Test Environment
**Hardware Requirements:**
- Servers: [Specifications]
- Workstations: [Specifications]
- Mobile Devices: [Device list]

**Software Requirements:**
- Operating Systems: [List]
- Browsers: [Supported versions]
- Databases: [Database systems]
- Third-party Tools: [Testing tools]

**Test Data Requirements:**
- Production-like data volume
- Anonymized customer data
- Edge case scenarios
- Performance test data

## Resource Planning
**Team Structure:**
- Test Manager: [Name]
- Senior Testers: [Names]
- Junior Testers: [Names]
- Automation Engineers: [Names]

**Skills Required:**
- Manual testing expertise
- Automation framework knowledge
- Domain knowledge
- Tool proficiency

## Test Schedule
| Phase | Start Date | End Date | Deliverables |
|-------|------------|----------|---------------|
| Test Planning | [Date] | [Date] | Test plan, test cases |
| Test Execution | [Date] | [Date] | Test results, bug reports |
| Test Closure | [Date] | [Date] | Test summary report |

## Risk Assessment
**High Risks:**
- [Risk 1: Description and mitigation]
- [Risk 2: Description and mitigation]

**Medium Risks:**
- [Risk 3: Description and mitigation]
- [Risk 4: Description and mitigation]

## Deliverables
- Test plan document
- Test case specifications
- Test execution reports
- Defect reports
- Test summary report
- Lessons learned document
    `,

    automationStrategy: `
# Test Automation Strategy

## Automation Objectives
- Reduce manual testing effort
- Increase test coverage
- Enable continuous testing
- Improve test reliability
- Accelerate feedback cycles

## Automation Scope
**Good Candidates for Automation:**
- Regression test suites
- Data-driven test scenarios
- Repetitive test cases
- Performance tests
- API tests
- Smoke tests

**Not Suitable for Automation:**
- Exploratory testing
- Usability testing
- Ad-hoc testing
- One-time tests
- Complex user interactions

## Tool Selection Criteria
**Evaluation Factors:**
- Technology compatibility
- Ease of use and learning curve
- Maintenance requirements
- Reporting capabilities
- Integration with CI/CD
- Cost and licensing
- Community support

**Recommended Tools:**
- **Web UI**: Selenium, Playwright, Cypress
- **API**: Postman, REST Assured, Karate
- **Mobile**: Appium, Espresso, XCUITest
- **Performance**: JMeter, LoadRunner, K6
- **CI/CD**: Jenkins, GitHub Actions, Azure DevOps

## Framework Design
**Architecture Principles:**
- Page Object Model (POM)
- Data-driven testing
- Keyword-driven testing
- Modular design
- Reusable components

**Framework Components:**
- Test data management
- Configuration management
- Reporting and logging
- Error handling
- Test execution engine

## Implementation Plan
**Phase 1: Foundation (Weeks 1-4)**
- Tool setup and configuration
- Framework development
- Initial test automation
- Team training

**Phase 2: Expansion (Weeks 5-8)**
- Automate critical test cases
- Integrate with CI/CD pipeline
- Establish reporting
- Performance optimization

**Phase 3: Maturity (Weeks 9-12)**
- Full regression suite automation
- Advanced reporting
- Maintenance processes
- Knowledge transfer

## Maintenance Strategy
**Regular Activities:**
- Test script updates
- Framework enhancements
- Performance monitoring
- Tool upgrades
- Training and knowledge sharing

**Success Metrics:**
- Automation coverage percentage
- Test execution time reduction
- Defect detection rate
- Maintenance effort
- ROI calculation
    `,

    regressionTestStrategy: `
# Regression Testing Strategy

## Regression Testing Objectives
- Ensure existing functionality works after changes
- Validate that new features don't break existing ones
- Maintain software quality throughout development
- Provide confidence for releases

## Regression Test Selection
**Selection Criteria:**
- Critical business functionality
- Frequently used features
- Previously defective areas
- Integration points
- Core system workflows

**Test Prioritization:**
1. **Priority 1**: Critical business functions
2. **Priority 2**: Major features and workflows
3. **Priority 3**: Secondary features
4. **Priority 4**: Nice-to-have functionality

## Regression Test Types
**Full Regression:**
- Complete test suite execution
- Used for major releases
- Comprehensive coverage
- Time-intensive approach

**Selective Regression:**
- Subset of test cases
- Based on impact analysis
- Faster execution
- Risk-based selection

**Progressive Regression:**
- New test cases for new features
- Existing test cases for unchanged features
- Balanced approach
- Continuous improvement

## Impact Analysis Process
1. **Code Change Analysis**
   - Identify modified components
   - Trace dependencies
   - Assess risk levels
   - Map to test cases

2. **Test Case Selection**
   - Select affected test cases
   - Include dependency tests
   - Add integration tests
   - Consider user workflows

3. **Execution Planning**
   - Prioritize test execution
   - Allocate resources
   - Schedule test runs
   - Plan automation

## Automation Integration
**Automated Regression Suite:**
- Core functionality tests
- API regression tests
- Database integrity tests
- Performance benchmarks

**Manual Regression Tests:**
- User experience validation
- Exploratory testing
- Complex business scenarios
- Visual verification

## Execution Strategy
**Continuous Integration:**
- Automated smoke tests on every commit
- Nightly regression runs
- Weekly full regression
- Release candidate validation

**Parallel Execution:**
- Multiple test environments
- Distributed test execution
- Browser/device parallelization
- Reduced execution time

## Success Metrics
- Test coverage percentage
- Defect detection rate
- Execution time trends
- Pass/fail rates
- Automation coverage
    `
  },

  // Quality Assessment Prompts
  qualityAssessment: {
    qualityMetrics: `
# Quality Metrics Dashboard

## Test Coverage Metrics
**Functional Coverage:**
- Requirements coverage: [X%]
- Feature coverage: [X%]
- User story coverage: [X%]
- Test case coverage: [X%]

**Code Coverage:**
- Line coverage: [X%]
- Branch coverage: [X%]
- Function coverage: [X%]
- Statement coverage: [X%]

**Automation Coverage:**
- Automated test percentage: [X%]
- Manual test percentage: [X%]
- Regression automation: [X%]
- API test automation: [X%]

## Defect Metrics
**Defect Density:**
- Defects per KLOC: [Number]
- Defects per feature: [Number]
- Defects per test case: [Number]

**Defect Distribution:**
- Critical: [X%]
- High: [X%]
- Medium: [X%]
- Low: [X%]

**Defect Resolution:**
- Average resolution time: [Days]
- First-time fix rate: [X%]
- Defect leakage rate: [X%]
- Reopened defects: [X%]

## Test Execution Metrics
**Test Progress:**
- Tests planned: [Number]
- Tests executed: [Number]
- Tests passed: [Number]
- Tests failed: [Number]
- Tests blocked: [Number]

**Execution Efficiency:**
- Test execution rate: [Tests/day]
- Pass rate: [X%]
- Automation execution time: [Hours]
- Manual execution time: [Hours]

## Quality Indicators
**Release Readiness:**
- Exit criteria met: [Yes/No]
- Critical defects: [Number]
- Test coverage achieved: [X%]
- Performance benchmarks: [Met/Not Met]

**Trend Analysis:**
- Defect discovery rate
- Test pass rate trends
- Coverage improvement
- Automation growth
    `,

    qualityGates: `
# Quality Gates Definition

## Entry Criteria
**Development Complete:**
- All features implemented
- Unit tests passing
- Code review completed
- Build deployed to test environment

**Test Environment Ready:**
- Environment configured
- Test data loaded
- Tools and access available
- Dependencies resolved

## Exit Criteria
**Functional Quality:**
- 100% critical test cases passed
- 95% high priority test cases passed
- No open critical defects
- Maximum 2 high severity defects

**Performance Quality:**
- Response time within SLA
- Throughput meets requirements
- Resource utilization acceptable
- No memory leaks detected

**Security Quality:**
- Security tests passed
- Vulnerability scan clean
- Authentication/authorization working
- Data protection verified

## Quality Gate Reviews
**Gate 1: Test Readiness**
- Entry criteria verification
- Test plan approval
- Resource allocation
- Risk assessment

**Gate 2: Test Execution**
- Test progress review
- Defect triage
- Coverage assessment
- Schedule adherence

**Gate 3: Release Readiness**
- Exit criteria verification
- Defect closure
- Performance validation
- Sign-off approval

## Escalation Process
**Quality Issues:**
- Immediate escalation for critical defects
- Daily review of high severity issues
- Weekly quality metrics review
- Monthly quality trend analysis

**Decision Authority:**
- Test Manager: Test execution decisions
- Project Manager: Schedule and resource decisions
- Product Owner: Feature and priority decisions
- Release Manager: Go/no-go decisions
    `,

    testCompletionReport: `
# Test Completion Report Template

## Executive Summary
**Project**: [Project name]
**Testing Period**: [Start date] - [End date]
**Test Manager**: [Name]
**Overall Status**: [Pass/Fail/Conditional Pass]

**Key Highlights:**
- [Major achievement 1]
- [Major achievement 2]
- [Key finding 1]
- [Key finding 2]

## Test Execution Summary
**Test Coverage:**
- Total test cases: [Number]
- Test cases executed: [Number] ([X%])
- Test cases passed: [Number] ([X%])
- Test cases failed: [Number] ([X%])
- Test cases blocked: [Number] ([X%])

**Feature Coverage:**
| Feature | Test Cases | Executed | Passed | Failed | Coverage |
|---------|------------|----------|--------|--------|-----------|
| Feature 1 | [#] | [#] | [#] | [#] | [X%] |
| Feature 2 | [#] | [#] | [#] | [#] | [X%] |

## Defect Summary
**Defect Statistics:**
- Total defects found: [Number]
- Critical defects: [Number]
- High severity defects: [Number]
- Medium severity defects: [Number]
- Low severity defects: [Number]

**Defect Status:**
- Fixed and verified: [Number]
- Fixed pending verification: [Number]
- Open defects: [Number]
- Deferred defects: [Number]

**Top Defect Areas:**
1. [Component]: [Number] defects
2. [Component]: [Number] defects
3. [Component]: [Number] defects

## Quality Assessment
**Quality Metrics:**
- Defect density: [Defects per KLOC]
- Test effectiveness: [Defects found in testing vs production]
- First-time pass rate: [X%]
- Automation coverage: [X%]

**Performance Results:**
- Response time: [Within/Outside] SLA
- Throughput: [Meets/Doesn't meet] requirements
- Resource utilization: [Acceptable/High]
- Scalability: [Validated/Issues found]

## Risk Assessment
**High Risks:**
- [Risk 1]: [Description and impact]
- [Risk 2]: [Description and impact]

**Medium Risks:**
- [Risk 3]: [Description and mitigation]
- [Risk 4]: [Description and mitigation]

## Recommendations
**For Current Release:**
1. [Recommendation 1]
2. [Recommendation 2]
3. [Recommendation 3]

**For Future Releases:**
1. [Process improvement 1]
2. [Tool enhancement 1]
3. [Training need 1]

## Lessons Learned
**What Went Well:**
- [Success 1]
- [Success 2]
- [Success 3]

**Areas for Improvement:**
- [Improvement area 1]
- [Improvement area 2]
- [Improvement area 3]

## Conclusion
**Release Recommendation**: [Go/No-Go/Conditional Go]
**Justification**: [Reasoning for recommendation]
**Conditions** (if applicable): [Conditions that must be met]
    `
  }
};

export default QATesterPrompts;