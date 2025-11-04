/**
 * Core M3U8 proxy functionality
 */

import fetch from 'node-fetch';
import https from 'https';
import { generateHeaders } from './domain-templates.js';
import { logger } from './logger.js';

// Create HTTPS agent that ignores SSL certificate errors
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

export interface ProxyOptions {
  timeout?: number;
  followRedirects?: boolean;
}

export interface ProxyResult {
  content: string | Buffer;
  contentType: string;
  status: number;
  headers: Record<string, string>;
}

/**
 * Proxy a URL and return the content
 */
export async function proxyUrl(
  targetUrl: string,
  options: ProxyOptions = {}
): Promise<ProxyResult> {
  const { timeout = 30000, followRedirects = true } = options;

  try {
    const url = new URL(targetUrl);
    const headers = generateHeaders(url);

    logger.debug({
      type: 'proxy-request',
      url: targetUrl,
      domain: url.hostname,
      headers: Object.keys(headers),
    }, 'Proxying URL');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(targetUrl, {
        headers,
        redirect: followRedirects ? 'follow' : 'manual',
        signal: controller.signal,
        agent: url.protocol === 'https:' ? httpsAgent : undefined,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      // Only use .text() for M3U8 playlists, NOT for all text/* content types
      // Using .text() on binary data (like MPEG-TS disguised as text/html) corrupts it with UTF-8 replacement characters
      const isM3u8 = contentType.includes('application/vnd.apple.mpegurl') ||
                     contentType.includes('application/x-mpegurl');

      const content = isM3u8
        ? await response.text()
        : Buffer.from(await response.arrayBuffer());

      logger.info({
        type: 'proxy-success',
        url: targetUrl,
        status: response.status,
        contentType,
        size: typeof content === 'string' ? content.length : content.length,
      }, 'Proxy request successful');

      return {
        content,
        contentType,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      logger.error({
        type: 'proxy-timeout',
        url: targetUrl,
        timeout,
      }, 'Proxy request timed out');
      throw new Error(`Request timed out after ${timeout}ms`);
    }

    logger.error({
      type: 'proxy-error',
      url: targetUrl,
      error: error instanceof Error ? error.message : String(error),
    }, 'Proxy request failed');

    throw error;
  }
}

/**
 * Process M3U8 playlist and rewrite URLs
 * Based on Shrina Proxy v2 implementation with improvements
 */
export function processM3u8(
  content: string,
  baseUrl: string,
  proxyUrl: string
): string {
  try {
    // Parse the base URL for resolving relative paths
    const baseUrlObj = new URL(baseUrl);

    // Calculate base path by removing filename
    let basePath = baseUrl;
    if (baseUrl.endsWith('.m3u8')) {
      basePath = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
    } else if (!basePath.endsWith('/')) {
      basePath = basePath + '/';
    }

    // Process content line by line
    const lines = content.split(/\r?\n/);
    const processed = lines.map(line => {
      const trimmedLine = line.trim();

      // Handle comment lines with URI attributes
      if (trimmedLine.startsWith('#')) {
        if (line.includes('URI="')) {
          // Handle multiple URI attributes on one line (e.g., LL-HLS #EXT-X-PART)
          let processedLine = line;
          const uriMatches = line.matchAll(/URI="([^"]+)"/g);

          for (const match of uriMatches) {
            const originalUri = match[1];

            // Skip if already proxied
            if (originalUri.startsWith(proxyUrl)) {
              continue;
            }

            try {
              // Resolve to absolute URL
              let absoluteUri: string;
              if (originalUri.startsWith('http://') || originalUri.startsWith('https://')) {
                absoluteUri = originalUri;
              } else if (originalUri.startsWith('//')) {
                // Protocol-relative URL
                absoluteUri = `${baseUrlObj.protocol}${originalUri}`;
              } else {
                // Relative URL
                absoluteUri = new URL(originalUri, basePath).toString();
              }

              // Create proxy URL
              const proxiedUrl = `${proxyUrl}?url=${encodeURIComponent(absoluteUri)}`;

              logger.debug({
                type: 'm3u8-rewrite-uri',
                original: originalUri,
                absolute: absoluteUri,
                proxied: proxiedUrl,
              }, 'Rewrote M3U8 URI attribute');

              // Replace this specific URI (not global to preserve order)
              processedLine = processedLine.replace(`URI="${originalUri}"`, `URI="${proxiedUrl}"`);
            } catch (error) {
              logger.warn({
                type: 'm3u8-parse-error',
                line,
                uri: originalUri,
                error: error instanceof Error ? error.message : String(error),
              }, 'Failed to parse URI in M3U8 tag');
            }
          }

          return processedLine;
        }
        // Return unmodified comment line
        return line;
      }

      // Handle non-comment lines (URLs)
      if (trimmedLine.length > 0) {
        // Skip if already proxied
        if (trimmedLine.startsWith(proxyUrl)) {
          return line;
        }

        try {
          // Resolve to absolute URL
          let absoluteUrl: string;
          if (trimmedLine.startsWith('http://') || trimmedLine.startsWith('https://')) {
            absoluteUrl = trimmedLine;
          } else if (trimmedLine.startsWith('//')) {
            // Protocol-relative URL
            absoluteUrl = `${baseUrlObj.protocol}${trimmedLine}`;
          } else {
            // Relative URL
            absoluteUrl = new URL(trimmedLine, basePath).toString();
          }

          // Create proxy URL
          const proxiedUrl = `${proxyUrl}?url=${encodeURIComponent(absoluteUrl)}`;

          logger.debug({
            type: 'm3u8-rewrite',
            original: trimmedLine,
            absolute: absoluteUrl,
            proxied: proxiedUrl,
          }, 'Rewrote M3U8 URL');

          return proxiedUrl;
        } catch (error) {
          logger.warn({
            type: 'm3u8-parse-error',
            line,
            error: error instanceof Error ? error.message : String(error),
          }, 'Failed to parse M3U8 line');
          return line;
        }
      }

      // Return unmodified empty lines
      return line;
    });

    return processed.join('\n');
  } catch (error) {
    logger.error({
      type: 'm3u8-process-error',
      error: error instanceof Error ? error.message : String(error),
    }, 'Critical error processing M3U8 content');
    // Return original content on critical error
    return content;
  }
}

/**
 * Check if URL is an M3U8 playlist
 */
export function isM3u8Url(url: string): boolean {
  return url.toLowerCase().endsWith('.m3u8') ||
         url.toLowerCase().includes('.m3u8?');
}

/**
 * Check if content type is M3U8
 */
export function isM3u8ContentType(contentType: string): boolean {
  return contentType.includes('application/vnd.apple.mpegurl') ||
         contentType.includes('application/x-mpegurl') ||
         contentType.includes('audio/mpegurl') ||
         contentType.includes('audio/x-mpegurl');
}

/**
 * Decompress content if needed (gzip, deflate, br, zstd)
 */
export async function decompressContent(
  content: Buffer,
  encoding: string | null
): Promise<Buffer> {
  if (!encoding) return content;

  const { gunzipSync, inflateSync, brotliDecompressSync } = await import('zlib');

  try {
    switch (encoding.toLowerCase()) {
      case 'gzip':
        logger.debug({ type: 'decompression', encoding: 'gzip' }, 'Decompressing gzip content');
        return gunzipSync(content);
      case 'deflate':
        logger.debug({ type: 'decompression', encoding: 'deflate' }, 'Decompressing deflate content');
        return inflateSync(content);
      case 'br':
        logger.debug({ type: 'decompression', encoding: 'brotli' }, 'Decompressing brotli content');
        return brotliDecompressSync(content);
      case 'zstd':
      case 'zst': {
        logger.debug({ type: 'decompression', encoding: 'zstd' }, 'Decompressing zstd content');
        const { decompress } = await import('@mongodb-js/zstd');
        const decompressed = await decompress(content);
        return Buffer.from(decompressed);
      }
      default:
        logger.debug({ type: 'decompression', encoding }, 'Unknown encoding, returning original content');
        return content;
    }
  } catch (error) {
    logger.warn({
      type: 'decompression-failed',
      encoding,
      error: error instanceof Error ? error.message : String(error),
    }, 'Failed to decompress content, using original');
    return content;
  }
}
