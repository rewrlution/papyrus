import './setup.js';

import { createApp } from './app.js';
import { env } from './env/config.js';

async function main() {
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.info(`🚀 API server listening to port: ${env.PORT}`);
  });

  const shutdown = async () => {
    console.info('🛑 Shutting down server...');

    server.close(async () => {
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
