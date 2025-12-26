import { registry } from '../../registry.js';
import {
  CreateJournalSchema,
  UpdateJournalSchema,
  DateParamSchema,
  PaginationParamSchema,
  JournalResponseSchema,
  JournalListResponseSchema,
} from '@rewrlution/papyrus-shared';

/**
 * Register all journal-related schemas with OpenAPI registry
 */
registry.register('CreateJournalInput', CreateJournalSchema);
registry.register('UpdateJournalInput', UpdateJournalSchema);
registry.register('DateParam', DateParamSchema);
registry.register('PaginationParam', PaginationParamSchema);
registry.register('JournalResponse', JournalResponseSchema);
registry.register('JournalListResponse', JournalListResponseSchema);
