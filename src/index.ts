/**
 * @ai-metadata
 * @component: MainApplication
 * @description: Main entry point for the Zendesk-ClickUp automation worker using Hono framework
 * @last-update: 2025-01-16
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/main-application.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["./app.ts"]
 * @tests: ["./tests/app.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Main entry point that exports the Hono application instance"
 * 
 * @approvals:
 *   - dev-approved: false
 *   - code-review-approved: false
 *   - qa-approved: false
 */

import { app } from './app';

/**
 * Export the Hono application instance as the default export
 * This replaces the manual routing logic with Hono's built-in router
 */
export default app;