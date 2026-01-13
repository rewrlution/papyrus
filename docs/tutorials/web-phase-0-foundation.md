# Phase 0: Foundation & Deploy Pipeline

Building the minimal infrastructure to get a Next.js website live.

## What We're Building

**Goal:** Get a basic Next.js 15 website running and deployed to Vercel with automated CI/CD.

**What problem does this solve?**
- Establish a working deployment pipeline immediately
- Validate that our setup works end-to-end
- Create a foundation to build upon in Phase 1

**Expected outcome:**
- Live URL with a basic "Hello World" page
- Working CI/CD pipeline (GitHub → Vercel)
- Next.js 15 app integrated into the monorepo
- Ready to add styling and content (Phase 1)

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub Repository                     │
│                  rewrlution/papyrus                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ (git push)
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    Vercel Platform                       │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Build Process                                    │  │
│  │  1. pnpm install                                  │  │
│  │  2. pnpm build --filter=@rewrlution/papyrus-web  │  │
│  │  3. Static export (.next folder)                 │  │
│  └───────────────────────────────────────────────────┘  │
│                     │                                    │
│                     ▼                                    │
│  ┌───────────────────────────────────────────────────┐  │
│  │  CDN (Global Distribution)                        │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
              ┌─────────────┐
              │   Browser   │
              │   (Users)   │
              └─────────────┘

Monorepo Structure:
├── packages/
│   ├── cli/              # Existing CLI
│   ├── api/              # Existing API
│   ├── shared/           # Existing shared code
│   └── web/              # NEW: Marketing website
│       ├── app/
│       │   ├── layout.tsx       # Root layout
│       │   └── page.tsx         # Home page
│       ├── public/              # Static assets
│       ├── package.json
│       ├── tsconfig.json
│       └── next.config.js
```

**Why this architecture:**
- **Next.js App Router** - Modern React framework with static export
- **Monorepo integration** - Will share types/utils with CLI and API in future
- **Vercel deployment** - Zero-config, fast CDN, preview URLs
- **Static export** - Fast, cheap, secure (no server needed)

**Trade-offs considered:**
- Static vs SSR: Static is faster and cheaper (good for marketing site)
- Vercel vs Cloudflare Pages: Vercel has better Next.js integration

---

## Prerequisites

**Required:**
- Node.js 20+ installed
- pnpm 10+ installed (`npm install -g pnpm`)
- Git configured
- GitHub account
- Vercel account (free tier) - Sign up at [vercel.com](https://vercel.com)

**Assumed knowledge:**
- Basic TypeScript
- Basic React (functional components)
- Basic git commands
- Terminal/command line usage

**Repository:**
- Clone the Papyrus monorepo
- Familiarity with the existing structure (see `/CLAUDE.md`)

---

## Implementation

### Step 1: Create the Web Package Directory

**Goal:** Set up the basic directory structure for the new web package.

From monorepo root:

```bash
# Navigate to packages directory
cd packages

# Create web package directory
mkdir web

# Navigate into it
cd web

# Create basic structure
mkdir app public
```

**Why this structure:**
- `app/` - Next.js App Router directory (Next.js 15 standard)
- `public/` - Static assets (images, fonts, etc.)
- Lives in `packages/` alongside cli, api, shared (monorepo pattern)

---

### Step 2: Create Minimal package.json

**Goal:** Define only the essential dependencies to get Next.js working.

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

**Why these dependencies:**
- **next, react, react-dom** - Core framework (minimum required)
- **TypeScript types** - For type checking
- **That's it!** No styling, no UI libraries, no extras yet

**Why NOT include:**
- ❌ Tailwind CSS - Don't need styling yet
- ❌ ESLint/Prettier - Already configured at monorepo root
- ❌ UI libraries - Will add in Phase 1 when needed
- ❌ Format/lint scripts - Use monorepo scripts instead

---

### Step 3: Configure TypeScript

**Goal:** Extend the monorepo TypeScript config with Next.js-specific settings.

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

**Why this configuration:**
- **Extends monorepo base** - Inherits shared TypeScript settings
- **Next.js plugin** - Better type inference for Next.js features
- **Path alias `@/*`** - Cleaner imports (`@/app/...` instead of `../../app/...`)
- **Minimal overrides** - Only what Next.js requires

**Why NOT include:**
- ❌ Project references to `shared` - Will add when we actually use shared types
- ❌ Complex path mappings - Keep it simple for now

---

### Step 4: Configure Next.js

**Goal:** Set up Next.js for static export and monorepo compatibility.

Create `packages/web/next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  images: {
    unoptimized: true, // Required for static export
  },
}

module.exports = nextConfig
```

**Why this configuration:**
- **`output: 'export'`** - Generate static HTML/CSS/JS (no server needed)
- **`reactStrictMode`** - Catch common bugs during development
- **`images.unoptimized`** - Required for static export (no server for image optimization)
- **Minimal** - Only what we need right now

**Why NOT include:**
- ❌ `transpilePackages` - Will add when we use shared package
- ❌ Environment variables - None needed yet
- ❌ Redirects/rewrites - No routing yet

---

### Step 5: Create Root Layout

**Goal:** Set up the root layout (required by Next.js App Router).

Create `packages/web/app/layout.tsx`:

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Papyrus - AI-Powered Journaling for Developers",
  description: "Journal like you code. Capture your thoughts right in your terminal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

**Why this approach:**
- **Metadata** - Basic SEO (title and description)
- **Minimal HTML** - Just html, body, and children
- **No styling** - Will add in Phase 1

**Why NOT include:**
- ❌ Custom fonts - Don't need yet
- ❌ CSS imports - No styles yet
- ❌ Dark mode classes - Will add with Tailwind in Phase 1

---

### Step 6: Create Basic Home Page

**Goal:** Create a simple landing page to verify the setup works.

Create `packages/web/app/page.tsx`:

```typescript
export default function Home() {
  return (
    <main>
      <h1>PAPYRUS</h1>
      <p>AI-Powered Journaling for Developers</p>
      <p>Journal like you code. Right in your terminal.</p>
      <code>npm install -g @rewrlution/papyrus-cli</code>
    </main>
  );
}
```

**Why this page:**
- **Simple HTML** - No fancy styling yet
- **Key message** - Value proposition clearly stated
- **Install command** - Primary call-to-action
- **Verifies setup** - If this loads, Next.js is working

**Why NOT include:**
- ❌ Complex layout - Keep it simple
- ❌ ASCII art logo - Will add in Phase 1
- ❌ Styled components - No styling yet

---

### Step 7: Install Dependencies

**Goal:** Install npm packages for the entire monorepo.

From the monorepo root:

```bash
cd /path/to/papyrus

# Install dependencies for entire monorepo
pnpm install
```

**Why from root:**
- pnpm workspaces handles all packages together
- Links packages automatically (cli, api, shared, web)
- Installs all dependencies efficiently

**Expected output:**
```
Progress: resolved X, reused Y, downloaded Z, added N
Done in Xs
```

---

### Step 8: Test Local Development

**Goal:** Verify the dev server works.

From the web package:

```bash
cd packages/web
pnpm dev
```

Open your browser to `http://localhost:3000`

**You should see:**
- "PAPYRUS" heading
- "AI-Powered Journaling for Developers" text
- Install command
- Plain HTML (no styling)

**Test checklist:**
- [ ] Page loads without errors
- [ ] Text is visible
- [ ] No console errors in browser DevTools
- [ ] Fast page load

**If it fails:**
- Check that all files are created in correct locations
- Verify package.json syntax is valid JSON
- Run `pnpm install` again from root
- Check Node.js version is 20+

Press `Ctrl+C` to stop the dev server.

---

### Step 9: Build for Production

**Goal:** Verify static export works.

From the web package:

```bash
cd packages/web
pnpm build
```

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
○  (Static) prerendered as static content

✓ Built in Xs
```

**What this does:**
1. Compiles TypeScript to JavaScript
2. Bundles React components
3. Generates static HTML files
4. Outputs to `.next` directory

**If build fails:**
- Check for TypeScript errors: `npx tsc --noEmit`
- Verify all imports are correct
- Check that files exist at specified paths

---

### Step 10: Update Monorepo Configuration

**Goal:** Integrate web package into the monorepo build system.

Update `turbo.json` at monorepo root to include `.next/**` in build outputs:

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
    },
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

**Why this change:**
- Turborepo caches the `.next` build output
- Skips rebuilding if nothing changed
- Faster CI/CD builds

Update root `package.json` to add web shortcuts (optional):

```json
{
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev --parallel",
    "test": "turbo run test",
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write \"**/*.{ts,tsx,json,md}\"",
    "web:dev": "pnpm --filter=@rewrlution/papyrus-web dev",
    "web:build": "pnpm --filter=@rewrlution/papyrus-web build"
  }
}
```

**Why add shortcuts:**
- `pnpm web:dev` is easier than `cd packages/web && pnpm dev`
- Consistent with monorepo patterns
- Optional convenience

---

### Step 11: Deploy to Vercel

**Goal:** Get the site live with automated deployments.

#### A. Connect Repository to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New Project"
4. Import your `rewrlution/papyrus` repository
5. Configure project:
   - **Framework Preset:** Next.js
   - **Root Directory:** `packages/web`
   - **Build Command:** `cd ../.. && pnpm install && pnpm build --filter=@rewrlution/papyrus-web`
   - **Output Directory:** `packages/web/.next`
   - **Install Command:** Override with `pnpm install`

6. Click "Deploy"

#### B. Wait for First Deploy

Vercel will:
- Install dependencies
- Build the site
- Deploy to CDN
- Generate a URL like `papyrus-web-abc123.vercel.app`

First deploy takes 2-3 minutes.

**Watch the build logs:**
- Check for errors
- Verify build completes successfully
- Note the preview URL

#### C. Verify Deployment

Once deployed:
- Click the deployment URL
- Verify the page loads
- Check that it matches your local build
- Test on mobile (should be responsive by default)

**Deployment checklist:**
- [ ] Site loads successfully
- [ ] All text is visible
- [ ] No errors in browser console
- [ ] Page loads fast (<2 seconds)

#### D. Configure Custom Domain (Optional)

If you have a domain:
1. Go to Project Settings → Domains
2. Add your domain (e.g., `papyrus.dev`)
3. Follow DNS instructions from Vercel
4. Wait for SSL certificate (automatic, ~30 seconds)

---

### Step 12: Verify Auto-Deploy Works

**Goal:** Ensure continuous deployment is working.

**Good news:** This is already configured! Vercel automatically:
- Deploys `main` branch to production
- Deploys other branches to preview URLs
- Deploys PRs to preview URLs
- Shows build status in GitHub

**To test auto-deploy:**

1. Make a small change to `packages/web/app/page.tsx`:
   ```typescript
   <p>Phase 0 Complete ✓</p>
   ```

2. Commit and push:
   ```bash
   git add packages/web
   git commit -m "feat(web): verify auto-deploy"
   git push
   ```

3. Check Vercel dashboard:
   - New deployment should start automatically
   - Watch build logs
   - Click preview URL when ready

4. Verify the change is live

---

## Testing

### Manual Testing Checklist

**Local Development:**
- [ ] `pnpm dev` starts server without errors
- [ ] `http://localhost:3000` loads the page
- [ ] Text is readable
- [ ] No console errors in browser DevTools

**Build:**
- [ ] `pnpm build` completes successfully
- [ ] No TypeScript errors
- [ ] `.next` directory is created
- [ ] Build output shows static pages generated

**Deployment:**
- [ ] Vercel dashboard shows successful deploy
- [ ] Production URL loads correctly
- [ ] Page loads fast (<2 seconds)
- [ ] Auto-deploy works (push triggers new deployment)

**Monorepo:**
- [ ] `pnpm install` from root installs all packages
- [ ] `pnpm web:dev` shortcut works (if added)
- [ ] No conflicts with other packages (cli, api, shared)

---

## Common Issues

### Issue: "Cannot find module 'next'"

**Why it happens:**
Dependencies not installed or pnpm workspace not recognized.

**Solution:**
```bash
# From monorepo root
pnpm install

# Verify web package has node_modules
ls packages/web/node_modules/next
```

---

### Issue: "Module not found: Can't resolve '@/...'"

**Why it happens:**
TypeScript path alias not configured correctly.

**Solution:**
Verify `tsconfig.json` has:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

Restart dev server after changing tsconfig.

---

### Issue: Build succeeds locally but fails on Vercel

**Why it happens:**
Different Node.js version or missing environment variables.

**Solution:**
1. Check Vercel build logs for specific error
2. Match Node.js version (add to `package.json`):
   ```json
   "engines": {
     "node": ">=20.0.0"
   }
   ```
3. Verify build command is correct in Vercel settings
4. Check that all file paths are case-sensitive (Linux vs Windows)

---

### Issue: "Module build failed" or TypeScript errors during build

**Why it happens:**
TypeScript configuration mismatch or missing types.

**Solution:**
```bash
# Check TypeScript errors
npx tsc --noEmit

# Verify extends path is correct
cat tsconfig.json | grep extends

# Should show: "extends": "../../tsconfig.base.json"
```

---

## What We Accomplished

Phase 0 is complete! You now have:
- ✅ Minimal Next.js 15 app with App Router
- ✅ TypeScript configured (extends monorepo base)
- ✅ Working CI/CD pipeline (GitHub → Vercel)
- ✅ Live production URL
- ✅ No unnecessary dependencies
- ✅ Clean, simple foundation

**What's NOT included yet (by design):**
- ❌ Tailwind CSS or any styling (Phase 1)
- ❌ UI component libraries (Phase 1)
- ❌ Custom fonts (Phase 1)
- ❌ Icons (Phase 1)
- ❌ Complex layouts (Phase 1)

---

## Next Steps

**Phase 1: MVP Content** - Add styling and marketing content progressively

In Phase 1, we'll add features one at a time:
1. Install Tailwind CSS (when we need styling)
2. Add terminal color palette (when we want dark theme)
3. Install Geist fonts (when we want nice typography)
4. Add shadcn/ui components (when we need specific UI elements)
5. Build Hero section
6. Build Features grid
7. Build Quick Start guide
8. Build Footer

Each addition is motivated by a specific need!

See tutorial: `docs/tutorials/web-phase-1-mvp-content.md`

---

## References

### Official Documentation
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Vercel Deployment](https://vercel.com/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)

### Related Papyrus Docs
- Main README: `/CLAUDE.md`
- Development plan: `/docs/WEB_DEVELOPMENT_PLAN.md`
- Tutor principles: `/docs/TUTOR-PRINCIPLES.md`

---

**Congratulations!** You've completed Phase 0. The foundation is minimal, clean, and deployed.

Move on to **Phase 1** to add styling and marketing content progressively.
