import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createServer } from '../src/server.js';

describe('Server', () => {
  it('should have health endpoint', async () => {
    const server = createServer();
    const response = await request(server).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
