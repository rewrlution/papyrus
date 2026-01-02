import { configStore } from '../storage/index.js';

import { ApiClient } from './api-client.js';

const API_BASE_URL = configStore.get('apiUrl') || 'http://localhost:3000/api';
export const api = new ApiClient(API_BASE_URL);
export { ApiClient } from './api-client.js';
