import './setup.js';

import { createApp } from './app.js';
import { env } from './env/config.js';
import { prisma } from './lib/prisma.js';

async function main() {
  try {
    await prisma.$connect();
    console.info('📀 Database connected');
  } catch (err) {
    console.error('❌ Database connection failed', err);
    process.exit(1);
  }

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.info(`🚀 API server listening to port: ${env.PORT}`);
  });

  const shutdown = async () => {
    console.info('🛑 Shutting down server...');

    server.close(async () => {
      await prisma.$disconnect();
      console.info('👋 Server closed');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('❌ Failed to start server', err);
  process.exit(1);
});
