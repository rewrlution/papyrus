# Server-Side Implementation

## Overview

This document provides the complete server-side implementation for the sync system, including service methods, controllers, and routes.

## 1. Update Journal Service

### File: `src/services/journal.service.ts`

Update the entire service to use `date` instead of `id` for public operations:

```typescript
import { CryptoService, type EncryptedData } from '../lib/crypto';
import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';
import {
  JournalResponse,
  SyncJournalResponse,
  BatchJournalItem,
  BatchJournalResponse,
  BatchResultItem,
} from '../schemas';
import type { Journal, PaginatedResponse } from '../types';
import { NotFoundError } from '../utils/errors';

function decryptJournal(journal: Journal): string {
  const { id, ciphertext, iv, authTag } = journal;
  const encrypted: EncryptedData = { ciphertext, iv, authTag };
  try {
    return CryptoService.decrypt(encrypted);
  } catch (err) {
    logger.error('Failed to decrypt journal', { id, err });
    return '[Decryption failed]';
  }
}

async function verifyJournalAccess(
  date: string,
  userId: string
): Promise<Journal> {
  const journal = await prisma.journal.findUnique({
    where: { userId_date: { userId, date } },
  });
  if (!journal) {
    logger.warn('Journal not found', { date, userId });
    throw new NotFoundError(`Journal not found`);
  }

  return journal;
}

export const JournalService = {
  // Create an encrypted journal entry
  async create(
    userId: string,
    date: string,
    content: string
  ): Promise<JournalResponse> {
    logger.info('Encrypting journal', {
      userId,
      date,
      contentLength: content.length,
    });
    const encrypted = CryptoService.encrypt(content);
    const { ciphertext, iv, authTag } = encrypted;

    logger.info('Creating journal', { userId, date });
    const journal = await prisma.journal.create({
      data: { userId, date, ciphertext, iv, authTag },
    });

    logger.info('Journal created', { id: journal.id, date });
    const { createdAt, updatedAt, deletedAt } = journal;

    return { date, content, createdAt, updatedAt, deletedAt };
  },

  // Get all journals for a user (paginated, excludes soft-deleted)
  async findAllByUser(
    userId: string,
    page: number,
    limit: number
  ): Promise<PaginatedResponse<JournalResponse>> {
    logger.info('Finding all journals by user', { userId, page, limit });
    const [journals, total] = await prisma.$transaction([
      prisma.journal.findMany({
        where: {
          userId,
          deletedAt: null, // Exclude soft-deleted journals
        },
        orderBy: { date: 'desc' }, // Sort by date descending (newest first)
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.journal.count({
        where: {
          userId,
          deletedAt: null,
        },
      }),
    ]);

    logger.info('Decrypting journals', { count: journals.length });
    const decryptedJournals: JournalResponse[] = journals.map((journal) => {
      const content = decryptJournal(journal);
      const { date, createdAt, updatedAt, deletedAt } = journal;
      return { date, content, createdAt, updatedAt, deletedAt };
    });

    return {
      data: decryptedJournals,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  // Get a single journal by date
  async findOne(date: string, userId: string): Promise<JournalResponse> {
    logger.info('Verifying journal access', { date, userId });
    const journal = await verifyJournalAccess(date, userId);

    // Check if soft-deleted
    if (journal.deletedAt) {
      logger.warn('Attempted to access deleted journal', { date, userId });
      throw new NotFoundError('Journal not found');
    }

    logger.info('Decrypting journal', { id: journal.id, date });
    const content = decryptJournal(journal);
    const { createdAt, updatedAt, deletedAt } = journal;
    return { date, content, createdAt, updatedAt, deletedAt };
  },

  // Update a journal
  async update(
    date: string,
    userId: string,
    data: { content: string }
  ): Promise<JournalResponse> {
    logger.info('Verifying journal access', { date, userId });
    const journal = await verifyJournalAccess(date, userId);

    // Check if soft-deleted
    if (journal.deletedAt) {
      logger.warn('Attempted to update deleted journal', { date, userId });
      throw new NotFoundError('Journal not found');
    }

    logger.info('Encrypting journal', {
      id: journal.id,
      contentLength: data.content.length,
    });
    const encrypted = CryptoService.encrypt(data.content);
    const { ciphertext, iv, authTag } = encrypted;
    const updatedData = { ciphertext, iv, authTag };

    logger.info('Updating journal content', { id: journal.id, date });
    const updated = await prisma.journal.update({
      where: { id: journal.id },
      data: updatedData,
    });
    const { createdAt, updatedAt, deletedAt } = updated;

    return { date, content: data.content, createdAt, updatedAt, deletedAt };
  },

  // Soft delete a journal by date
  async delete(date: string, userId: string): Promise<void> {
    logger.info('Verifying journal access', { date, userId });
    const journal = await verifyJournalAccess(date, userId);

    logger.info('Soft deleting journal', { id: journal.id, date });
    await prisma.journal.update({
      where: { id: journal.id },
      data: { deletedAt: new Date() },
    });
  },

  // Get count of journals of a user (excludes soft-deleted)
  async countByUser(userId: string): Promise<number> {
    return prisma.journal.count({
      where: {
        userId,
        deletedAt: null,
      },
    });
  },

  // SYNC: Find journals modified since a timestamp (includes soft-deleted)
  async findModifiedSince(
    userId: string,
    since: Date
  ): Promise<SyncJournalResponse> {
    logger.info('Finding journals modified since', { userId, since });

    const journals = await prisma.journal.findMany({
      where: {
        userId,
        updatedAt: { gt: since },
      },
      orderBy: { updatedAt: 'asc' },
    });

    logger.info('Found modified journals', { count: journals.length });

    logger.info('Decrypting journals', { count: journals.length });
    const decryptedJournals: JournalResponse[] = journals.map((journal) => {
      const content = decryptJournal(journal);
      const { date, createdAt, updatedAt, deletedAt } = journal;
      return { date, content, createdAt, updatedAt, deletedAt };
    });

    return {
      journals: decryptedJournals,
      serverTimestamp: new Date(),
    };
  },

  // SYNC: Batch upsert journals with conflict detection
  async batchUpsert(
    userId: string,
    journals: BatchJournalItem[]
  ): Promise<BatchJournalResponse> {
    logger.info('Batch upserting journals', { userId, count: journals.length });

    const results: BatchResultItem[] = [];
    const conflicts: JournalResponse[] = [];

    for (const item of journals) {
      try {
        const { date, content, clientUpdatedAt } = item;

        // Find existing journal
        const existing = await prisma.journal.findUnique({
          where: { userId_date: { userId, date } },
        });

        // Handle deletion (content is null)
        if (content === null) {
          if (existing) {
            // Check for conflict: Server has newer version than client's last known state
            if (existing.updatedAt > clientUpdatedAt) {
              // PHILOSOPHY: Data is precious. When there's a conflict during deletion,
              // we ALWAYS restore the server's version. This means if Device A deletes
              // a journal while Device B edits it, the edit wins because it represents
              // new content creation. The client will receive the conflict and restore
              // the journal locally, preserving the data.
              logger.warn(
                'Conflict detected during delete - preserving server data',
                {
                  date,
                  userId,
                }
              );
              const decryptedContent = decryptJournal(existing);
              conflicts.push({
                date: existing.date,
                content: decryptedContent,
                createdAt: existing.createdAt,
                updatedAt: existing.updatedAt,
                deletedAt: existing.deletedAt,
              });
              results.push({
                date,
                status: 'conflict',
                serverUpdatedAt: existing.updatedAt,
              });
            } else {
              // Soft delete
              const deleted = await prisma.journal.update({
                where: { id: existing.id },
                data: { deletedAt: new Date() },
              });
              results.push({
                date,
                status: 'deleted',
                serverUpdatedAt: deleted.updatedAt,
              });
            }
          } else {
            // Already deleted or never existed
            results.push({
              date,
              status: 'deleted',
              serverUpdatedAt: new Date(),
            });
          }
          continue;
        }

        // Handle create/update
        const encrypted = CryptoService.encrypt(content);
        const { ciphertext, iv, authTag } = encrypted;

        if (!existing) {
          // Create new journal
          logger.info('Creating new journal in batch', { date, userId });
          const created = await prisma.journal.create({
            data: {
              userId,
              date,
              ciphertext,
              iv,
              authTag,
            },
          });
          results.push({
            date,
            status: 'created',
            serverUpdatedAt: created.updatedAt,
          });
        } else {
          // Check for conflict
          if (existing.updatedAt > clientUpdatedAt) {
            logger.warn('Conflict detected during update', { date, userId });
            const decryptedContent = decryptJournal(existing);
            conflicts.push({
              date: existing.date,
              content: decryptedContent,
              createdAt: existing.createdAt,
              updatedAt: existing.updatedAt,
              deletedAt: existing.deletedAt,
            });
            results.push({
              date,
              status: 'conflict',
              serverUpdatedAt: existing.updatedAt,
            });
          } else {
            // Update existing journal
            logger.info('Updating journal in batch', { date, userId });
            const updated = await prisma.journal.update({
              where: { id: existing.id },
              data: {
                ciphertext,
                iv,
                authTag,
                deletedAt: null, // Restore if was soft-deleted
              },
            });
            results.push({
              date,
              status: 'updated',
              serverUpdatedAt: updated.updatedAt,
            });
          }
        }
      } catch (error) {
        logger.error('Failed to upsert journal in batch', { item, error });
        // Continue with next journal
      }
    }

    logger.info('Batch upsert completed', {
      userId,
      total: results.length,
      conflicts: conflicts.length,
    });

    return {
      results,
      conflicts,
      serverTimestamp: new Date(),
    };
  },
};
```

## 2. Update Journal Controller

### File: `src/controllers/journal.controller.ts`

Update to use `date` parameter and add batch endpoint:

```typescript
import type { Response } from 'express';

import { asyncHandler } from '../middleware';
import {
  CreateJournalInput,
  DateParam,
  PaginationParam,
  SyncJournalQuery,
  UpdateJournalInput,
  BatchJournalRequest,
} from '../schemas';
import { JournalService } from '../services';
import { RequestWithUser, ValidatedRequest } from '../types';

export const JournalController = {
  list: asyncHandler(
    async (
      req: RequestWithUser & ValidatedRequest<PaginationParam>,
      res: Response
    ) => {
      const { page, limit } = req.validated;
      const userId = req.user.id;
      const result = await JournalService.findAllByUser(userId, page, limit);
      res.status(200).json(result);
    }
  ),

  get: asyncHandler(
    async (
      req: RequestWithUser & ValidatedRequest<DateParam>,
      res: Response
    ) => {
      const { date } = req.validated;
      const userId = req.user.id;
      const journal = await JournalService.findOne(date, userId);
      res.status(200).json(journal);
    }
  ),

  create: asyncHandler(
    async (
      req: RequestWithUser & ValidatedRequest<CreateJournalInput>,
      res: Response
    ) => {
      const { date, content } = req.validated;
      const userId = req.user.id;
      const journal = await JournalService.create(userId, date, content);
      res.status(201).json(journal);
    }
  ),

  update: asyncHandler(
    async (
      req: RequestWithUser & ValidatedRequest<DateParam & UpdateJournalInput>,
      res: Response
    ) => {
      const { date, content } = req.validated;
      const userId = req.user.id;
      const journal = await JournalService.update(date, userId, { content });
      res.json(journal);
    }
  ),

  delete: asyncHandler(
    async (
      req: RequestWithUser & ValidatedRequest<DateParam>,
      res: Response
    ) => {
      const { date } = req.validated;
      const userId = req.user.id;
      await JournalService.delete(date, userId);
      res.status(204).send();
    }
  ),

  // SYNC: Pull changes since timestamp
  sync: asyncHandler(
    async (
      req: RequestWithUser & ValidatedRequest<SyncJournalQuery>,
      res: Response
    ) => {
      const { since } = req.validated;
      const userId = req.user.id;
      const result = await JournalService.findModifiedSince(userId, since);
      res.status(200).json(result);
    }
  ),

  // SYNC: Push batch changes with conflict detection
  batch: asyncHandler(
    async (
      req: RequestWithUser & ValidatedRequest<BatchJournalRequest>,
      res: Response
    ) => {
      const { journals } = req.validated;
      const userId = req.user.id;
      const result = await JournalService.batchUpsert(userId, journals);
      res.status(200).json(result);
    }
  ),
};
```

## 3. Update Journal Routes

### File: `src/routes/journal.routes.ts`

Update routes to use `date` parameter and add batch endpoint:

```typescript
import { Router } from 'express';

import { JournalController } from '../controllers';
import {
  requireAuthentication,
  validateBody,
  validateParams,
  validateQuery,
} from '../middleware';
import {
  CreateJournalSchema,
  DateParamSchema,
  PaginationParamSchema,
  SyncJournalQuerySchema,
  UpdateJournalSchema,
  BatchJournalRequestSchema,
} from '../schemas';

const router = Router();

// All routes require authentication
router.use(requireAuthentication);

// List journals (paginated)
router.get('/', validateQuery(PaginationParamSchema), JournalController.list);

// IMPORTANT: Sync endpoints must be registered BEFORE '/:date' to avoid route conflicts
router.get(
  '/sync',
  validateQuery(SyncJournalQuerySchema),
  JournalController.sync
);
router.post(
  '/batch',
  validateBody(BatchJournalRequestSchema),
  JournalController.batch
);

// CRUD operations by date
router.get('/:date', validateParams(DateParamSchema), JournalController.get);
router.post('/', validateBody(CreateJournalSchema), JournalController.create);
router.put(
  '/:date',
  validateParams(DateParamSchema),
  validateBody(UpdateJournalSchema),
  JournalController.update
);
router.delete(
  '/:date',
  validateParams(DateParamSchema),
  JournalController.delete
);

export { router as journalRoutes };
```

## 4. API Endpoints Summary

| Method   | Endpoint                         | Description                                      |
| -------- | -------------------------------- | ------------------------------------------------ |
| `GET`    | `/journals`                      | List all journals (paginated, excludes deleted)  |
| `GET`    | `/journals/:date`                | Get single journal by date                       |
| `POST`   | `/journals`                      | Create new journal                               |
| `PUT`    | `/journals/:date`                | Update journal by date                           |
| `DELETE` | `/journals/:date`                | Soft delete journal by date                      |
| `GET`    | `/journals/sync?since=<ISO8601>` | Pull sync - get changes since timestamp          |
| `POST`   | `/journals/batch`                | Push sync - batch upsert with conflict detection |

## 5. Testing

### Manual Testing with curl

**Create a journal:**

```bash
curl -X POST http://localhost:3000/journals \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "20251206",
    "content": "Today I learned about sync systems!"
  }'
```

**Get journal by date:**

```bash
curl http://localhost:3000/journals/20251206 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Pull sync (get changes since Dec 1):**

```bash
curl "http://localhost:3000/journals/sync?since=2025-12-01T00:00:00.000Z" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Push sync (batch update):**

```bash
curl -X POST http://localhost:3000/journals/batch \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "journals": [
      {
        "date": "20251206",
        "content": "Updated content",
        "clientUpdatedAt": "2025-12-06T10:00:00.000Z"
      },
      {
        "date": "20251207",
        "content": "New journal",
        "clientUpdatedAt": "2025-12-07T09:00:00.000Z"
      }
    ]
  }'
```

## 6. OpenAPI Documentation

### File: `src/docs/sync.docs.ts`

The sync endpoints are documented using OpenAPI/Swagger for automatic API documentation generation:

```typescript
import {
  BatchJournalRequestSchema,
  BatchJournalResponseSchema,
  SyncJournalQuerySchema,
  SyncJournalResponseSchema,
} from '../schemas';
import { ErrorResponseComponents } from './components/responses';
import { registry } from './openapi';

// GET /journals/sync - Pull changes from server
registry.registerPath({
  method: 'get',
  path: '/journals/sync',
  summary: 'Pull sync - Get journals modified since timestamp',
  description:
    'Retrieve all journals that have been created, updated, or deleted after the given timestamp. ' +
    'This is the "pull" part of the sync process. Includes soft-deleted journals (deletedAt != null) ' +
    'so clients can sync deletions.',
  tags: ['Journals', 'Sync'],
  security: [{ bearerAuth: [] }],
  request: {
    query: SyncJournalQuerySchema,
  },
  responses: {
    200: {
      description: 'Journals retrieved successfully',
      content: {
        'application/json': {
          schema: SyncJournalResponseSchema,
          example: {
            journals: [
              {
                date: '20251206',
                content: 'Today I learned about sync systems!',
                createdAt: '2025-12-06T10:00:00.000Z',
                updatedAt: '2025-12-06T10:00:00.000Z',
                deletedAt: null,
              },
              {
                date: '20251205',
                content: 'Yesterday was productive',
                createdAt: '2025-12-05T09:00:00.000Z',
                updatedAt: '2025-12-05T14:30:00.000Z',
                deletedAt: null,
              },
            ],
            serverTimestamp: '2025-12-06T15:00:00.000Z',
          },
        },
      },
    },
    400: ErrorResponseComponents.BadRequest,
    401: ErrorResponseComponents.Unauthorized,
  },
});

// POST /journals/batch - Push changes to server
registry.registerPath({
  method: 'post',
  path: '/journals/batch',
  summary: 'Push sync - Batch upsert journals with conflict detection',
  description:
    'Upload multiple journal changes (create/update/delete) in a single request. ' +
    'The server detects conflicts by comparing clientUpdatedAt with server updatedAt. ' +
    'If a conflict is detected, the server returns the current version for the client to merge. ' +
    'Set content to null to delete a journal. ' +
    'This is the "push" part of the sync process.',
  tags: ['Journals', 'Sync'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: BatchJournalRequestSchema,
          example: {
            journals: [
              {
                date: '20251206',
                content: 'Updated content from client',
                clientUpdatedAt: '2025-12-06T10:00:00.000Z',
              },
              {
                date: '20251207',
                content: 'New journal created offline',
                clientUpdatedAt: '2025-12-07T09:00:00.000Z',
              },
              {
                date: '20251205',
                content: null, // Deletion
                clientUpdatedAt: '2025-12-05T14:30:00.000Z',
              },
            ],
          },
        },
      },
    },
  },
  responses: {
    200: {
      description:
        'Batch operation completed. Check status field for each result. ' +
        'Conflicts array contains server versions that need to be merged on the client.',
      content: {
        'application/json': {
          schema: BatchJournalResponseSchema,
          examples: {
            success: {
              summary: 'All operations successful',
              value: {
                results: [
                  {
                    date: '20251206',
                    status: 'updated',
                    serverUpdatedAt: '2025-12-06T15:00:00.000Z',
                  },
                  {
                    date: '20251207',
                    status: 'created',
                    serverUpdatedAt: '2025-12-07T15:00:00.000Z',
                  },
                ],
                conflicts: [],
                serverTimestamp: '2025-12-07T15:00:00.000Z',
              },
            },
            conflict: {
              summary: 'Conflict detected - server has newer version',
              value: {
                results: [
                  {
                    date: '20251206',
                    status: 'conflict',
                    serverUpdatedAt: '2025-12-06T14:00:00.000Z',
                  },
                ],
                conflicts: [
                  {
                    date: '20251206',
                    content: 'Server version that was edited on another device',
                    createdAt: '2025-12-06T10:00:00.000Z',
                    updatedAt: '2025-12-06T14:00:00.000Z',
                    deletedAt: null,
                  },
                ],
                serverTimestamp: '2025-12-06T15:00:00.000Z',
              },
            },
            deletionConflict: {
              summary:
                'Deletion conflict - server has newer edit (data preserved)',
              value: {
                results: [
                  {
                    date: '20251206',
                    status: 'conflict',
                    serverUpdatedAt: '2025-12-06T14:00:00.000Z',
                  },
                ],
                conflicts: [
                  {
                    date: '20251206',
                    content:
                      'Server preserved this content - it was edited on another device',
                    createdAt: '2025-12-06T10:00:00.000Z',
                    updatedAt: '2025-12-06T14:00:00.000Z',
                    deletedAt: null,
                  },
                ],
                serverTimestamp: '2025-12-06T15:00:00.000Z',
              },
            },
          },
        },
      },
    },
    400: ErrorResponseComponents.BadRequest,
    401: ErrorResponseComponents.Unauthorized,
  },
});
```

### Accessing the API Documentation

Once the server is running, you can access the interactive API documentation at:

- **Swagger UI**: `http://localhost:3000/api-docs`
- **OpenAPI JSON**: `http://localhost:3000/openapi.json`

The documentation includes:

- ✅ Request/response schemas with validation rules
- ✅ Example requests and responses
- ✅ Multiple response examples (success, conflict, deletion conflict)
- ✅ Authentication requirements
- ✅ Interactive "Try it out" feature

## 7. Verification Checklist

- ✅ All CRUD endpoints use `date` parameter instead of `id`
- ✅ Soft delete implemented (sets `deletedAt` instead of hard delete)
- ✅ Regular endpoints filter out soft-deleted journals
- ✅ Sync endpoints include soft-deleted journals
- ✅ Batch endpoint detects conflicts via timestamp comparison
- ✅ Conflict responses include server's version for client to merge
- ✅ All operations log with both `id` (internal) and `date` (public)
- ✅ OpenAPI documentation added for sync endpoints
- ✅ API docs accessible at `/api-docs` with interactive examples
