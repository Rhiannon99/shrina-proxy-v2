/**
 * MIME type configuration for handling disguised streaming segments
 * Based on Shrina Proxy v2 implementation
 */

/**
 * Enhanced segment detection patterns
 * These help identify streaming segments that might be disguised with wrong extensions
 */
export const SEGMENT_PATTERNS = [
  // Common segment naming patterns
  /seg-\d+/i,
  /segment-\d+/i,
  /chunk-\d+/i,
  /frag-\d+/i,
  /part-\d+/i,

  // HLS-style patterns
  /-v\d+-a\d+/i,
  /-f\d+-v\d+-a\d+/i,

  // Other common patterns
  /media-\d+/i,
  /stream_\d+/i,
  /_\d+\.ts$/i,
  /_\d+\.m4s$/i,
];

/**
 * Enhanced detection for disguised segments
 * @param path File path or URL
 * @returns Boolean indicating if this might be a disguised segment
 */
export function isDisguisedSegment(path: string): boolean {
  if (!path) return false;

  const pathLower = path.toLowerCase();

  // Check for segment patterns with wrong extensions
  const hasSegmentPattern = SEGMENT_PATTERNS.some(pattern => pattern.test(path));
  const hasSuspiciousExtension = ['.js', '.jpg', '.jpeg', '.png', '.gif', '.css', '.html', '.txt', '.webp', '.ico'].some(ext =>
    pathLower.endsWith(ext)
  );

  return hasSegmentPattern && hasSuspiciousExtension;
}

/**
 * Enhanced TS segment detection
 * @param path File path or URL
 * @returns Boolean indicating if it's a TS file
 */
export function isTsSegment(path: string): boolean {
  if (!path) return false;

  const pathLower = path.toLowerCase();

  // Check standard TS extensions
  if (pathLower.endsWith('.ts') ||
      pathLower.endsWith('.mts') ||
      pathLower.endsWith('.m2ts') ||
      pathLower.endsWith('.mp2t')) {
    return true;
  }

  // Check for disguised segments
  if (isDisguisedSegment(path)) {
    return true;
  }

  return false;
}

/**
 * Determines if a path is specifically an M3U8 playlist
 * @param path File path or URL
 * @returns Boolean indicating if it's an M3U8 file
 */
export function isM3u8Playlist(path: string): boolean {
  if (!path) return false;
  return path.toLowerCase().endsWith('.m3u8') || path.toLowerCase().endsWith('.m3u');
}

/**
 * Detect MPEG-TS by checking for sync bytes in binary content
 * MPEG-TS files have 0x47 sync byte at the start and every 188 bytes
 * @param buffer Binary data to analyze
 * @returns Boolean indicating if it's likely a TS segment
 */
export function detectTransportStream(buffer: Buffer | Uint8Array): boolean {
  try {
    // Convert to Uint8Array if it's not already
    const data = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

    // Minimum size check
    if (data.length < 188) {
      return false;
    }

    // Check first byte for TS sync byte (0x47)
    if (data[0] !== 0x47) {
      return false;
    }

    // Check additional TS sync bytes at 188-byte intervals
    let syncByteCount = 1; // We already found one
    for (let i = 1; i <= 5; i++) { // Check up to 5 more sync bytes
      const offset = i * 188;
      if (offset < data.length && data[offset] === 0x47) {
        syncByteCount++;
      }
    }

    // Require at least 2 sync bytes for positive detection
    return syncByteCount >= 2;
  } catch (error) {
    return false;
  }
}

/**
 * List of suspicious extensions that might be disguising streaming content
 */
const SUSPICIOUS_EXTENSIONS = [
  '.js', '.jpg', '.jpeg', '.png', '.gif', '.css',
  '.html', '.txt', '.webp', '.ico', '.json', '.xml',
  '.svg', '.pdf', '.doc', '.docx'
];

/**
 * Check if a path has a suspicious extension
 */
function hasSuspiciousExtension(path: string): boolean {
  const pathLower = path.toLowerCase();
  return SUSPICIOUS_EXTENSIONS.some(ext => pathLower.endsWith(ext));
}

/**
 * Get content type based on segment analysis
 * This function provides intelligent content type detection for streaming content
 * @param path File path or URL
 * @param buffer Optional binary content for deeper analysis
 * @param fallback Fallback content type
 * @returns Best guess content type
 */
export function getStreamingContentType(
  path: string,
  buffer?: Buffer | Uint8Array,
  fallback?: string
): string {
  if (!path) return fallback || 'application/octet-stream';

  // Check if it's an M3U8 playlist first (by URL)
  if (isM3u8Playlist(path)) {
    // Double-check: if we have buffer content, verify it's actually text (starts with #EXTM3U or #EXT-X-)
    if (buffer) {
      const firstByte = buffer[0];
      const secondByte = buffer[1];
      // Check if it starts with "#E" (0x23 0x45) which indicates #EXTM3U
      if (firstByte === 0x23 && secondByte === 0x45) {
        return 'application/vnd.apple.mpegurl';
      }
      // If buffer doesn't start with #, it might be binary TS data mistakenly named .m3u8
      // Fall through to binary detection
    } else {
      // No buffer to verify, trust the URL extension
      return 'application/vnd.apple.mpegurl';
    }
  }

  // If we have buffer content, check binary signature first for ALL suspicious extensions
  if (buffer && hasSuspiciousExtension(path)) {
    if (detectTransportStream(buffer)) {
      return 'video/mp2t';
    }
    // If binary detection fails but it has suspicious extension, fall through to other checks
  }

  // If we have buffer content, check binary signature for all other cases
  if (buffer && detectTransportStream(buffer)) {
    return 'video/mp2t';
  }

  // Check if it's a TS segment (including disguised ones with known patterns)
  if (isTsSegment(path)) {
    return 'video/mp2t';
  }

  // Fall back to provided fallback or generic binary
  return fallback || 'application/octet-stream';
}

export default {
  SEGMENT_PATTERNS,
  isDisguisedSegment,
  isTsSegment,
  isM3u8Playlist,
  detectTransportStream,
  getStreamingContentType,
};
