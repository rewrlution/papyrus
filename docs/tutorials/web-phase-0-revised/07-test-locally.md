# 07: Test Locally

Install dependencies and run the development server.

## Goal

Verify everything works locally before deploying.

## Step 1: Install Dependencies

From monorepo root:

```bash
cd /path/to/papyrus
pnpm install
```

**What happens:**
- pnpm reads `packages/web/package.json`
- Installs Next.js, React, TypeScript
- Links all monorepo packages
- Creates `node_modules` in root and `packages/web`

**Expected output:**
```
Progress: resolved 150, reused 140, downloaded 10, added 150
Done in 15s
```

## Step 2: Start Dev Server

From web package:

```bash
cd packages/web
pnpm dev
```

**What happens:**
- Next.js starts development server
- Compiles TypeScript
- Watches for file changes
- Opens on port 3000

**Expected output:**
```
▲ Next.js 15.1.4
- Local:        http://localhost:3000

✓ Ready in 2s
```

## Step 3: Open in Browser

Open `http://localhost:3000`

**You should see:**
- "PAPYRUS" heading
- "AI-Powered Journaling for Developers" text
- "Journal like you code..." text
- Install command
- **Plain HTML** (no styling)

## Step 4: Verify Hot Reload

Edit `app/page.tsx`:
```typescript
<p>Phase 0 Complete ✓</p>
```

Save the file. Browser should automatically reload showing the change.

## Step 5: Check for Errors

Open browser DevTools (F12):
- **Console tab:** Should have no errors
- **Network tab:** Page should load fast (<500ms)

## Troubleshooting

### Port 3000 already in use

```bash
# Use different port
pnpm dev -- --port 3001
```

### Cannot find module 'next'

```bash
# From monorepo root
pnpm install

# Verify node_modules exists
ls packages/web/node_modules/next
```

### TypeScript errors

```bash
# Check specific errors
npx tsc --noEmit

# Common fix: restart TypeScript server in VS Code
# Cmd+Shift+P → "TypeScript: Restart TS Server"
```

## Success Criteria

✅ Dev server starts without errors
✅ Page loads at `http://localhost:3000`
✅ Text is visible (unstyled)
✅ Hot reload works
✅ No console errors

## Stop Server

Press `Ctrl+C` in terminal to stop the dev server.

## Next

→ [08: Build & Deploy](./08-build-deploy.md) - Build for production and deploy to Vercel
