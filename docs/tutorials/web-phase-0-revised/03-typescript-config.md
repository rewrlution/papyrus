# 03: TypeScript Config

Configure TypeScript to extend the monorepo base config.

## Goal

Set up TypeScript for Next.js with minimal configuration.

## Create tsconfig.json

Create `packages/web/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## Key Settings Explained

### `"extends": "../../tsconfig.base.json"`
Inherits settings from monorepo base config. Keeps config DRY.

### `"plugins": [{ "name": "next" }]`
Next.js TypeScript plugin for better type inference.

### `"paths": { "@/*": ["./*"] }`
Allows imports like `@/app/layout` instead of `../../app/layout`.

### `"jsx": "preserve"`
Lets Next.js handle JSX transformation (faster builds).

## What We're NOT Configuring

### ❌ Project References
```json
"references": [{ "path": "../shared" }]
```
**Why skip:** We're not using shared package types yet. Add later if needed.

### ❌ Complex Path Mappings
**Why skip:** Simple `@/*` is enough. Don't over-engineer.

## Verify Config

```bash
# Check TypeScript compiles (should have no errors)
npx tsc --noEmit
```

Expected: No errors (though files are empty, TypeScript should accept the config).

## Next

→ [04: Next.js Config](./04-nextjs-config.md) - Configure Next.js for static export
