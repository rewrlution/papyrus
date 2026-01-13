# Phase 0.3: TypeScript Configuration

Set up TypeScript for Next.js with monorepo integration and path aliases.

## What We're Building

**Goal:** Configure TypeScript to work seamlessly with Next.js 15, enable strict type checking, and set up path aliases for clean imports.

**Why:** TypeScript catches errors before runtime, improves code navigation, and provides autocomplete. Proper configuration is essential for a good developer experience.

**What you'll learn:**
- How TypeScript integrates with Next.js
- Why we extend the base monorepo config
- What each compiler option does
- How path aliases simplify imports

---

## Prerequisites

- Completed [02-package-config.md](./02-package-config.md)
- `packages/web/` directory exists
- Dependencies installed (`pnpm install` from monorepo root)

---

## Understanding TypeScript in Next.js

Next.js has **built-in TypeScript support**. When you add a `tsconfig.json` file, Next.js automatically:

1. **Generates type definitions** for routes and pages
2. **Enables incremental compilation** for faster builds
3. **Provides type checking** in development
4. **Validates component props** in React Server Components

### Monorepo TypeScript Architecture

```
papyrus/
├── tsconfig.base.json           # Base config (shared rules)
└── packages/
    ├── shared/
    │   └── tsconfig.json        # Extends base
    ├── cli/
    │   └── tsconfig.json        # Extends base
    └── web/
        └── tsconfig.json        # Extends base + Next.js
```

**Why this structure:**
- **DRY principle:** Common rules in `tsconfig.base.json`
- **Package-specific settings:** Each package can override as needed
- **Type references:** Packages can reference types from other packages
- **Incremental builds:** TypeScript only rebuilds changed packages

**Alternative approaches:**
- Single `tsconfig.json` at root: Doesn't work well for packages with different targets (Node vs Browser)
- Separate configs with duplicated rules: Hard to maintain consistency
- No base config: Lots of duplication across packages

---

## Implementation

### Step 1: Create TypeScript Configuration

Navigate to the web package:

```bash
cd packages/web
```

Create `tsconfig.json`:

```bash
touch tsconfig.json
```

Add the following configuration:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "incremental": true,
    "isolatedModules": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/app/*": ["./app/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    ".next",
    "out"
  ],
  "references": [
    {
      "path": "../shared"
    }
  ]
}
```

**File location:** `/home/user/papyrus/packages/web/tsconfig.json`

---

## Understanding the Configuration

Let's break down each section and explain why it's needed.

### Extending Base Configuration

```json
"extends": "../../tsconfig.base.json"
```

**What it does:** Inherits common TypeScript rules from the monorepo base config.

**Why:** Keeps configuration DRY (Don't Repeat Yourself). All packages share the same base rules for consistency.

**What's inherited:**
- `strictNullChecks: true` - Prevents null/undefined errors
- `noUnusedLocals: true` - Warns about unused variables
- `noImplicitReturns: true` - Ensures all code paths return a value
- And other strict type-checking rules

### Compiler Options Explained

#### Target and Library

```json
"target": "ES2022",
"lib": ["ES2023", "DOM", "DOM.Iterable"]
```

**Target:** The JavaScript version to compile to. `ES2022` is well-supported in modern browsers.

**Lib:** Type definitions to include:
- `ES2023` - Latest JavaScript features (Promise, Array methods)
- `DOM` - Browser APIs (document, window, fetch)
- `DOM.Iterable` - Iterable DOM collections (NodeList, etc.)

**Why ES2022:** Next.js transpiles code with SWC (Rust-based compiler), so we can use modern syntax. The target doesn't affect the actual output (Next.js handles that).

#### JSX Configuration

```json
"jsx": "preserve"
```

**What it does:** Keeps JSX syntax as-is during TypeScript compilation.

**Why:** Next.js's SWC compiler handles JSX transformation. TypeScript only checks types, not transforms.

**Alternatives:**
- `"jsx": "react"` - Transforms to `React.createElement()` calls (old approach)
- `"jsx": "react-jsx"` - Transforms to new JSX runtime (React 17+)
- `"jsx": "preserve"` - **Our choice** (Next.js handles it)

#### Module System

```json
"module": "ESNext",
"moduleResolution": "Bundler"
```

**Module:** Use the latest ES module syntax (`import`/`export`).

**ModuleResolution:** How TypeScript finds imported modules.
- `Node` - Classic Node.js resolution (looks in node_modules)
- `Bundler` - **Modern approach** for bundlers (Webpack, Vite, SWC)

**Why Bundler:** Next.js uses a bundler (Turbopack/Webpack), so we use bundler resolution. This supports:
- Importing `.ts` files without extensions
- Package exports maps
- Conditional exports (import vs require)

#### Type Checking Settings

```json
"strict": true,
"noEmit": true,
"isolatedModules": true
```

**strict:** Enables all strict type-checking options. This includes:
- `strictNullChecks` - Can't assign null/undefined unless explicitly allowed
- `strictFunctionTypes` - Stricter function parameter checking
- `strictBindCallApply` - Type-safe bind/call/apply
- `noImplicitAny` - Must specify types (no implicit `any`)

**noEmit:** Don't output JavaScript files. Next.js handles compilation, TypeScript only checks types.

**isolatedModules:** Each file must be compilable independently. Required for SWC and Babel.

**Why strict mode:** Catches bugs early. Examples:

```typescript
// Without strict mode (dangerous)
function getName(user) {
  return user.name; // What if user is null?
}

// With strict mode (safe)
function getName(user: User | null) {
  return user?.name ?? "Unknown"; // Explicit null handling
}
```

#### Performance Options

```json
"skipLibCheck": true,
"incremental": true
```

**skipLibCheck:** Skip type checking of `.d.ts` files (type definitions).

**Why:** Dramatically speeds up compilation. We trust that published libraries have correct types.

**incremental:** Cache type information between builds.

**Why:** Makes subsequent builds much faster (only re-checks changed files).

#### Next.js Plugin

```json
"plugins": [
  {
    "name": "next"
  }
]
```

**What it does:** Enables Next.js TypeScript plugin for enhanced editor support.

**Features:**
- Autocomplete for page/layout exports
- Type checking for route parameters
- Validation of metadata exports
- Server/Client component rules

**Why:** Better DX (developer experience) in VS Code and other editors.

### Path Aliases

```json
"baseUrl": ".",
"paths": {
  "@/*": ["./*"],
  "@/components/*": ["./components/*"],
  "@/lib/*": ["./lib/*"],
  "@/app/*": ["./app/*"]
}
```

**What it does:** Allows clean imports using `@/` prefix instead of relative paths.

**Before (relative paths):**
```typescript
import { Button } from '../../../components/ui/button';
import { cn } from '../../lib/utils';
```

**After (path aliases):**
```typescript
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
```

**Why this is better:**
- ✅ Easier to move files (imports don't break)
- ✅ More readable (clear where imports come from)
- ✅ Shorter paths
- ✅ Works across any file depth

**Alias meanings:**
- `@/*` - Root of web package (wildcard for any file)
- `@/components/*` - All components
- `@/lib/*` - Utility functions
- `@/app/*` - App Router files (pages, layouts)

### Include and Exclude

```json
"include": [
  "next-env.d.ts",
  "**/*.ts",
  "**/*.tsx",
  ".next/types/**/*.ts"
],
"exclude": [
  "node_modules",
  ".next",
  "out"
]
```

**include:** Files to type-check
- `next-env.d.ts` - Next.js type definitions (auto-generated)
- `**/*.ts` - All TypeScript files
- `**/*.tsx` - All React TypeScript files
- `.next/types/**/*.ts` - Next.js generated types

**exclude:** Files to ignore
- `node_modules` - Third-party packages
- `.next` - Next.js build output
- `out` - Static export output

**Why:** Avoid type-checking unnecessary files (speeds up compilation).

### Project References

```json
"references": [
  {
    "path": "../shared"
  }
]
```

**What it does:** Tells TypeScript this package depends on the `shared` package.

**Why:** Enables cross-package type checking and jump-to-definition in editors.

**Benefits:**
- Import types from `@rewrlution/papyrus-shared`
- Editor autocomplete works across packages
- Incremental builds (only rebuild changed packages)
- Type safety across the monorepo

**Example usage:**
```typescript
// In packages/web/app/page.tsx
import { DateStringSchema } from '@rewrlution/papyrus-shared';

const date = DateStringSchema.parse('2025-01-13');
```

---

## Step 2: Create Next.js Environment Types

Next.js auto-generates type definitions. Create a placeholder:

```bash
touch next-env.d.ts
```

Add this content:

```typescript
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.
```

**File location:** `/home/user/papyrus/packages/web/next-env.d.ts`

**What it does:** References Next.js type definitions.

**Why:** Next.js will manage this file automatically. Don't edit it manually.

**What gets generated:**
- Types for `next/image`
- Types for `next/link`
- Types for route parameters
- Types for metadata exports

---

## Step 3: Verify Configuration

Test the TypeScript configuration:

```bash
# From packages/web/
npx tsc --noEmit
```

**Expected output:**
```
# No output = success!
# TypeScript found no errors
```

If you see errors about missing files, that's fine (we haven't created components yet).

**What this command does:**
- `tsc` - TypeScript compiler
- `--noEmit` - Don't output files, just check types

---

## Testing the Configuration

### Test 1: Path Aliases

Create a test utility file:

```bash
mkdir -p lib
echo "export const test = 'hello';" > lib/test.ts
```

Create a test component:

```bash
mkdir -p components
cat > components/TestComponent.tsx << 'EOF'
import { test } from '@/lib/test';

export function TestComponent() {
  return <div>{test}</div>;
}
EOF
```

Run type check:

```bash
npx tsc --noEmit
```

**Expected:** No errors. The `@/lib/test` import resolves correctly.

**Clean up:**
```bash
rm -rf lib/test.ts components/TestComponent.tsx
```

### Test 2: Strict Mode

Create a file with a type error:

```bash
cat > test-strict.ts << 'EOF'
function greet(name: string) {
  return name.toUpperCase();
}

// This should error (null not allowed)
greet(null);
EOF
```

Run type check:

```bash
npx tsc --noEmit test-strict.ts
```

**Expected output:**
```
test-strict.ts:6:7 - error TS2345: Argument of type 'null' is not assignable to parameter of type 'string'.

6 greet(null);
        ~~~~
```

**Clean up:**
```bash
rm test-strict.ts
```

**What this proves:** Strict mode is working. TypeScript caught the null error.

---

## Common Issues

### Issue 1: "Cannot find module '@/lib/utils'"

**Cause:** Path aliases not configured correctly or baseUrl is wrong.

**Solution:**
1. Verify `baseUrl` is `"."` (current directory)
2. Verify `paths` includes `"@/*": ["./*"]`
3. Restart your editor (VS Code, etc.)

**Why it happens:** Editors cache TypeScript configuration. Restarting forces a refresh.

### Issue 2: "Cannot find name 'React'"

**Cause:** Next.js 13+ doesn't require importing React in components.

**Solution:** Remove `import React from 'react'` from files. Next.js auto-imports it.

**Why:** Next.js uses the new JSX transform (React 17+) which doesn't require React in scope.

### Issue 3: "Module not found: Can't resolve '../shared'"

**Cause:** Project reference is set but the `shared` package isn't built.

**Solution:**
```bash
# From monorepo root
cd packages/shared
pnpm build
```

**Why it happens:** TypeScript project references require the referenced package to be built first.

### Issue 4: Types not updating in editor

**Cause:** Editor hasn't reloaded TypeScript language server.

**Solution (VS Code):**
1. Open Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`)
2. Run "TypeScript: Restart TS Server"

**Alternative:** Reload the entire window (`Cmd+R` or `Ctrl+R`)

### Issue 5: "JSX element implicitly has type 'any'"

**Cause:** Missing `@types/react` or TypeScript can't find React types.

**Solution:**
```bash
pnpm install --save-dev @types/react @types/react-dom
```

**Why:** React is written in JavaScript. The `@types/react` package provides TypeScript definitions.

---

## TypeScript Best Practices for Next.js

### 1. Use Type Inference

```typescript
// Good: TypeScript infers the return type
function getTitle() {
  return "Papyrus - Developer Journaling";
}

// Unnecessary: Explicit return type
function getTitle(): string {
  return "Papyrus - Developer Journaling";
}
```

**When to add explicit types:**
- Public API functions
- Complex return types
- When inference is wrong

### 2. Use React.FC Sparingly

```typescript
// Good: Simple function component
export function Button({ label }: { label: string }) {
  return <button>{label}</button>;
}

// Okay: Using React.FC
export const Button: React.FC<{ label: string }> = ({ label }) => {
  return <button>{label}</button>;
};
```

**Why simple is better:**
- Less boilerplate
- Clearer function signature
- No implicit `children` prop

**When to use React.FC:**
- Team convention requires it
- Need to explicitly type `children`

### 3. Define Props Interfaces

```typescript
// Good: Separate interface
interface ButtonProps {
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  // ...
}
```

**Why:**
- Reusable type definition
- Can extend the interface
- Better documentation

### 4. Use Path Aliases

```typescript
// Good: Path alias
import { Button } from '@/components/ui/button';

// Bad: Relative path
import { Button } from '../../../components/ui/button';
```

**Always use `@/` prefix for imports within the web package.**

---

## Next Steps

Your TypeScript configuration is complete! Next tutorial:

**→ [04-nextjs-config.md](./04-nextjs-config.md)** - Configure Next.js for static export

**What's next:**
- Set up Next.js for static site generation
- Configure output mode
- Enable monorepo package transpilation

---

## Summary

**What we built:**
- TypeScript configuration extending monorepo base
- Path aliases for clean imports (`@/`)
- Next.js TypeScript plugin integration
- Project references to shared package
- Strict type checking enabled

**Key concepts:**
- `strict: true` catches bugs early
- `noEmit: true` because Next.js handles compilation
- Path aliases make imports cleaner
- Project references enable cross-package types

**Configuration highlights:**
```json
{
  "extends": "../../tsconfig.base.json",  // Inherit base rules
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]                       // Path aliases
    },
    "plugins": [{ "name": "next" }]       // Next.js plugin
  },
  "references": [{ "path": "../shared" }] // Monorepo integration
}
```

**Remember:**
- Always use `@/` for imports
- Restart editor after config changes
- Build `shared` package before using its types
- Let TypeScript infer types when possible

---

## References

- [Next.js TypeScript Documentation](https://nextjs.org/docs/basic-features/typescript)
- [TypeScript tsconfig Reference](https://www.typescriptlang.org/tsconfig)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [TypeScript Path Mapping](https://www.typescriptlang.org/docs/handbook/module-resolution.html#path-mapping)
