import dotenv from 'dotenv';

dotenv.config();

const env = {
  port: parseInt(process.env.PORT ?? '5000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  vdocipher: {
    apiKey: process.env.VDOCIPHER_API_KEY ?? '',
    baseUrl: process.env.VDOCIPHER_BASE_URL ?? 'https://dev.vdocipher.com/api',
  },
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  webhookSecret: process.env.VDOCIPHER_WEBHOOK_SECRET ?? '',
} as const;

if (!env.vdocipher.apiKey) {
  throw new Error('VDOCIPHER_API_KEY environment variable is required');
}

export default env;
