import { createServer } from './server.js';
import { env } from './env/config.js';

const port = env.PORT;
const server = createServer();

server.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
