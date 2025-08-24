# Performance Guidelines

## Overview
This document outlines performance optimization standards, monitoring practices, and best practices for the Zendesk-ClickUp Automation project.

## Performance Principles

### Core Performance Goals
- **Response Time**: API responses < 200ms for 95th percentile
- **Throughput**: Handle 1000+ concurrent requests
- **Availability**: 99.9% uptime
- **Resource Efficiency**: Optimal CPU and memory usage
- **Scalability**: Linear scaling with load

### Performance-First Development
- Consider performance implications in design decisions
- Implement performance testing from the start
- Monitor performance metrics continuously
- Optimize based on real-world usage patterns

## Code-Level Optimizations

### Efficient Data Structures
```typescript
// ✅ GOOD - Use Map for O(1) lookups
const userCache = new Map<string, User>();

function getUserById(id: string): User | undefined {
  return userCache.get(id);
}

// ❌ BAD - Array.find() is O(n)
const users: User[] = [];

function getUserById(id: string): User | undefined {
  return users.find(user => user.id === id);
}
```

### Async/Await Best Practices
```typescript
// ✅ GOOD - Parallel execution
async function syncTickets(ticketIds: string[]): Promise<SyncResult[]> {
  const promises = ticketIds.map(id => syncSingleTicket(id));
  return Promise.all(promises);
}

// ❌ BAD - Sequential execution
async function syncTickets(ticketIds: string[]): Promise<SyncResult[]> {
  const results: SyncResult[] = [];
  for (const id of ticketIds) {
    const result = await syncSingleTicket(id);
    results.push(result);
  }
  return results;
}
```

### Memory Management
```typescript
// ✅ GOOD - Proper cleanup and resource management
export class TicketProcessor {
  private readonly cache = new Map<string, CachedTicket>();
  private readonly maxCacheSize = 1000;
  
  addToCache(ticket: CachedTicket): void {
    // Implement LRU eviction
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(ticket.id, {
      ...ticket,
      lastAccessed: Date.now()
    });
  }
  
  cleanup(): void {
    this.cache.clear();
  }
}

// ❌ BAD - Memory leaks
export class TicketProcessor {
  private readonly cache = new Map<string, CachedTicket>();
  
  addToCache(ticket: CachedTicket): void {
    // No size limit - potential memory leak
    this.cache.set(ticket.id, ticket);
  }
}
```

### Efficient String Operations
```typescript
// ✅ GOOD - Use template literals for simple concatenation
const message = `Ticket ${ticketId} has been ${status}`;

// ✅ GOOD - Use Array.join() for multiple concatenations
const parts = [prefix, ticketId, status, suffix];
const message = parts.join(' ');

// ❌ BAD - String concatenation in loops
let message = '';
for (const part of parts) {
  message += part + ' ';
}
```

## Database Performance

### Query Optimization
```typescript
// ✅ GOOD - Efficient query with proper indexing
export class TicketRepository {
  async findActiveTicketsByUser(userId: string): Promise<Ticket[]> {
    return this.db.query(`
      SELECT t.id, t.title, t.status, t.created_at
      FROM tickets t
      WHERE t.assignee_id = $1 
        AND t.status IN ('open', 'pending')
        AND t.deleted_at IS NULL
      ORDER BY t.created_at DESC
      LIMIT 100
    `, [userId]);
  }
}

// ❌ BAD - Inefficient query without proper filtering
export class TicketRepository {
  async findActiveTicketsByUser(userId: string): Promise<Ticket[]> {
    const allTickets = await this.db.query('SELECT * FROM tickets');
    return allTickets.filter(ticket => 
      ticket.assignee_id === userId && 
      ['open', 'pending'].includes(ticket.status) &&
      !ticket.deleted_at
    );
  }
}
```

### Connection Pooling
```typescript
// Database connection pool configuration
export const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  pool: {
    min: 5,           // Minimum connections
    max: 20,          // Maximum connections
    idle: 10000,      // Close connections after 10s of inactivity
    acquire: 60000,   // Maximum time to get connection
    evict: 1000       // Check for idle connections every 1s
  },
  logging: process.env.NODE_ENV === 'development'
};
```

### Indexing Strategy
```sql
-- Performance-critical indexes
CREATE INDEX CONCURRENTLY idx_tickets_assignee_status 
  ON tickets (assignee_id, status) 
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_tickets_created_at 
  ON tickets (created_at DESC);

CREATE INDEX CONCURRENTLY idx_sync_records_status 
  ON sync_records (status, created_at);

-- Composite index for common query patterns
CREATE INDEX CONCURRENTLY idx_tickets_search 
  ON tickets USING gin(to_tsvector('english', title || ' ' || description));
```

## Caching Strategies

### Multi-Level Caching
```typescript
export class CacheManager {
  private readonly memoryCache = new Map<string, CacheEntry>();
  private readonly redisClient: Redis;
  
  async get<T>(key: string): Promise<T | null> {
    // Level 1: Memory cache
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      return memoryEntry.value as T;
    }
    
    // Level 2: Redis cache
    const redisValue = await this.redisClient.get(key);
    if (redisValue) {
      const parsed = JSON.parse(redisValue) as T;
      
      // Store in memory cache for faster access
      this.memoryCache.set(key, {
        value: parsed,
        expiresAt: Date.now() + 60000 // 1 minute
      });
      
      return parsed;
    }
    
    return null;
  }
  
  async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    // Store in both caches
    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + Math.min(ttl * 1000, 60000)
    });
    
    await this.redisClient.setex(key, ttl, JSON.stringify(value));
  }
}
```

### Cache Invalidation
```typescript
export class TicketService {
  constructor(
    private readonly repository: TicketRepository,
    private readonly cache: CacheManager
  ) {}
  
  async updateTicket(id: string, updates: UpdateTicketDto): Promise<Ticket> {
    const ticket = await this.repository.update(id, updates);
    
    // Invalidate related caches
    await Promise.all([
      this.cache.delete(`ticket:${id}`),
      this.cache.delete(`user:${ticket.assigneeId}:tickets`),
      this.cache.invalidatePattern(`tickets:*`)
    ]);
    
    return ticket;
  }
}
```

## API Performance

### Response Compression
```typescript
import compression from 'compression';

// Enable gzip compression
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024
}));
```

### Request Optimization
```typescript
// ✅ GOOD - Batch API requests
export class ZendeskBatchService {
  async getMultipleTickets(ticketIds: string[]): Promise<ZendeskTicket[]> {
    // Batch requests in chunks of 100
    const chunks = this.chunkArray(ticketIds, 100);
    const promises = chunks.map(chunk => 
      this.zendeskClient.getTickets(chunk.join(','))
    );
    
    const results = await Promise.all(promises);
    return results.flat();
  }
  
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// ❌ BAD - Individual API requests
export class ZendeskService {
  async getMultipleTickets(ticketIds: string[]): Promise<ZendeskTicket[]> {
    const tickets: ZendeskTicket[] = [];
    for (const id of ticketIds) {
      const ticket = await this.zendeskClient.getTicket(id);
      tickets.push(ticket);
    }
    return tickets;
  }
}
```

### Pagination Optimization
```typescript
// ✅ GOOD - Cursor-based pagination for large datasets
export class TicketController {
  async getTickets(req: Request, res: Response): Promise<void> {
    const { cursor, limit = 20 } = req.query;
    
    const tickets = await this.ticketService.getTickets({
      cursor: cursor as string,
      limit: Math.min(Number(limit), 100)
    });
    
    const nextCursor = tickets.length === Number(limit) 
      ? tickets[tickets.length - 1].id 
      : null;
    
    res.json({
      success: true,
      data: tickets,
      pagination: {
        nextCursor,
        hasMore: nextCursor !== null
      }
    });
  }
}
```

## Background Processing

### Queue Management
```typescript
import Bull from 'bull';

// Job queue configuration
export const syncQueue = new Bull('ticket-sync', {
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379')
  },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

// Process jobs with concurrency control
syncQueue.process('sync-ticket', 5, async (job) => {
  const { ticketId, direction } = job.data;
  
  try {
    await syncTicket(ticketId, direction);
    job.progress(100);
  } catch (error) {
    job.log(`Sync failed: ${error.message}`);
    throw error;
  }
});
```

### Batch Processing
```typescript
export class BatchProcessor {
  private readonly batchSize = 50;
  private readonly batchInterval = 5000; // 5 seconds
  private pendingItems: SyncItem[] = [];
  
  async addItem(item: SyncItem): Promise<void> {
    this.pendingItems.push(item);
    
    if (this.pendingItems.length >= this.batchSize) {
      await this.processBatch();
    }
  }
  
  private async processBatch(): Promise<void> {
    if (this.pendingItems.length === 0) return;
    
    const batch = this.pendingItems.splice(0, this.batchSize);
    
    try {
      await this.syncService.processBatch(batch);
    } catch (error) {
      // Handle batch processing errors
      await this.handleBatchError(batch, error);
    }
  }
  
  startBatchTimer(): void {
    setInterval(() => {
      if (this.pendingItems.length > 0) {
        this.processBatch();
      }
    }, this.batchInterval);
  }
}
```

## Monitoring and Metrics

### Performance Metrics
```typescript
import { register, Counter, Histogram, Gauge } from 'prom-client';

// Define metrics
export const metrics = {
  httpRequestDuration: new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code']
  }),
  
  syncOperations: new Counter({
    name: 'sync_operations_total',
    help: 'Total number of sync operations',
    labelNames: ['direction', 'status']
  }),
  
  activeConnections: new Gauge({
    name: 'active_database_connections',
    help: 'Number of active database connections'
  }),
  
  cacheHitRate: new Counter({
    name: 'cache_operations_total',
    help: 'Total cache operations',
    labelNames: ['type', 'result']
  })
};

// Middleware to track request duration
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    metrics.httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode.toString())
      .observe(duration);
  });
  
  next();
}
```

### Performance Monitoring
```typescript
export class PerformanceMonitor {
  private readonly alertThresholds = {
    responseTime: 1000,    // 1 second
    errorRate: 0.05,       // 5%
    memoryUsage: 0.85      // 85%
  };
  
  async checkPerformance(): Promise<PerformanceReport> {
    const metrics = await this.collectMetrics();
    const alerts = this.checkAlerts(metrics);
    
    if (alerts.length > 0) {
      await this.sendAlerts(alerts);
    }
    
    return {
      timestamp: new Date(),
      metrics,
      alerts
    };
  }
  
  private async collectMetrics(): Promise<SystemMetrics> {
    return {
      responseTime: await this.getAverageResponseTime(),
      errorRate: await this.getErrorRate(),
      memoryUsage: process.memoryUsage().heapUsed / process.memoryUsage().heapTotal,
      cpuUsage: await this.getCpuUsage(),
      activeConnections: await this.getActiveConnections()
    };
  }
}
```

## Load Testing

### Performance Testing Strategy
```typescript
// k6 load testing script
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up
    { duration: '5m', target: 100 },   // Stay at 100 users
    { duration: '2m', target: 200 },   // Ramp up to 200 users
    { duration: '5m', target: 200 },   // Stay at 200 users
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],   // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],      // Error rate under 10%
  }
};

export default function() {
  const response = http.get('http://localhost:3000/api/v1/tickets');
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
```

## Resource Optimization

### Memory Optimization
```typescript
// ✅ GOOD - Streaming for large datasets
export class ReportGenerator {
  async generateLargeReport(filters: ReportFilters): Promise<NodeJS.ReadableStream> {
    const stream = new Readable({ objectMode: true });
    
    // Process data in chunks to avoid memory issues
    let offset = 0;
    const batchSize = 1000;
    
    const processNextBatch = async () => {
      const batch = await this.repository.getReportData(filters, offset, batchSize);
      
      if (batch.length === 0) {
        stream.push(null); // End stream
        return;
      }
      
      for (const item of batch) {
        stream.push(this.formatReportItem(item));
      }
      
      offset += batchSize;
      setImmediate(processNextBatch); // Yield control
    };
    
    processNextBatch();
    return stream;
  }
}
```

### CPU Optimization
```typescript
// ✅ GOOD - Use worker threads for CPU-intensive tasks
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';

if (isMainThread) {
  // Main thread
  export class DataProcessor {
    async processLargeDataset(data: any[]): Promise<ProcessedData[]> {
      const numWorkers = require('os').cpus().length;
      const chunkSize = Math.ceil(data.length / numWorkers);
      
      const promises = [];
      for (let i = 0; i < numWorkers; i++) {
        const chunk = data.slice(i * chunkSize, (i + 1) * chunkSize);
        if (chunk.length > 0) {
          promises.push(this.processChunk(chunk));
        }
      }
      
      const results = await Promise.all(promises);
      return results.flat();
    }
    
    private processChunk(chunk: any[]): Promise<ProcessedData[]> {
      return new Promise((resolve, reject) => {
        const worker = new Worker(__filename, {
          workerData: { chunk }
        });
        
        worker.on('message', resolve);
        worker.on('error', reject);
      });
    }
  }
} else {
  // Worker thread
  const { chunk } = workerData;
  const processed = chunk.map(item => {
    // CPU-intensive processing
    return processItem(item);
  });
  
  parentPort?.postMessage(processed);
}
```

## AI Assistant Performance Rules

### Performance Optimization Guidelines
- Generate code with performance considerations from the start
- Implement efficient algorithms and data structures
- Add appropriate caching layers
- Use async/await patterns correctly
- Include performance monitoring and metrics
- Optimize database queries and indexing

### Performance Checklist for AI
- [ ] Efficient data structures used
- [ ] Async operations properly parallelized
- [ ] Database queries optimized with proper indexes
- [ ] Caching implemented where appropriate
- [ ] Memory usage optimized
- [ ] API responses compressed
- [ ] Background processing for heavy tasks
- [ ] Performance metrics and monitoring added
- [ ] Load testing considerations included
- [ ] Resource cleanup implemented
- [ ] Error handling doesn't impact performance
- [ ] Pagination implemented for large datasets

## Performance Best Practices Summary

### Do's
- ✅ Use appropriate data structures for the use case
- ✅ Implement caching at multiple levels
- ✅ Optimize database queries and use proper indexing
- ✅ Use connection pooling for database connections
- ✅ Implement background processing for heavy tasks
- ✅ Monitor performance metrics continuously
- ✅ Use compression for API responses
- ✅ Implement proper pagination
- ✅ Use streaming for large datasets
- ✅ Parallelize independent operations

### Don'ts
- ❌ Don't load entire datasets into memory
- ❌ Don't make sequential API calls when parallel is possible
- ❌ Don't ignore database query performance
- ❌ Don't cache everything without considering memory usage
- ❌ Don't block the event loop with CPU-intensive tasks
- ❌ Don't ignore memory leaks
- ❌ Don't skip performance testing
- ❌ Don't optimize prematurely without measuring
- ❌ Don't ignore error handling performance impact
- ❌ Don't forget to clean up resources

---

**Note**: Performance optimization should be based on actual measurements and real-world usage patterns. Always profile before optimizing and measure the impact of changes.