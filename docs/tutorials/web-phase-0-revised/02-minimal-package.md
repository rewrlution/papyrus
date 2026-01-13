# 02: Minimal Package Config

Install ONLY the essentials to get Next.js running.

## Goal

Create `package.json` with absolute minimum dependencies. Add more in Phase 1.

## The Minimal package.json

Create `packages/web/package.json`:

```json
{
  "name": "@rewrlution/papyrus-web",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^15.1.4",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.5",
    "@types/react": "^19.0.6",
    "@types/react-dom": "^19.0.2",
    "typescript": "^5.7.3"
  }
}
```

## What We're Installing

**Production dependencies (3):**
- `next` - Next.js framework
- `react` - React library
- `react-dom` - React DOM renderer

**Dev dependencies (4):**
- `@types/node` - Node.js type definitions
- `@types/react` - React type definitions
- `@types/react-dom` - React DOM type definitions
- `typescript` - TypeScript compiler

**Total: 7 packages** (vs 20+ in old Phase 0!)

## What We're NOT Installing

### ❌ Tailwind CSS
**Why skip:** We don't need styling yet. Add in Phase 1 when we build actual UI.

### ❌ ESLint / Prettier
**Why skip:** Already configured at monorepo root. Use `pnpm lint` and `pnpm format` from root.

### ❌ shadcn/ui dependencies
**Why skip:** Don't need UI components yet. Add in Phase 1 when building sections.

### ❌ Fonts (geist)
**Why skip:** Default fonts work fine for now. Add in Phase 1 for better typography.

### ❌ Icons (lucide-react)
**Why skip:** No UI elements yet that need icons. Add in Phase 1.

### ❌ Utilities (clsx, tailwind-merge)
**Why skip:** These are for Tailwind class merging. We don't have Tailwind yet.

## Scripts Explanation

```json
"dev": "next dev"          // Start development server
"build": "next build"      // Build for production
"start": "next start"      // Preview production build
```

**Why no lint/format scripts:**
- Use monorepo's scripts instead: `pnpm lint`, `pnpm format` from root
- Avoids duplication
- Consistent config across packages

## Verification

Check your `package.json`:
- Only 3 production dependencies
- Only 4 dev dependencies
- Only 3 scripts
- Uses monorepo's ESLint/Prettier

## Next

→ [03: TypeScript Config](./03-typescript-config.md) - Configure TypeScript for Next.js
