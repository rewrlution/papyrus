import './setup.js';

import { createApp } from './app.js';
import { env } from './env/config.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';

async function main() {
  try {
    await prisma.$connect();
    logger.info('📀 Database connected');
  } catch (err) {
    logger.error('❌ Database connection failed', err);
    process.exit(1);
  }

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
