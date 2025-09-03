/**
 * @type: interface
 * @domain: workflow
 * @purpose: Export all workflow domain interfaces
 * @solid-principle: ISP
 */

// Webhook handler interfaces
export type {
  IWebhookHandler,
  IZendeskWebhookHandler,
  IClickUpWebhookHandler,
} from './webhook-handler.interface';

// Workflow orchestration interfaces
export type {
  IWorkflowOrchestrator,
  IWorkflowExecutor,
} from './workflow-orchestrator.interface';

// Webhook service interfaces
export type {
  IWebhookService,
  IZendeskWebhookService,
  IClickUpWebhookService,
} from './webhook-service.interface';