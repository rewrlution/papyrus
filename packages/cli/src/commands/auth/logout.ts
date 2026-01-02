import { api } from '../../lib/api/index.js';

export function logout(): void {
  api.logout();
}
