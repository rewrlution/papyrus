# Part 3: Building the API - Express REST Server

Welcome to Part 3! Now that we have our shared package, let's build something that uses it: a REST API server with Express. You'll see how easy it is to share code in a monorepo.

## The Big Picture

We're building a simple REST API that:

- Manages users (create, list, get by ID)
- Uses our **shared utilities** (formatMessage, generateId)
- Uses our **shared types** (User, ApiResponse)
- Returns consistent JSON responses
- Has a health check endpoint

The magic: When we `import` from `@myapp/shared`, we're importing from the package we built in Part 2!

## What You'll Learn

- How to create a package that depends on another package
- How to set up Express with TypeScript
- How to structure an API with routes
- How to use TypeScript project references
- How to test your API

## Step 1: Create the Package Structure

Create the API package folders:

```bash
mkdir -p packages/api/src/routes
mkdir -p packages/api/tests
```

Your monorepo now has:

```
packages/
├── shared/     (from Part 2)
└── api/        (new!)
    ├── src/
    │   └── routes/
    └── tests/
```

## Step 2: Configure the Package

Create `packages/api/package.json`:

```json
{
  "name": "@myapp/api",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "test": "vitest run"
  },
  "dependencies": {
    "@myapp/shared": "workspace:*",
    "express": "^4.21.2"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "tsx": "^4.19.2"
  }
}
```

**New concepts here:**

- `"@myapp/shared": "workspace:*"` - This is the magic! It tells pnpm: "Link to the shared package in this workspace"
- `"private": true"` - This package won't be published to npm
- `tsx` - Allows running TypeScript directly (great for development)
- `@types/express` - TypeScript types for Express

## Step 3: Install Dependencies

From the root of your monorepo:

```bash
pnpm install
```

pnpm will:

1. Install Express and its types
2. Install tsx for development
3. Link `@myapp/shared` to this package (no need to publish!)

## Step 4: Configure TypeScript

Create `packages/api/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"],
  "references": [{ "path": "../shared" }]
}
```

**Key addition:** `"references"` tells TypeScript: "This package depends on the shared package." TypeScript will:

- Check that shared is built before building API
- Provide better autocomplete and type checking
- Enable incremental builds (faster!)

## Step 5: Create the Express Server

Create `packages/api/src/server.ts`:

```typescript
import express, { type Express, type Request, type Response } from "express";
import { formatMessage, type ApiResponse } from "@myapp/shared";
import { router } from "./routes/index.js";

export function createServer(): Express {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use("/api", router);

  // Health check endpoint
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

  // Root endpoint
  app.get("/", (_req: Request, res: Response) => {
    res.json({
      message: formatMessage("Welcome to MyApp API"),
      version: "1.0.0",
    });
  });

  return app;
}
```

**Notice:**

- We import `formatMessage` and `ApiResponse` from `@myapp/shared` - seamlessly!
- We use TypeScript types like `Express`, `Request`, `Response`
- The function returns an Express app (making it testable)

## Step 6: Create API Routes

Create `packages/api/src/routes/index.ts`:

```typescript
import { Router, type Request, type Response } from "express";
import { generateId, type User, type ApiResponse } from "@myapp/shared";

export const router = Router();

// In-memory storage (for demo purposes - use a database in production!)
const users: User[] = [];

// Get all users
router.get("/users", (_req: Request, res: Response) => {
  const response: ApiResponse<User[]> = {
    success: true,
    data: users,
    message: `Found ${users.length} users`,
  };
  res.json(response);
});

// Get user by ID
router.get("/users/:id", (req: Request, res: Response) => {
  const user = users.find((u) => u.id === req.params.id);

  if (!user) {
    const response: ApiResponse = {
      success: false,
      error: "User not found",
    };
    res.status(404).json(response);
    return;
  }

  const response: ApiResponse<User> = {
    success: true,
    data: user,
  };
  res.json(response);
});

// Create user
router.post("/users", (req: Request, res: Response) => {
  const { name, email } = req.body;

  if (!name || !email) {
    const response: ApiResponse = {
      success: false,
      error: "Name and email are required",
    };
    res.status(400).json(response);
    return;
  }

  const newUser: User = {
    id: generateId(),
    name,
    email,
    createdAt: new Date(),
  };

  users.push(newUser);

  const response: ApiResponse<User> = {
    success: true,
    data: newUser,
    message: "User created successfully",
  };
  res.status(201).json(response);
});
```

**What's happening:**

- We use `generateId()` from shared to create unique IDs
- We use the `User` type from shared for type safety
- We use `ApiResponse` to ensure consistent responses
- All three endpoints follow RESTful conventions

## Step 7: Create the Entry Point

Create `packages/api/src/index.ts`:

```typescript
import { createServer } from "./server.js";

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const server = createServer();

server.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
```

This is the file that actually starts the server.

## Step 8: Build the API

First, make sure shared is built:

```bash
pnpm build
```

Turbo will:

1. Build `@myapp/shared` first (because API depends on it)
2. Then build `@myapp/api`

You should see both packages build successfully!

## Step 9: Run Your API

Start the development server:

```bash
cd packages/api
pnpm dev
```

You should see:

```
API server running on http://localhost:3000
```

## Step 10: Test Your API

Open another terminal and test the endpoints:

```bash
# Test health endpoint
curl http://localhost:3000/health

# You should see:
# {"success":true,"message":"[MyApp] API is healthy","data":{"status":"ok","timestamp":"..."}}

# Test root endpoint
curl http://localhost:3000/

# Test getting users (empty array)
curl http://localhost:3000/api/users

# Create a user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com"}'

# Get all users (should show Alice)
curl http://localhost:3000/api/users
```

**It works!** 🎉

Notice how the responses use the format from `@myapp/shared`, and the user ID was generated by `generateId()` from shared!

## Understanding the Dependency Flow

Here's what happens when you import from `@myapp/shared`:

```
1. You write: import { formatMessage } from '@myapp/shared'
2. TypeScript looks at tsconfig references
3. Finds @myapp/shared in packages/shared
4. Uses the built code from packages/shared/dist
5. Provides type checking and autocomplete!
```

No publishing to npm, no manual linking - it just works!

## Add Tests

Create `packages/api/tests/server.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { createServer } from "../src/server.js";

describe("Server", () => {
  it("should create express server", () => {
    const server = createServer();
    expect(server).toBeDefined();
  });

  it("should have health endpoint", () => {
    const server = createServer();
    const routes = server._router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => layer.route.path);

    expect(routes).toContain("/health");
  });
});
```

Create `packages/api/vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
});
```

Run tests:

```bash
pnpm test
```

All tests should pass!

## What We've Accomplished

You've built a working API that:

✅ Imports and uses code from another package (`@myapp/shared`)
✅ Has RESTful endpoints (GET, POST)
✅ Uses TypeScript for type safety
✅ Returns consistent responses
✅ Can run in development mode with hot reload
✅ Has tests

## Try It Yourself: Add a Delete Endpoint

Practice by adding a delete endpoint:

1. Add to `packages/api/src/routes/index.ts`:

```typescript
router.delete("/users/:id", (req: Request, res: Response) => {
  const index = users.findIndex((u) => u.id === req.params.id);

  if (index === -1) {
    const response: ApiResponse = {
      success: false,
      error: "User not found",
    };
    res.status(404).json(response);
    return;
  }

  users.splice(index, 1);

  const response: ApiResponse = {
    success: true,
    message: "User deleted successfully",
  };
  res.json(response);
});
```

2. Test it:

```bash
# Create a user first
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob","email":"bob@example.com"}'

# Note the ID from the response, then delete:
curl -X DELETE http://localhost:3000/api/users/[USER_ID]
```

## Understanding Workspace Dependencies

The `"workspace:*"` protocol in package.json is special:

- **Development:** Points to the local package (always latest)
- **Publishing:** Gets replaced with the actual version
- **Benefits:** No need to rebuild shared every time, instant updates

## Common Issues and Solutions

**Issue:** `Cannot find module '@myapp/shared'`
**Solution:**

1. Make sure you ran `pnpm install` at the root
2. Build the shared package first: `pnpm --filter @myapp/shared build`

**Issue:** TypeScript errors about missing types
**Solution:** Check that `tsconfig.json` has the `references` array

**Issue:** Port 3000 already in use
**Solution:** Use a different port: `PORT=3001 pnpm dev`

## Monorepo Benefits in Action

Notice how easy it was to:

- Import types from shared package
- Get autocomplete for shared functions
- Change shared package and have API automatically use updates
- Test everything together

With separate repos, you'd need to:

- Publish shared to npm
- Update version in API
- Reinstall dependencies
- Much more complex!

## Summary

You've learned:

1. How to create a package that depends on another package
2. How to use workspace dependencies (`workspace:*`)
3. How to build an Express API with TypeScript
4. How to structure routes and endpoints
5. How TypeScript project references work
6. How to test your API

**Next:** [Part 4 - Building the CLI →](04-building-the-cli.md)

In the next tutorial, we'll build a terminal application using Ink (React for the CLI). It will also import from `@myapp/shared`, completing our monorepo trio!
