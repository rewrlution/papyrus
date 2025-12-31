# Testing Strategy

## Overview

This document outlines how to test the sync system at various levels to ensure it works correctly and handles edge cases.

## Unit Tests

### 1. Schema Validation Tests

```typescript
// tests/schemas/sync.schema.test.ts
import { describe, it, expect } from '@jest/globals';
import {
  SyncJournalQuerySchema,
  BatchJournalItemSchema,
} from '../../src/schemas/sync.schema';

describe('Sync Schema Validation', () => {
  describe('SyncJournalQuerySchema', () => {
    it('should accept valid ISO 8601 datetime', () => {
      const result = SyncJournalQuerySchema.parse({
        since: '2025-12-01T00:00:00.000Z',
      });
      expect(result.since).toBeInstanceOf(Date);
    });

    it('should reject invalid datetime format', () => {
      expect(() => {
        SyncJournalQuerySchema.parse({ since: 'not-a-date' });
      }).toThrow();
    });
  });

  describe('BatchJournalItemSchema', () => {
    it('should accept valid journal item', () => {
      const result = BatchJournalItemSchema.parse({
        date: '20251206',
        content: 'Test content',
        clientUpdatedAt: new Date(),
      });
      expect(result.date).toBe('20251206');
    });

    it('should accept null content for deletion', () => {
      const result = BatchJournalItemSchema.parse({
        date: '20251206',
        content: null,
        clientUpdatedAt: new Date(),
      });
      expect(result.content).toBeNull();
    });

    it('should reject invalid date format', () => {
      expect(() => {
        BatchJournalItemSchema.parse({
          date: '2025-12-06', // Wrong format (should be YYYYMMDD)
          content: 'Test',
          clientUpdatedAt: new Date(),
        });
      }).toThrow();
    });
  });
});
```

### 2. Service Layer Tests

```typescript
// tests/services/journal.service.test.ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { JournalService } from '../../src/services/journal.service';
import { prisma } from '../../src/lib/prisma';

// Mock Prisma
jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    journal: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe('JournalService - Sync Methods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findModifiedSince', () => {
    it('should return journals modified after timestamp', async () => {
      const mockJournals = [
        {
          id: '1',
          date: '20251206',
          ciphertext: 'encrypted',
          iv: 'iv',
          authTag: 'tag',
          userId: 'user1',
          createdAt: new Date('2025-12-06T10:00:00Z'),
          updatedAt: new Date('2025-12-06T11:00:00Z'),
          deletedAt: null,
        },
      ];

      prisma.journal.findMany.mockResolvedValue(mockJournals);

      const result = await JournalService.findModifiedSince(
        'user1',
        new Date('2025-12-06T09:00:00Z')
      );

      expect(result.journals).toHaveLength(1);
      expect(result.journals[0].date).toBe('20251206');
      expect(result.serverTimestamp).toBeInstanceOf(Date);
    });

    it('should include soft-deleted journals in sync', async () => {
      const mockJournals = [
        {
          id: '1',
          date: '20251206',
          ciphertext: 'encrypted',
          iv: 'iv',
          authTag: 'tag',
          userId: 'user1',
          createdAt: new Date('2025-12-06T10:00:00Z'),
          updatedAt: new Date('2025-12-06T11:00:00Z'),
          deletedAt: new Date('2025-12-06T11:30:00Z'),
        },
      ];

      prisma.journal.findMany.mockResolvedValue(mockJournals);

      const result = await JournalService.findModifiedSince(
        'user1',
        new Date()
      );

      expect(result.journals[0].deletedAt).not.toBeNull();
    });
  });

  describe('batchUpsert', () => {
    it('should detect conflict when server has newer version', async () => {
      const existingJournal = {
        id: '1',
        date: '20251206',
        userId: 'user1',
        ciphertext: 'old',
        iv: 'iv',
        authTag: 'tag',
        updatedAt: new Date('2025-12-06T12:00:00Z'), // Server version
        deletedAt: null,
      };

      prisma.journal.findUnique.mockResolvedValue(existingJournal);

      const result = await JournalService.batchUpsert('user1', [
        {
          date: '20251206',
          content: 'new content',
          clientUpdatedAt: new Date('2025-12-06T10:00:00Z'), // Client's stale timestamp
        },
      ]);

      expect(result.results[0].status).toBe('conflict');
      expect(result.conflicts).toHaveLength(1);
    });

    it('should create new journal when no conflict', async () => {
      prisma.journal.findUnique.mockResolvedValue(null);
      prisma.journal.create.mockResolvedValue({
        id: '1',
        date: '20251206',
        userId: 'user1',
        ciphertext: 'encrypted',
        iv: 'iv',
        authTag: 'tag',
        updatedAt: new Date(),
        deletedAt: null,
      });

      const result = await JournalService.batchUpsert('user1', [
        {
          date: '20251206',
          content: 'new content',
          clientUpdatedAt: new Date(),
        },
      ]);

      expect(result.results[0].status).toBe('created');
      expect(result.conflicts).toHaveLength(0);
    });

    it('should soft delete when content is null', async () => {
      const existingJournal = {
        id: '1',
        date: '20251206',
        userId: 'user1',
        updatedAt: new Date('2025-12-06T10:00:00Z'),
        deletedAt: null,
      };

      prisma.journal.findUnique.mockResolvedValue(existingJournal);
      prisma.journal.update.mockResolvedValue({
        ...existingJournal,
        deletedAt: new Date(),
      });

      const result = await JournalService.batchUpsert('user1', [
        {
          date: '20251206',
          content: null, // Deletion request
          clientUpdatedAt: new Date('2025-12-06T10:00:00Z'),
        },
      ]);

      expect(result.results[0].status).toBe('deleted');
    });

    it('should restore server data on deletion conflict', async () => {
      const existingJournal = {
        id: '1',
        date: '20251206',
        userId: 'user1',
        ciphertext: 'encrypted_edited_content',
        iv: 'iv',
        authTag: 'tag',
        createdAt: new Date('2025-12-06T10:00:00Z'),
        updatedAt: new Date('2025-12-06T14:00:00Z'), // Server has newer version
        deletedAt: null,
      };

      prisma.journal.findUnique.mockResolvedValue(existingJournal);

      const result = await JournalService.batchUpsert('user1', [
        {
          date: '20251206',
          content: null, // Deletion request
          clientUpdatedAt: new Date('2025-12-06T10:00:00Z'), // Client's stale timestamp
        },
      ]);

      // Should detect conflict and preserve server's data
      expect(result.results[0].status).toBe('conflict');
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].date).toBe('20251206');
      expect(result.conflicts[0].deletedAt).toBeNull(); // Not deleted
    });
  });
});
```

## Integration Tests

### 1. End-to-End Sync Flow

```typescript
// tests/integration/sync.test.ts
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';

describe('Sync Integration Tests', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Create test user and get auth token
    const response = await request(app)
      .post('/auth/register')
      .send({ email: 'test@example.com', password: 'password123' });

    authToken = response.body.token;
    userId = response.body.user.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.journal.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
  });

  it('should sync journals between two clients', async () => {
    // Client A creates a journal
    const createResponse = await request(app)
      .post('/journals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ date: '20251206', content: 'First version' })
      .expect(201);

    const journal = createResponse.body;

    // Client B pulls sync
    const syncResponse = await request(app)
      .get('/journals/sync?since=2025-12-01T00:00:00.000Z')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(syncResponse.body.journals).toHaveLength(1);
    expect(syncResponse.body.journals[0].date).toBe('20251206');
    expect(syncResponse.body.journals[0].content).toBe('First version');
  });

  it('should handle conflict and return server version', async () => {
    // Create initial journal
    await request(app)
      .post('/journals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ date: '20251207', content: 'Server version' })
      .expect(201);

    // Wait a bit to ensure updatedAt is different
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Simulate Client A trying to update with stale timestamp
    const batchResponse = await request(app)
      .post('/journals/batch')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        journals: [
          {
            date: '20251207',
            content: 'Client version',
            clientUpdatedAt: new Date(Date.now() - 10000).toISOString(), // Old timestamp
          },
        ],
      })
      .expect(200);

    expect(batchResponse.body.results[0].status).toBe('conflict');
    expect(batchResponse.body.conflicts).toHaveLength(1);
    expect(batchResponse.body.conflicts[0].content).toBe('Server version');
  });

  it('should accept merged version after conflict', async () => {
    // First create journal
    const createResponse = await request(app)
      .post('/journals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ date: '20251208', content: 'Original' })
      .expect(201);

    const originalUpdatedAt = createResponse.body.updatedAt;

    // Simulate conflict
    const batchResponse1 = await request(app)
      .post('/journals/batch')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        journals: [
          {
            date: '20251208',
            content: 'Client edit',
            clientUpdatedAt: new Date(Date.now() - 10000).toISOString(),
          },
        ],
      });

    expect(batchResponse1.body.conflicts).toHaveLength(1);

    // Push merged version with correct timestamp
    const mergedContent = `${batchResponse1.body.conflicts[0].content}\n\n---\nMerged\n---\n\nClient edit`;

    const batchResponse2 = await request(app)
      .post('/journals/batch')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        journals: [
          {
            date: '20251208',
            content: mergedContent,
            clientUpdatedAt: batchResponse1.body.conflicts[0].updatedAt,
          },
        ],
      })
      .expect(200);

    expect(batchResponse2.body.results[0].status).toBe('updated');
    expect(batchResponse2.body.conflicts).toHaveLength(0);
  });

  it('should restore server data on deletion conflict', async () => {
    const date = '20251209';
    const originalContent = 'Original content';
    const editedContent = 'Edited on another device';

    // Create initial journal
    await request(app)
      .post('/journals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ date, content: originalContent })
      .expect(201);

    // Get initial sync state
    const syncResponse = await request(app)
      .get('/journals/sync?since=2025-12-01T00:00:00.000Z')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const initialTimestamp = syncResponse.body.journals.find(
      (j) => j.date === date
    ).updatedAt;

    // Another device edits the journal
    await request(app)
      .put(`/journals/${date}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: editedContent })
      .expect(200);

    // Wait to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 100));

    // First device tries to delete with old timestamp
    const batchResponse = await request(app)
      .post('/journals/batch')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        journals: [
          {
            date,
            content: null, // Deletion
            clientUpdatedAt: initialTimestamp,
          },
        ],
      })
      .expect(200);

    // Should have conflict
    expect(batchResponse.body.results[0].status).toBe('conflict');
    expect(batchResponse.body.conflicts).toHaveLength(1);
    expect(batchResponse.body.conflicts[0].content).toBe(editedContent);

    // Verify server still has the edited content
    const getResponse = await request(app)
      .get(`/journals/${date}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(getResponse.body.content).toBe(editedContent);
    expect(getResponse.body.deletedAt).toBeNull();
  });
});
```

## Manual Testing Scenarios

### Scenario 1: Deletion Conflict - Data Preservation

**Objective**: Verify that deletion conflicts always restore server's content

**Setup**:

- Two devices (Device A and Device B)
- Same user logged in on both
- Both have journal for 2025-12-06 with content "Original content"

**Steps**:

1. **Device B** goes online, edits journal to "Updated on Device B", syncs successfully
2. **Device A** (offline) deletes the journal locally
3. **Device A** comes online and attempts to sync the deletion
4. Server detects conflict: deletion has old timestamp, server has newer edit
5. Server returns conflict status with server's content
6. **Device A** receives response and restores the journal
7. User on Device A sees notification: "Journal restored - it was edited on another device"

**Expected Results**:

- ✅ Journal is restored on Device A with content "Updated on Device B"
- ✅ User is notified about the restoration
- ✅ Both devices now have the same content
- ✅ No data loss occurred

**curl Commands**:

```bash
# Device B: Edit the journal
curl -X PUT http://localhost:3000/journals/20251206 \
  -H "Authorization: Bearer DEVICE_B_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Updated on Device B"}'

# Device A: Try to sync deletion (will get conflict)
curl -X POST http://localhost:3000/journals/batch \
  -H "Authorization: Bearer DEVICE_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "journals": [{
      "date": "20251206",
      "content": null,
      "clientUpdatedAt": "2025-12-06T10:00:00.000Z"
    }]
  }'

# Device A: Verify journal was restored
curl http://localhost:3000/journals/20251206 \
  -H "Authorization: Bearer DEVICE_A_TOKEN"
# Should return: {"content": "Updated on Device B", ...}
```

---

### Scenario 2: Basic Sync Flow

**Setup**:

- Two devices (Device A and Device B)
- Same user logged in on both

**Steps**:

1. On Device A: Create journal for today
2. On Device B: Pull sync
3. Verify: Journal appears on Device B

**Expected Result**: ✅ Journal synced successfully

---

### Scenario 3: Conflict - Same Journal Edited on Both Devices

**Setup**:

- Two devices offline
- Same journal exists on both with content "Version 0"

**Steps**:

1. Device A (offline): Edit to "Version A"
2. Device B (offline): Edit to "Version B"
3. Device A: Come online, sync → succeeds
4. Device B: Come online, sync → conflict detected
5. Device B: Auto-merge, push merged version
6. Device A: Pull sync, see merged version

**Expected Result**:

- ✅ Device B detects conflict
- ✅ Auto-merge creates content with both versions
- ✅ Merged version propagates to Device A
- ✅ No data loss

---

### Scenario 3: Conflict - Same Journal Edited on Both Devices

**Setup**:

- Two devices offline
- Same journal exists on both with content "Version 0"

**Steps**:

1. Device A (offline): Edit to "Version A"
2. Device B (offline): Edit to "Version B"
3. Device A: Come online, sync → succeeds
4. Device B: Come online, sync → conflict detected
5. Device B: Auto-merge, push merged version
6. Device A: Pull sync, see merged version

**Expected Result**:

- ✅ Device B detects conflict
- ✅ Auto-merge creates content with both versions
- ✅ Merged version propagates to Device A
- ✅ No data loss

---

### Scenario 4: Offline Creation and Sync

**Setup**:

- Device A offline

**Steps**:

1. Device A (offline): Create 5 new journals
2. Device A: Come online, sync
3. Device B: Pull sync

**Expected Result**: ✅ All 5 journals appear on Device B

---

### Scenario 4: Soft Delete Sync

**Setup**:

- Journal exists on both devices

**Steps**:

1. Device A: Delete journal
2. Device A: Sync
3. Device B: Pull sync

**Expected Result**: ✅ Journal disappears on Device B

---

### Scenario 5: Three-Way Conflict

**Setup**:

- Three devices (A, B, C) all offline
- Same journal on all devices

**Steps**:

1. Device A (offline): Edit to "Version A"
2. Device B (offline): Edit to "Version B"
3. Device C (offline): Edit to "Version C"
4. Device A: Sync (succeeds, now server has "Version A")
5. Device B: Sync (conflict, merges to "Version A\n---\nVersion B")
6. Device C: Sync (conflict with B's merged version)

**Expected Result**: ✅ Final version contains all three versions with merge markers

---

### Scenario 6: Large Batch Sync

**Setup**:

- Device A offline for 1 week

**Steps**:

1. Device A (offline): Create/edit 50 journals
2. Device B (online): Create/edit 30 journals
3. Device A: Come online, sync

**Expected Result**:

- ✅ All 50 journals from Device A pushed to server
- ✅ All 30 journals from Device B pulled to Device A
- ✅ Any overlaps handled as conflicts

---

## Performance Testing

### 1. Sync Performance Benchmarks

```typescript
// tests/performance/sync.perf.test.ts
describe('Sync Performance', () => {
  it('should sync 100 journals in under 5 seconds', async () => {
    const journals = Array.from({ length: 100 }, (_, i) => ({
      date: `2025${String(i + 1).padStart(4, '0')}`,
      content: 'Test content '.repeat(100),
      clientUpdatedAt: new Date(),
    }));

    const start = Date.now();
    const response = await request(app)
      .post('/journals/batch')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ journals });

    const duration = Date.now() - start;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(5000);
  });

  it('should handle 1000 journal pull sync in under 3 seconds', async () => {
    // Create 1000 journals
    // ...

    const start = Date.now();
    const response = await request(app)
      .get('/journals/sync?since=2025-01-01T00:00:00.000Z')
      .set('Authorization', `Bearer ${authToken}`);

    const duration = Date.now() - start;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(3000);
  });
});
```

### 2. Database Query Performance

```sql
-- Test query performance for sync endpoint
EXPLAIN ANALYZE
SELECT * FROM journals
WHERE user_id = 'user1'
  AND updated_at > '2025-12-01T00:00:00Z'
ORDER BY updated_at ASC;

-- Should use index on (user_id, updated_at)
-- Execution time should be < 50ms for 10,000 journals
```

## Monitoring and Observability

### 1. Key Metrics to Track

```typescript
// Instrument sync endpoints with metrics
import { metrics } from './lib/metrics';

export const JournalService = {
  async batchUpsert(userId: string, journals: BatchJournalItem[]) {
    const startTime = Date.now();

    try {
      const result = await this._batchUpsertImpl(userId, journals);

      // Track metrics
      metrics.increment('sync.batch.success', {
        journalCount: journals.length,
        conflictCount: result.conflicts.length,
      });

      metrics.timing('sync.batch.duration', Date.now() - startTime);

      return result;
    } catch (error) {
      metrics.increment('sync.batch.error');
      throw error;
    }
  },
};
```

### 2. Metrics to Monitor

- `sync.batch.success` - Number of successful batch syncs
- `sync.batch.error` - Number of failed batch syncs
- `sync.batch.duration` - Time taken for batch sync
- `sync.batch.journal_count` - Number of journals per batch
- `sync.batch.conflict_count` - Number of conflicts detected
- `sync.pull.success` - Number of successful pull syncs
- `sync.pull.duration` - Time taken for pull sync
- `sync.pull.journal_count` - Number of journals returned in pull

### 3. Alerting Thresholds

- 🔴 **Critical**: Error rate > 5%
- 🟡 **Warning**: Conflict rate > 20%
- 🟡 **Warning**: Batch sync duration > 5 seconds
- 🟡 **Warning**: Pull sync duration > 2 seconds

## Debugging Tools

### 1. Sync Log Viewer

```typescript
// Add debug endpoint (dev only)
router.get('/debug/sync-log/:userId', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).send();
  }

  const logs = await prisma.journal.findMany({
    where: { userId: req.params.userId },
    select: {
      date: true,
      updatedAt: true,
      deletedAt: true,
      createdAt: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  res.json(logs);
});
```

### 2. Conflict Simulator

```typescript
// Simulate conflict for testing
router.post('/debug/simulate-conflict', async (req, res) => {
  // Create journal with old timestamp
  const journal = await prisma.journal.create({
    data: {
      userId: req.body.userId,
      date: req.body.date,
      content: 'Original',
      updatedAt: new Date(Date.now() - 60000), // 1 minute ago
    },
  });

  // Return info for client to create conflict
  res.json({ journal, instructions: 'Push with older clientUpdatedAt' });
});
```

## Summary

Testing checklist:

- ✅ Unit tests for schemas and service methods
- ✅ Integration tests for end-to-end sync flow
- ✅ Manual testing scenarios for all conflict cases
- ✅ Performance benchmarks for large syncs
- ✅ Monitoring metrics for production
- ✅ Debugging tools for development
