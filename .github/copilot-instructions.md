<!-- Copilot instructions for zendesk-clickup-automation -->

# Copilot / AI Agent Instructions

Purpose: give an AI coding agent the minimal, high-value information to be immediately productive in this repository.

- **Big picture**: This is a Cloudflare Workers + Hono HTTP app that integrates ClickUp, Zendesk, Slack and an AI client (Gemini). Entry point: `src/index.ts` which mounts domain route groups from `src/infrastructure/routes/*` and wires a manual DI container from `src/infrastructure/di/*`.

- **DI & lifecycle**: The project uses a manual dependency factory pattern. `createDependencies(env)` in `src/infrastructure/di/dependencies.ts` builds all services (OAuth, API clients, workflow orchestrator, AI, optional Slack). The DI middleware is created by `createDIMiddleware()` in `src/infrastructure/di/container.ts` and attaches `deps` and `container` to the Hono context. Route handlers access services via `c.get('deps')` or helpers in `container`.

- **Environment & KV**: Required environment keys are declared in `Env` (same file). Important KV bindings: `OAUTH_TOKENS`, `OAUTH_STATES`, `USER_TOKENS` (used by `TokenStorageService`). When adding features, ensure KV usage is guarded when running locally (some features expect KV to exist and will throw in `createDependencies`).

- **Routing & auth conventions**: Routes live under `src/infrastructure/routes/*` and mount at `/api/*`. ClickUp routes (`clickup.routes.ts`) illustrate patterns:

  - OAuth endpoints do not require the Bearer header; other routes check `Authorization: Bearer <token>` in middleware and store the token in the Hono context via `c.set('accessToken', ...)`.
  - Status endpoints intentionally skip auth to allow unauthenticated connectivity checks.

- **Key domains & files to inspect when changing behavior**:

  - DI/Factory: `src/infrastructure/di/dependencies.ts`, `src/infrastructure/di/container.ts`
  - App entry: `src/index.ts`
  - Routes: `src/infrastructure/routes/*.ts` (clickup, zendesk, slack, webhook)
  - ClickUp domain: `src/domains/clickup/services/*`, `src/domains/clickup/interfaces/*`
  - Zendesk domain: `src/domains/zendesk/*`
  - Workflow: `src/domains/workflow/*` (orchestration between Zendesk <-> ClickUp)
  - AI prompts: `src/domains/ai/prompts/*.poml` and prompt manager `src/domains/ai/services/prompt-manager.service.ts`

- **Testing / running locally**: This project targets Cloudflare Workers. There is no explicit local-run script in repo root. Typical developer steps:

  - Build / type-check: `npm run build` or `npm run typecheck` if available in `package.json`.
  - Cloudflare Workers preview: use `wrangler dev` with `wrangler.dev.jsonc`/`wrangler.jsonc` configured. Ensure KV bindings are set via `wrangler` or local shims. If KV not available, initialize the DI container in a test to provide a mocked `Env`.

- **Patterns and conventions to follow**:

  - Single Responsibility: services in `src/domains/*/services` are narrow and focused (e.g., `ClickUpOAuthService` only handles OAuth).
  - Interfaces live in `src/domains/*/interfaces` and guide implementation shape — prefer returning the concrete implementation used across `dependencies.ts` when adding new service wiring.
  - Error handling: routes prefer returning structured JSON errors (see `clickup.routes.ts`). Use `c.json({ error: '...', message: '...' }, status)` for API responses.
  - Logging: use `console.log/error` for server logs; `src/index.ts` uses Hono `logger()` middleware — keep messages informative and include context keys.

- **Common pitfalls**:

  - Missing required environment variables causes `createDependencies` to throw. When testing, either provide required keys or mock `createDependencies`/KV namespaces.
  - KV access assumed in `TokenStorageService` — when writing unit tests, inject a fake KV object implementing `get/put/delete/list` minimal APIs.

- **When editing routes / DI**:

  - Update the `Dependencies` interface in `src/infrastructure/di/dependencies.ts` to add new services.
  - Wire concrete implementations in `createDependencies` and ensure any required env keys are added to `Env` and validated in `validateEnvironment`.
  - Use `DIContext` type from `src/infrastructure/di/container.ts` for typed route handlers.

- **Examples**:

  - Read `ClickUpOAuthService.generateAuthorizationUrl` for how OAuth states are generated/stored (calls into `tokenStorage`).
  - Read `clickup.routes.ts` `/status` and `/status/auth` for auth-check patterns and how `clickUpClient` is used (e.g., `getAuthorizedUser`).

- **PR checklist for changes involving runtime behavior**:
  - Add/modify env keys: update `Env` and `validateEnvironment`.
  - Add new KV usage: document required KV binding names and update `wrangler` config if needed.
  - Update DI: add interface, concrete service, and wire in `createDependencies`.
  - Add route: use `src/infrastructure/routes/*.ts`, use DI via `c.get('deps')` and `DIContext` typing.

If anything in these instructions is unclear or you want me to expand examples for a specific area (local dev, testing, or DI changes), tell me which area to expand.
