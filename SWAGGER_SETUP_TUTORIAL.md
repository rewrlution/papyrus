# Adding Swagger/OpenAPI Documentation to Papyrus

This tutorial guides you through setting up Swagger/OpenAPI documentation for the Papyrus API using `@asteasolutions/zod-to-openapi`.

## Prerequisites

- Node.js and pnpm installed
- Papyrus monorepo set up with `@packages/shared` and `@packages/api`

## Table of Contents

1. [Install Dependencies](#step-1-install-dependencies)
2. [Create Extended Zod Instance](#step-2-create-extended-zod-instance)
3. [Update Schema Files](#step-3-update-schema-files)
4. [Export Extended Zod](#step-4-export-extended-zod)
5. [Create OpenAPI Registry](#step-5-create-openapi-registry)
6. [Define API Routes](#step-6-define-api-routes)
7. [Generate OpenAPI Document](#step-7-generate-openapi-document)
8. [Integrate Swagger UI](#step-8-integrate-swagger-ui)
9. [Test Setup](#step-9-test-setup)

---

## Step 1: Install Dependencies

### In `packages/shared`:

```bash
cd packages/shared
pnpm add @asteasolutions/zod-to-openapi
```

### In `packages/api`:

```bash
cd packages/api
pnpm add @asteasolutions/zod-to-openapi swagger-ui-express
pnpm add -D @types/swagger-ui-express
```

### Return to root:

```bash
cd ../..
```

---

## Step 2: Create Extended Zod Instance

The extended Zod instance in `@packages/shared` allows all schemas to use OpenAPI metadata methods.

### File: `packages/shared/src/schemas/zod.ts`

```typescript
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Extend Zod with OpenAPI capabilities
extendZodWithOpenApi(z);

// Re-export the extended z instance
export { z };
```

---

## Step 3: Update Schema Files

Update all existing schema files to use the extended Zod instance and add OpenAPI metadata.

### File: `packages/shared/src/schemas/auth/inputs.ts`

```typescript
import { z } from "../zod.js";

export const SignupSchema = z
  .object({
    email: z.string().email("Invalid email address").openapi({
      description: "User email address",
      example: "user@example.com",
    }),
    password: z
      .string()
      .min(8, "Must be at least 8 characters long")
      .refine((val) => /[A-Z]/.test(val), "Need uppercase")
      .refine((val) => /[a-z]/.test(val), "Need lowercase")
      .refine((val) => /\d/.test(val), "Need number")
      .refine((val) => /[@$!%*?&]/.test(val), "Need special char")
      .openapi({
        description:
          "Password with at least 8 characters, including uppercase, lowercase, number, and special character",
        example: "SecurePass123!",
      }),
    confirmPassword: z.string().openapi({
      description: "Password confirmation (must match password)",
      example: "SecurePass123!",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .openapi({
    ref: "SignupInput",
    description: "User signup request body",
  });

export const SigninSchema = z
  .object({
    email: z.string().email("Invalid email address").openapi({
      description: "User email address",
      example: "user@example.com",
    }),
    password: z.string().min(1, "Password is required").openapi({
      description: "User password",
      example: "SecurePass123!",
    }),
  })
  .openapi({
    ref: "SigninInput",
    description: "User signin request body",
  });

export const VerifyEmailSchema = z
  .object({
    token: z.string().min(1, "Verification token is required").openapi({
      description: "Email verification token",
      example: "abc123def456",
    }),
  })
  .openapi({
    ref: "VerifyEmailInput",
    description: "Email verification request body",
  });

export const ResendVerificationSchema = z
  .object({
    email: z.string().email("Invalid email address").openapi({
      description: "User email address",
      example: "user@example.com",
    }),
  })
  .openapi({
    ref: "ResendVerificationInput",
    description: "Resend verification email request body",
  });

export type SignupInput = z.infer<typeof SignupSchema>;
export type SigninInput = z.infer<typeof SigninSchema>;
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof ResendVerificationSchema>;
```

### File: `packages/shared/src/schemas/auth/responses.ts`

```typescript
import { z } from "../zod.js";
import { ApiResponseSchema, ApiErrorResponseSchema } from "../common/index.js";

export const AuthTokenSchema = z
  .object({
    token: z.string().openapi({
      description: "JWT authentication token",
      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    }),
    expiresIn: z.number().openapi({
      description: "Token expiration time in seconds",
      example: 3600,
    }),
  })
  .openapi({
    ref: "AuthToken",
    description: "Authentication token information",
  });

export const UserSchema = z
  .object({
    id: z.string().openapi({
      description: "User unique identifier",
      example: "user_123abc",
    }),
    email: z.string().email().openapi({
      description: "User email address",
      example: "user@example.com",
    }),
    emailVerified: z.boolean().openapi({
      description: "Whether the user email has been verified",
      example: false,
    }),
    createdAt: z.string().datetime().openapi({
      description: "User account creation timestamp",
      example: "2024-01-15T10:30:00Z",
    }),
  })
  .openapi({
    ref: "User",
    description: "User account information",
  });

export const SignupResponseDataSchema = z
  .object({
    user: UserSchema,
    token: AuthTokenSchema,
  })
  .openapi({
    ref: "SignupResponseData",
    description: "Successful signup response data",
  });

export const SigninResponseDataSchema = z
  .object({
    user: UserSchema,
    token: AuthTokenSchema,
  })
  .openapi({
    ref: "SigninResponseData",
    description: "Successful signin response data",
  });

export const SignupResponseSchema = ApiResponseSchema(
  SignupResponseDataSchema,
).openapi({
  ref: "SignupResponse",
  description: "Signup API response",
});

export const SigninResponseSchema = ApiResponseSchema(
  SigninResponseDataSchema,
).openapi({
  ref: "SigninResponse",
  description: "Signin API response",
});

export const AuthErrorResponseSchema = ApiErrorResponseSchema.openapi({
  ref: "AuthErrorResponse",
  description: "Authentication error response",
});

export type AuthToken = z.infer<typeof AuthTokenSchema>;
export type User = z.infer<typeof UserSchema>;
export type SignupResponseData = z.infer<typeof SignupResponseDataSchema>;
export type SigninResponseData = z.infer<typeof SigninResponseDataSchema>;
export type SignupResponse = z.infer<typeof SignupResponseSchema>;
export type SigninResponse = z.infer<typeof SigninResponseSchema>;
```

### File: `packages/shared/src/schemas/common/index.ts`

```typescript
import { z } from "../zod.js";

// Generic API response wrapper
export function ApiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.literal(true).openapi({
      description: "Indicates successful API response",
      example: true,
    }),
    message: z.string().openapi({
      description: "Human-readable success message",
      example: "Operation completed successfully",
    }),
    data: dataSchema,
  });
}

// Generic API error response
export const ApiErrorResponseSchema = z
  .object({
    success: z.literal(false).openapi({
      description: "Indicates failed API response",
      example: false,
    }),
    message: z.string().openapi({
      description: "Human-readable error message",
      example: "An error occurred",
    }),
    error: z
      .object({
        code: z.string().openapi({
          description: "Error code for programmatic handling",
          example: "VALIDATION_ERROR",
        }),
        details: z.any().optional().openapi({
          description: "Additional error details",
        }),
      })
      .optional()
      .openapi({
        description: "Detailed error information",
      }),
  })
  .openapi({
    ref: "ApiErrorResponse",
    description: "Standard API error response",
  });

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
```

### Update Journal Schemas (similar pattern)

Apply the same pattern to `packages/shared/src/schemas/journal/*.ts` files:

- Import `z` from `../zod.js`
- Add `.openapi()` metadata to each field and schema
- Add `ref`, `description`, and `example` values

---

## Step 4: Export Extended Zod

Export the extended Zod instance from the shared package so the API package can use it.

### File: `packages/shared/src/index.ts`

```typescript
export * from "./utils/index.js";
export * from "./schemas/index.js";
export { z } from "./schemas/zod.js";
```

### File: `packages/shared/src/schemas/index.ts`

Ensure this file exports the zod module:

```typescript
export * from "./auth/index.js";
export * from "./common/index.js";
export * from "./journal/index.js";
export * from "./zod.js";
```

---

## Step 5: Create OpenAPI Registry

Create the OpenAPI registry that will hold all schema and route registrations.

### File: `packages/api/src/swagger/registry.ts`

```typescript
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  SignupSchema,
  SigninSchema,
  VerifyEmailSchema,
  ResendVerificationSchema,
  SignupResponseSchema,
  SigninResponseSchema,
  AuthErrorResponseSchema,
} from "@rewrlution/papyrus-shared";

// Create the registry
export const registry = new OpenAPIRegistry();

// Register authentication schemas
registry.register("SignupInput", SignupSchema);
registry.register("SigninInput", SigninSchema);
registry.register("VerifyEmailInput", VerifyEmailSchema);
registry.register("ResendVerificationInput", ResendVerificationSchema);
registry.register("SignupResponse", SignupResponseSchema);
registry.register("SigninResponse", SigninResponseSchema);
registry.register("AuthErrorResponse", AuthErrorResponseSchema);

// Register security scheme (Bearer token)
registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description: "JWT authentication token",
});
```

---

## Step 6: Define API Routes

Create route definitions for all API endpoints.

### File: `packages/api/src/swagger/routes/auth.ts`

```typescript
import { registry } from "../registry.js";
import {
  SignupSchema,
  SigninSchema,
  SignupResponseSchema,
  SigninResponseSchema,
  AuthErrorResponseSchema,
} from "@rewrlution/papyrus-shared";

// POST /auth/signup
registry.registerPath({
  method: "post",
  path: "/auth/signup",
  tags: ["Authentication"],
  summary: "Register a new user account",
  description:
    "Create a new user account with email and password. Returns user information and authentication token.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: SignupSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "User successfully created",
      content: {
        "application/json": {
          schema: SignupResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid input or validation error",
      content: {
        "application/json": {
          schema: AuthErrorResponseSchema,
        },
      },
    },
    409: {
      description: "User already exists",
      content: {
        "application/json": {
          schema: AuthErrorResponseSchema,
        },
      },
    },
  },
});

// POST /auth/signin
registry.registerPath({
  method: "post",
  path: "/auth/signin",
  tags: ["Authentication"],
  summary: "Sign in to existing account",
  description:
    "Authenticate with email and password. Returns user information and authentication token.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: SigninSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Successfully authenticated",
      content: {
        "application/json": {
          schema: SigninResponseSchema,
        },
      },
    },
    401: {
      description: "Invalid credentials",
      content: {
        "application/json": {
          schema: AuthErrorResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid input",
      content: {
        "application/json": {
          schema: AuthErrorResponseSchema,
        },
      },
    },
  },
});
```

### File: `packages/api/src/swagger/routes/journal.ts`

```typescript
import { registry } from "../registry.js";
// Import your journal schemas from shared package
// Register journal endpoints similarly

// Example:
// registry.registerPath({
//   method: 'post',
//   path: '/journals',
//   tags: ['Journals'],
//   summary: 'Create a new journal entry',
//   ...
// });
```

### File: `packages/api/src/swagger/routes/index.ts`

```typescript
// Import all route definitions to ensure they register
import "./auth.js";
import "./journal.js";

export * from "./auth.js";
export * from "./journal.js";
```

---

## Step 7: Generate OpenAPI Document

Create the generator that produces the complete OpenAPI specification.

### File: `packages/api/src/swagger/generator.ts`

```typescript
import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { registry } from "./registry.js";
// Import routes to ensure they're registered
import "./routes/index.js";

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "Papyrus API",
      version: "0.0.1",
      description:
        "API documentation for Papyrus - A personal knowledge management system",
      contact: {
        name: "API Support",
        email: "support@papyrus.example.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local development server",
      },
      {
        url: "https://api.papyrus.example.com",
        description: "Production server",
      },
    ],
    tags: [
      {
        name: "Authentication",
        description: "User authentication and authorization endpoints",
      },
      {
        name: "Journals",
        description: "Journal entry management endpoints",
      },
    ],
  });
}
```

---

## Step 8: Integrate Swagger UI

Add Swagger UI middleware to your Express server.

### File: `packages/api/src/server.ts`

```typescript
import express, { Express, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import { formatMessage, type ApiResponse } from "@rewrlution/papyrus-shared";
import { generateOpenApiDocument } from "./swagger/generator.js";

export function createServer(): Express {
  const app = express();

  // middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Generate OpenAPI document
  const openApiDocument = generateOpenApiDocument();

  // Serve OpenAPI JSON
  app.get("/api-docs.json", (_req: Request, res: Response) => {
    res.json(openApiDocument);
  });

  // Serve Swagger UI
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "Papyrus API Documentation",
    }),
  );

  // health check endpoint
  app.get("/health", (_req: Request, res: Response) => {
    const response: ApiResponse<{ status: string; timestamp: string }> = {
      success: true,
      message: formatMessage("API is healthy"),
      data: {
        status: "ok",
        timestamp: new Date().toISOString(),
      },
    };
    res.json(response);
  });

  return app;
}
```

---

## Step 9: Test Setup

### Build the packages:

```bash
# From root directory
pnpm build
```

### Start the development server:

```bash
cd packages/api
pnpm dev
```

### Access Swagger UI:

Open your browser and navigate to:

```
http://localhost:3000/api-docs
```

### Access OpenAPI JSON:

```
http://localhost:3000/api-docs.json
```

### Verify:

1. All endpoints are listed
2. Schemas show proper examples
3. Request/response bodies are documented
4. You can try out endpoints directly from Swagger UI

---

## Troubleshooting

### TypeScript errors about `.openapi()`

Make sure all schema files import from the extended Zod:

```typescript
import { z } from "../zod.js"; // ✓ Correct
import { z } from "zod"; // ✗ Wrong
```

### Schemas not showing up in Swagger

Ensure you've imported the route definitions in `generator.ts`:

```typescript
import "./routes/index.js";
```

### Module resolution errors

Check your `tsconfig.json` has proper module resolution settings and includes the swagger directory.

---

## Next Steps

1. Add more route definitions for all your API endpoints
2. Add request validation middleware using the schemas
3. Add response validation in development mode
4. Consider adding `express-openapi-validator` for runtime validation
5. Add authentication/authorization to protected routes
6. Export OpenAPI spec for client generation (TypeScript, Python, etc.)

---

## Additional Resources

- [@asteasolutions/zod-to-openapi](https://github.com/asteasolutions/zod-to-openapi)
- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
