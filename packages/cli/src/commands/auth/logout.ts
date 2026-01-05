import { api } from '../../lib/api/index.js';
import * as msg from '../../utils/messages.js';

export function logout(): void {
  api.logout();
  msg.success('Logged out successfully');
}
