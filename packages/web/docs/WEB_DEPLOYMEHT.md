# 08: Build & Deploy

Build for production and deploy to Vercel.

## Goal

Get your site live on the internet with automated deployments.

## Part 1: Build Locally

### Step 1: Build for Production

From `packages/web`:

```bash
pnpm build
```

**What happens:**

- TypeScript compiles to JavaScript
- React components bundle
- Static HTML pages generate
- Output goes to `.next/` directory

**Expected output:**

```
▲ Next.js 15.1.4

Creating an optimized production build ...
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (2/2)
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    137 B          87.2 kB
└ ○ /_not-found                          871 B          86.9 kB
○  (Static)  prerendered as static content

✓ Built in 5s
```

### Step 2: Test Production Build

```bash
pnpm start
```

Open `http://localhost:3000` - should look identical to dev server but optimized.

Press `Ctrl+C` to stop.

## Part 2: Deploy to Vercel

### Step 1: Sign Up

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Choose "Continue with GitHub"
4. Authorize Vercel

### Step 2: Import Repository

1. Click "Add New Project"
2. Find your `papyrus` repository
3. Click "Import"

### Step 3: Configure Project

**Framework Preset:** Next.js (auto-detected)

**Root Directory:**

```
packages/web
```

**Build Command:**

```bash
cd ../.. && pnpm install && pnpm build --filter=@rewrlution/papyrus-web
```

**Output Directory:**

```
packages/web/.next
```

**Install Command:** Override with:

```bash
pnpm install
```

### Step 4: Deploy

1. Click "Deploy"
2. Wait 2-3 minutes
3. Vercel will:
   - Install dependencies
   - Build your site
   - Deploy to CDN
   - Generate URL like `papyrus-web-abc123.vercel.app`

### Step 5: Verify Deployment

1. Click the deployment URL
2. Should see your site live!
3. Test on mobile (responsive by default)

## Part 3: Auto-Deployment

**Already configured!** Vercel automatically:

- Deploys `main` branch to production
- Deploys other branches to preview URLs
- Deploys pull requests to preview URLs
- Shows build status in GitHub

### Test Auto-Deploy

1. Make a small change to `app/page.tsx`:

   ```typescript
   <p>Deployed automatically! 🚀</p>
   ```

2. Commit and push:

   ```bash
   git add packages/web
   git commit -m "feat(web): test auto-deploy"
   git push
   ```

3. Check Vercel dashboard - new deployment starts automatically

4. Visit production URL when done - see your changes live!

## Troubleshooting

### Build fails on Vercel

**Check build logs:**

1. Go to Vercel project
2. Click failed deployment
3. Read "Build Logs" tab

**Common fixes:**

- TypeScript errors: Fix locally with `npx tsc --noEmit`
- Missing dependencies: Check `package.json`
- Build command wrong: Verify command in Vercel settings

### "Cannot find module"

**Fix:** Verify `package.json` has all dependencies:

```bash
# From packages/web
pnpm install
pnpm build
```

If builds locally but fails on Vercel, check Node.js version:

```json
// Add to package.json
"engines": {
  "node": ">=20.0.0"
}
```

## Success Criteria

✅ Local build succeeds
✅ Production build previews correctly
✅ Deployed to Vercel successfully
✅ Live URL loads your site
✅ Auto-deployment works on git push

## Update Monorepo Config

Update `turbo.json` at monorepo root:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

**Why:** Tells Turborepo to cache `.next/` build output.

## Phase 0 Complete! 🎉

You now have:

- ✅ Live Next.js website
- ✅ Working CI/CD pipeline
- ✅ Minimal dependencies (only 7 packages)
- ✅ Clean foundation

**What's NOT included yet:**

- ❌ Styling (Tailwind)
- ❌ Components (shadcn/ui)
- ❌ Fonts
- ❌ Icons
- ❌ Marketing content

## Next

→ **[Phase 1 Revised](../web-phase-1-revised/00-INDEX.md)** - Add styling and content progressively!
