/**
 * Context for template rendering
 */
export interface TemplateContext {
  /** Variables to substitute in template */
  variables: Record<string, any>;
  /** User context */
  user?: {
    /** User ID */
    id: string;
    /** Username */
    name: string;
    /** Display name */
    displayName?: string;
    /** User email */
    email?: string;
    /** User timezone */
    timezone?: string;
  };
  /** Channel context */
  channel?: {
    /** Channel ID */
    id: string;
    /** Channel name */
    name: string;
    /** Channel type */
    type: string;
  };
  /** Workspace context */
  workspace?: {
    /** Workspace ID */
    id: string;
    /** Workspace name */
    name: string;
    /** Workspace domain */
    domain?: string;
  };
  /** Timestamp context */
  timestamp?: {
    /** Current timestamp */
    now: Date;
    /** Formatted current time */
    formatted?: string;
    /** Timezone */
    timezone?: string;
  };
  /** Custom context variables */
  custom?: Record<string, any>;
  /** Environment context */
  environment?: {
    /** Environment name (dev, staging, prod) */
    name: string;
    /** Application version */
    version?: string;
    /** Feature flags */
    features?: Record<string, boolean>;
  };
}