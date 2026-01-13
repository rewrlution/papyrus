# 01: Project Setup

Create the minimal directory structure for the web package.

## Goal

Set up basic folders - just what Next.js requires, nothing extra.

## Steps

### 1. Navigate to Monorepo Root

```bash
cd /path/to/papyrus
```

### 2. Create Web Package

```bash
mkdir -p packages/web
cd packages/web
```

### 3. Create Minimal Structure

```bash
# Only what we need right now
mkdir app
mkdir public
```

**Why only these two:**
- `app/` - Required by Next.js App Router
- `public/` - For static assets (optional but standard)

**Why NOT create components/, lib/, etc:**
- We'll create them in Phase 1 when we actually need them
- Keep it minimal for now

### 4. Create Placeholder Files

```bash
# App files (required by Next.js)
touch app/layout.tsx
touch app/page.tsx

# Config files (we'll fill these in next steps)
touch package.json
touch tsconfig.json
touch next.config.js
```

### 5. Verify Structure

```bash
ls -la
# Should show: app/, public/, package.json, tsconfig.json, next.config.js
```

## What We Have

```
packages/web/
├── app/
│   ├── layout.tsx
│   └── page.tsx
├── public/
├── package.json
├── tsconfig.json
└── next.config.js
```

**That's it!** Much simpler than the original Phase 0.

## Next

→ [02: Minimal Package Config](./02-minimal-package.md) - Install only essential dependencies
