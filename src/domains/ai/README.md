# AI Domain

This domain provides AI functionality for the Zendesk-ClickUp Automation system, with a focus on text generation and prompt management. It currently integrates with Google's Gemini API but is designed to be provider-agnostic for future flexibility.

## Features

- Generic AI client interface for text generation
- Gemini API integration
- POML-based prompt template management
- Type-safe configuration with Zod validation
- Comprehensive error handling

## Architecture

The AI domain follows the project's SOLID principles and interface-driven design:

- **Interfaces**: Define contracts for AI clients and prompt management
- **Services**: Implement the interfaces with concrete functionality
- **Types**: Define data structures and validation schemas
- **Errors**: Provide specific error classes for better error handling

## Usage

### Basic Text Generation

```typescript
import { Dependencies } from '../infrastructure/di/dependencies';

async function generateText(deps: Dependencies, prompt: string): Promise<string> {
  try {
    const result = await deps.aiClient.generateText(prompt);
    return result.text;
  } catch (error) {
    console.error('Text generation failed:', error);
    throw error;
  }
}
```

### Using Prompt Templates

```typescript
import { Dependencies } from '../infrastructure/di/dependencies';

async function summarizeTicket(deps: Dependencies, ticketContent: string): Promise<string> {
  try {
    // Load the template
    const template = await deps.promptManager.loadTemplate('ticket-summary.poml');
    
    // Render the template with variables
    const renderedPrompt = await deps.promptManager.renderTemplate(template, {
      ticketContent
    });
    
    // Generate text using the rendered prompt
    const result = await deps.aiClient.generateText(renderedPrompt);
    return result.text;
  } catch (error) {
    console.error('Ticket summarization failed:', error);
    throw error;
  }
}
```

### Advanced Usage with Instructions

```typescript
import { Dependencies } from '../infrastructure/di/dependencies';

async function createClickUpTask(deps: Dependencies, ticketData: any): Promise<string> {
  try {
    // Process template with variables and instructions
    const processedPrompt = await deps.promptManager.processTemplate('task-creation.poml', {
      ticketId: ticketData.id,
      ticketSubject: ticketData.subject,
      requesterName: ticketData.requester.name,
      requesterEmail: ticketData.requester.email,
      ticketPriority: ticketData.priority,
      ticketStatus: ticketData.status,
      ticketDescription: ticketData.description,
      ticketComments: ticketData.comments.join('\n')
    });
    
    // Generate text with specific instructions
    const result = await deps.geminiClient.generateTextWithInstructions(
      processedPrompt,
      'Create a detailed ClickUp task with clear requirements and acceptance criteria.'
    );
    
    return result.text;
  } catch (error) {
    console.error('Task creation failed:', error);
    throw error;
  }
}
```

## Configuration

### Environment Variables

- `GEMINI_API_KEY`: Your Google Gemini API key (required for Gemini integration)

### Gemini Client Configuration

The Gemini client can be configured with the following options:

```typescript
const geminiConfig = {
  apiKey: env.GEMINI_API_KEY || '',
  model: 'gemini-pro', // Default model
  maxTokens: 1024,     // Maximum tokens to generate
  temperature: 0.7,    // Controls randomness (0.0-1.0)
};
```

### Prompt Manager Configuration

The POML prompt manager can be configured with:

```typescript
const promptManagerConfig = {
  templateDir: 'prompts', // Directory containing POML templates
  defaultVariables: {     // Variables available to all templates
    systemName: 'Zendesk-ClickUp Automation',
  },
};
```

## Prompt Templates

Prompt templates are stored in the `prompts` directory and use the POML format. Example templates include:

- `ticket-summary.poml`: Generates concise summaries of Zendesk tickets
- `task-creation.poml`: Creates structured ClickUp tasks from ticket information
- `error-analysis.poml`: Analyzes error logs and provides troubleshooting recommendations

## Error Handling

The domain provides specific error classes for better error handling:

- `AIClientError`: Base class for all AI client errors
- `AIGenerationError`: Errors during text generation
- `AIConfigurationError`: Configuration-related errors

## Extending with New AI Providers

To add a new AI provider:

1. Create a new interface extending `IAIClient` with provider-specific methods
2. Implement the interface in a new service class
3. Add the necessary types and configuration
4. Update the dependency injection container

Example:

```typescript
// 1. Create interface
export interface IOpenAIClient extends IAIClient {
  setModel(model: string): void;
  getEmbeddings(text: string): Promise<number[]>;
}

// 2. Implement service
export class OpenAIClient implements IOpenAIClient {
  // Implementation
}

// 3. Update DI container
const openAIClient = new OpenAIClient(openAIConfig);
// Use as default or specific provider
const aiClient = openAIClient;
```