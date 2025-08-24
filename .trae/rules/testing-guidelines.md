# Testing Guidelines

## Overview
This document outlines testing standards, patterns, and best practices for the Zendesk-ClickUp Automation project.

## Testing Philosophy

### Testing Pyramid
- **Unit Tests (70%)**: Fast, isolated tests for individual functions/methods
- **Integration Tests (20%)**: Tests for component interactions
- **End-to-End Tests (10%)**: Full workflow tests

### Test-Driven Development (TDD)
- Write tests before implementation when possible
- Follow Red-Green-Refactor cycle
- Maintain high test coverage (minimum 80%)

## Unit Testing Standards

### Test Structure
Use the AAA (Arrange, Act, Assert) pattern:

```typescript
describe('TicketService', () => {
  describe('createTicket', () => {
    it('should create a ticket with valid data', async () => {
      // Arrange
      const ticketData = {
        title: 'Test Ticket',
        description: 'Test Description',
        priority: 'high' as const
      };
      const mockZendeskClient = createMockZendeskClient();
      const ticketService = new TicketService(mockZendeskClient);

      // Act
      const result = await ticketService.createTicket(ticketData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.title).toBe(ticketData.title);
    });
  });
});
```

### Naming Conventions
- Test files: `*.test.ts` or `*.spec.ts`
- Test descriptions should be clear and descriptive
- Use "should" statements for test names

```typescript
// ✅ GOOD - Clear, descriptive test names
describe('UserValidator', () => {
  it('should throw ValidationError when email is invalid', () => {});
  it('should return true when all fields are valid', () => {});
  it('should handle empty optional fields gracefully', () => {});
});

// ❌ BAD - Vague test names
describe('UserValidator', () => {
  it('test email', () => {});
  it('validation works', () => {});
  it('handles data', () => {});
});
```

### Test Organization

#### File Structure
```
src/
├── services/
│   ├── ticket.service.ts
│   └── __tests__/
│       └── ticket.service.test.ts
├── utils/
│   ├── validation.ts
│   └── __tests__/
│       └── validation.test.ts
└── __tests__/
    └── integration/
        └── ticket-workflow.test.ts
```

#### Test Grouping
- Group related tests using `describe` blocks
- Use nested `describe` blocks for method-specific tests
- Separate positive and negative test cases

## Mocking and Test Doubles

### Mock External Dependencies
```typescript
// Mock external API clients
jest.mock('../clients/zendesk.client', () => ({
  ZendeskClient: jest.fn().mockImplementation(() => ({
    createTicket: jest.fn(),
    updateTicket: jest.fn(),
    getTicket: jest.fn()
  }))
}));

// Mock environment variables
process.env.ZENDESK_TOKEN = 'test-token';
process.env.CLICKUP_API_KEY = 'test-key';
```

### Factory Functions for Test Data
```typescript
// test-factories.ts
export const createTestTicket = (overrides: Partial<Ticket> = {}): Ticket => ({
  id: '12345',
  title: 'Test Ticket',
  description: 'Test Description',
  status: 'open',
  priority: 'medium',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createTestUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'agent',
  ...overrides
});
```

## Integration Testing

### API Integration Tests
```typescript
describe('Zendesk Integration', () => {
  let zendeskClient: ZendeskClient;
  
  beforeEach(() => {
    zendeskClient = new ZendeskClient({
      subdomain: process.env.TEST_ZENDESK_SUBDOMAIN!,
      email: process.env.TEST_ZENDESK_EMAIL!,
      token: process.env.TEST_ZENDESK_TOKEN!
    });
  });

  it('should create and retrieve a ticket', async () => {
    const ticketData = createTestTicket();
    
    const createdTicket = await zendeskClient.createTicket(ticketData);
    expect(createdTicket.id).toBeTruthy();
    
    const retrievedTicket = await zendeskClient.getTicket(createdTicket.id);
    expect(retrievedTicket.title).toBe(ticketData.title);
  });
});
```

### Database Integration Tests
```typescript
describe('Database Integration', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  it('should persist and retrieve sync records', async () => {
    const syncRecord = createTestSyncRecord();
    
    await syncRepository.save(syncRecord);
    const retrieved = await syncRepository.findById(syncRecord.id);
    
    expect(retrieved).toEqual(syncRecord);
  });
});
```

## End-to-End Testing

### Workflow Tests
```typescript
describe('Ticket Sync Workflow', () => {
  it('should sync ticket from Zendesk to ClickUp', async () => {
    // Create ticket in Zendesk
    const zendeskTicket = await createZendeskTicket({
      title: 'E2E Test Ticket',
      description: 'End-to-end test'
    });

    // Trigger sync process
    await triggerSync();

    // Verify ticket exists in ClickUp
    const clickupTask = await findClickUpTaskByZendeskId(zendeskTicket.id);
    expect(clickupTask).toBeDefined();
    expect(clickupTask.name).toBe(zendeskTicket.title);
  });
});
```

## Test Configuration

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts']
};
```

### Test Setup
```typescript
// src/__tests__/setup.ts
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Global test setup
beforeAll(async () => {
  // Setup test database, mock services, etc.
});

afterAll(async () => {
  // Cleanup resources
});

// Extend Jest matchers
expect.extend({
  toBeValidTicket(received) {
    const pass = received && 
                 typeof received.id === 'string' &&
                 typeof received.title === 'string' &&
                 typeof received.description === 'string';
    
    return {
      message: () => `expected ${received} to be a valid ticket`,
      pass
    };
  }
});
```

## Error Testing

### Exception Testing
```typescript
describe('Error Handling', () => {
  it('should throw ValidationError for invalid input', async () => {
    const invalidData = { title: '', description: null };
    
    await expect(ticketService.createTicket(invalidData))
      .rejects
      .toThrow(ValidationError);
  });

  it('should handle API rate limiting gracefully', async () => {
    mockZendeskClient.createTicket.mockRejectedValue(
      new RateLimitError('Rate limit exceeded')
    );

    const result = await ticketService.createTicketWithRetry(validTicketData);
    
    expect(result).toBeDefined();
    expect(mockZendeskClient.createTicket).toHaveBeenCalledTimes(3); // Retry logic
  });
});
```

## Performance Testing

### Load Testing
```typescript
describe('Performance Tests', () => {
  it('should handle bulk ticket creation efficiently', async () => {
    const tickets = Array.from({ length: 100 }, () => createTestTicket());
    
    const startTime = Date.now();
    await Promise.all(tickets.map(ticket => ticketService.createTicket(ticket)));
    const endTime = Date.now();
    
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
  });
});
```

## Test Data Management

### Test Database
- Use separate test database
- Reset database state between tests
- Use transactions for test isolation

### Test Environment Variables
```bash
# .env.test
NODE_ENV=test
DATABASE_URL=postgresql://test:test@localhost:5432/zendesk_clickup_test
ZENDESK_SUBDOMAIN=test-subdomain
ZENDESK_EMAIL=test@example.com
ZENDESK_TOKEN=test-token
CLICKUP_API_KEY=test-api-key
LOG_LEVEL=error
```

## Continuous Integration

### Test Pipeline
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:coverage
```

## AI Assistant Testing Rules

### Test Generation Guidelines
- Generate comprehensive test suites for all new code
- Include positive and negative test cases
- Test edge cases and error conditions
- Ensure proper mocking of external dependencies

### Testing Checklist for AI
- [ ] Unit tests cover all public methods
- [ ] Integration tests verify component interactions
- [ ] Error cases are properly tested
- [ ] Mocks are used for external dependencies
- [ ] Test data factories are used consistently
- [ ] Tests follow naming conventions
- [ ] Coverage thresholds are met
- [ ] Performance tests for critical paths
- [ ] Security-related functionality is tested
- [ ] Tests are deterministic and reliable

## Test Maintenance

### Regular Test Review
- Remove obsolete tests
- Update tests when requirements change
- Refactor test code for maintainability
- Monitor test execution time

### Test Documentation
- Document complex test scenarios
- Maintain test data documentation
- Keep testing guidelines up to date

---

**Note**: These guidelines should be followed consistently across all test files to ensure reliable, maintainable, and comprehensive test coverage.