/**
 * M3U8 Proxy Server - Hono Edition
 * Ultra-fast, lightweight proxy for HLS/M3U8 streams
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { config } from './config.js';
import { logger } from './logger.js';
import { cache } from './cache.js';
import {
  proxyUrl,
  processM3u8,
  isM3u8Url,
  isM3u8ContentType,
  decompressContent,
} from './proxy.js';
import { getStreamingContentType } from './mime-types.js';

// Create Hono app
const app = new Hono();

// CORS middleware - allow all origins
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Range'],
  exposeHeaders: ['Content-Length', 'Content-Range', 'Content-Type', 'Accept-Ranges'],
}));

// Request logging middleware
app.use('*', async (c, next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  logger.info({
    type: 'request',
    method,
    path,
    status,
    duration,
    ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
  }, `${method} ${path} ${status} ${duration}ms`);
});

// Root endpoint
app.get('/', (c) => {
  return c.json({
    name: 'M3U8 Proxy (Hono Edition)',
    version: '1.0.0',
    description: 'Ultra-fast M3U8/HLS proxy with domain-specific anti-hotlinking support',
    framework: 'Hono.js - The fastest web framework',
    usage: {
      proxy: '/proxy?url=https://example.com/playlist.m3u8',
      health: '/health',
      cache: '/cache/stats',
    },
    features: [
      'M3U8/HLS playlist proxying',
      'Automatic URL rewriting',
      'Domain-specific header injection',
      'Content decompression',
      'In-memory caching',
      'Ultra-fast performance with Hono.js',
    ],
    performance: {
      framework: 'Hono.js',
      advantages: [
        '3-4x faster than Express',
        'Zero dependencies',
        'Built-in streaming support',
        'Edge-ready architecture',
      ],
    },
  });
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
    cache: cache.getStats(),
    timestamp: new Date().toISOString(),
  });
});

// Cache stats endpoint
app.get('/cache/stats', (c) => {
  return c.json({
    ...cache.getStats(),
    timestamp: new Date().toISOString(),
  });
});

// Cache clear endpoint
app.post('/cache/clear', (c) => {
  cache.clear();
  return c.json({
    message: 'Cache cleared successfully',
    timestamp: new Date().toISOString(),
  });
});

// Main proxy endpoint
app.get('/proxy', async (c) => {
  try {
    const targetUrl = c.req.query('url');

    if (!targetUrl) {
      return c.json({
        error: 'Missing required parameter: url',
        usage: '/proxy?url=https://example.com/playlist.m3u8',
      }, 400);
    }

    // Validate URL
    try {
      new URL(targetUrl);
    } catch (error) {
      return c.json({
        error: 'Invalid URL format',
        url: targetUrl,
      }, 400);
    }

    // Check cache
    const cacheKey = targetUrl;
    const cached = cache.get(cacheKey);

    if (cached) {
      c.header('Content-Type', cached.contentType);
      c.header('X-Cache', 'HIT');
      return c.body(cached.content);
    }

    // Proxy the request
    const result = await proxyUrl(targetUrl, {
      timeout: config.requestTimeout,
    });

    // Handle content decompression
    // node-fetch does NOT automatically decompress when using arrayBuffer()
    // We must manually decompress ALL compressed content
    let content = result.content;
    const contentEncoding = result.headers['content-encoding'];

    // Decompress if content-encoding header is present
    if (contentEncoding && content instanceof Buffer) {
      logger.info({
        type: 'decompression',
        encoding: contentEncoding,
        url: targetUrl,
        originalSize: content.length,
      }, 'Decompressing content');

      try {
        content = await decompressContent(content, contentEncoding);
        logger.info({
          type: 'decompression-success',
          encoding: contentEncoding,
          decompressedSize: content.length,
        }, 'Content decompressed successfully');
      } catch (error) {
        logger.error({
          type: 'decompression-error',
          encoding: contentEncoding,
          error: error instanceof Error ? error.message : String(error),
        }, 'Failed to decompress content');
        // Continue with compressed content if decompression fails
      }
    }

    // Override content-type for disguised streaming segments (with binary detection)
    const buffer = content instanceof Buffer ? content :
                   typeof content === 'string' ? Buffer.from(content) : undefined;
    const detectedContentType = getStreamingContentType(targetUrl, buffer, result.contentType);
    if (detectedContentType !== result.contentType) {
      logger.info({
        type: 'content-type-override',
        url: targetUrl,
        original: result.contentType,
        detected: detectedContentType,
      }, 'Overriding content-type for disguised segment');
      result.contentType = detectedContentType;
    }

    // Process M3U8 playlists
    const isM3u8 = isM3u8Url(targetUrl) || isM3u8ContentType(result.contentType);

    // Check if content is actually M3U8 (starts with #EXTM3U or #EXT-X-)
    // Only check the first 100 bytes to avoid corrupting binary data
    let isActuallyM3u8 = false;
    if (typeof content === 'string') {
      isActuallyM3u8 = content.trim().startsWith('#EXTM3U') || content.trim().startsWith('#EXT-X-');
    } else if (content instanceof Buffer && content.length > 0) {
      // Only check first 100 bytes to avoid converting large binary files to string
      const firstBytes = content.slice(0, Math.min(100, content.length)).toString('utf-8');
      isActuallyM3u8 = firstBytes.trim().startsWith('#EXTM3U') || firstBytes.trim().startsWith('#EXT-X-');
    }

    if (isM3u8 && isActuallyM3u8) {
      // Convert to string ONLY if it's M3U8
      const textContent = typeof content === 'string' ? content : content.toString('utf-8');
      // Use RELATIVE URLs like Shrina v2 instead of absolute URLs
      const proxyBaseUrl = '/proxy';
      content = processM3u8(textContent, targetUrl, proxyBaseUrl);
      result.contentType = 'application/vnd.apple.mpegurl';
    }

    // Cache the result
    cache.set(cacheKey, content, result.contentType, config.cacheTtl);

    // Send response
    c.header('Content-Type', result.contentType);
    c.header('X-Cache', 'MISS');

    // Remove content-encoding header if present (node-fetch already decompressed)
    // This prevents clients from trying to decompress already-decompressed content
    if (result.headers['content-encoding']) {
      delete result.headers['content-encoding'];
    }

    // Keep Content-Length if the content wasn't decompressed
    // Video players need this for buffering and seeking
    const contentLength = content instanceof Buffer ? content.length :
                         typeof content === 'string' ? Buffer.byteLength(content, 'utf-8') :
                         undefined;
    if (contentLength !== undefined) {
      c.header('Content-Length', contentLength.toString());
    }

    return c.body(content);
  } catch (error) {
    logger.error({
      type: 'proxy-error',
      url: c.req.query('url'),
      error: error instanceof Error ? error.message : String(error),
    }, 'Proxy request failed');

    return c.json({
      error: error instanceof Error ? error.message : 'Internal server error',
      url: c.req.query('url'),
    }, 500);
  }
});

// 404 handler
app.notFound((c) => {
  return c.json({
    error: 'Not found',
    path: c.req.path,
    availableEndpoints: {
      root: '/',
      proxy: '/proxy?url=<target_url>',
      health: '/health',
      cacheStats: '/cache/stats',
      cacheClear: '/cache/clear',
    },
  }, 404);
});

// Error handler
app.onError((err, c) => {
  logger.error({
    type: 'unhandled-error',
    error: err.message,
    stack: err.stack,
    path: c.req.path,
  }, 'Unhandled error');

  return c.json({
    error: 'Internal server error',
    message: err.message,
  }, 500);
});

// Start server
const server = serve({
  fetch: app.fetch,
  port: config.port,
  hostname: config.host,
}, (info) => {
  logger.info({
    type: 'server-start',
    host: config.host,
    port: config.port,
    env: config.nodeEnv,
    framework: 'Hono.js',
    config: {
      cacheTtl: config.cacheTtl,
      requestTimeout: config.requestTimeout,
    },
  }, `M3U8 Proxy server started on http://${config.host}:${config.port}`);

  console.log('\n🎬 M3U8 Proxy Server (Hono Edition)');
  console.log('═══════════════════════════════════');
  console.log(`📍 URL: http://${config.host}:${config.port}`);
  console.log(`⚡ Framework: Hono.js (3-4x faster than Express)`);
  console.log(`🌐 Environment: ${config.nodeEnv}`);
  console.log(`💾 Cache TTL: ${config.cacheTtl}s`);
  console.log(`⏱️  Request Timeout: ${config.requestTimeout}ms`);
  console.log('');
  console.log('📋 Endpoints:');
  console.log(`   • Root: http://${config.host}:${config.port}/`);
  console.log(`   • Proxy: http://${config.host}:${config.port}/proxy?url=<url>`);
  console.log(`   • Health: http://${config.host}:${config.port}/health`);
  console.log(`   • Cache Stats: http://${config.host}:${config.port}/cache/stats`);
  console.log('');
  console.log('🚀 Performance Benefits:');
  console.log('   • Zero dependencies (lightweight)');
  console.log('   • Built-in streaming support');
  console.log('   • Edge-ready architecture');
  console.log('   • Optimized for proxying workloads');
  console.log('');
  console.log('💡 Example:');
  console.log(`   curl "http://${config.host}:${config.port}/proxy?url=https://example.com/playlist.m3u8"`);
  console.log('═══════════════════════════════════\n');
});

// Graceful shutdown
const shutdown = () => {
  logger.info({ type: 'shutdown' }, 'Shutting down gracefully');

  server.close(() => {
    cache.destroy();
    logger.info({ type: 'shutdown' }, 'Server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.warn({ type: 'shutdown' }, 'Forcing shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;
