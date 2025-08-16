# TypeScript Type Definitions 📝

This directory contains comprehensive TypeScript type definitions, interfaces, and type utilities for the Zendesk-ClickUp automation system, ensuring type safety and consistency across the entire codebase.

## Purpose

The Types directory provides:
- Core type definitions for all system components
- Shared interfaces and contracts
- Type utilities and helper types
- API response and request type definitions
- Event and message type definitions
- Domain-specific type models

## File Structure

```
types/
├── agents.ts          # Agent-related type definitions
└── index.ts           # Main type exports and re-exports
```

## Core Type Categories

### Agent Types (`agents.ts`)
Comprehensive type definitions for the agent system:

#### Base Agent Interface
```typescript
interface IAgent {
  id: string;
  name: string;
  type: AgentType;
  capabilities: AgentCapability[];
  state: AgentState;
  metadata: AgentMetadata;
  
  // Core methods
  initialize(config: AgentConfig): Promise<void>;
  execute(task: Task): Promise<TaskResult>;
  shutdown(): Promise<void>;
  
  // Communication methods
  sendMessage(message: AgentMessage): Promise<void>;
  receiveMessage(message: AgentMessage): Promise<void>;
  
  // State management
  updateState(newState: Partial<AgentState>): Promise<void>;
  getStatus(): AgentStatus;
}
```

#### Agent Types and Enums
```typescript
enum AgentType {
  BUSINESS_ANALYST = 'business-analyst',
  DEVOPS = 'devops',
  PROJECT_MANAGER = 'project-manager',
  QA_TESTER = 'qa-tester',
  SOFTWARE_ENGINEER = 'software-engineer',
  WORDPRESS_DEVELOPER = 'wordpress-developer'
}

enum AgentState {
  INITIALIZING = 'initializing',
  IDLE = 'idle',
  BUSY = 'busy',
  ERROR = 'error',
  SHUTDOWN = 'shutdown'
}

enum AgentStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown'
}
```

#### Agent Capabilities
```typescript
interface AgentCapability {
  id: string;
  name: string;
  description: string;
  category: CapabilityCategory;
  level: CapabilityLevel;
  requirements: string[];
  metadata: Record<string, any>;
}

enum CapabilityCategory {
  ANALYSIS = 'analysis',
  DEVELOPMENT = 'development',
  TESTING = 'testing',
  DEPLOYMENT = 'deployment',
  MANAGEMENT = 'management',
  COMMUNICATION = 'communication'
}

enum CapabilityLevel {
  BASIC = 'basic',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}
```

#### Task Definitions
```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  assignedAgent?: string;
  requiredCapabilities: string[];
  dependencies: string[];
  metadata: TaskMetadata;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
}

enum TaskType {
  ANALYSIS = 'analysis',
  DEVELOPMENT = 'development',
  TESTING = 'testing',
  DEPLOYMENT = 'deployment',
  REVIEW = 'review',
  DOCUMENTATION = 'documentation',
  INTEGRATION = 'integration'
}

enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold'
}

interface TaskResult {
  taskId: string;
  status: TaskStatus;
  result?: any;
  error?: Error;
  metrics: TaskMetrics;
  artifacts: TaskArtifact[];
  completedAt: Date;
}

interface TaskMetrics {
  duration: number;
  resourceUsage: ResourceUsage;
  qualityScore?: number;
  performanceMetrics: Record<string, number>;
}

interface TaskArtifact {
  id: string;
  type: ArtifactType;
  name: string;
  content: string | Buffer;
  metadata: Record<string, any>;
}

enum ArtifactType {
  CODE = 'code',
  DOCUMENTATION = 'documentation',
  TEST_REPORT = 'test_report',
  DEPLOYMENT_SCRIPT = 'deployment_script',
  ANALYSIS_REPORT = 'analysis_report'
}
```

### Communication Types

#### Message Definitions
```typescript
interface AgentMessage {
  id: string;
  from: string;
  to: string | string[];
  type: MessageType;
  content: MessageContent;
  timestamp: Date;
  correlationId?: string;
  replyTo?: string;
}

enum MessageType {
  REQUEST = 'request',
  RESPONSE = 'response',
  NOTIFICATION = 'notification',
  BROADCAST = 'broadcast',
  ERROR = 'error'
}

interface MessageContent {
  subject: string;
  body: any;
  attachments?: MessageAttachment[];
  metadata: Record<string, any>;
}

interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  content: Buffer | string;
}
```

#### Event System Types
```typescript
interface SystemEvent {
  id: string;
  type: EventType;
  source: string;
  timestamp: Date;
  data: EventData;
  metadata: EventMetadata;
}

enum EventType {
  AGENT_STARTED = 'agent_started',
  AGENT_STOPPED = 'agent_stopped',
  TASK_CREATED = 'task_created',
  TASK_COMPLETED = 'task_completed',
  TASK_FAILED = 'task_failed',
  SYSTEM_ERROR = 'system_error',
  INTEGRATION_EVENT = 'integration_event'
}

interface EventData {
  entityId: string;
  entityType: string;
  action: string;
  payload: Record<string, any>;
  previousState?: any;
  newState?: any;
}

interface EventMetadata {
  version: string;
  source: string;
  correlationId?: string;
  causationId?: string;
  userId?: string;
  sessionId?: string;
}
```

### Integration Types

#### Zendesk Types
```typescript
interface ZendeskTicket {
  id: number;
  url: string;
  external_id?: string;
  type: TicketType;
  subject: string;
  raw_subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  recipient?: string;
  requester_id: number;
  submitter_id: number;
  assignee_id?: number;
  organization_id?: number;
  group_id?: number;
  collaborator_ids: number[];
  follower_ids: number[];
  email_cc_ids: number[];
  forum_topic_id?: number;
  problem_id?: number;
  has_incidents: boolean;
  is_public: boolean;
  due_at?: string;
  tags: string[];
  custom_fields: ZendeskCustomField[];
  satisfaction_rating?: ZendeskSatisfactionRating;
  sharing_agreement_ids: number[];
  fields: ZendeskTicketField[];
  followup_ids: number[];
  ticket_form_id?: number;
  brand_id: number;
  allow_channelback: boolean;
  allow_attachments: boolean;
  created_at: string;
  updated_at: string;
}

enum TicketType {
  PROBLEM = 'problem',
  INCIDENT = 'incident',
  QUESTION = 'question',
  TASK = 'task'
}

enum TicketPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

enum TicketStatus {
  NEW = 'new',
  OPEN = 'open',
  PENDING = 'pending',
  HOLD = 'hold',
  SOLVED = 'solved',
  CLOSED = 'closed'
}

interface ZendeskUser {
  id: number;
  url: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  time_zone: string;
  iana_time_zone: string;
  phone?: string;
  shared_phone_number?: string;
  photo?: ZendeskPhoto;
  locale_id: number;
  locale: string;
  organization_id?: number;
  role: UserRole;
  verified: boolean;
  external_id?: string;
  tags: string[];
  alias?: string;
  active: boolean;
  shared: boolean;
  shared_agent: boolean;
  last_login_at?: string;
  two_factor_auth_enabled: boolean;
  signature?: string;
  details?: string;
  notes?: string;
  role_type: number;
  custom_role_id?: number;
  moderator: boolean;
  ticket_restriction?: TicketRestriction;
  only_private_comments: boolean;
  restricted_agent: boolean;
  suspended: boolean;
  default_group_id?: number;
  report_csv: boolean;
  user_fields: Record<string, any>;
}

enum UserRole {
  END_USER = 'end-user',
  AGENT = 'agent',
  ADMIN = 'admin'
}

interface ZendeskOrganization {
  id: number;
  url: string;
  name: string;
  shared_tickets: boolean;
  shared_comments: boolean;
  external_id?: string;
  created_at: string;
  updated_at: string;
  domain_names: string[];
  details?: string;
  notes?: string;
  group_id?: number;
  tags: string[];
  organization_fields: Record<string, any>;
}
```

#### ClickUp Types
```typescript
interface ClickUpTask {
  id: string;
  custom_id?: string;
  name: string;
  text_content: string;
  description: string;
  status: ClickUpTaskStatus;
  orderindex: string;
  date_created: string;
  date_updated: string;
  date_closed?: string;
  date_done?: string;
  archived: boolean;
  creator: ClickUpUser;
  assignees: ClickUpUser[];
  watchers: ClickUpUser[];
  checklists: ClickUpChecklist[];
  tags: ClickUpTag[];
  parent?: string;
  priority?: ClickUpPriority;
  due_date?: string;
  start_date?: string;
  points?: number;
  time_estimate?: number;
  time_spent?: number;
  custom_fields: ClickUpCustomField[];
  dependencies: ClickUpDependency[];
  linked_tasks: ClickUpLinkedTask[];
  team_id: string;
  url: string;
  permission_level: string;
  list: ClickUpList;
  project: ClickUpProject;
  folder: ClickUpFolder;
  space: ClickUpSpace;
}

interface ClickUpTaskStatus {
  id: string;
  status: string;
  color: string;
  orderindex: number;
  type: 'open' | 'closed' | 'custom';
}

interface ClickUpUser {
  id: number;
  username: string;
  color: string;
  email: string;
  profilePicture?: string;
}

interface ClickUpWorkspace {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  members: ClickUpMember[];
}

interface ClickUpSpace {
  id: string;
  name: string;
  color?: string;
  private: boolean;
  avatar?: string;
  admin_can_manage?: boolean;
  statuses: ClickUpTaskStatus[];
  multiple_assignees: boolean;
  features: ClickUpSpaceFeatures;
  archived: boolean;
}

interface ClickUpList {
  id: string;
  name: string;
  orderindex: number;
  status?: string;
  priority?: ClickUpPriority;
  assignee?: ClickUpUser;
  task_count?: number;
  due_date?: string;
  due_date_time?: boolean;
  start_date?: string;
  start_date_time?: boolean;
  folder: ClickUpFolder;
  space: ClickUpSpace;
  archived: boolean;
  override_statuses?: boolean;
  statuses: ClickUpTaskStatus[];
  permission_level: string;
}
```

#### Slack Types
```typescript
interface SlackMessage {
  type: string;
  channel: string;
  user: string;
  text: string;
  ts: string;
  thread_ts?: string;
  reply_count?: number;
  reply_users_count?: number;
  latest_reply?: string;
  reply_users?: string[];
  subscribed?: boolean;
  last_read?: string;
  unread_count?: number;
  attachments?: SlackAttachment[];
  blocks?: SlackBlock[];
  reactions?: SlackReaction[];
  pinned_to?: string[];
  pinned_info?: SlackPinnedInfo;
}

interface SlackChannel {
  id: string;
  name: string;
  is_channel: boolean;
  is_group: boolean;
  is_im: boolean;
  is_mpim: boolean;
  is_private: boolean;
  created: number;
  is_archived: boolean;
  is_general: boolean;
  unlinked: number;
  name_normalized: string;
  is_shared: boolean;
  is_org_shared: boolean;
  is_member: boolean;
  is_pending_ext_shared: boolean;
  pending_shared: string[];
  context_team_id: string;
  updated: number;
  parent_conversation?: string;
  creator: string;
  is_ext_shared: boolean;
  shared_team_ids: string[];
  pending_connected_team_ids: string[];
  is_pending_ext_shared_unlinked: boolean;
  topic: SlackTopic;
  purpose: SlackPurpose;
  previous_names: string[];
  num_members?: number;
}

interface SlackUser {
  id: string;
  team_id: string;
  name: string;
  deleted: boolean;
  color: string;
  real_name: string;
  tz: string;
  tz_label: string;
  tz_offset: number;
  profile: SlackUserProfile;
  is_admin: boolean;
  is_owner: boolean;
  is_primary_owner: boolean;
  is_restricted: boolean;
  is_ultra_restricted: boolean;
  is_bot: boolean;
  is_app_user: boolean;
  updated: number;
  is_email_confirmed: boolean;
  who_can_share_contact_card: string;
}
```

### Workflow Types

#### Workflow Definitions
```typescript
interface Workflow {
  id: string;
  name: string;
  description: string;
  version: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  variables: WorkflowVariable[];
  metadata: WorkflowMetadata;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

enum WorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived'
}

interface WorkflowStep {
  id: string;
  name: string;
  type: StepType;
  agentType?: AgentType;
  action: string;
  inputs: WorkflowInput[];
  outputs: WorkflowOutput[];
  conditions: WorkflowCondition[];
  nextSteps: string[];
  errorHandling: ErrorHandlingStrategy;
  timeout: number;
  retryPolicy: RetryPolicy;
}

enum StepType {
  AGENT_TASK = 'agent_task',
  INTEGRATION = 'integration',
  CONDITION = 'condition',
  PARALLEL = 'parallel',
  LOOP = 'loop',
  WAIT = 'wait'
}

interface WorkflowTrigger {
  id: string;
  type: TriggerType;
  conditions: TriggerCondition[];
  schedule?: CronSchedule;
  webhook?: WebhookConfig;
}

enum TriggerType {
  MANUAL = 'manual',
  SCHEDULED = 'scheduled',
  WEBHOOK = 'webhook',
  EVENT = 'event'
}
```

### Configuration Types

#### System Configuration
```typescript
interface SystemConfig {
  app: AppConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  integrations: IntegrationsConfig;
  agents: AgentsConfig;
  security: SecurityConfig;
  monitoring: MonitoringConfig;
}

interface AppConfig {
  name: string;
  version: string;
  environment: Environment;
  port: number;
  host: string;
  debug: boolean;
  logLevel: LogLevel;
}

enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TEST = 'test'
}

enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace'
}

interface DatabaseConfig {
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  pool: PoolConfig;
}

enum DatabaseType {
  POSTGRESQL = 'postgresql',
  MYSQL = 'mysql',
  MONGODB = 'mongodb',
  SQLITE = 'sqlite'
}

interface IntegrationsConfig {
  zendesk: ZendeskConfig;
  clickup: ClickUpConfig;
  slack: SlackConfig;
}

interface ZendeskConfig {
  subdomain: string;
  email: string;
  token: string;
  apiVersion: string;
  rateLimiting: RateLimitConfig;
}

interface ClickUpConfig {
  apiToken: string;
  teamId: string;
  apiVersion: string;
  rateLimiting: RateLimitConfig;
}

interface SlackConfig {
  botToken: string;
  appToken: string;
  signingSecret: string;
  rateLimiting: RateLimitConfig;
}
```

### Utility Types

#### Generic Utility Types
```typescript
// API Response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata: ResponseMetadata;
}

interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

interface ResponseMetadata {
  timestamp: Date;
  requestId: string;
  duration: number;
  version: string;
}

// Pagination types
interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface PaginationRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  filters?: Record<string, any>;
}

enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

// Search and filter types
interface SearchRequest {
  query: string;
  filters: SearchFilter[];
  pagination: PaginationRequest;
  facets?: string[];
}

interface SearchFilter {
  field: string;
  operator: FilterOperator;
  value: any;
}

enum FilterOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_THAN_OR_EQUAL = 'greater_than_or_equal',
  LESS_THAN_OR_EQUAL = 'less_than_or_equal',
  IN = 'in',
  NOT_IN = 'not_in'
}

// Audit and tracking types
interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  userId: string;
  timestamp: Date;
  changes: AuditChange[];
  metadata: Record<string, any>;
}

enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  EXECUTE = 'execute'
}

interface AuditChange {
  field: string;
  oldValue: any;
  newValue: any;
}
```

### Type Guards and Validators

#### Type Guard Functions
```typescript
// Agent type guards
function isAgent(obj: any): obj is IAgent {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    Object.values(AgentType).includes(obj.type) &&
    Array.isArray(obj.capabilities);
}

function isTask(obj: any): obj is Task {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    Object.values(TaskType).includes(obj.type) &&
    Object.values(TaskStatus).includes(obj.status);
}

function isAgentMessage(obj: any): obj is AgentMessage {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.from === 'string' &&
    (typeof obj.to === 'string' || Array.isArray(obj.to)) &&
    Object.values(MessageType).includes(obj.type);
}

// Integration type guards
function isZendeskTicket(obj: any): obj is ZendeskTicket {
  return obj &&
    typeof obj.id === 'number' &&
    typeof obj.subject === 'string' &&
    Object.values(TicketStatus).includes(obj.status);
}

function isClickUpTask(obj: any): obj is ClickUpTask {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    obj.status &&
    typeof obj.status.status === 'string';
}

function isSlackMessage(obj: any): obj is SlackMessage {
  return obj &&
    typeof obj.type === 'string' &&
    typeof obj.channel === 'string' &&
    typeof obj.user === 'string' &&
    typeof obj.text === 'string';
}
```

#### Validation Schemas
```typescript
// JSON Schema definitions for runtime validation
const AgentSchema = {
  type: 'object',
  required: ['id', 'name', 'type', 'capabilities', 'state'],
  properties: {
    id: { type: 'string', minLength: 1 },
    name: { type: 'string', minLength: 1 },
    type: { enum: Object.values(AgentType) },
    capabilities: {
      type: 'array',
      items: { $ref: '#/definitions/AgentCapability' }
    },
    state: { enum: Object.values(AgentState) }
  }
};

const TaskSchema = {
  type: 'object',
  required: ['id', 'title', 'type', 'status'],
  properties: {
    id: { type: 'string', minLength: 1 },
    title: { type: 'string', minLength: 1 },
    description: { type: 'string' },
    type: { enum: Object.values(TaskType) },
    priority: { enum: Object.values(TaskPriority) },
    status: { enum: Object.values(TaskStatus) },
    assignedAgent: { type: 'string' },
    requiredCapabilities: {
      type: 'array',
      items: { type: 'string' }
    },
    dependencies: {
      type: 'array',
      items: { type: 'string' }
    }
  }
};
```

### Advanced Type Utilities

#### Conditional Types
```typescript
// Extract agent types based on capabilities
type AgentWithCapability<T extends AgentCapability> = IAgent & {
  capabilities: T[];
};

// Extract task types for specific agents
type TaskForAgent<T extends AgentType> = Task & {
  type: T extends AgentType.BUSINESS_ANALYST ? TaskType.ANALYSIS :
        T extends AgentType.SOFTWARE_ENGINEER ? TaskType.DEVELOPMENT :
        T extends AgentType.QA_TESTER ? TaskType.TESTING :
        TaskType;
};

// Extract integration types based on service
type IntegrationData<T extends string> = 
  T extends 'zendesk' ? ZendeskTicket :
  T extends 'clickup' ? ClickUpTask :
  T extends 'slack' ? SlackMessage :
  never;
```

#### Mapped Types
```typescript
// Create partial update types
type AgentUpdate = Partial<Pick<IAgent, 'name' | 'capabilities' | 'metadata'>>;
type TaskUpdate = Partial<Pick<Task, 'title' | 'description' | 'priority' | 'status'>>;

// Create readonly versions
type ReadonlyAgent = Readonly<IAgent>;
type ReadonlyTask = Readonly<Task>;

// Create required versions of optional fields
type RequiredTaskFields = Required<Pick<Task, 'assignedAgent' | 'dueDate'>>;
```

#### Template Literal Types
```typescript
// Event type patterns
type AgentEventType = `agent:${AgentType}:${AgentState}`;
type TaskEventType = `task:${TaskType}:${TaskStatus}`;
type IntegrationEventType = `integration:${string}:${string}`;

// API endpoint patterns
type AgentEndpoint = `/api/agents/${string}`;
type TaskEndpoint = `/api/tasks/${string}`;
type IntegrationEndpoint = `/api/integrations/${string}/${string}`;
```

## Type Export Strategy

The `index.ts` file serves as the main export point:

```typescript
// Core agent types
export * from './agents';

// Re-export commonly used types with aliases
export type {
  IAgent as Agent,
  Task,
  TaskResult,
  AgentMessage as Message,
  SystemEvent as Event
};

// Export type utilities
export {
  isAgent,
  isTask,
  isAgentMessage,
  isZendeskTicket,
  isClickUpTask,
  isSlackMessage
};

// Export validation schemas
export {
  AgentSchema,
  TaskSchema
};

// Export enums for runtime use
export {
  AgentType,
  AgentState,
  TaskType,
  TaskStatus,
  TaskPriority,
  MessageType,
  EventType
};
```

## Best Practices

### Type Design
- Use descriptive and consistent naming conventions
- Prefer interfaces over types for object shapes
- Use enums for fixed sets of values
- Implement proper inheritance hierarchies

### Type Safety
- Use strict TypeScript configuration
- Implement comprehensive type guards
- Validate data at runtime boundaries
- Use branded types for domain-specific values

### Documentation
- Document complex types with JSDoc comments
- Provide usage examples for utility types
- Maintain type compatibility across versions
- Use semantic versioning for breaking changes

### Performance
- Avoid deeply nested conditional types
- Use type aliases for complex type expressions
- Minimize use of `any` and `unknown`
- Optimize type checking performance