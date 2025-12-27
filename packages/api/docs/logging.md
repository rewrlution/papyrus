# Logging Best Practices

This document outlines the best practices for logging in the Papyrus API application.

## Overview

We use [Winston](https://github.com/winstonjs/winston) as our logging library, configured in `src/lib/logger.ts`. Winston provides structured, level-based logging with automatic timestamp formatting and environment-aware configuration.

## Winston Configuration

Our logger is configured with:

- **Log levels**: `debug` in development, `info` in production
- **Format**: Timestamp + colorized output + error stack traces
- **Transport**: Console (can be extended with file or external services)

### Winston Log Levels (highest to lowest priority)

1. `error` (0) - Critical errors
2. `warn` (1) - Warnings
3. `info` (2) - General info (Winston's default)
4. `http` (3) - HTTP requests
5. `verbose` (4) - Detailed info
6. `debug` (5) - Debug messages
7. `silly` (6) - Very verbose

When a log level is set, Winston outputs that level and all higher-priority levels.

## When to Use `console` vs `logger`

### ✅ Use `console` for:

- **Bootstrap/initialization code** (e.g., `src/env/config.ts`)
  - Runs before the logger is initialized
  - Avoids circular dependencies
  - Critical errors must be visible even if logging infrastructure fails

```typescript
// ✅ GOOD: config.ts
function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    parsed.error.issues.forEach((issue) => {
      console.error(` ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }

  return parsed.data;
}
```

### ✅ Use `logger` for:

- **Application-level code** (e.g., `src/index.ts`)
- **Service layer**
- **Utility functions**
- **Any code after bootstrap phase**

```typescript
// ✅ GOOD: index.ts
import { logger } from './lib/logger.js';

async function main() {
  try {
    await prisma.$connect();
    logger.info('📀 Database connected');
  } catch (err) {
    logger.error('❌ Database connection failed', { error: err });
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    logger.info('🚀 API server listening', { port: env.PORT });
  });
}
```

## Using Child Loggers with Context

Child loggers automatically add context to all log entries, making it easier to trace requests and debug issues.

### When to Use Child Loggers

- **HTTP request handlers** - Add request ID, user ID, path, method
- **Background jobs** - Add job ID, job name
- **Async operations** - Add correlation IDs
- **Any code where you want automatic context**

### Example: Request Logging

```typescript
import { createContextLogger } from '../lib/logger.js';

app.get('/api/users/:id', (req, res) => {
  const reqLogger = createContextLogger({
    requestId: req.id,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
  });

  reqLogger.info('Fetching user');

  try {
    const user = await getUserById(req.params.id);
    reqLogger.info('User fetched successfully', { userId: user.id });
    res.json(user);
  } catch (error) {
    reqLogger.error('Failed to fetch user', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

**Output:**

```
2025-12-27 10:30:45 [info]: Fetching user { requestId: '123', path: '/api/users/42', method: 'GET', userId: '1' }
2025-12-27 10:30:46 [info]: User fetched successfully { requestId: '123', path: '/api/users/42', method: 'GET', userId: '1', userId: '42' }
```

### Example: Service Layer

For services, either import the base logger or accept a logger as a parameter:

```typescript
// Option 1: Import base logger
import { logger } from '../lib/logger.js';

export async function sendEmail(to: string, subject: string) {
  logger.info('Sending email', { to, subject });
  // ... send email
  logger.info('Email sent successfully', { to, subject });
}

// Option 2: Accept logger as parameter (better for testing)
export async function sendEmail(to: string, subject: string, log = logger) {
  log.info('Sending email', { to, subject });
  // ... send email
  log.info('Email sent successfully', { to, subject });
}
```

## Logging Best Practices

### 1. Include Relevant Context

```typescript
// ❌ BAD: Not enough context
logger.error('Failed to update');

// ✅ GOOD: Include relevant details
logger.error('Failed to update journal entry', {
  journalId,
  userId,
  error: err.message,
});
```

### 2. Use Appropriate Log Levels

```typescript
logger.error('Critical failure', { error }); // System errors
logger.warn('Deprecated API used', { endpoint }); // Warnings
logger.info('User logged in', { userId }); // Important events
logger.debug('Query params', { params }); // Debug info (dev only)
```

### 3. Log Errors with Full Context

```typescript
try {
  await doSomething();
} catch (error) {
  // ✅ GOOD: Log the error object for stack traces
  logger.error('Operation failed', {
    error,
    context: { userId, action: 'doSomething' },
  });
}
```

### 4. Avoid Logging Sensitive Data

```typescript
// ❌ BAD: Logging sensitive data
logger.info('User authenticated', { password, token });

// ✅ GOOD: Log only non-sensitive data
logger.info('User authenticated', { userId, email });
```

## Quick Reference

| Location                  | Use                                  | Reason                                  |
| ------------------------- | ------------------------------------ | --------------------------------------- |
| **config.ts** (bootstrap) | `console`                            | Runs before logger, avoid circular deps |
| **index.ts** (startup)    | `logger`                             | Application-level logging               |
| **Routes/handlers**       | `createContextLogger({ requestId })` | Request context in all logs             |
| **Services/utilities**    | `logger` or pass as param            | Consistent logging, testable            |

## Additional Resources

- [Winston Documentation](https://github.com/winstonjs/winston)
- [Winston NPM Package](https://www.npmjs.com/package/winston)
- [Winston Logging Levels](https://github.com/winstonjs/winston#logging-levels)
