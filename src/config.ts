/**
 * Application configuration
 */

import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'production',
  logLevel: process.env.LOG_LEVEL || 'info',
  cacheTtl: parseInt(process.env.CACHE_TTL || '300', 10),
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30000', 10),
};

export default config;
