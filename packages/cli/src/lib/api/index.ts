import { ApiClient } from './api-client.js';

const API_BASE_URL = 'https://papyrus-api-prod.onrender.com/api';
export const api = new ApiClient(API_BASE_URL);
export { ApiClient } from './api-client.js';
