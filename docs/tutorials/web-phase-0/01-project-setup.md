# Phase 0.1: Project Setup

Create the directory structure for the marketing website package.

## What We're Building

**Goal:** Set up the initial folder structure for the `packages/web` package in the Papyrus monorepo.

**Why:** A well-organized structure makes it easy to find files, follow Next.js conventions, and scale the project.

---

## Prerequisites

- Papyrus monorepo cloned locally
- Terminal open at monorepo root: `/home/user/papyrus`
- Basic understanding of monorepo structure (see `/CLAUDE.md`)

---

## Understanding the Structure

The web package follows Next.js 15 App Router conventions:

```
packages/web/
├── app/                 # Next.js App Router (routes and layouts)
│   ├── layout.tsx      # Root layout (wraps all pages)
│   ├── page.tsx        # Home page (/ route)
│   └── globals.css     # Global CSS + Tailwind
├── components/         # React components
│   ├── ui/            # shadcn/ui components (auto-generated)
│   ├── sections/      # Page sections (Hero, Features, etc.)
│   └── shared/        # Reusable components
├── lib/               # Utility functions
│   └── utils.ts      # Helper functions
├── public/            # Static assets (images, fonts)
│   └── assets/       # Organized assets
└── [config files]    # TypeScript, Next.js, Tailwind configs
```

**Why this structure:**
- `app/` - Next.js 15 App Router convention (required)
- `components/ui/` - shadcn/ui copies components here (you own the code)
- `components/sections/` - Page sections for easy composition
- `components/shared/` - Reusable components across sections
- `lib/` - Pure JavaScript/TypeScript utilities
- `public/` - Static files served from root URL

**Alternative structures considered:**
- `src/` folder: Not using it (Next.js 13+ prefers root-level `app/`)
- `styles/` folder: Not needed (using `app/globals.css`)
- `pages/` folder: Old Next.js router (we're using App Router)

---

## Implementation

### Step 1: Navigate to Monorepo Root

```bash
cd /home/user/papyrus
```

Verify you're in the correct location:
```bash
pwd
# Should output: /home/user/papyrus

ls packages/
# Should show: cli  api  shared
```

### Step 2: Create Web Package Directory

```bash
mkdir -p packages/web
cd packages/web
```

**What `-p` does:** Creates parent directories if they don't exist (safe to run multiple times).

### Step 3: Create App Directory Structure

```bash
# Create app directory (Next.js App Router)
mkdir -p app
```

The `app/` directory is where Next.js looks for:
- **Routes:** Files named `page.tsx` become routes
- **Layouts:** Files named `layout.tsx` wrap pages
- **Special files:** `loading.tsx`, `error.tsx`, `not-found.tsx`

### Step 4: Create Components Directory Structure

```bash
# Create component directories
mkdir -p components/ui
mkdir -p components/sections
mkdir -p components/shared
```

**Directory purposes:**
- `components/ui/` - shadcn/ui will generate components here
- `components/sections/` - Large page sections (Hero, Features, Footer)
- `components/shared/` - Small reusable components (CopyButton, CodeBlock)

**Why separate sections and shared?**
- **Sections** are page-specific, large, and rarely reused
- **Shared** are small, reusable across multiple sections
- Makes it easy to find components by purpose

### Step 5: Create Lib Directory

```bash
# Create lib directory for utilities
mkdir -p lib
```

The `lib/` directory contains pure functions:
- No React components
- No side effects
- Easily testable
- Can be moved to `shared` package later if needed

### Step 6: Create Public Directory

```bash
# Create public directory for static assets
mkdir -p public/assets
```

**How Next.js serves public files:**
- Files in `public/` are served from root URL
- `public/logo.png` → Available at `/logo.png`
- `public/assets/hero.png` → Available at `/assets/hero.png`

**What goes in public:**
- Images (PNGs, JPGs, SVGs)
- Fonts (if not using next/font)
- favicon.ico
- robots.txt
- sitemap.xml

### Step 7: Create Configuration Files (Placeholders)

```bash
# Create placeholder config files
touch package.json
touch tsconfig.json
touch next.config.js
touch tailwind.config.ts
touch postcss.config.js
touch .eslintrc.json
touch README.md
touch .gitignore
```

**Why create empty files now:**
- Visualize the complete structure
- Ready to fill in next tutorials
- Ensures we don't forget any config files

### Step 8: Create Initial App Files (Placeholders)

```bash
# Create placeholder app files
touch app/layout.tsx
touch app/page.tsx
touch app/globals.css
```

These are the **minimum required files** for Next.js App Router:
- `layout.tsx` - Required root layout
- `page.tsx` - Home page
- `globals.css` - Optional but conventional

### Step 9: Verify Directory Structure

```bash
# From packages/web, show the tree structure
tree -L 3
```

Expected output:
```
.
├── app
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components
│   ├── sections
│   ├── shared
│   └── ui
├── lib
├── next.config.js
├── package.json
├── postcss.config.js
├── public
│   └── assets
├── README.md
├── tailwind.config.ts
└── tsconfig.json
```

**If tree is not installed:**
```bash
# Alternative using ls
ls -R
```

### Step 10: Create .gitignore

Create `packages/web/.gitignore`:

```gitignore
# Dependencies
node_modules
.pnp
.pnp.js

# Testing
coverage

# Next.js
.next/
out/
build
dist

# Production
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# Environment
.env*.local
.env

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# IDEs
.vscode
.idea
*.swp
*.swo
*~
.DS_Store

# Misc
.turbo
```

**Why this .gitignore:**
- **node_modules** - Dependencies (pnpm handles this)
- **.next/** - Build output (regenerated on build)
- **out/** - Static export output (regenerated)
- **.env*.local** - Secrets (never commit)
- **next-env.d.ts** - Generated TypeScript definitions

---

## Verification

### Check Directory Exists

```bash
cd /home/user/papyrus/packages/web
pwd
# Should output: /home/user/papyrus/packages/web
```

### Check Structure Created

```bash
ls -la
# Should see: app/, components/, lib/, public/, and config files
```

### Check All Subdirectories

```bash
find . -type d
# Should show all directories we created
```

---

## What's Next

Now that the structure is ready, we'll fill in the configuration files:

**Next Tutorial:** [02-package-config.md](./02-package-config.md) - Configure `package.json` with dependencies and scripts.

---

## Common Issues

### Issue: Permission denied when creating directories

**Solution:**
```bash
# Check if you have write permissions
ls -la packages/

# If permission issue, check ownership
whoami

# May need to use sudo (not recommended in development)
```

### Issue: `tree` command not found

**Solution:**
```bash
# Install tree (optional)
sudo apt-get install tree  # Ubuntu/Debian
brew install tree          # macOS

# Or use ls -R instead
ls -R
```

---

## Summary

You've created the foundational directory structure for the Papyrus marketing website:

✅ `packages/web/` package directory
✅ `app/` for Next.js App Router
✅ `components/` organized by purpose
✅ `lib/` for utilities
✅ `public/` for static assets
✅ Placeholder config files
✅ `.gitignore` for excluding build artifacts

**Time taken:** ~5 minutes
**Files created:** 8 directories, 10 files (empty)

---

**Continue to:** [02-package-config.md](./02-package-config.md) →
