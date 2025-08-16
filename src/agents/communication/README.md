# Inter-Agent Messaging 📡

This directory contains the communication infrastructure for agent-to-agent messaging, event handling, and coordination.

## Purpose

The `communication` directory provides:
- Message passing between agents
- Event-driven communication patterns
- Pub/Sub messaging systems
- Agent discovery and registration
- Communication protocols and standards

## Key Components

### Messaging Infrastructure
- **MessageBroker**: Central message routing and delivery
- **MessageQueue**: Asynchronous message queuing system
- **EventBus**: Event-driven communication hub
- **MessageSerializer**: Message serialization and deserialization

### Communication Patterns
- **RequestResponse**: Synchronous request-response communication
- **PublishSubscribe**: Asynchronous pub/sub messaging
- **CommandQuery**: Command and query separation pattern
- **EventSourcing**: Event-based state management

### Agent Discovery
- **AgentRegistry**: Central registry for agent discovery
- **ServiceDiscovery**: Dynamic service discovery mechanism
- **HealthMonitor**: Agent health checking and monitoring
- **LoadBalancer**: Distributes messages across agent instances

## Message Types

### System Messages
- **AgentRegistration**: Agent startup and registration
- **HealthCheck**: Agent health status updates
- **ShutdownNotification**: Graceful shutdown coordination

### Business Messages
- **TicketCreated**: New ticket creation events
- **TaskUpdated**: Task status change notifications
- **SyncRequest**: Data synchronization requests
- **ErrorAlert**: Error and exception notifications

### Coordination Messages
- **WorkflowStart**: Workflow initiation messages
- **TaskAssignment**: Task assignment to specific agents
- **ResourceLock**: Resource locking and unlocking
- **BatchComplete**: Batch processing completion

## Usage

```typescript
import { MessageBroker } from './MessageBroker';
import { EventBus } from './EventBus';

// Publishing an event
const eventBus = new EventBus();
eventBus.publish('ticket.created', { ticketId: '123', priority: 'high' });

// Subscribing to events
eventBus.subscribe('ticket.created', async (event) => {
  // Handle ticket creation
});

// Direct messaging
const broker = new MessageBroker();
await broker.sendMessage('zendesk-agent', {
  type: 'FETCH_TICKET',
  payload: { ticketId: '123' }
});
```

## Features

- **Reliable Delivery**: Guaranteed message delivery with acknowledgments
- **Message Persistence**: Persistent message storage for reliability
- **Dead Letter Queues**: Handle failed message processing
- **Message Routing**: Intelligent message routing based on content
- **Security**: Encrypted communication and authentication
- **Monitoring**: Real-time communication monitoring and metrics