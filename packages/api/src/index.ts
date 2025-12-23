import { createServer } from './server.js';

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const server = createServer();

server.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
