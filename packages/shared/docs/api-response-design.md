# API Response Schema Design

## Overview

This document explains the design decisions behind the API response schemas defined in `src/schemas/common/response.ts`. The design went through several iterations before arriving at the current 4-schema approach.

## Background & Context

The response schemas serve as the foundation for all API responses across the entire application. They need to:

- Provide type safety for both runtime validation (Zod) and compile-time checking (TypeScript)
- Generate accurate OpenAPI/Swagger documentation
- Be easy to use and understand for API consumers
- Support different response patterns (error, message-only, data, paginated)

## Evolution of the Design

### Initial Approach: Meta-types with Unions

We initially tried to create "meta-types" that would union different response types together:

```typescript
export const ApiResponseSchema = <T extends ZodType>(dataSchema: T) =>
  z.union([
    ApiErrorResponseSchema,
    ApiMessageResponseSchema,
    ApiDataResponseSchema(dataSchema),
  ]);

export type ApiResponse<T = never> = T extends never
  ? ApiMessageResponse | ApiErrorResponse
  : ApiDataResponse<T> | ApiErrorResponse;
```

**The goal** was to have a single, flexible type that could represent any API response, reducing the number of types consumers needed to import.

### Problems with the Meta-type Approach

#### 1. Zod Union Parsing Order Issue (Critical Bug)

This was the most serious problem that caused actual runtime bugs:

- **How Zod unions work**: Zod tries each schema in the union sequentially until one succeeds
- **Zod's default behavior**: Object schemas don't reject extra properties (unless `.strict()` is used)
- **The bug**: When parsing a response like `{ success: true, data: {...}, message: "..." }`:
  1. Zod tries `ApiMessageResponseSchema` first (which expects `{ success: true, message: string }`)
  2. It matches successfully because it finds `success: true` and `message: string`
  3. Zod **ignores the extra `data` field** (default behavior)
  4. The parsed result has the `data` field **dropped**
  5. Zod never tries `ApiDataResponseSchema`

**Impact**: Data responses were incorrectly parsed as message-only responses, causing data loss at runtime.

**Test failures**: This caused 3 test failures in `journal/responses.test.ts` where responses with data were being parsed and the data field was coming back as `undefined`.

#### 2. Complex Conditional Types

The conditional type logic was clever but created confusion:

```typescript
export type ApiResponse<T = never> = T extends never
  ? ApiMessageResponse | ApiErrorResponse
  : ApiDataResponse<T> | ApiErrorResponse;
```

**Problems**:

- When should consumers use `ApiResponse<User>` vs `ApiResponse<never>` vs `ApiResponse<void>`?
- The generic parameter has dual meaning (data type AND response shape selector)
- TypeScript's discriminated union narrowing doesn't work well with generics
- Hard to understand at a glance what type will actually be returned

#### 3. OpenAPI/Swagger Documentation Issues

Union types made it difficult to document endpoints clearly:

- Hard to express "this endpoint returns either data OR just a message"
- Swagger UI would show all possible union members, creating confusion
- Examples had to cover multiple response shapes

### The .nullish() vs .nullable() Decision

Another key design decision involved how to handle missing data:

**Initial approach** with `.nullish()`:

```typescript
data: dataSchema.nullish(); // Allows T | null | undefined
```

This allows three states:

- `data: T` - value is present
- `data: null` - explicitly null
- `data: undefined` or field omitted entirely

**Problems**:

- Inconsistent response shape: sometimes `data` field exists, sometimes it doesn't
- Clients need to check both `if (response.data === undefined)` and `if (response.data === null)`
- Unclear semantics: does missing field mean "no data" or "field wasn't included in response"?
- When would you use `null` vs omitting the field?

**Final approach** with `.nullable()`:

```typescript
data: dataSchema.nullable(); // Allows T | null, field required
```

This enforces two states:

- `data: T` - value is present
- `data: null` - no data available

**Benefits**:

- Consistent response shape: `data` field always exists in JSON
- Clients can always access `response.data` (no need to check field existence)
- Clear semantics: `null` means "no data available" (e.g., resource not found)
- Better distinction from `ApiMessageResponseSchema` (which has no `data` field at all)

Example use cases:

- `GET /user/:id` returns `{ success: true, data: null, message: "User not found" }` for 404
- `DELETE /user/:id` returns `{ success: true, data: { id: "123" }, message: "User deleted" }` with minimal data
- `POST /user` returns `{ success: true, data: {...user}, message: "User created" }` with full data

## Final Design: 4 Independent Base Schemas

We settled on exposing 4 separate, independent base schemas without meta-types:

### 1. ApiErrorResponseSchema

```typescript
{
  success: false,
  message: string,
  error: {
    code: string,
    details?: Array<{ field: string, message: string }>
  }
}
```

**When to use**: All error responses (4xx, 5xx status codes)

### 2. ApiMessageResponseSchema

```typescript
{
  success: true,
  message: string
}
```

**When to use**: Operations that return only a confirmation message:

- Email verification (`/auth/verify-email`)
- Logout endpoints (`/auth/logout`)
- Simple success confirmations

### 3. ApiDataResponseSchema<T>

```typescript
{
  success: true,
  data: T | null,  // Field required, can be null
  message: string
}
```

**When to use**: Operations that return data:

- GET requests (data can be null if not found)
- POST/PUT/PATCH (data contains created/updated resource)
- DELETE (data contains minimal info like `{ id: string }`)

### 4. ApiPaginatedResponseSchema<T>

```typescript
{
  success: true,
  data: T[],  // Array of items
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  },
  message: string
}
```

**When to use**: List endpoints with pagination:

- `GET /journals` (paginated list of journals)
- `GET /users` (paginated list of users)

## Why This Design is Better

### 1. Explicit and Clear

Each endpoint explicitly declares what it returns. No guessing about whether an endpoint returns data or just a message.

### 2. No Union Parsing Issues

Schemas are used independently or in explicit domain-specific unions, avoiding the Zod parsing order bug entirely.

### 3. Better TypeScript Support

Types narrow correctly with discriminated unions. TypeScript can infer the exact response shape based on the `success` field.

### 4. Industry Standard

This pattern matches how major APIs are designed:

- **Stripe API**: Separate response types per endpoint
- **GitHub API**: Explicit response shapes for different operations
- **Twilio API**: Clear distinction between success and error responses

### 5. Swagger Clarity

Each endpoint's OpenAPI documentation clearly shows the response shape without ambiguity.

## Usage Guidelines

### For Error Responses

```typescript
import {
  ApiErrorResponseSchema,
  type ApiErrorResponse,
} from '@rewrlution/papyrus-shared';

// In error handler
const errorResponse: ApiErrorResponse = {
  success: false,
  message: 'User not found',
  error: {
    code: 'NOT_FOUND',
  },
};
```

### For Message-Only Responses

```typescript
import {
  ApiMessageResponseSchema,
  type ApiMessageResponse,
} from '@rewrlution/papyrus-shared';

// verify-email endpoint
const response: ApiMessageResponse = {
  success: true,
  message: 'Email verified successfully!',
};
```

### For Data Responses

```typescript
import {
  ApiDataResponseSchema,
  type ApiDataResponse,
} from '@rewrlution/papyrus-shared';

// GET user endpoint
const response: ApiDataResponse<User> = {
  success: true,
  data: user, // or null if not found
  message: 'User retrieved successfully',
};
```

### For Paginated Responses

```typescript
import {
  ApiPaginatedResponseSchema,
  type ApiPaginatedResponse,
} from '@rewrlution/papyrus-shared';

// GET journals endpoint
const response: ApiPaginatedResponse<Journal> = {
  success: true,
  data: journals,
  pagination: {
    page: 1,
    limit: 10,
    total: 50,
    totalPages: 5,
  },
  message: 'Journals retrieved successfully',
};
```

## Domain-Specific Response Schemas

Each domain should create specific response schemas by composing these base schemas. This provides clear contracts and self-documenting code.

### Example: Authentication Responses

```typescript
// packages/shared/src/schemas/auth/responses.ts
import { z } from 'zod';
import {
  ApiErrorResponseSchema,
  ApiMessageResponseSchema,
  ApiDataResponseSchema,
} from '../common/response.js';
import { UserDataSchema } from '../common/user.js';

// Message-only response for email verification
export const VerifyEmailResponseSchema = z
  .union([ApiErrorResponseSchema, ApiMessageResponseSchema])
  .openapi('VerifyEmailResponse', {
    description: 'Email verification response',
  });

// Data response for signin
export const SigninResponseSchema = ApiDataResponseSchema(
  UserDataSchema.extend({ token: z.string() })
).openapi('SigninResponse', {
  description: 'Signin response with user data and JWT token',
});

export type VerifyEmailResponse = z.infer<typeof VerifyEmailResponseSchema>;
export type SigninResponse = z.infer<typeof SigninResponseSchema>;
```

### Example: Journal Responses

```typescript
// packages/shared/src/schemas/journal/responses.ts
import { z } from 'zod';
import {
  ApiDataResponseSchema,
  ApiPaginatedResponseSchema,
} from '../common/response.js';
import { JournalDataSchema } from '../common/journal.js';

// Single journal response (data can be null if not found)
export const JournalResponseSchema = ApiDataResponseSchema(
  JournalDataSchema
).openapi('JournalResponse', {
  description: 'Single journal entry response',
});

// Paginated list of journals
export const JournalListResponseSchema = ApiPaginatedResponseSchema(
  JournalDataSchema
).openapi('JournalListResponse', {
  description: 'Paginated list of journal entries',
});

export type JournalResponse = z.infer<typeof JournalResponseSchema>;
export type JournalListResponse = z.infer<typeof JournalListResponseSchema>;
```

## Benefits of Domain-Specific Schemas

1. **Clear Contracts**: `VerifyEmailResponse` vs `SigninResponse` is self-documenting
2. **Type Safety**: Each endpoint has its exact return type
3. **Perfect Narrowing**: TypeScript can narrow based on `success` field
4. **Clean OpenAPI**: Each schema generates clear Swagger documentation
5. **Maintainability**: Easy to understand what each endpoint returns

## Migration Notes

If you're migrating from the old meta-type approach:

1. Replace `ApiResponseSchema<T>` with `ApiDataResponseSchema(T)`
2. Replace `ApiResponse<T>` type with `ApiDataResponse<T>`
3. Replace `ApiPaginatedSuccessResponseSchema` with `ApiPaginatedResponseSchema`
4. For message-only endpoints, use `ApiMessageResponseSchema` directly
5. Update error responses to use `ApiErrorResponse` type explicitly

## Lessons Learned

1. **Zod unions require careful consideration**: Default behavior of ignoring extra properties can cause subtle bugs
2. **Simplicity over cleverness**: Separate schemas are easier to understand than complex conditional types
3. **Explicit is better than implicit**: Clear schema names are better than generic meta-types
4. **Industry patterns exist for a reason**: Major APIs use similar patterns because they work
5. **Type safety at multiple levels**: Both runtime (Zod) and compile-time (TypeScript) validation are important

## References

- [Zod Documentation - Unions](https://zod.dev/?id=unions)
- [TypeScript Discriminated Unions](https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html#discriminating-unions)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Stripe API Design](https://stripe.com/docs/api)
- [GitHub API Design](https://docs.github.com/en/rest)
