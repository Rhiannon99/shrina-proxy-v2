/**
 * Simple in-memory cache
 */

import { logger } from './logger.js';

interface CacheEntry {
  content: string | Buffer;
  contentType: string;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private defaultTtl: number = 300) {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  set(key: string, content: string | Buffer, contentType: string, ttl?: number): void {
    this.cache.set(key, {
      content,
      contentType,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTtl,
    });

    logger.debug({
      type: 'cache-set',
      key,
      size: typeof content === 'string' ? content.length : content.length,
      ttl: ttl || this.defaultTtl,
    }, 'Cached content');
  }

  get(key: string): { content: string | Buffer; contentType: string } | null {
    const entry = this.cache.get(key);

    if (!entry) {
      logger.debug({ type: 'cache-miss', key }, 'Cache miss');
      return null;
    }

    const age = (Date.now() - entry.timestamp) / 1000;

    if (age > entry.ttl) {
      this.cache.delete(key);
      logger.debug({
        type: 'cache-expired',
        key,
        age,
        ttl: entry.ttl,
      }, 'Cache entry expired');
      return null;
    }

    logger.debug({
      type: 'cache-hit',
      key,
      age,
    }, 'Cache hit');

    return {
      content: entry.content,
      contentType: entry.contentType,
    };
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    logger.info({ type: 'cache-clear' }, 'Cache cleared');
  }

  private cleanup(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      const age = (now - entry.timestamp) / 1000;
      if (age > entry.ttl) {
        this.cache.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      logger.debug({
        type: 'cache-cleanup',
        expired: expiredCount,
        remaining: this.cache.size,
      }, 'Cache cleanup completed');
    }
  }

  getStats(): {
    size: number;
    keys: number;
  } {
    return {
      size: this.cache.size,
      keys: this.cache.size,
    };
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

export const cache = new SimpleCache();
export default cache;
