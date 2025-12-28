# Tutorial 05: Architecture Patterns

## Goal

Understand and implement the layered architecture pattern with repositories, mappers, services, controllers, and routes. This tutorial teaches you the "why" and "how" of clean architecture.

## What You'll Learn

- Why we separate concerns into layers
- What each layer is responsible for
- How data flows through the layers
- Repository pattern for data access
- Mapper pattern for data transformation
- The benefits of this architecture

## The Problem: Spaghetti Code

Many beginners write everything in route handlers:

```typescript
// ❌ BAD: Everything in one place (spaghetti code)
app.post('/signup', async (req, res) => {
  try {
    // Validation mixed with business logic
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    // Direct database access in route handler
    const existing = await prisma.user.findUnique({
      where: { email: req.body.email },
    });

    if (existing) {
      return res.status(409).json({ error: 'User exists' });
    }

    // Business logic in route handler
    const hash = await bcrypt.hash(req.body.password, 10);
    const token = crypto.randomBytes(32).toString('hex');

    // More database calls
    const user = await prisma.user.create({
      data: {
        email: req.body.email,
        passwordHash: hash,
        verificationToken: token,
      },
    });

    // Email sending mixed in
    await sendEmail(req.body.email, token);

    // Response formatting
    res.json({ id: user.id, email: user.email });
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});
```

**Problems:**

- Hard to test (everything is coupled)
- Hard to maintain (one giant function)
- Hard to reuse (logic tied to HTTP)
- Hard to modify (changing one thing breaks everything)
- No type safety for data transformations

## The Solution: Layered Architecture

We separate concerns into distinct layers:

```
┌─────────────────────────────────────┐
│  Routes (HTTP endpoints)            │  ← "What endpoints exist?"
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Controllers (Request/Response)     │  ← "How do I handle HTTP?"
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Services (Business Logic)          │  ← "What are the rules?"
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Repositories (Data Access)         │  ← "How do I get data?"
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Mappers (Data Transformation)      │  ← "How do I transform data?"
└─────────────────────────────────────┘
```

Each layer has ONE responsibility!

## Layer 1: Mappers (Data Transformation)

**Responsibility**: Transform between different data representations

- Database entity → DTO (Data Transfer Object)
- DTO → Database entity
- Hide sensitive fields (passwords, tokens)
- Add computed fields

Create `src/domain/mappers/user.mapper.ts`:

```typescript
/**
 * User Mapper
 * Transforms between database entities and DTOs
 */
import type { User } from '@prisma/client';
import type { UserDTO } from '@papyrus/shared';

export class UserMapper {
  /**
   * Convert database User to response DTO
   * Hides sensitive information
   */
  static toResponseDTO(user: User): UserDTO {
    return {
      id: user.id,
      email: user.email,
      verified: user.verified,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
    // Note: passwordHash, verificationToken are NOT included!
  }

  /**
   * Convert multiple users to DTOs
   */
  static toResponseDTOList(users: User[]): UserDTO[] {
    return users.map((user) => this.toResponseDTO(user));
  }
}
```

**Why mappers?**

- **Security**: Never expose sensitive fields (passwords, tokens)
- **Consistency**: Same transformation logic everywhere
- **Flexibility**: Database changes don't affect API responses
- **Type Safety**: TypeScript ensures correct shape

**Example:**

```typescript
// Database entity (internal)
const dbUser = {
  id: '123',
  email: 'user@example.com',
  passwordHash: '$2b$10$...', // SENSITIVE
  verificationToken: 'abc123', // SENSITIVE
  verified: true,
  createdAt: Date,
  updatedAt: Date,
};

// Response DTO (external)
const responseUser = UserMapper.toResponseDTO(dbUser);
// {
//   id: '123',
//   email: 'user@example.com',
//   verified: true,
//   createdAt: '2024-01-15T10:30:00.000Z',
//   updatedAt: '2024-01-15T10:30:00.000Z'
// }
// Password and token are hidden!
```

## Layer 2: Repositories (Data Access)

**Responsibility**: All database operations

- Encapsulate Prisma calls
- No business logic
- Reusable queries
- Easy to test with mocks

Create `src/domain/repositories/user.repository.ts`:

```typescript
/**
 * User Repository
 * Handles all database operations for User model
 */
import type { Prisma, User } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';

/**
 * User Repository
 * All User database operations go through this repository
 */
export const userRepository = {
  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  },

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  /**
   * Find user by verification token
   */
  async findByVerificationToken(token: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { verificationToken: token },
    });
  },

  /**
   * Create a new user
   */
  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({
      data,
    });
  },

  /**
   * Update user
   */
  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  },

  /**
   * Delete user
   */
  async delete(id: string): Promise<User> {
    return prisma.user.delete({
      where: { id },
    });
  },

  /**
   * Find all users (with pagination)
   */
  async findMany(skip = 0, take = 10): Promise<User[]> {
    return prisma.user.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  },
};
```

**Why repositories?**

- **Encapsulation**: All database logic in one place
- **Reusability**: Use same queries across services
- **Testability**: Easy to mock for testing
- **Maintainability**: Change database queries without touching business logic
- **Consistency**: Same patterns for all models

**Without Repository (Bad):**

```typescript
// Service has database knowledge
const user = await prisma.user.findUnique({ where: { email } });
const user2 = await prisma.user.findUnique({ where: { email } }); // Duplicated!
```

**With Repository (Good):**

```typescript
// Service uses repository
const user = await userRepository.findByEmail(email);
const user2 = await userRepository.findByEmail(email); // Reused!
```

## Layer 3: Services (Business Logic)

**Responsibility**: Business rules and orchestration

- Implement business logic
- Coordinate between repositories
- Handle external services (email, etc.)
- Throw business errors
- No HTTP knowledge

Create `src/services/auth.service.ts`:

```typescript
/**
 * Auth Service
 * Business logic for authentication
 */
import { UserMapper } from '../domain/mappers/user.mapper.js';
import { userRepository } from '../domain/repositories/user.repository.js';
import { ConflictError } from '../utils/errors.js';

export const AuthService = {
  /**
   * User signup
   * Business logic: Check if user exists, create user, send email
   */
  async signup(email: string, password: string) {
    // Business rule: Email must be unique
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    // Business logic: Hash password, generate token
    const passwordHash = 'hashed_' + password; // TODO: Use bcrypt
    const verificationToken = 'token_' + Math.random(); // TODO: Use crypto
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Create user via repository
    const userEntity = await userRepository.create({
      email,
      passwordHash,
      verified: false,
      verificationToken,
      verificationExpiry,
    });

    // Business logic: Send verification email
    // TODO: await sendVerificationEmail(email, verificationToken)

    // Transform to DTO before returning
    const user = UserMapper.toResponseDTO(userEntity);

    return {
      message: `Signup successful! Please check ${email} to verify your account.`,
      user,
    };
  },

  // More service methods...
};
```

**Why services?**

- **Business Logic**: All rules in one place
- **Orchestration**: Coordinates multiple operations
- **Reusability**: Can be called from different controllers
- **Testability**: No HTTP dependencies
- **No HTTP knowledge**: Can be used in CLI, cron jobs, etc.

## Layer 4: Controllers (Request/Response Handling)

**Responsibility**: Handle HTTP specifics

- Extract data from req
- Call service methods
- Format responses
- Set status codes
- No business logic!

Create `src/controllers/auth.controller.ts`:

```typescript
/**
 * Auth Controller
 * HTTP request handlers for authentication
 */
import type { Response } from 'express';

import { asyncHandler } from '../middleware/index.js';
import { AuthService } from '../services/index.js';
import type { ValidatedRequest } from '../types/index.js';
import type { SignupInput, SignupResponse } from '@papyrus/shared';

export const AuthController = {
  /**
   * POST /api/auth/signup
   * Handle user signup request
   */
  signup: asyncHandler(
    async (
      req: ValidatedRequest<SignupInput>,
      res: Response<SignupResponse>
    ) => {
      // Extract validated data from request
      const { email, password } = req.validated;

      // Call service (business logic)
      const result = await AuthService.signup(email, password);

      // Send response with appropriate status code
      res.status(201).json(result);
    }
  ),

  // More controller methods...
};
```

**Why controllers?**

- **HTTP Specifics**: Status codes, headers, etc.
- **Thin Layer**: Just extracts data and calls service
- **Type Safety**: Uses ValidatedRequest for type-safe data
- **Separation**: HTTP logic separate from business logic

## Layer 5: Routes (Endpoint Definitions)

**Responsibility**: Define API endpoints and apply middleware

- Define HTTP methods and paths
- Apply middleware (validation, auth)
- Wire controllers
- API structure definition

Create `src/routes/auth.routes.ts`:

```typescript
/**
 * Auth Routes
 * Defines authentication endpoints
 */
import { Router } from 'express';

import { AuthController } from '../controllers/index.js';
import { validateBody } from '../middleware/index.js';
import { SignupSchema } from '@papyrus/shared';

const router = Router();

/**
 * POST /api/auth/signup
 * Register a new user
 */
router.post(
  '/signup',
  validateBody(SignupSchema), // Middleware: Validate request body
  AuthController.signup // Controller: Handle request
);

// More routes...

export { router as authRoutes };
```

**Why separate routes?**

- **API Structure**: Clear endpoint definitions
- **Middleware Chaining**: Easy to see what middleware applies
- **Documentation**: Routes file is like API documentation
- **Modularity**: Each feature has its own routes file

## Layer 6: Shared Schemas

Create `src/schemas/auth.schemas.ts`:

```typescript
/**
 * Auth Schemas
 * Validation schemas for auth endpoints
 * (In real project, these come from @papyrus/shared)
 */
import { z } from 'zod';

export const SignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long'),
});

export type SignupInput = z.infer<typeof SignupSchema>;
```

Create `src/schemas/index.ts`:

```typescript
export * from './auth.schemas.js';
```

## Complete Data Flow Example

Let's trace a signup request through all layers:

```
1. CLIENT SENDS:
   POST /api/auth/signup
   Body: { "email": "user@example.com", "password": "secret123" }

2. EXPRESS RECEIVES REQUEST
   ↓

3. MIDDLEWARE CHAIN:
   - CORS middleware: Adds CORS headers
   - Request logger: Logs the request
   - JSON parser: Parses body
   ↓

4. ROUTE MATCHES:
   POST /api/auth/signup
   ↓

5. VALIDATION MIDDLEWARE:
   - Validates body against SignupSchema
   - Attaches validated data to req.validated
   - If invalid → throws ZodError → caught by errorHandler
   ↓

6. CONTROLLER (auth.controller.ts):
   - Extracts: email, password from req.validated
   - Calls: AuthService.signup(email, password)
   ↓

7. SERVICE (auth.service.ts):
   - Checks: Email already exists? (via repository)
   - Hashes: Password with bcrypt
   - Generates: Verification token
   - Creates: User via repository
   - Sends: Verification email
   - Transforms: User entity to DTO (via mapper)
   - Returns: { message, user }
   ↓

8. REPOSITORY (user.repository.ts):
   - Executes: prisma.user.findByEmail()
   - Executes: prisma.user.create()
   - Returns: User entity
   ↓

9. MAPPER (user.mapper.ts):
   - Transforms: User entity to UserDTO
   - Removes: Sensitive fields
   - Returns: Safe user object
   ↓

10. BACK TO CONTROLLER:
    - Receives: { message, user }
    - Sets: Status 201 (Created)
    - Sends: JSON response
    ↓

11. CLIENT RECEIVES:
    Status: 201 Created
    Body: {
      "message": "Signup successful! Please check email...",
      "user": {
        "id": "123",
        "email": "user@example.com",
        "verified": false,
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    }
```

## Create Index Files

Create `src/controllers/index.ts`:

```typescript
export * from './auth.controller.js';
```

Create `src/services/index.ts`:

```typescript
export * from './auth.service.js';
```

Create `src/domain/mappers/index.ts`:

```typescript
export * from './user.mapper.js';
```

Create `src/domain/repositories/index.ts`:

```typescript
export * from './user.repository.js';
```

Create `src/routes/index.ts`:

```typescript
export * from './auth.routes.js';
```

## Update App with Routes

Update `src/app.ts`:

```typescript
import { authRoutes } from './routes/index.js';

// Inside createApp():

// Remove placeholder comment and add:
app.use('/api/auth', authRoutes);
```

## Benefits of This Architecture

### 1. Testability

Each layer can be tested independently:

```typescript
// Test repository (mock Prisma)
test('findByEmail returns user', async () => {
  const user = await userRepository.findByEmail('test@example.com')
  expect(user).toBeDefined()
})

// Test service (mock repository)
test('signup throws error if email exists', async () => {
  jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser)
  await expect(AuthService.signup('test@example.com', 'password')).rejects.toThrow(
    ConflictError
  )
})

// Test controller (mock service)
test('signup returns 201 on success', async () => {
  jest.spyOn(AuthService, 'signup').mockResolvedValue(mockResponse)
  const res = await request(app).post('/api/auth/signup').send({ ...})
  expect(res.status).toBe(201)
})
```

### 2. Maintainability

Change one layer without affecting others:

```typescript
// Change database from Prisma to TypeORM?
// ✅ Only update repositories!

// Change response format?
// ✅ Only update mappers!

// Change business rules?
// ✅ Only update services!

// Change API endpoints?
// ✅ Only update routes!
```

### 3. Reusability

Use the same service from different sources:

```typescript
// HTTP endpoint
app.post('/signup', AuthController.signup);

// CLI command
await AuthService.signup(email, password);

// Cron job
await AuthService.signup(batch[i].email, batch[i].password);

// GraphQL resolver
signup: () => AuthService.signup(email, password);
```

### 4. Type Safety

TypeScript ensures correctness:

```typescript
// Mapper ensures safe response
const user = UserMapper.toResponseDTO(dbUser); // Type: UserDTO (no passwords!)

// Repository ensures correct queries
const user = await userRepository.findById(id); // Type: User | null

// Service ensures business logic
const result = await AuthService.signup(email, password); // Type: SignupResponse
```

## Checkpoint

You now understand:

- Why we separate into layers
- What each layer is responsible for
- How data flows through the architecture
- Repository pattern for data access
- Mapper pattern for transformation
- Benefits of clean architecture

Your project structure:

```
api/
├── src/
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   └── index.ts
│   ├── domain/
│   │   ├── mappers/
│   │   │   ├── user.mapper.ts
│   │   │   └── index.ts
│   │   └── repositories/
│   │       ├── user.repository.ts
│   │       └── index.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   └── index.ts
│   ├── schemas/
│   │   ├── auth.schemas.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   └── index.ts
│   └── app.ts
└── package.json
```
