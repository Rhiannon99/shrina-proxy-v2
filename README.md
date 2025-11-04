# M3U8 Proxy

🎬 **Lightweight M3U8/HLS proxy with domain-specific anti-hotlinking support**

A streamlined, production-ready proxy server for HLS/M3U8 streams that automatically handles anti-hotlinking protection, URL rewriting, content decompression, and caching.

## ✨ Features

- **M3U8/HLS Proxying**: Automatically detects and processes M3U8 playlists
- **URL Rewriting**: Rewrites all segment URLs to proxy through the server
- **Anti-Hotlinking Bypass**: Domain-specific header injection (Origin, Referer, User-Agent)
- **Content Decompression**: Automatic handling of gzip, deflate, and brotli
- **In-Memory Caching**: Built-in caching with configurable TTL
- **CORS Enabled**: Full CORS support for cross-origin requests
- **Zero Configuration**: Works out of the box with sensible defaults
- **Docker Ready**: Production-ready Docker and Docker Compose setup
- **Health Checks**: Built-in health check and monitoring endpoints
- **TypeScript**: Fully typed for better development experience

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

The server will start on `http://localhost:3000`

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build and run manually
docker build -t m3u8-proxy .
docker run -p 3000:3000 --env-file .env m3u8-proxy
```

### Production Deployment

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## 📖 Usage

### Basic Proxy Request

```bash
curl "http://localhost:3000/proxy?url=https://example.com/playlist.m3u8"
```

### Using in HTML5 Video Player

```html
<video controls>
  <source src="http://localhost:3000/proxy?url=https://example.com/playlist.m3u8" type="application/x-mpegURL">
</video>
```

### Using with HLS.js

```javascript
const video = document.getElementById('video');
const hls = new Hls();

const proxyUrl = 'http://localhost:3000/proxy?url=' +
                 encodeURIComponent('https://example.com/playlist.m3u8');

hls.loadSource(proxyUrl);
hls.attachMedia(video);
```

## 🔌 API Endpoints

### `GET /`
Root endpoint with server information and usage examples.

### `GET /proxy?url=<target_url>`
Main proxy endpoint. Fetches and processes the target URL.

**Parameters:**
- `url` (required): The URL to proxy (must be URL-encoded)

**Example:**
```bash
curl "http://localhost:3000/proxy?url=https%3A%2F%2Fexample.com%2Fplaylist.m3u8"
```

### `GET /health`
Health check endpoint that returns server status, uptime, memory usage, and cache stats.

**Response:**
```json
{
  "status": "healthy",
  "uptime": 123.456,
  "memory": {
    "used": 45,
    "total": 128
  },
  "cache": {
    "size": 10,
    "keys": 10
  },
  "timestamp": "2025-01-10T12:00:00.000Z"
}
```

### `GET /cache/stats`
Returns cache statistics.

### `POST /cache/clear`
Clears the cache.

## ⚙️ Configuration

Configuration is done via environment variables. Copy `.env.example` to `.env` and adjust values:

```bash
# Server Configuration
PORT=3000                  # Server port
HOST=0.0.0.0              # Server host (0.0.0.0 for all interfaces)
NODE_ENV=production       # Environment (development|production)

# Logging
LOG_LEVEL=info            # Log level (trace|debug|info|warn|error|fatal)

# Cache Settings
CACHE_TTL=300             # Cache TTL in seconds (default: 5 minutes)

# Request Configuration
REQUEST_TIMEOUT=30000     # Request timeout in milliseconds (default: 30 seconds)
```

## 🌐 Domain Templates

The proxy includes built-in support for many streaming domains with anti-hotlinking protection. Domains are automatically detected and appropriate headers are applied.

### Supported Domains

- **Krussdomi.com** and related domains
- **Megacloud** family (megacloud.blog, megacloud.club, etc.)
- **Cloudnestra.com** and CDN domains
- **Embed.su** and CDN domains
- **VidSrc** family
- **Akamaized.net** and Cloudfront CDN
- Many more...

### Adding New Domains

To add support for a new domain, edit `src/domain-templates.ts`:

```typescript
export const domainTemplates: DomainTemplate[] = [
  // ... existing templates ...

  // Add your new domain
  {
    pattern: /\.yourdomain\.com$/i,
    origin: 'https://yourdomain.com',
    referer: 'https://yourdomain.com/',
    userAgent: 'Mozilla/5.0 ...', // Optional
    additionalHeaders: {          // Optional
      'x-custom-header': 'value'
    }
  },
];
```

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Start the service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
```

### Using Docker CLI

```bash
# Build image
docker build -t m3u8-proxy .

# Run container
docker run -d \
  --name m3u8-proxy \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e LOG_LEVEL=info \
  m3u8-proxy

# View logs
docker logs -f m3u8-proxy

# Stop container
docker stop m3u8-proxy
docker rm m3u8-proxy
```

## 📊 Monitoring

### Health Check

The `/health` endpoint provides server health information:

```bash
curl http://localhost:3000/health
```

### Cache Statistics

Monitor cache performance:

```bash
curl http://localhost:3000/cache/stats
```

### Logs

The server uses structured logging with Pino. In development, logs are pretty-printed:

```
[2025-01-10 12:00:00.000] INFO: M3U8 Proxy server started on http://0.0.0.0:3000
[2025-01-10 12:00:01.123] INFO: Request completed
    method: "GET"
    path: "/proxy"
    status: 200
    duration: 456
```

## 🔒 Security Considerations

- The proxy does not implement rate limiting (add middleware if needed)
- All domains are allowed by default (configure domain whitelist if needed)
- CORS is wide open (restrict origins in production if needed)
- Consider adding authentication for production use
- Monitor cache size in production environments

## 🏗️ Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ GET /proxy?url=...
       ↓
┌─────────────┐
│   Express   │
│   Server    │
└──────┬──────┘
       │
       ├─→ Cache Check
       │
       ├─→ Domain Template Matching
       │      ↓
       │   Header Generation
       │      ↓
       ├─→ Fetch Target URL
       │      ↓
       ├─→ Decompress Content
       │      ↓
       ├─→ Process M3U8
       │      ↓
       └─→ Cache & Return
```

## 📝 Examples

### Proxy a simple M3U8 playlist

```bash
curl "http://localhost:3000/proxy?url=https://example.com/playlist.m3u8"
```

### Proxy a video segment

```bash
curl "http://localhost:3000/proxy?url=https://example.com/segment-001.ts" --output segment.ts
```

### Clear cache

```bash
curl -X POST http://localhost:3000/cache/clear
```

## 🛠️ Development

### Project Structure

```
m3u8-proxy/
├── src/
│   ├── index.ts              # Main server
│   ├── proxy.ts              # Proxy logic
│   ├── cache.ts              # Cache implementation
│   ├── config.ts             # Configuration
│   ├── logger.ts             # Logging setup
│   └── domain-templates.ts   # Domain patterns
├── package.json
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

### Building

```bash
# Build TypeScript
npm run build

# Output will be in ./dist/
```

### Testing

```bash
# Start dev server
npm run dev

# In another terminal, test endpoints
curl http://localhost:3000/health
curl "http://localhost:3000/proxy?url=https://example.com/test.m3u8"
```

## 🤝 Contributing

Contributions are welcome! Here are some ways you can contribute:

1. Add support for new streaming domains
2. Improve caching strategies
3. Add rate limiting
4. Add authentication support
5. Improve documentation

## 📄 License

MIT License - feel free to use this in your projects!

## 🙏 Acknowledgments

Based on [Shrina Proxy](../README.md) v2 architecture, simplified for easier deployment and focused on M3U8/HLS streaming.

## 🐛 Troubleshooting

### Port already in use

```bash
# Change PORT in .env file
PORT=3001
```

### Cache growing too large

```bash
# Reduce CACHE_TTL in .env
CACHE_TTL=60

# Or clear cache via API
curl -X POST http://localhost:3000/cache/clear
```

### Timeout errors

```bash
# Increase REQUEST_TIMEOUT in .env
REQUEST_TIMEOUT=60000
```

### Domain not working

1. Check if domain is in `src/domain-templates.ts`
2. Add the domain pattern if missing
3. Rebuild and restart the server

## 📚 Additional Resources

- [HLS Specification](https://datatracker.ietf.org/doc/html/rfc8216)
- [HTTP Live Streaming (Apple)](https://developer.apple.com/streaming/)
- [HLS.js Player](https://github.com/video-dev/hls.js/)

## 💬 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the logs for error messages
3. Open an issue on GitHub

---

Made with ❤️ for the streaming community
