import { z } from 'zod';
import {
  ApiPaginatedResponseSchema,
  ApiResponseSchema,
} from '../common/response.js';
import { JournalDataSchema, JournalMetadataSchema } from '../common/journal.js';

export const JournalResponseSchema = ApiResponseSchema(JournalDataSchema);

export const JournalMetadataListResponseSchema = ApiPaginatedResponseSchema(
  JournalMetadataSchema
);

export const JournalListResponseSchema =
  ApiPaginatedResponseSchema(JournalDataSchema);

export type JournalResponse = z.infer<typeof JournalResponseSchema>;
export type JournalMetadataListResponse = z.infer<
  typeof JournalMetadataListResponseSchema
>;
export type JournalListResponse = z.infer<typeof JournalListResponseSchema>;
