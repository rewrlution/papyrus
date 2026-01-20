import './setup.js';

import { createApp } from './app.js';
import { env } from './env/config.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';

async function connectWithRetry(maxRetries = 5, initialDelayMs = 1000) {
  let delayMs = initialDelayMs;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$connect();
      logger.info('📀 Database connected');
      return;
    } catch (err) {
      if (attempt === maxRetries) {
        logger.error('❌ Database connection failed after retries', err);
        process.exit(1);
      }
      logger.warn(
        `⏳ Database connection attempt ${attempt}/${maxRetries} failed, retrying in ${delayMs}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      delayMs *= 2;
    }
  }
}

async function main() {
  await connectWithRetry();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 API server listening to port: ${env.PORT}`);
  });

  const shutdown = async () => {
    logger.info('🛑 Shutting down server...');

    server.close(async () => {
      await prisma.$disconnect();
      logger.info('👋 Server closed');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  logger.error('❌ Failed to start server', err);
  process.exit(1);
});
