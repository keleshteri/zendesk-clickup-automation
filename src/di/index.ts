/**
 * @ai-metadata
 * @component: DI Index
 * @description: Barrel export for dependency injection module
 * @last-update: 2024-12-19
 * @last-editor: ai-assistant
 * @changelog: ./docs/changelog/di-index.md
 * @stability: stable
 * @edit-permissions: "full"
 * @dependencies: ["./container.ts"]
 * @tests: ["./tests/di.test.ts"]
 * @breaking-changes-risk: low
 * @review-required: false
 * @ai-context: "Provides clean barrel exports for the dependency injection module"
 */

// Re-export everything from container
export * from './container';

// Named exports for better IDE support
export {
  DI_TOKENS,
  diContainer,
  registerService,
  registerSingleton,
  registerInstance,
  resolveService,
  injectable,
  singleton,
  inject
} from './container';