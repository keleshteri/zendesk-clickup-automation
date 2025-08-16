# Utility Functions & Helper Modules 🛠️

This directory contains reusable utility functions, helper modules, and common functionality that supports the entire Zendesk-ClickUp automation system. These utilities provide essential building blocks for data processing, validation, formatting, and system operations.

## Purpose

The Utils directory provides:
- Common utility functions and helpers
- Data transformation and validation utilities
- String manipulation and formatting functions
- Date/time processing utilities
- File system and path utilities
- Encryption and security helpers
- Performance optimization utilities
- Testing and debugging helpers

## File Structure

```
utils/
├── validation.ts      # Data validation utilities
├── formatting.ts      # String and data formatting functions
├── date.ts           # Date/time manipulation utilities
├── crypto.ts         # Encryption and hashing utilities
├── file.ts           # File system operations
├── performance.ts    # Performance monitoring utilities
├── testing.ts        # Testing helper functions
├── logger.ts         # Logging utilities
├── cache.ts          # Caching utilities
├── retry.ts          # Retry logic utilities
├── rate-limit.ts     # Rate limiting utilities
├── sanitize.ts       # Data sanitization utilities
├── transform.ts      # Data transformation utilities
└── index.ts          # Main exports
```

## Core Utility Categories

### Data Validation (`validation.ts`)
Comprehensive validation utilities for ensuring data integrity:

```typescript
// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// URL validation
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Phone number validation
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,3}[\s\-\(\)]?[\d\s\-\(\)]{7,14}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Object validation
export function validateObject<T>(
  obj: unknown,
  schema: ValidationSchema<T>
): ValidationResult<T> {
  const errors: ValidationError[] = [];
  
  for (const [key, validator] of Object.entries(schema)) {
    const value = (obj as any)?.[key];
    const result = validator(value);
    
    if (!result.isValid) {
      errors.push({
        field: key,
        message: result.message,
        value
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? obj as T : undefined
  };
}

// Array validation
export function validateArray<T>(
  arr: unknown[],
  itemValidator: (item: unknown) => ValidationResult<T>
): ValidationResult<T[]> {
  if (!Array.isArray(arr)) {
    return {
      isValid: false,
      errors: [{ field: 'root', message: 'Expected array', value: arr }]
    };
  }
  
  const validatedItems: T[] = [];
  const errors: ValidationError[] = [];
  
  arr.forEach((item, index) => {
    const result = itemValidator(item);
    if (result.isValid && result.data) {
      validatedItems.push(result.data);
    } else {
      errors.push(...result.errors.map(err => ({
        ...err,
        field: `[${index}].${err.field}`
      })));
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? validatedItems : undefined
  };
}

interface ValidationSchema<T> {
  [K in keyof T]: (value: unknown) => ValidationResult<T[K]>;
}

interface ValidationResult<T> {
  isValid: boolean;
  errors: ValidationError[];
  data?: T;
}

interface ValidationError {
  field: string;
  message: string;
  value: unknown;
}
```

### String & Data Formatting (`formatting.ts`)
Utilities for consistent data formatting across the system:

```typescript
// String formatting
export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function truncateText(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

// Number formatting
export function formatCurrency(
  amount: number,
  currency = 'USD',
  locale = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(amount);
}

export function formatNumber(
  num: number,
  decimals = 2,
  locale = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

// Template formatting
export function formatTemplate(
  template: string,
  variables: Record<string, any>
): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const value = variables[key.trim()];
    return value !== undefined ? String(value) : match;
  });
}

// JSON formatting
export function formatJson(obj: any, indent = 2): string {
  return JSON.stringify(obj, null, indent);
}

export function minifyJson(obj: any): string {
  return JSON.stringify(obj);
}
```

### Date & Time Utilities (`date.ts`)
Comprehensive date/time manipulation and formatting:

```typescript
// Date formatting
export function formatDate(
  date: Date | string | number,
  format = 'YYYY-MM-DD',
  timezone?: string
): string {
  const d = new Date(date);
  
  if (timezone) {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(d);
  }
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day);
}

export function formatDateTime(
  date: Date | string | number,
  includeSeconds = false,
  timezone?: string
): string {
  const d = new Date(date);
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };
  
  if (includeSeconds) {
    options.second = '2-digit';
  }
  
  if (timezone) {
    options.timeZone = timezone;
  }
  
  return new Intl.DateTimeFormat('sv-SE', options).format(d);
}

// Date calculations
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

export function diffInDays(date1: Date, date2: Date): number {
  const timeDiff = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

export function diffInHours(date1: Date, date2: Date): number {
  const timeDiff = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(timeDiff / (1000 * 3600));
}

// Date validation
export function isValidDate(date: any): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

export function isBusinessDay(date: Date): boolean {
  return !isWeekend(date);
}

// Relative time
export function getRelativeTime(date: Date, now = new Date()): string {
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  
  return formatDate(date);
}
```

### Cryptography & Security (`crypto.ts`)
Security utilities for encryption, hashing, and token generation:

```typescript
import crypto from 'crypto';

// Hashing
export function hashPassword(password: string, salt?: string): string {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, actualSalt, 10000, 64, 'sha512');
  return `${actualSalt}:${hash.toString('hex')}`;
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, hash] = hashedPassword.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512');
  return hash === verifyHash.toString('hex');
}

export function generateHash(data: string, algorithm = 'sha256'): string {
  return crypto.createHash(algorithm).update(data).digest('hex');
}

// Encryption
export function encrypt(text: string, key: string): string {
  const algorithm = 'aes-256-gcm';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string, key: string): string {
  const algorithm = 'aes-256-gcm';
  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipher(algorithm, key);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Token generation
export function generateToken(length = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function generateUUID(): string {
  return crypto.randomUUID();
}

export function generateSecureId(prefix = '', length = 16): string {
  const randomPart = crypto.randomBytes(length).toString('base64url');
  return prefix ? `${prefix}_${randomPart}` : randomPart;
}

// API key generation
export function generateApiKey(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(24).toString('base64url');
  return `ak_${timestamp}_${random}`;
}
```

### File System Utilities (`file.ts`)
File operations and path manipulation utilities:

```typescript
import fs from 'fs/promises';
import path from 'path';

// File operations
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

export async function readJsonFile<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

export async function writeJsonFile(
  filePath: string,
  data: any,
  indent = 2
): Promise<void> {
  const content = JSON.stringify(data, null, indent);
  await ensureDirectory(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf-8');
}

export async function copyFile(source: string, destination: string): Promise<void> {
  await ensureDirectory(path.dirname(destination));
  await fs.copyFile(source, destination);
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

// Path utilities
export function getFileExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase();
}

export function getFileName(filePath: string, includeExtension = true): string {
  const baseName = path.basename(filePath);
  return includeExtension ? baseName : path.parse(baseName).name;
}

export function joinPaths(...paths: string[]): string {
  return path.join(...paths);
}

export function resolvePath(filePath: string): string {
  return path.resolve(filePath);
}

export function relativePath(from: string, to: string): string {
  return path.relative(from, to);
}

// File size utilities
export async function getFileSize(filePath: string): Promise<number> {
  const stats = await fs.stat(filePath);
  return stats.size;
}

export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}
```

### Performance Monitoring (`performance.ts`)
Utilities for measuring and optimizing performance:

```typescript
// Timing utilities
export class Timer {
  private startTime: number;
  private endTime?: number;
  
  constructor() {
    this.startTime = performance.now();
  }
  
  stop(): number {
    this.endTime = performance.now();
    return this.getDuration();
  }
  
  getDuration(): number {
    const end = this.endTime || performance.now();
    return end - this.startTime;
  }
  
  reset(): void {
    this.startTime = performance.now();
    this.endTime = undefined;
  }
}

export function measureTime<T>(fn: () => T): { result: T; duration: number } {
  const timer = new Timer();
  const result = fn();
  const duration = timer.stop();
  return { result, duration };
}

export async function measureAsyncTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const timer = new Timer();
  const result = await fn();
  const duration = timer.stop();
  return { result, duration };
}

// Memory utilities
export function getMemoryUsage(): NodeJS.MemoryUsage {
  return process.memoryUsage();
}

export function formatMemoryUsage(usage: NodeJS.MemoryUsage): string {
  const formatBytes = (bytes: number) => (bytes / 1024 / 1024).toFixed(2) + ' MB';
  
  return [
    `RSS: ${formatBytes(usage.rss)}`,
    `Heap Used: ${formatBytes(usage.heapUsed)}`,
    `Heap Total: ${formatBytes(usage.heapTotal)}`,
    `External: ${formatBytes(usage.external)}`
  ].join(', ');
}

// Performance monitoring
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  
  record(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }
  
  getStats(name: string): PerformanceStats | undefined {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return undefined;
    
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }
  
  clear(name?: string): void {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }
}

interface PerformanceStats {
  count: number;
  min: number;
  max: number;
  avg: number;
  median: number;
  p95: number;
  p99: number;
}
```

### Retry Logic (`retry.ts`)
Robust retry mechanisms with exponential backoff:

```typescript
// Retry configuration
interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitter: boolean;
  retryCondition?: (error: any) => boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  jitter: true
};

// Retry function
export async function retry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: any;
  
  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry this error
      if (finalConfig.retryCondition && !finalConfig.retryCondition(error)) {
        throw error;
      }
      
      // Don't delay on the last attempt
      if (attempt === finalConfig.maxAttempts) {
        break;
      }
      
      // Calculate delay with exponential backoff
      let delay = finalConfig.baseDelay * Math.pow(finalConfig.backoffFactor, attempt - 1);
      delay = Math.min(delay, finalConfig.maxDelay);
      
      // Add jitter to prevent thundering herd
      if (finalConfig.jitter) {
        delay = delay * (0.5 + Math.random() * 0.5);
      }
      
      await sleep(delay);
    }
  }
  
  throw lastError;
}

// Retry with circuit breaker
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeout: number = 60000
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
  
  getState(): string {
    return this.state;
  }
}

// Utility functions
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function isRetryableError(error: any): boolean {
  // Network errors
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
    return true;
  }
  
  // HTTP errors (5xx)
  if (error.response && error.response.status >= 500) {
    return true;
  }
  
  // Rate limiting (429)
  if (error.response && error.response.status === 429) {
    return true;
  }
  
  return false;
}
```

### Rate Limiting (`rate-limit.ts`)
Rate limiting utilities for API calls and resource management:

```typescript
// Token bucket rate limiter
export class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  
  constructor(
    private capacity: number,
    private refillRate: number // tokens per second
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }
  
  async consume(tokens = 1): Promise<boolean> {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }
  
  async waitForTokens(tokens = 1): Promise<void> {
    while (!(await this.consume(tokens))) {
      const waitTime = (tokens - this.tokens) / this.refillRate * 1000;
      await sleep(Math.max(waitTime, 100));
    }
  }
  
  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.refillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
  
  getAvailableTokens(): number {
    this.refill();
    return this.tokens;
  }
}

// Sliding window rate limiter
export class SlidingWindowRateLimiter {
  private requests: number[] = [];
  
  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}
  
  async isAllowed(): Promise<boolean> {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    
    return false;
  }
  
  async waitForSlot(): Promise<void> {
    while (!(await this.isAllowed())) {
      await sleep(100);
    }
  }
  
  getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - this.requests.length);
  }
}

// Rate limited function wrapper
export function rateLimit<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  limiter: TokenBucket | SlidingWindowRateLimiter
): T {
  return (async (...args: any[]) => {
    if (limiter instanceof TokenBucket) {
      await limiter.waitForTokens();
    } else {
      await limiter.waitForSlot();
    }
    return fn(...args);
  }) as T;
}
```

### Data Sanitization (`sanitize.ts`)
Utilities for cleaning and sanitizing user input:

```typescript
// HTML sanitization
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/<object[^>]*>.*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

// SQL injection prevention
export function sanitizeSql(input: string): string {
  return input
    .replace(/'/g, "''")
    .replace(/"/g, '""')
    .replace(/;/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '');
}

// XSS prevention
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  
  return text.replace(/[&<>"']/g, char => map[char]);
}

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}

// File name sanitization
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
}

// URL sanitization
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol');
    }
    
    return parsed.toString();
  } catch {
    return '';
  }
}
```

### Data Transformation (`transform.ts`)
Utilities for transforming data between different formats:

```typescript
// Object transformation
export function transformObject<T, U>(
  obj: T,
  transformer: (key: string, value: any) => [string, any] | null
): U {
  const result: any = {};
  
  for (const [key, value] of Object.entries(obj as any)) {
    const transformed = transformer(key, value);
    if (transformed) {
      const [newKey, newValue] = transformed;
      result[newKey] = newValue;
    }
  }
  
  return result;
}

// Array transformation
export function transformArray<T, U>(
  arr: T[],
  transformer: (item: T, index: number) => U | null
): U[] {
  return arr
    .map(transformer)
    .filter((item): item is U => item !== null);
}

// Deep clone
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as any;
  }
  
  if (typeof obj === 'object') {
    const cloned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  
  return obj;
}

// Merge objects
export function mergeDeep<T>(...objects: Partial<T>[]): T {
  const result: any = {};
  
  for (const obj of objects) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          result[key] = mergeDeep(result[key] || {}, value);
        } else {
          result[key] = value;
        }
      }
    }
  }
  
  return result;
}

// Flatten object
export function flattenObject(
  obj: Record<string, any>,
  prefix = '',
  separator = '.'
): Record<string, any> {
  const flattened: Record<string, any> = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}${separator}${key}` : key;
      const value = obj[key];
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(flattened, flattenObject(value, newKey, separator));
      } else {
        flattened[newKey] = value;
      }
    }
  }
  
  return flattened;
}

// Unflatten object
export function unflattenObject(
  obj: Record<string, any>,
  separator = '.'
): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const keys = key.split(separator);
      let current = result;
      
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!(k in current)) {
          current[k] = {};
        }
        current = current[k];
      }
      
      current[keys[keys.length - 1]] = obj[key];
    }
  }
  
  return result;
}
```

## Export Strategy

The `index.ts` file provides a centralized export point:

```typescript
// Validation utilities
export * from './validation';

// Formatting utilities
export * from './formatting';

// Date utilities
export * from './date';

// Crypto utilities
export * from './crypto';

// File utilities
export * from './file';

// Performance utilities
export * from './performance';

// Testing utilities
export * from './testing';

// Logger utilities
export * from './logger';

// Cache utilities
export * from './cache';

// Retry utilities
export * from './retry';

// Rate limiting utilities
export * from './rate-limit';

// Sanitization utilities
export * from './sanitize';

// Transformation utilities
export * from './transform';

// Commonly used utilities with aliases
export {
  formatDate as fmtDate,
  formatDateTime as fmtDateTime,
  generateUUID as uuid,
  generateToken as token,
  deepClone as clone,
  sleep as delay
};
```

## Usage Examples

### Data Validation
```typescript
import { validateObject, isValidEmail } from '../utils';

const userSchema = {
  email: (value: unknown) => ({
    isValid: typeof value === 'string' && isValidEmail(value),
    errors: [],
    data: value as string
  }),
  age: (value: unknown) => ({
    isValid: typeof value === 'number' && value >= 0,
    errors: [],
    data: value as number
  })
};

const result = validateObject(userData, userSchema);
if (result.isValid) {
  console.log('Valid user:', result.data);
}
```

### Performance Monitoring
```typescript
import { measureAsyncTime, PerformanceMonitor } from '../utils';

const monitor = new PerformanceMonitor();

const { result, duration } = await measureAsyncTime(async () => {
  return await apiCall();
});

monitor.record('api_call', duration);
console.log('API call stats:', monitor.getStats('api_call'));
```

### Rate Limiting
```typescript
import { TokenBucket, rateLimit } from '../utils';

const limiter = new TokenBucket(10, 2); // 10 tokens, 2 per second
const limitedApiCall = rateLimit(apiCall, limiter);

await limitedApiCall(); // Automatically rate limited
```

## Best Practices

### Function Design
- Keep functions pure and side-effect free when possible
- Use TypeScript for strong typing
- Provide comprehensive error handling
- Include JSDoc documentation

### Performance
- Optimize for common use cases
- Use memoization for expensive operations
- Implement lazy loading where appropriate
- Monitor memory usage

### Testing
- Write unit tests for all utility functions
- Test edge cases and error conditions
- Use property-based testing for complex logic
- Maintain high test coverage

### Security
- Validate all inputs
- Sanitize user data
- Use secure random generation
- Follow security best practices

### Maintainability
- Keep functions focused and single-purpose
- Use consistent naming conventions
- Provide clear documentation
- Version breaking changes appropriately