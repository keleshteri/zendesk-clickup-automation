/**
 * Software Engineer Agent Prompts
 * Comprehensive templates for code analysis, technical solutions, architecture reviews, and debugging workflows
 */

export const SoftwareEngineerPrompts = {
  // Code Analysis Templates
  codeAnalysis: {
    codeReviewTemplate: `
# Code Review Checklist

## General Code Quality
- [ ] **Readability**: Code is clear and well-documented
- [ ] **Naming**: Variables, functions, and classes have meaningful names
- [ ] **Structure**: Code is well-organized and follows project conventions
- [ ] **Comments**: Complex logic is properly explained
- [ ] **Formatting**: Consistent indentation and style

## Functionality
- [ ] **Requirements**: Code meets specified requirements
- [ ] **Edge Cases**: Handles boundary conditions appropriately
- [ ] **Error Handling**: Proper exception handling and validation
- [ ] **Input Validation**: User inputs are validated and sanitized
- [ ] **Output**: Returns expected results in correct format

## Performance
- [ ] **Efficiency**: Algorithms and data structures are appropriate
- [ ] **Memory Usage**: No memory leaks or excessive allocation
- [ ] **Database Queries**: Optimized and avoid N+1 problems
- [ ] **Caching**: Appropriate use of caching mechanisms
- [ ] **Scalability**: Code can handle expected load

## Security
- [ ] **Authentication**: Proper user authentication checks
- [ ] **Authorization**: Correct permission validations
- [ ] **Data Protection**: Sensitive data is encrypted/protected
- [ ] **SQL Injection**: Parameterized queries used
- [ ] **XSS Prevention**: Output is properly escaped
- [ ] **CSRF Protection**: Cross-site request forgery prevention

## Testing
- [ ] **Unit Tests**: Adequate test coverage
- [ ] **Integration Tests**: Component interactions tested
- [ ] **Test Quality**: Tests are meaningful and maintainable
- [ ] **Mock Usage**: Appropriate use of mocks and stubs
- [ ] **Test Data**: Realistic test scenarios

## Maintainability
- [ ] **SOLID Principles**: Single responsibility, open/closed, etc.
- [ ] **DRY Principle**: Don't repeat yourself
- [ ] **Coupling**: Low coupling between components
- [ ] **Cohesion**: High cohesion within components
- [ ] **Refactoring**: Code is clean and refactored
    `,

    staticAnalysisTemplate: `
# Static Code Analysis Report

## Code Metrics
**Complexity Metrics:**
- Cyclomatic Complexity: [Value] (Target: < 10)
- Lines of Code: [Value]
- Function Length: [Average/Max] (Target: < 50 lines)
- Class Size: [Average/Max] (Target: < 500 lines)
- Nesting Depth: [Max] (Target: < 4)

**Quality Metrics:**
- Code Coverage: [X%] (Target: > 80%)
- Test Coverage: [X%] (Target: > 90%)
- Documentation Coverage: [X%] (Target: > 70%)
- Duplication Rate: [X%] (Target: < 5%)

## Code Smells Detected
**Critical Issues:**
- [Issue 1]: [Description and location]
- [Issue 2]: [Description and location]

**Major Issues:**
- [Issue 3]: [Description and location]
- [Issue 4]: [Description and location]

**Minor Issues:**
- [Issue 5]: [Description and location]
- [Issue 6]: [Description and location]

## Security Vulnerabilities
**High Severity:**
- [Vulnerability 1]: [Description and remediation]
- [Vulnerability 2]: [Description and remediation]

**Medium Severity:**
- [Vulnerability 3]: [Description and remediation]
- [Vulnerability 4]: [Description and remediation]

## Performance Issues
**Database Related:**
- N+1 Query Problems: [Locations]
- Missing Indexes: [Tables/Columns]
- Inefficient Queries: [Query examples]

**Algorithm Related:**
- Inefficient Loops: [Locations]
- Unnecessary Computations: [Examples]
- Memory Intensive Operations: [Locations]

## Recommendations
**Immediate Actions:**
1. [High priority fix 1]
2. [High priority fix 2]
3. [High priority fix 3]

**Long-term Improvements:**
1. [Architectural improvement 1]
2. [Process improvement 1]
3. [Tool/framework upgrade 1]
    `,

    performanceAnalysisTemplate: `
# Performance Analysis Template

## Performance Profiling Results
**Execution Time Analysis:**
- Total Execution Time: [ms]
- CPU Time: [ms]
- I/O Wait Time: [ms]
- Network Time: [ms]
- Database Time: [ms]

**Memory Usage Analysis:**
- Peak Memory Usage: [MB]
- Average Memory Usage: [MB]
- Memory Leaks Detected: [Yes/No]
- Garbage Collection Impact: [%]

**Hotspot Analysis:**
| Function/Method | Execution Time | Call Count | % of Total |
|-----------------|----------------|------------|------------|
| [Function 1] | [ms] | [count] | [%] |
| [Function 2] | [ms] | [count] | [%] |
| [Function 3] | [ms] | [count] | [%] |

## Database Performance
**Query Performance:**
- Slowest Queries: [List with execution times]
- Most Frequent Queries: [List with call counts]
- Index Usage: [Effective/Needs improvement]
- Connection Pool Usage: [%]

**Database Metrics:**
- Query Response Time: [Average/P95/P99]
- Connection Count: [Current/Max]
- Lock Contention: [Detected issues]
- Deadlocks: [Count and causes]

## Network Performance
**API Response Times:**
- Average Response Time: [ms]
- P95 Response Time: [ms]
- P99 Response Time: [ms]
- Error Rate: [%]

**External Dependencies:**
- Third-party API Calls: [Response times]
- File System Operations: [I/O metrics]
- Cache Hit Ratio: [%]

## Optimization Recommendations
**Code Optimizations:**
1. [Specific optimization 1]
2. [Specific optimization 2]
3. [Specific optimization 3]

**Infrastructure Optimizations:**
1. [Infrastructure change 1]
2. [Infrastructure change 2]
3. [Infrastructure change 3]

**Database Optimizations:**
1. [Database optimization 1]
2. [Database optimization 2]
3. [Database optimization 3]
    `
  },

  // Technical Solution Guides
  technicalSolutions: {
    solutionDesignTemplate: `
# Technical Solution Design Template

## Problem Statement
**Business Problem:**
[Clear description of the business problem to solve]

**Technical Challenge:**
[Specific technical challenges and constraints]

**Success Criteria:**
[How success will be measured]

## Requirements Analysis
**Functional Requirements:**
1. [Requirement 1]: [Description]
2. [Requirement 2]: [Description]
3. [Requirement 3]: [Description]

**Non-Functional Requirements:**
- **Performance**: [Response time, throughput requirements]
- **Scalability**: [Expected load, growth projections]
- **Reliability**: [Uptime, error rate requirements]
- **Security**: [Security standards, compliance needs]
- **Maintainability**: [Code quality, documentation needs]

## Solution Architecture
**High-Level Architecture:**
\`\`\`
[ASCII diagram or description of system components]
\`\`\`

**Component Breakdown:**
1. **Component 1**: [Purpose and responsibilities]
2. **Component 2**: [Purpose and responsibilities]
3. **Component 3**: [Purpose and responsibilities]

**Data Flow:**
1. [Step 1]: [Data flow description]
2. [Step 2]: [Data flow description]
3. [Step 3]: [Data flow description]

## Technology Stack
**Backend Technologies:**
- Programming Language: [Language and version]
- Framework: [Framework and version]
- Database: [Database system and version]
- Cache: [Caching solution]
- Message Queue: [If applicable]

**Frontend Technologies:**
- Framework: [React/Vue/Angular]
- State Management: [Redux/Vuex/NgRx]
- UI Library: [Material-UI/Ant Design/etc.]
- Build Tools: [Webpack/Vite/etc.]

**Infrastructure:**
- Cloud Provider: [AWS/Azure/GCP]
- Container Platform: [Docker/Kubernetes]
- CI/CD: [Jenkins/GitHub Actions/etc.]
- Monitoring: [Monitoring tools]

## Implementation Plan
**Phase 1: Foundation (Weeks 1-2)**
- Set up development environment
- Create basic project structure
- Implement core data models
- Set up CI/CD pipeline

**Phase 2: Core Features (Weeks 3-6)**
- Implement main business logic
- Create API endpoints
- Develop user interface
- Add authentication/authorization

**Phase 3: Integration & Testing (Weeks 7-8)**
- Integrate with external systems
- Comprehensive testing
- Performance optimization
- Security hardening

**Phase 4: Deployment & Monitoring (Week 9)**
- Production deployment
- Monitoring setup
- Documentation completion
- Knowledge transfer

## Risk Assessment
**Technical Risks:**
- [Risk 1]: [Description, impact, mitigation]
- [Risk 2]: [Description, impact, mitigation]
- [Risk 3]: [Description, impact, mitigation]

**Integration Risks:**
- [Risk 4]: [Description, impact, mitigation]
- [Risk 5]: [Description, impact, mitigation]

## Success Metrics
**Performance Metrics:**
- Response Time: [Target]
- Throughput: [Target]
- Error Rate: [Target]
- Uptime: [Target]

**Business Metrics:**
- User Adoption: [Target]
- Feature Usage: [Target]
- Customer Satisfaction: [Target]
    `,

    apiDesignTemplate: `
# API Design Template

## API Overview
**API Name**: [API Name]
**Version**: [v1.0]
**Base URL**: [https://api.example.com/v1]
**Authentication**: [Bearer Token/API Key/OAuth]

## Design Principles
- **RESTful**: Follow REST conventions
- **Consistent**: Uniform naming and structure
- **Versioned**: Support for API versioning
- **Documented**: Comprehensive documentation
- **Secure**: Authentication and authorization
- **Performant**: Optimized for speed and efficiency

## Resource Design
**Resource 1: Users**
\`\`\`
GET    /users           # List users
GET    /users/{id}      # Get user by ID
POST   /users           # Create user
PUT    /users/{id}      # Update user
DELETE /users/{id}      # Delete user
\`\`\`

**Resource 2: Products**
\`\`\`
GET    /products        # List products
GET    /products/{id}   # Get product by ID
POST   /products        # Create product
PUT    /products/{id}   # Update product
DELETE /products/{id}   # Delete product
\`\`\`

## Request/Response Format
**Standard Request Headers:**
\`\`\`
Content-Type: application/json
Authorization: Bearer {token}
X-API-Version: v1
\`\`\`

**Standard Response Format:**
\`\`\`json
{
  "status": "success|error",
  "data": {
    // Response data
  },
  "message": "Human readable message",
  "errors": [
    // Error details
  ],
  "meta": {
    "timestamp": "2023-01-01T00:00:00Z",
    "request_id": "uuid"
  }
}
\`\`\`

## Error Handling
**HTTP Status Codes:**
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 422: Validation Error
- 500: Internal Server Error

**Error Response Format:**
\`\`\`json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "code": "INVALID_FORMAT",
      "message": "Email format is invalid"
    }
  ]
}
\`\`\`

## Pagination
**Query Parameters:**
- page: Page number (default: 1)
- limit: Items per page (default: 20, max: 100)
- sort: Sort field and direction (e.g., "name:asc")

**Pagination Response:**
\`\`\`json
{
  "data": [...],
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total": 100,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
\`\`\`

## Security Considerations
**Authentication:**
- JWT tokens with expiration
- Refresh token mechanism
- Rate limiting per user

**Authorization:**
- Role-based access control
- Resource-level permissions
- API key restrictions

**Data Protection:**
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- HTTPS enforcement
    `,

    databaseDesignTemplate: `
# Database Design Template

## Database Overview
**Database Type**: [PostgreSQL/MySQL/MongoDB]
**Schema Name**: [schema_name]
**Purpose**: [Brief description of database purpose]

## Entity Relationship Design
**Core Entities:**
1. **Users**
   - Primary Key: user_id (UUID)
   - Attributes: email, password_hash, first_name, last_name, created_at, updated_at
   - Relationships: One-to-many with Orders

2. **Products**
   - Primary Key: product_id (UUID)
   - Attributes: name, description, price, category_id, created_at, updated_at
   - Relationships: Many-to-one with Categories

3. **Orders**
   - Primary Key: order_id (UUID)
   - Attributes: user_id, total_amount, status, created_at, updated_at
   - Relationships: Many-to-one with Users, One-to-many with OrderItems

## Table Definitions
**Users Table:**
\`\`\`sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

**Products Table:**
\`\`\`sql
CREATE TABLE products (
    product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id UUID REFERENCES categories(category_id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

## Indexing Strategy
**Primary Indexes:**
- All primary keys (automatic)
- Foreign key columns
- Unique constraints

**Secondary Indexes:**
\`\`\`sql
-- User email lookup
CREATE INDEX idx_users_email ON users(email);

-- Product category filtering
CREATE INDEX idx_products_category ON products(category_id);

-- Order date range queries
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Composite index for user orders
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
\`\`\`

## Data Integrity
**Constraints:**
- Primary key constraints
- Foreign key constraints
- Unique constraints
- Check constraints
- Not null constraints

**Triggers:**
\`\`\`sql
-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
\`\`\`

## Performance Considerations
**Query Optimization:**
- Use appropriate indexes
- Avoid N+1 queries
- Use connection pooling
- Implement query caching

**Partitioning Strategy:**
- Time-based partitioning for large tables
- Hash partitioning for distributed load
- Range partitioning for ordered data

**Backup and Recovery:**
- Daily automated backups
- Point-in-time recovery capability
- Backup retention policy
- Disaster recovery procedures
    `
  },

  // Architecture Review Prompts
  architectureReview: {
    systemArchitectureReview: `
# System Architecture Review Template

## Architecture Overview
**System Name**: [System Name]
**Architecture Style**: [Microservices/Monolith/Serverless/Hybrid]
**Review Date**: [Date]
**Reviewer**: [Name and Role]

## Architecture Assessment
**Scalability:**
- [ ] Horizontal scaling capability
- [ ] Load balancing implementation
- [ ] Database scaling strategy
- [ ] Caching mechanisms
- [ ] CDN usage for static content

**Reliability:**
- [ ] Fault tolerance mechanisms
- [ ] Circuit breaker patterns
- [ ] Retry logic implementation
- [ ] Graceful degradation
- [ ] Health check endpoints

**Performance:**
- [ ] Response time optimization
- [ ] Database query optimization
- [ ] Caching strategy
- [ ] Asynchronous processing
- [ ] Resource utilization efficiency

**Security:**
- [ ] Authentication mechanisms
- [ ] Authorization controls
- [ ] Data encryption (at rest and in transit)
- [ ] API security (rate limiting, validation)
- [ ] Network security (firewalls, VPNs)

## Component Analysis
**Frontend Components:**
- **Web Application**: [Technology, strengths, weaknesses]
- **Mobile Application**: [Technology, strengths, weaknesses]
- **Admin Dashboard**: [Technology, strengths, weaknesses]

**Backend Components:**
- **API Gateway**: [Implementation, routing, security]
- **Application Services**: [Business logic, data processing]
- **Background Jobs**: [Queue system, processing]
- **Database Layer**: [Data storage, access patterns]

**Infrastructure Components:**
- **Load Balancers**: [Configuration, health checks]
- **Web Servers**: [Technology, configuration]
- **Application Servers**: [Runtime, scaling]
- **Database Servers**: [Replication, backup]

## Integration Patterns
**Internal Integrations:**
- Service-to-service communication
- Data synchronization mechanisms
- Event-driven architecture
- Message queuing systems

**External Integrations:**
- Third-party API integrations
- Payment gateway connections
- Authentication providers
- Monitoring and logging services

## Data Architecture
**Data Storage:**
- Primary database design
- Data warehouse/analytics
- File storage systems
- Caching layers

**Data Flow:**
- Data ingestion processes
- ETL/ELT pipelines
- Real-time data streaming
- Data backup and recovery

## Deployment Architecture
**Environment Strategy:**
- Development environment
- Staging environment
- Production environment
- Disaster recovery environment

**Deployment Process:**
- CI/CD pipeline implementation
- Blue-green deployment
- Canary releases
- Rollback procedures

## Recommendations
**Immediate Improvements:**
1. [High priority recommendation 1]
2. [High priority recommendation 2]
3. [High priority recommendation 3]

**Long-term Enhancements:**
1. [Strategic improvement 1]
2. [Strategic improvement 2]
3. [Strategic improvement 3]

**Risk Mitigation:**
1. [Risk 1 and mitigation strategy]
2. [Risk 2 and mitigation strategy]
3. [Risk 3 and mitigation strategy]
    `,

    microservicesReview: `
# Microservices Architecture Review

## Service Inventory
**Core Services:**
| Service Name | Purpose | Technology | Team Owner | Status |
|--------------|---------|------------|------------|--------|
| User Service | User management | Node.js | Team A | Active |
| Product Service | Product catalog | Java | Team B | Active |
| Order Service | Order processing | Python | Team C | Active |

## Service Design Principles
**Single Responsibility:**
- [ ] Each service has a clear, single purpose
- [ ] Services are loosely coupled
- [ ] High cohesion within services
- [ ] Clear service boundaries

**Data Management:**
- [ ] Database per service pattern
- [ ] No shared databases between services
- [ ] Event sourcing where appropriate
- [ ] CQRS implementation

**Communication Patterns:**
- [ ] Synchronous communication (REST/GraphQL)
- [ ] Asynchronous messaging (Events/Messages)
- [ ] Service mesh implementation
- [ ] API versioning strategy

## Service Quality Assessment
**Observability:**
- [ ] Distributed tracing implemented
- [ ] Centralized logging
- [ ] Metrics collection
- [ ] Health check endpoints
- [ ] Service dependency mapping

**Resilience:**
- [ ] Circuit breaker pattern
- [ ] Timeout configurations
- [ ] Retry mechanisms
- [ ] Bulkhead pattern
- [ ] Graceful degradation

**Security:**
- [ ] Service-to-service authentication
- [ ] API gateway security
- [ ] Network segmentation
- [ ] Secrets management
- [ ] Security scanning

## Data Consistency
**Consistency Patterns:**
- Eventual consistency implementation
- Saga pattern for distributed transactions
- Event sourcing for audit trails
- CQRS for read/write separation

**Data Synchronization:**
- Event-driven data updates
- Message ordering guarantees
- Duplicate message handling
- Data reconciliation processes

## Deployment and Operations
**Container Strategy:**
- [ ] Docker containerization
- [ ] Kubernetes orchestration
- [ ] Resource limits and requests
- [ ] Health checks and readiness probes

**CI/CD Pipeline:**
- [ ] Independent service deployments
- [ ] Automated testing
- [ ] Canary deployments
- [ ] Rollback capabilities

**Monitoring and Alerting:**
- [ ] Service-level metrics
- [ ] Business metrics
- [ ] Error rate monitoring
- [ ] Performance monitoring
- [ ] Capacity planning

## Recommendations
**Service Optimization:**
1. [Service-specific improvement 1]
2. [Service-specific improvement 2]
3. [Service-specific improvement 3]

**Architecture Improvements:**
1. [Architecture enhancement 1]
2. [Architecture enhancement 2]
3. [Architecture enhancement 3]

**Operational Excellence:**
1. [Operational improvement 1]
2. [Operational improvement 2]
3. [Operational improvement 3]
    `,

    securityArchitectureReview: `
# Security Architecture Review

## Security Assessment Overview
**System**: [System Name]
**Review Date**: [Date]
**Security Level**: [Public/Internal/Confidential/Restricted]
**Compliance Requirements**: [GDPR/HIPAA/SOX/PCI-DSS]

## Authentication and Authorization
**Authentication Mechanisms:**
- [ ] Multi-factor authentication (MFA)
- [ ] Single sign-on (SSO) integration
- [ ] Password policy enforcement
- [ ] Account lockout mechanisms
- [ ] Session management

**Authorization Controls:**
- [ ] Role-based access control (RBAC)
- [ ] Attribute-based access control (ABAC)
- [ ] Principle of least privilege
- [ ] Regular access reviews
- [ ] Privileged account management

## Data Protection
**Data Classification:**
- Public data: [Description and handling]
- Internal data: [Description and handling]
- Confidential data: [Description and handling]
- Restricted data: [Description and handling]

**Encryption:**
- [ ] Data at rest encryption
- [ ] Data in transit encryption (TLS 1.3)
- [ ] Database encryption
- [ ] File system encryption
- [ ] Key management system

**Data Loss Prevention:**
- [ ] Data masking in non-production
- [ ] Data retention policies
- [ ] Secure data disposal
- [ ] Data backup encryption
- [ ] Cross-border data transfer controls

## Network Security
**Network Segmentation:**
- [ ] DMZ implementation
- [ ] Internal network isolation
- [ ] Micro-segmentation
- [ ] Zero-trust architecture

**Firewall Configuration:**
- [ ] Web application firewall (WAF)
- [ ] Network firewalls
- [ ] Intrusion detection/prevention
- [ ] DDoS protection
- [ ] VPN access controls

## Application Security
**Secure Development:**
- [ ] Security code reviews
- [ ] Static application security testing (SAST)
- [ ] Dynamic application security testing (DAST)
- [ ] Dependency vulnerability scanning
- [ ] Security training for developers

**Runtime Protection:**
- [ ] Input validation and sanitization
- [ ] Output encoding
- [ ] SQL injection prevention
- [ ] Cross-site scripting (XSS) protection
- [ ] Cross-site request forgery (CSRF) protection

## Infrastructure Security
**Server Hardening:**
- [ ] Operating system hardening
- [ ] Service minimization
- [ ] Regular security patching
- [ ] Antivirus/anti-malware
- [ ] Host-based intrusion detection

**Container Security:**
- [ ] Container image scanning
- [ ] Runtime security monitoring
- [ ] Secrets management
- [ ] Network policies
- [ ] Resource limits

## Monitoring and Incident Response
**Security Monitoring:**
- [ ] Security information and event management (SIEM)
- [ ] Log aggregation and analysis
- [ ] Anomaly detection
- [ ] Threat intelligence integration
- [ ] Security metrics and KPIs

**Incident Response:**
- [ ] Incident response plan
- [ ] Security team contacts
- [ ] Escalation procedures
- [ ] Forensic capabilities
- [ ] Business continuity planning

## Compliance and Governance
**Regulatory Compliance:**
- [ ] Data protection regulations (GDPR)
- [ ] Industry standards (ISO 27001)
- [ ] Audit requirements
- [ ] Documentation maintenance
- [ ] Regular compliance assessments

**Security Governance:**
- [ ] Security policies and procedures
- [ ] Risk assessment processes
- [ ] Security awareness training
- [ ] Vendor security assessments
- [ ] Third-party risk management

## Recommendations
**Critical Security Issues:**
1. [Critical issue 1 and remediation]
2. [Critical issue 2 and remediation]
3. [Critical issue 3 and remediation]

**Security Enhancements:**
1. [Enhancement 1 and implementation plan]
2. [Enhancement 2 and implementation plan]
3. [Enhancement 3 and implementation plan]

**Compliance Improvements:**
1. [Compliance gap 1 and resolution]
2. [Compliance gap 2 and resolution]
3. [Compliance gap 3 and resolution]
    `
  },

  // Debugging Workflows
  debugging: {
    bugInvestigationTemplate: `
# Bug Investigation Template

## Bug Information
**Bug ID**: [BUG-XXX]
**Reporter**: [Name]
**Date Reported**: [Date]
**Severity**: [Critical/High/Medium/Low]
**Priority**: [P1/P2/P3/P4]

## Problem Description
**Summary**: [Brief description of the issue]
**Expected Behavior**: [What should happen]
**Actual Behavior**: [What actually happens]
**Impact**: [Effect on users/business]

## Environment Details
**Environment**: [Production/Staging/Development]
**Version**: [Software version]
**Browser/Client**: [Browser version or client details]
**Operating System**: [OS and version]
**Device**: [Desktop/Mobile/Tablet]

## Reproduction Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]
4. [Continue until bug occurs]

**Reproducibility**: [Always/Sometimes/Rarely]
**Test Data**: [Specific data used]

## Initial Investigation
**Hypothesis**: [Initial theory about the cause]
**Areas to Investigate**:
- [ ] Frontend code
- [ ] Backend API
- [ ] Database queries
- [ ] Third-party integrations
- [ ] Infrastructure/deployment
- [ ] Configuration settings

## Evidence Collection
**Logs Reviewed**:
- Application logs: [Findings]
- Error logs: [Findings]
- Database logs: [Findings]
- Web server logs: [Findings]
- System logs: [Findings]

**Screenshots/Videos**: [Attach visual evidence]
**Network Traces**: [API calls, response times]
**Database Queries**: [Slow or failing queries]

## Code Analysis
**Affected Components**:
- Component 1: [Analysis findings]
- Component 2: [Analysis findings]
- Component 3: [Analysis findings]

**Code Changes**: [Recent changes that might be related]
**Dependencies**: [External libraries or services involved]

## Root Cause Analysis
**Primary Cause**: [Main reason for the bug]
**Contributing Factors**: [Additional factors]
**Timeline**: [When the issue started]
**Trigger**: [What caused the issue to manifest]

## Solution Design
**Proposed Fix**: [Description of the solution]
**Alternative Solutions**: [Other possible approaches]
**Risk Assessment**: [Risks of implementing the fix]
**Testing Strategy**: [How to verify the fix]

## Implementation Plan
**Code Changes Required**:
1. [Change 1]: [Description]
2. [Change 2]: [Description]
3. [Change 3]: [Description]

**Database Changes**: [Schema or data changes needed]
**Configuration Changes**: [Settings to update]
**Deployment Requirements**: [Special deployment considerations]

## Testing Plan
**Unit Tests**: [New or updated unit tests]
**Integration Tests**: [Integration test scenarios]
**Manual Testing**: [Manual test cases]
**Regression Testing**: [Areas to regression test]

## Prevention Measures
**Code Improvements**: [How to prevent similar issues]
**Process Improvements**: [Development process changes]
**Monitoring Enhancements**: [Better detection mechanisms]
**Documentation Updates**: [Knowledge base updates]
    `,

    performanceDebuggingTemplate: `
# Performance Debugging Template

## Performance Issue Details
**Issue ID**: [PERF-XXX]
**Reported By**: [Name]
**Date**: [Date]
**Severity**: [Critical/High/Medium/Low]

## Performance Problem
**Symptom**: [Slow response, high CPU, memory leak, etc.]
**Affected Component**: [Frontend/Backend/Database/Network]
**User Impact**: [How users are affected]
**Business Impact**: [Effect on business operations]

## Performance Metrics
**Current Performance**:
- Response Time: [Current vs Expected]
- Throughput: [Current vs Expected]
- CPU Usage: [Current vs Normal]
- Memory Usage: [Current vs Normal]
- Database Performance: [Query times, connections]

**Performance Baseline**:
- Historical Performance: [Previous measurements]
- SLA Requirements: [Performance targets]
- Acceptable Thresholds: [Warning and critical levels]

## Environment Analysis
**System Resources**:
- CPU: [Usage patterns, bottlenecks]
- Memory: [Usage, leaks, garbage collection]
- Disk I/O: [Read/write patterns, latency]
- Network: [Bandwidth, latency, packet loss]

**Application Metrics**:
- Request Volume: [Current load]
- Error Rates: [Error frequency and types]
- Cache Hit Rates: [Caching effectiveness]
- Connection Pools: [Database connection usage]

## Profiling Results
**Application Profiling**:
- Hotspots: [Functions consuming most time]
- Call Stack Analysis: [Deep call chains]
- Memory Allocation: [Large object allocations]
- Garbage Collection: [GC frequency and duration]

**Database Profiling**:
- Slow Queries: [Queries taking longest time]
- Query Execution Plans: [Inefficient plans]
- Index Usage: [Missing or unused indexes]
- Lock Contention: [Blocking queries]

**Network Profiling**:
- API Response Times: [Slow endpoints]
- External Service Calls: [Third-party latency]
- Data Transfer: [Large payloads]
- Connection Overhead: [Connection establishment time]

## Root Cause Analysis
**Primary Bottleneck**: [Main performance constraint]
**Contributing Factors**:
1. [Factor 1]: [Description and impact]
2. [Factor 2]: [Description and impact]
3. [Factor 3]: [Description and impact]

**Timeline Analysis**: [When performance degraded]
**Change Correlation**: [Recent changes that might be related]

## Optimization Strategy
**Quick Wins** (Immediate improvements):
1. [Optimization 1]: [Expected improvement]
2. [Optimization 2]: [Expected improvement]
3. [Optimization 3]: [Expected improvement]

**Medium-term Optimizations**:
1. [Optimization 4]: [Implementation effort and benefit]
2. [Optimization 5]: [Implementation effort and benefit]
3. [Optimization 6]: [Implementation effort and benefit]

**Long-term Improvements**:
1. [Architectural change 1]: [Strategic benefit]
2. [Architectural change 2]: [Strategic benefit]
3. [Architectural change 3]: [Strategic benefit]

## Implementation Plan
**Phase 1: Immediate Fixes**
- [Fix 1]: [Implementation details]
- [Fix 2]: [Implementation details]
- Expected Impact: [Performance improvement]

**Phase 2: Code Optimizations**
- [Optimization 1]: [Code changes required]
- [Optimization 2]: [Code changes required]
- Expected Impact: [Performance improvement]

**Phase 3: Infrastructure Improvements**
- [Infrastructure change 1]: [Implementation plan]
- [Infrastructure change 2]: [Implementation plan]
- Expected Impact: [Performance improvement]

## Monitoring and Validation
**Performance Testing**:
- Load Testing: [Test scenarios]
- Stress Testing: [Breaking point analysis]
- Endurance Testing: [Long-running performance]
- Spike Testing: [Sudden load increases]

**Monitoring Setup**:
- Key Metrics: [Metrics to track]
- Alerting Thresholds: [When to alert]
- Dashboard Updates: [Visualization improvements]
- Automated Testing: [Continuous performance validation]

## Prevention Measures
**Performance Standards**:
- Code Review Guidelines: [Performance considerations]
- Performance Testing: [Regular testing schedule]
- Monitoring: [Proactive monitoring setup]
- Capacity Planning: [Growth planning process]
    `,

    productionIssueTemplate: `
# Production Issue Response Template

## Incident Information
**Incident ID**: [INC-XXX]
**Date/Time**: [Timestamp]
**Severity**: [SEV-1/SEV-2/SEV-3/SEV-4]
**Status**: [Investigating/Mitigating/Resolved]
**Incident Commander**: [Name]

## Issue Summary
**Problem Statement**: [Brief description of the issue]
**User Impact**: [How users are affected]
**Business Impact**: [Effect on business operations]
**Affected Services**: [List of impacted services]

## Timeline
**Detection**: [How and when the issue was detected]
**Initial Response**: [First actions taken]
**Escalation**: [When and to whom escalated]
**Resolution**: [When issue was resolved]

## Immediate Response
**Assessment Actions**:
- [ ] Check system health dashboards
- [ ] Review recent deployments
- [ ] Check error logs and metrics
- [ ] Verify external dependencies
- [ ] Assess user impact scope

**Communication Actions**:
- [ ] Notify stakeholders
- [ ] Update status page
- [ ] Prepare customer communication
- [ ] Brief support team
- [ ] Document incident progress

## Investigation Process
**Symptoms Observed**:
- [Symptom 1]: [Description and evidence]
- [Symptom 2]: [Description and evidence]
- [Symptom 3]: [Description and evidence]

**Data Gathering**:
- Application Logs: [Key findings]
- System Metrics: [Anomalies detected]
- Database Status: [Performance issues]
- Network Status: [Connectivity problems]
- External Services: [Third-party issues]

**Hypothesis Testing**:
1. [Hypothesis 1]: [Test results]
2. [Hypothesis 2]: [Test results]
3. [Hypothesis 3]: [Test results]

## Root Cause Analysis
**Primary Cause**: [Main reason for the incident]
**Contributing Factors**: [Additional factors]
**Failure Points**: [Where systems failed]
**Detection Gaps**: [Why wasn't this caught earlier]

## Resolution Actions
**Immediate Mitigation**:
- [Action 1]: [Description and result]
- [Action 2]: [Description and result]
- [Action 3]: [Description and result]

**Permanent Fix**:
- [Fix 1]: [Implementation details]
- [Fix 2]: [Implementation details]
- [Fix 3]: [Implementation details]

**Verification Steps**:
- [ ] System functionality restored
- [ ] Performance metrics normal
- [ ] User reports resolved
- [ ] Monitoring alerts cleared
- [ ] Stakeholders notified

## Post-Incident Actions
**Immediate Follow-up**:
- [ ] Document lessons learned
- [ ] Update runbooks
- [ ] Improve monitoring
- [ ] Schedule post-mortem
- [ ] Communicate resolution

**Prevention Measures**:
1. [Preventive action 1]: [Implementation plan]
2. [Preventive action 2]: [Implementation plan]
3. [Preventive action 3]: [Implementation plan]

**Process Improvements**:
1. [Process improvement 1]: [Description]
2. [Process improvement 2]: [Description]
3. [Process improvement 3]: [Description]

## Lessons Learned
**What Went Well**:
- [Success 1]: [Description]
- [Success 2]: [Description]
- [Success 3]: [Description]

**What Could Be Improved**:
- [Improvement 1]: [Action plan]
- [Improvement 2]: [Action plan]
- [Improvement 3]: [Action plan]

**Action Items**:
| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| [Action 1] | [Name] | [Date] | [Status] |
| [Action 2] | [Name] | [Date] | [Status] |
| [Action 3] | [Name] | [Date] | [Status] |
    `
  }
};

export default SoftwareEngineerPrompts;
