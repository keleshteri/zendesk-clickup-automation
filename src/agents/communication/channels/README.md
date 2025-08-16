# Communication Channels 📢

This directory contains the communication channel implementations that enable agents to communicate with each other and external systems through various messaging channels and transport mechanisms.

## Purpose

The Communication Channels system provides:
- Multiple communication channel implementations
- Channel management and lifecycle control
- Message routing and delivery mechanisms
- Channel monitoring and health checking
- Load balancing and failover capabilities

## Core Components

### Channel Manager
- **Channel Registry**: Register and manage available channels
- **Lifecycle Management**: Control channel creation, activation, and termination
- **Health Monitoring**: Monitor channel health and availability
- **Load Balancing**: Distribute messages across multiple channels

### Message Router
- **Routing Logic**: Route messages to appropriate channels
- **Delivery Guarantees**: Ensure message delivery with various guarantees
- **Priority Handling**: Handle message priorities and urgency
- **Dead Letter Handling**: Manage undeliverable messages

### Channel Adapters
- **Protocol Adaptation**: Adapt messages to channel-specific protocols
- **Format Conversion**: Convert message formats for different channels
- **Error Translation**: Translate channel-specific errors
- **Performance Optimization**: Optimize for channel characteristics

### Connection Pool
- **Connection Management**: Manage persistent connections
- **Resource Optimization**: Optimize resource usage across channels
- **Failover Support**: Handle connection failures and recovery
- **Scaling**: Scale connections based on demand

## File Structure

### `channel-manager.ts`
Main channel management system:
- Channel registration and discovery
- Lifecycle management and health monitoring
- Load balancing and failover logic
- Performance monitoring and optimization

### `message-router.ts`
Message routing and delivery:
- Intelligent message routing algorithms
- Delivery guarantee implementations
- Priority queue management
- Dead letter queue handling

### `channel-adapters.ts`
Channel-specific adapters:
- Protocol-specific message adaptation
- Format conversion and validation
- Error handling and translation
- Performance optimization per channel

### `connection-pool.ts`
Connection pooling and management:
- Connection lifecycle management
- Resource pooling and optimization
- Health checking and recovery
- Scaling and load distribution

## Channel Types

### HTTP Channel
```typescript
class HTTPChannel implements CommunicationChannel {
  name = 'HTTP';
  type = 'synchronous';
  
  async send(message: Message, endpoint: string): Promise<Response> {
    const httpClient = this.connectionPool.getConnection(endpoint);
    
    const request = {
      method: 'POST',
      url: endpoint,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Agent-System/1.0',
        'X-Message-ID': message.id,
        'X-Correlation-ID': message.correlationId
      },
      body: JSON.stringify(message),
      timeout: this.config.timeout
    };
    
    try {
      const response = await httpClient.request(request);
      this.metrics.recordSuccess(message.id, response.duration);
      return response;
    } catch (error) {
      this.metrics.recordError(message.id, error);
      throw error;
    }
  }
  
  async receive(request: IncomingMessage): Promise<Message> {
    const body = await this.parseRequestBody(request);
    const message = this.validateAndParseMessage(body);
    
    this.metrics.recordReceived(message.id);
    return message;
  }
}
```

### WebSocket Channel
```typescript
class WebSocketChannel implements CommunicationChannel {
  name = 'WebSocket';
  type = 'bidirectional';
  private connections: Map<string, WebSocket> = new Map();
  private messageHandlers: Map<string, MessageHandler> = new Map();
  
  async connect(endpoint: string): Promise<void> {
    if (this.connections.has(endpoint)) {
      return; // Already connected
    }
    
    const ws = new WebSocket(endpoint);
    
    return new Promise((resolve, reject) => {
      ws.onopen = () => {
        this.connections.set(endpoint, ws);
        this.setupMessageHandling(ws, endpoint);
        this.metrics.recordConnection(endpoint);
        resolve();
      };
      
      ws.onerror = (error) => {
        this.metrics.recordConnectionError(endpoint, error);
        reject(error);
      };
      
      ws.onclose = () => {
        this.connections.delete(endpoint);
        this.metrics.recordDisconnection(endpoint);
      };
    });
  }
  
  async send(message: Message, endpoint: string): Promise<void> {
    let ws = this.connections.get(endpoint);
    
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      await this.connect(endpoint);
      ws = this.connections.get(endpoint)!;
    }
    
    const serializedMessage = JSON.stringify(message);
    ws.send(serializedMessage);
    
    this.metrics.recordSent(message.id, serializedMessage.length);
  }
  
  private setupMessageHandling(ws: WebSocket, endpoint: string): void {
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleIncomingMessage(message, endpoint);
      } catch (error) {
        this.metrics.recordParseError(endpoint, error);
      }
    };
  }
}
```

### Message Queue Channel
```typescript
class MessageQueueChannel implements CommunicationChannel {
  name = 'MessageQueue';
  type = 'asynchronous';
  private connection?: Connection;
  private channel?: Channel;
  private consumers: Map<string, Consumer> = new Map();
  
  async initialize(): Promise<void> {
    this.connection = await amqp.connect(this.config.connectionString);
    this.channel = await this.connection.createChannel();
    
    // Setup dead letter exchange
    await this.setupDeadLetterExchange();
    
    // Setup retry mechanism
    await this.setupRetryMechanism();
  }
  
  async send(message: Message, queue: string): Promise<void> {
    if (!this.channel) await this.initialize();
    
    await this.channel.assertQueue(queue, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'dlx',
        'x-dead-letter-routing-key': `${queue}.failed`
      }
    });
    
    const messageOptions = {
      persistent: true,
      messageId: message.id,
      correlationId: message.correlationId,
      timestamp: Date.now(),
      headers: {
        'retry-count': 0,
        'max-retries': this.config.maxRetries
      }
    };
    
    const messageBuffer = Buffer.from(JSON.stringify(message));
    const published = this.channel.sendToQueue(queue, messageBuffer, messageOptions);
    
    if (!published) {
      throw new Error('Failed to publish message to queue');
    }
    
    this.metrics.recordSent(message.id, messageBuffer.length);
  }
  
  async subscribe(queue: string, handler: MessageHandler): Promise<void> {
    if (!this.channel) await this.initialize();
    
    await this.channel.assertQueue(queue, { durable: true });
    
    const consumer = await this.channel.consume(queue, async (msg) => {
      if (!msg) return;
      
      try {
        const message = JSON.parse(msg.content.toString());
        await handler(message);
        
        this.channel.ack(msg);
        this.metrics.recordProcessed(message.id);
      } catch (error) {
        await this.handleProcessingError(msg, error);
      }
    }, {
      noAck: false
    });
    
    this.consumers.set(queue, consumer);
  }
  
  private async handleProcessingError(msg: ConsumeMessage, error: Error): Promise<void> {
    const retryCount = (msg.properties.headers['retry-count'] || 0) + 1;
    const maxRetries = msg.properties.headers['max-retries'] || this.config.maxRetries;
    
    if (retryCount <= maxRetries) {
      // Retry with exponential backoff
      const delay = Math.pow(2, retryCount) * 1000;
      
      setTimeout(() => {
        const retryHeaders = {
          ...msg.properties.headers,
          'retry-count': retryCount
        };
        
        this.channel.sendToQueue(msg.fields.routingKey, msg.content, {
          ...msg.properties,
          headers: retryHeaders
        });
      }, delay);
    } else {
      // Send to dead letter queue
      this.channel.nack(msg, false, false);
    }
    
    this.metrics.recordError(msg.properties.messageId, error);
  }
}
```

### Event Stream Channel
```typescript
class EventStreamChannel implements CommunicationChannel {
  name = 'EventStream';
  type = 'streaming';
  private streams: Map<string, EventStream> = new Map();
  
  async createStream(streamName: string, config: StreamConfig): Promise<EventStream> {
    const stream = new EventStream(streamName, config);
    await stream.initialize();
    
    this.streams.set(streamName, stream);
    return stream;
  }
  
  async publish(streamName: string, event: Event): Promise<void> {
    const stream = this.streams.get(streamName);
    if (!stream) {
      throw new Error(`Stream ${streamName} not found`);
    }
    
    const eventData = {
      id: event.id,
      type: event.type,
      data: event.data,
      timestamp: new Date().toISOString(),
      metadata: event.metadata
    };
    
    await stream.append(eventData);
    this.metrics.recordEventPublished(streamName, event.id);
  }
  
  async subscribe(
    streamName: string,
    handler: EventHandler,
    options: SubscriptionOptions = {}
  ): Promise<Subscription> {
    const stream = this.streams.get(streamName);
    if (!stream) {
      throw new Error(`Stream ${streamName} not found`);
    }
    
    const subscription = await stream.subscribe({
      fromPosition: options.fromPosition || 'latest',
      batchSize: options.batchSize || 100,
      handler: async (events: Event[]) => {
        for (const event of events) {
          try {
            await handler(event);
            this.metrics.recordEventProcessed(streamName, event.id);
          } catch (error) {
            this.metrics.recordEventError(streamName, event.id, error);
            
            if (options.errorHandler) {
              await options.errorHandler(event, error);
            }
          }
        }
      }
    });
    
    return subscription;
  }
}
```

## Channel Selection and Routing

### Channel Selector
```typescript
class ChannelSelector {
  selectChannel(message: Message, availableChannels: CommunicationChannel[]): CommunicationChannel {
    const criteria = this.getSelectionCriteria(message);
    
    // Filter channels based on capabilities
    const suitableChannels = availableChannels.filter(channel =>
      this.isChannelSuitable(channel, criteria)
    );
    
    if (suitableChannels.length === 0) {
      throw new Error('No suitable channels found for message');
    }
    
    // Score channels based on criteria
    const scoredChannels = suitableChannels.map(channel => ({
      channel,
      score: this.scoreChannel(channel, criteria)
    }));
    
    // Sort by score and return best channel
    scoredChannels.sort((a, b) => b.score - a.score);
    return scoredChannels[0].channel;
  }
  
  private getSelectionCriteria(message: Message): ChannelSelectionCriteria {
    return {
      priority: message.priority,
      reliability: message.requiresReliability,
      latency: message.maxLatency,
      size: this.estimateMessageSize(message),
      security: message.securityLevel,
      deliveryGuarantee: message.deliveryGuarantee
    };
  }
  
  private scoreChannel(channel: CommunicationChannel, criteria: ChannelSelectionCriteria): number {
    let score = 0;
    
    // Latency scoring
    if (criteria.latency === 'low' && channel.characteristics.lowLatency) {
      score += 30;
    }
    
    // Reliability scoring
    if (criteria.reliability && channel.characteristics.reliable) {
      score += 25;
    }
    
    // Throughput scoring
    if (criteria.size > 1024 && channel.characteristics.highThroughput) {
      score += 20;
    }
    
    // Security scoring
    if (criteria.security === 'high' && channel.characteristics.secure) {
      score += 15;
    }
    
    // Current load penalty
    const loadPenalty = channel.currentLoad * 10;
    score -= loadPenalty;
    
    return score;
  }
}
```

### Message Router
```typescript
class MessageRouter {
  private channels: Map<string, CommunicationChannel> = new Map();
  private selector: ChannelSelector = new ChannelSelector();
  private deadLetterQueue: DeadLetterQueue = new DeadLetterQueue();
  
  async route(message: Message, destination: Destination): Promise<void> {
    const routingContext = this.createRoutingContext(message, destination);
    
    try {
      await this.executeRouting(routingContext);
    } catch (error) {
      await this.handleRoutingError(routingContext, error);
    }
  }
  
  private async executeRouting(context: RoutingContext): Promise<void> {
    const { message, destination } = context;
    
    // Select appropriate channel
    const availableChannels = this.getAvailableChannels(destination);
    const selectedChannel = this.selector.selectChannel(message, availableChannels);
    
    // Apply delivery guarantee
    switch (message.deliveryGuarantee) {
      case 'at-most-once':
        await this.sendAtMostOnce(selectedChannel, message, destination);
        break;
      case 'at-least-once':
        await this.sendAtLeastOnce(selectedChannel, message, destination);
        break;
      case 'exactly-once':
        await this.sendExactlyOnce(selectedChannel, message, destination);
        break;
      default:
        await selectedChannel.send(message, destination.address);
    }
  }
  
  private async sendAtLeastOnce(
    channel: CommunicationChannel,
    message: Message,
    destination: Destination
  ): Promise<void> {
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        await channel.send(message, destination.address);
        
        // Wait for acknowledgment
        const ack = await this.waitForAcknowledgment(message.id, 5000);
        if (ack) {
          return; // Success
        }
      } catch (error) {
        attempt++;
        if (attempt >= maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        await this.sleep(Math.pow(2, attempt) * 1000);
      }
    }
  }
  
  private async sendExactlyOnce(
    channel: CommunicationChannel,
    message: Message,
    destination: Destination
  ): Promise<void> {
    // Check if message was already sent
    const messageId = message.id;
    if (await this.isMessageAlreadySent(messageId)) {
      return; // Already sent
    }
    
    // Use transactional sending
    const transaction = await this.beginTransaction();
    
    try {
      await channel.send(message, destination.address);
      await this.markMessageAsSent(messageId);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
```

## Load Balancing and Failover

### Load Balancer
```typescript
class ChannelLoadBalancer {
  private strategies: Map<string, LoadBalancingStrategy> = new Map();
  
  constructor() {
    this.strategies.set('round-robin', new RoundRobinStrategy());
    this.strategies.set('weighted', new WeightedStrategy());
    this.strategies.set('least-connections', new LeastConnectionsStrategy());
    this.strategies.set('response-time', new ResponseTimeStrategy());
  }
  
  selectChannel(
    channels: CommunicationChannel[],
    strategy: string = 'round-robin'
  ): CommunicationChannel {
    const loadBalancer = this.strategies.get(strategy);
    if (!loadBalancer) {
      throw new Error(`Unknown load balancing strategy: ${strategy}`);
    }
    
    const healthyChannels = channels.filter(channel => channel.isHealthy());
    if (healthyChannels.length === 0) {
      throw new Error('No healthy channels available');
    }
    
    return loadBalancer.select(healthyChannels);
  }
}

class RoundRobinStrategy implements LoadBalancingStrategy {
  private currentIndex = 0;
  
  select(channels: CommunicationChannel[]): CommunicationChannel {
    const channel = channels[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % channels.length;
    return channel;
  }
}

class WeightedStrategy implements LoadBalancingStrategy {
  select(channels: CommunicationChannel[]): CommunicationChannel {
    const totalWeight = channels.reduce((sum, channel) => sum + channel.weight, 0);
    const random = Math.random() * totalWeight;
    
    let currentWeight = 0;
    for (const channel of channels) {
      currentWeight += channel.weight;
      if (random <= currentWeight) {
        return channel;
      }
    }
    
    return channels[channels.length - 1];
  }
}
```

### Failover Manager
```typescript
class FailoverManager {
  private primaryChannels: Map<string, CommunicationChannel> = new Map();
  private backupChannels: Map<string, CommunicationChannel[]> = new Map();
  
  async sendWithFailover(message: Message, destination: string): Promise<void> {
    const primary = this.primaryChannels.get(destination);
    
    if (primary && primary.isHealthy()) {
      try {
        await primary.send(message, destination);
        return;
      } catch (error) {
        this.markChannelUnhealthy(primary);
      }
    }
    
    // Try backup channels
    const backups = this.backupChannels.get(destination) || [];
    
    for (const backup of backups) {
      if (backup.isHealthy()) {
        try {
          await backup.send(message, destination);
          return;
        } catch (error) {
          this.markChannelUnhealthy(backup);
        }
      }
    }
    
    throw new Error('All channels failed for destination: ' + destination);
  }
  
  private markChannelUnhealthy(channel: CommunicationChannel): void {
    channel.markUnhealthy();
    
    // Schedule health check
    setTimeout(() => {
      this.performHealthCheck(channel);
    }, this.config.healthCheckInterval);
  }
  
  private async performHealthCheck(channel: CommunicationChannel): Promise<void> {
    try {
      await channel.healthCheck();
      channel.markHealthy();
    } catch (error) {
      // Schedule another health check
      setTimeout(() => {
        this.performHealthCheck(channel);
      }, this.config.healthCheckInterval);
    }
  }
}
```

## Monitoring and Metrics

### Channel Metrics
```typescript
class ChannelMetrics {
  private metrics: Map<string, ChannelMetric> = new Map();
  
  recordSent(channelName: string, messageId: string, size: number): void {
    const metric = this.getOrCreateMetric(channelName);
    metric.sentCount++;
    metric.sentBytes += size;
    metric.lastActivity = new Date();
  }
  
  recordReceived(channelName: string, messageId: string, size: number): void {
    const metric = this.getOrCreateMetric(channelName);
    metric.receivedCount++;
    metric.receivedBytes += size;
    metric.lastActivity = new Date();
  }
  
  recordError(channelName: string, messageId: string, error: Error): void {
    const metric = this.getOrCreateMetric(channelName);
    metric.errorCount++;
    metric.lastError = {
      timestamp: new Date(),
      error: error.message,
      messageId
    };
  }
  
  recordLatency(channelName: string, messageId: string, latency: number): void {
    const metric = this.getOrCreateMetric(channelName);
    metric.latencies.push(latency);
    
    // Keep only last 1000 latency measurements
    if (metric.latencies.length > 1000) {
      metric.latencies.shift();
    }
    
    metric.averageLatency = metric.latencies.reduce((a, b) => a + b, 0) / metric.latencies.length;
  }
  
  getChannelHealth(channelName: string): ChannelHealth {
    const metric = this.metrics.get(channelName);
    if (!metric) {
      return { status: 'unknown', score: 0 };
    }
    
    const errorRate = metric.errorCount / (metric.sentCount + metric.receivedCount);
    const isActive = Date.now() - metric.lastActivity.getTime() < 300000; // 5 minutes
    
    let status: HealthStatus;
    let score = 100;
    
    if (!isActive) {
      status = 'inactive';
      score = 0;
    } else if (errorRate > 0.1) {
      status = 'unhealthy';
      score = Math.max(0, 100 - (errorRate * 1000));
    } else if (errorRate > 0.05) {
      status = 'degraded';
      score = Math.max(50, 100 - (errorRate * 500));
    } else {
      status = 'healthy';
      score = Math.max(80, 100 - (errorRate * 100));
    }
    
    return { status, score, errorRate, averageLatency: metric.averageLatency };
  }
}
```

### Performance Dashboard
```typescript
class ChannelDashboard {
  async generateReport(): Promise<ChannelReport> {
    const channels = await this.channelManager.getAllChannels();
    const report: ChannelReport = {
      timestamp: new Date(),
      channels: [],
      summary: {
        totalChannels: channels.length,
        healthyChannels: 0,
        unhealthyChannels: 0,
        totalMessages: 0,
        totalErrors: 0
      }
    };
    
    for (const channel of channels) {
      const health = this.metrics.getChannelHealth(channel.name);
      const metrics = this.metrics.getMetrics(channel.name);
      
      const channelReport: ChannelReportItem = {
        name: channel.name,
        type: channel.type,
        health: health,
        metrics: {
          sentCount: metrics?.sentCount || 0,
          receivedCount: metrics?.receivedCount || 0,
          errorCount: metrics?.errorCount || 0,
          averageLatency: metrics?.averageLatency || 0
        }
      };
      
      report.channels.push(channelReport);
      
      // Update summary
      if (health.status === 'healthy') {
        report.summary.healthyChannels++;
      } else {
        report.summary.unhealthyChannels++;
      }
      
      report.summary.totalMessages += channelReport.metrics.sentCount + channelReport.metrics.receivedCount;
      report.summary.totalErrors += channelReport.metrics.errorCount;
    }
    
    return report;
  }
}
```

## Integration Points

### Agent System Integration
- Integration with agent communication interfaces
- Agent discovery and channel negotiation
- Message routing between agents
- Performance monitoring and optimization

### External System Integration
- Zendesk webhook channel implementation
- ClickUp API communication channel
- Third-party service integration channels
- Legacy system communication adapters

### Event System Integration
- Event-driven channel activation
- Channel event publishing and subscription
- Event correlation across channels
- Channel performance event generation

## Best Practices

### Channel Design
- Design channels for specific communication patterns
- Implement proper error handling and recovery
- Optimize for expected message volumes and sizes
- Provide comprehensive monitoring and metrics

### Performance Optimization
- Use connection pooling for persistent channels
- Implement message batching where appropriate
- Monitor and optimize channel performance
- Use appropriate serialization formats

### Reliability and Resilience
- Implement proper failover mechanisms
- Use circuit breakers for external dependencies
- Provide message persistence for critical communications
- Implement proper retry logic with backoff

### Security Considerations
- Encrypt sensitive data in transit
- Implement proper authentication and authorization
- Use secure communication protocols
- Regularly audit channel security configurations