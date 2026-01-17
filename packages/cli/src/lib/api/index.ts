import { ApiClient } from './api-client.js';
import { SseClient } from './sse-client.js';

const API_BASE_URL = 'https://papyrus-api-prod.onrender.com/api';

export const api = new ApiClient(API_BASE_URL);
export const sse = new SseClient(API_BASE_URL);

export { ApiClient } from './api-client.js';
export { SseClient } from './sse-client.js';
