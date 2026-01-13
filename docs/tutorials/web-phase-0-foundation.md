# Phase 0: Foundation & Deploy Pipeline

Building the infrastructure for the Papyrus CLI marketing website.

## What We're Building

**Goal:** Set up a Next.js 15 marketing website with Tailwind CSS, shadcn/ui, and automated Vercel deployment.

**What problem does this solve?**
- Establish a solid foundation for rapid feature development
- Enable continuous deployment for fast iteration
- Set up design system and styling infrastructure
- Get something live immediately to validate the pipeline

**Expected outcome:**
- Live URL with a basic landing page
- Working CI/CD pipeline (GitHub → Vercel)
- Dark theme with terminal aesthetic
- Ready to add content (Phase 1)

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
│  │  1. npm install                                   │  │
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
│       │   ├── page.tsx         # Home page
│       │   └── globals.css      # Global styles
│       ├── components/
│       │   ├── ui/              # shadcn components
│       │   └── shared/          # Reusable components
│       ├── lib/
│       │   └── utils.ts         # Utility functions
│       ├── public/              # Static assets
│       ├── package.json
│       ├── tsconfig.json
│       ├── tailwind.config.ts
│       └── next.config.js
```

**Why this architecture:**
- **Next.js App Router** - Modern React framework with static export
- **Monorepo integration** - Shares types/utils with CLI and API
- **shadcn/ui** - Copy-paste components (no library bloat)
- **Vercel deployment** - Zero-config, fast CDN, preview URLs
- **Static export** - Fast, cheap, secure (no server needed)

**Trade-offs considered:**
- Static vs SSR: Static is faster and cheaper (good for marketing site)
- shadcn/ui vs custom: shadcn provides accessible primitives we can customize
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

### Step 1: Create the Web Package Structure

**Goal:** Set up the basic directory structure for the new web package in the monorepo.

First, create the directory structure:

```bash
# From monorepo root
cd /home/user/papyrus

# Create the web package directory
mkdir -p packages/web

# Navigate into it
cd packages/web
```

Now create the foundational files and directories:

```bash
# Create directory structure
mkdir -p app
mkdir -p components/ui
mkdir -p components/shared
mkdir -p lib
mkdir -p public/assets

# Create placeholder files
touch app/layout.tsx
touch app/page.tsx
touch app/globals.css
touch lib/utils.ts
touch next.config.js
touch tsconfig.json
touch tailwind.config.ts
touch postcss.config.js
touch .eslintrc.json
touch package.json
touch README.md
```

**Why this structure:**
- `app/` - Next.js App Router directory
- `components/ui/` - shadcn components (will be auto-generated)
- `components/shared/` - Custom reusable components
- `lib/` - Utility functions
- `public/` - Static assets (images, fonts, etc.)

---

### Step 2: Configure package.json

**Goal:** Define the package dependencies and scripts.

Create `packages/web/package.json`:

```json
{
  "name": "@rewrlution/papyrus-web",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write \"**/*.{ts,tsx,json,md}\"",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^15.1.4",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0",
    "lucide-react": "^0.468.0",
    "@rewrlution/papyrus-shared": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^22.10.5",
    "@types/react": "^19.0.6",
    "@types/react-dom": "^19.0.2",
    "typescript": "^5.7.3",
    "tailwindcss": "^4.0.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "eslint": "^8.57.1",
    "eslint-config-next": "^15.1.4",
    "prettier": "^3.4.2"
  }
}
```

**Why these dependencies:**
- **next, react, react-dom** - Core framework
- **class-variance-authority, clsx, tailwind-merge** - For shadcn/ui
- **lucide-react** - Icon library (tree-shakeable)
- **@rewrlution/papyrus-shared** - Shared types from monorepo

---

### Step 3: Configure TypeScript

**Goal:** Set up TypeScript with proper monorepo integration.

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
  "exclude": ["node_modules"],
  "references": [
    {
      "path": "../shared"
    }
  ]
}
```

**Why this configuration:**
- Extends base TypeScript config from monorepo root
- References `shared` package for type checking
- Path alias `@/*` for cleaner imports
- Next.js plugin for better type inference

---

### Step 4: Configure Next.js

**Goal:** Set up Next.js for static export and proper monorepo paths.

Create `packages/web/next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  transpilePackages: ['@rewrlution/papyrus-shared'],
  images: {
    unoptimized: true, // Required for static export
  },
}

module.exports = nextConfig
```

**Why this configuration:**
- `output: 'export'` - Generate static HTML/CSS/JS (no server needed)
- `transpilePackages` - Compile TypeScript from shared package
- `images.unoptimized` - Required for static export (no server for image optimization)

---

### Step 5: Configure Tailwind CSS v4

**Goal:** Set up Tailwind with a terminal-inspired color palette.

Create `packages/web/tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          black: "#0a0a0a",
          darkgray: "#1a1a1a",
          gray: "#2a2a2a",
          lightgray: "#666666",
          text: "#e0e0e0",
          green: "#00ff00",
          cyan: "#00d9ff",
          yellow: "#ffdd00",
          red: "#ff4444",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

Create `packages/web/postcss.config.js`:

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**Why this configuration:**
- **Terminal colors** - Custom palette for dev tool aesthetic
- **shadcn/ui tokens** - CSS variables for theming
- **Font families** - Geist Sans for UI, Geist Mono for code
- **tailwindcss-animate** - For smooth animations (shadcn/ui requirement)

---

### Step 6: Create Global Styles

**Goal:** Set up CSS variables and base styles for the dark terminal theme.

Create `packages/web/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 4%; /* #0a0a0a */
    --foreground: 0 0% 88%; /* #e0e0e0 */

    --card: 0 0% 10%;
    --card-foreground: 0 0% 88%;

    --popover: 0 0% 10%;
    --popover-foreground: 0 0% 88%;

    --primary: 180 100% 44%; /* cyan #00d9ff */
    --primary-foreground: 0 0% 4%;

    --secondary: 0 0% 16%;
    --secondary-foreground: 0 0% 88%;

    --muted: 0 0% 16%;
    --muted-foreground: 0 0% 60%;

    --accent: 60 100% 56%; /* yellow #ffdd00 */
    --accent-foreground: 0 0% 4%;

    --destructive: 0 100% 63%; /* red #ff4444 */
    --destructive-foreground: 0 0% 88%;

    --border: 0 0% 20%;
    --input: 0 0% 20%;
    --ring: 180 100% 44%;

    --radius: 0.5rem;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
```

**Why these styles:**
- Dark terminal background (#0a0a0a)
- Cyan primary color (terminal aesthetic)
- Yellow accent (like terminal warnings)
- CSS variables for easy theming

---

### Step 7: Create Root Layout

**Goal:** Set up the root layout with fonts and metadata.

Create `packages/web/app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Papyrus - AI-Powered Journaling for Developers",
  description: "Journal like you code. Capture your thoughts, track your progress, and reflect on your journey—right in your terminal.",
  keywords: ["journaling", "CLI", "terminal", "developer tools", "markdown", "local-first"],
  authors: [{ name: "Rewrlution", email: "rewrlution@gmail.com" }],
  openGraph: {
    title: "Papyrus - AI-Powered Journaling for Developers",
    description: "Journal like you code. Capture your thoughts directly from the terminal.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Papyrus - AI-Powered Journaling for Developers",
    description: "Journal like you code. Capture your thoughts directly from the terminal.",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

**Why this approach:**
- **Geist fonts** - Modern, optimized fonts from Vercel
- **SEO metadata** - Open Graph and Twitter cards
- **Dark mode** - Always dark (terminal aesthetic)
- **Font variables** - CSS variables for font families

---

### Step 8: Create Basic Home Page

**Goal:** Create a simple landing page to verify the setup works.

Create `packages/web/app/page.tsx`:

```typescript
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <pre className="text-terminal-cyan text-6xl font-bold mb-8 font-mono">
{`██████╗  █████╗ ██████╗ ██╗   ██╗██████╗ ██╗   ██╗███████╗
██╔══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝██╔══██╗██║   ██║██╔════╝
██████╔╝███████║██████╔╝ ╚████╔╝ ██████╔╝██║   ██║███████╗
██╔═══╝ ██╔══██║██╔═══╝   ╚██╔╝  ██╔══██╗██║   ██║╚════██║
██║     ██║  ██║██║        ██║   ██║  ██║╚██████╔╝███████║
╚═╝     ╚═╝  ╚═╝╚═╝        ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝`}
        </pre>

        <h1 className="text-4xl font-bold mb-4 text-terminal-text">
          AI-Powered Journaling for Developers
        </h1>

        <p className="text-xl text-terminal-lightgray mb-8">
          Journal like you code. Right in your terminal.
        </p>

        <div className="bg-terminal-darkgray border border-terminal-gray rounded-lg p-6 max-w-2xl mx-auto">
          <code className="text-terminal-green font-mono">
            $ npm install -g @rewrlution/papyrus-cli
          </code>
        </div>

        <p className="text-sm text-terminal-lightgray mt-8">
          Phase 0 Complete: Foundation & Deploy Pipeline ✓
        </p>
      </div>
    </main>
  );
}
```

**Why this page:**
- Shows the Papyrus ASCII logo (brand identity)
- Simple, clear value proposition
- Install command (primary CTA)
- Verifies Tailwind colors work
- Verifies fonts load correctly

---

### Step 9: Create Utility Functions

**Goal:** Set up the `cn()` utility for merging Tailwind classes.

Create `packages/web/lib/utils.ts`:

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names with Tailwind-aware deduplication
 * Used by shadcn/ui components
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Why this utility:**
- Required by shadcn/ui components
- Merges Tailwind classes intelligently (no duplicates)
- Example: `cn("text-red-500", "text-blue-500")` → `"text-blue-500"` (last wins)

---

### Step 10: Configure ESLint

**Goal:** Set up linting rules for Next.js and TypeScript.

Create `packages/web/.eslintrc.json`:

```json
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": {
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }
    ],
    "react/no-unescaped-entities": "off"
  }
}
```

---

### Step 11: Create Package README

**Goal:** Document the web package for future developers.

Create `packages/web/README.md`:

```markdown
# @rewrlution/papyrus-web

Marketing website for Papyrus CLI - An AI-powered journaling tool built for developers.

## Tech Stack

- **Framework:** Next.js 15 (App Router, Static Export)
- **Styling:** Tailwind CSS v4
- **Components:** shadcn/ui
- **Fonts:** Geist Sans + Geist Mono
- **Deployment:** Vercel

## Development

\`\`\`bash
# Install dependencies (from monorepo root)
pnpm install

# Start dev server
pnpm dev

# Open http://localhost:3000
\`\`\`

## Build

\`\`\`bash
# Build for production
pnpm build

# Preview production build
pnpm start
\`\`\`

## Deployment

Automatically deployed to Vercel on push to main branch.

- **Production:** [URL will be here after deployment]
- **Preview:** Auto-generated for each PR

## Project Structure

\`\`\`
packages/web/
├── app/
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page
│   └── globals.css      # Global styles
├── components/
│   ├── ui/              # shadcn components
│   └── shared/          # Custom components
├── lib/
│   └── utils.ts         # Utilities
└── public/              # Static assets
\`\`\`

## Adding shadcn/ui Components

\`\`\`bash
# Install shadcn CLI (first time only)
npx shadcn@latest init

# Add components
npx shadcn@latest add button
npx shadcn@latest add card
\`\`\`

## Learn More

- See development plan: `/docs/WEB_DEVELOPMENT_PLAN.md`
- See tutorials: `/docs/tutorials/`
```

---

### Step 12: Install Dependencies

**Goal:** Install all npm packages.

From the monorepo root, run:

```bash
cd /home/user/papyrus

# Install dependencies for entire monorepo
pnpm install
```

**Why from root:**
- pnpm workspaces handles all packages together
- Links `@rewrlution/papyrus-shared` automatically
- Installs all dependencies efficiently

---

### Step 13: Initialize shadcn/ui

**Goal:** Set up shadcn/ui CLI and install first component.

```bash
cd packages/web

# Initialize shadcn/ui (interactive)
npx shadcn@latest init

# Answer prompts:
# - TypeScript: Yes
# - Style: Default
# - Base color: Slate
# - CSS variables: Yes
# - tailwind.config: Yes
# - components directory: ./components
# - utils import alias: @/lib/utils
# - React Server Components: Yes

# Install button component (test)
npx shadcn@latest add button
```

This creates `components/ui/button.tsx` - a fully accessible button component.

**Why shadcn/ui:**
- Components are copied to your codebase (no library dependency)
- Built on Radix UI (accessible by default)
- Fully customizable
- Tailwind-based styling

---

### Step 14: Test Local Development

**Goal:** Verify the dev server works.

```bash
cd packages/web
pnpm dev
```

Open your browser to `http://localhost:3000`

You should see:
- Papyrus ASCII logo in cyan
- "AI-Powered Journaling for Developers" headline
- Install command in a terminal-style box
- Dark background with terminal colors

**Test checklist:**
- [ ] Page loads without errors
- [ ] Fonts render correctly (Geist Sans/Mono)
- [ ] Colors match terminal palette
- [ ] Fast page load
- [ ] No console errors

Press `Ctrl+C` to stop the dev server.

---

### Step 15: Build for Production

**Goal:** Verify static export works.

```bash
cd packages/web
pnpm build
```

This should:
1. Compile TypeScript
2. Generate static HTML/CSS/JS
3. Output to `.next` directory
4. Show build statistics

Expected output:
```
Route (app)                              Size     First Load JS
┌ ○ /                                    137 B          87.2 kB
└ ○ /_not-found                          871 B          86.9 kB
○ (Static) prerendered as static content
```

**If build fails:**
- Check for TypeScript errors: `pnpm type-check`
- Check for linting errors: `pnpm lint`
- Check imports are correct (all files exist)

---

### Step 16: Deploy to Vercel

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

#### C. Verify Deployment

Once deployed:
- Click the URL
- Verify the page loads
- Check that it matches your local build
- Test on mobile (responsive design)

#### D. Configure Custom Domain (Optional)

If you have a domain:
1. Go to Project Settings → Domains
2. Add your domain (e.g., `papyrus.dev`)
3. Follow DNS instructions
4. Wait for SSL certificate (automatic)

---

### Step 17: Set Up Auto-Deploy

**Goal:** Enable continuous deployment on every push.

Good news: **This is already configured!** Vercel automatically:
- Deploys `main` branch to production
- Deploys other branches to preview URLs
- Deploys PRs to preview URLs
- Shows build status in GitHub

**To test:**
1. Make a small change to `packages/web/app/page.tsx`
2. Commit and push to your branch
3. Check Vercel dashboard - new deployment starts
4. Click preview URL when ready

---

### Step 18: Update Monorepo Root Scripts

**Goal:** Add web package to monorepo build scripts.

Update `/home/user/papyrus/package.json` to include web package:

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

Update `/home/user/papyrus/turbo.json` to include web package:

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

**Why these changes:**
- `turbo.json` includes `.next/**` in build outputs
- Root scripts can run web commands easily
- `pnpm web:dev` is a shortcut for running the dev server

---

## Testing

### Manual Testing Checklist

After completing all steps, verify:

**Local Development:**
- [ ] `pnpm dev` starts server without errors
- [ ] `http://localhost:3000` loads the page
- [ ] Papyrus ASCII logo displays in cyan
- [ ] Fonts load correctly (Geist Sans/Mono)
- [ ] Terminal color palette is visible
- [ ] No console errors in browser DevTools

**Build:**
- [ ] `pnpm build` completes successfully
- [ ] No TypeScript errors
- [ ] No lint errors
- [ ] `.next` directory is created

**Deployment:**
- [ ] Vercel dashboard shows successful deploy
- [ ] Production URL loads correctly
- [ ] Mobile responsive (test on phone)
- [ ] Fast page load (<2 seconds)
- [ ] Preview deployments work for new commits

**Monorepo:**
- [ ] `pnpm install` from root installs all packages
- [ ] `pnpm web:dev` shortcut works
- [ ] No conflicts with other packages

---

## Common Issues

### Issue: "Cannot find module '@rewrlution/papyrus-shared'"

**Why it happens:**
TypeScript can't resolve the shared package.

**Solution:**
```bash
# Build shared package first
cd packages/shared
pnpm build

# Then try again
cd ../web
pnpm dev
```

---

### Issue: "Error: Failed to load SWC binary"

**Why it happens:**
Next.js compiler issue, usually on first install.

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules .next
pnpm install
pnpm dev
```

---

### Issue: Fonts not loading

**Why it happens:**
Geist fonts not installed or imported incorrectly.

**Solution:**
```bash
# Install geist package
pnpm add geist

# Verify import in app/layout.tsx
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
```

---

### Issue: Tailwind styles not applying

**Why it happens:**
PostCSS or Tailwind config issue.

**Solution:**
```bash
# Verify tailwind.config.ts content paths are correct
content: [
  "./app/**/*.{ts,tsx}",
  "./components/**/*.{ts,tsx}",
],

# Restart dev server
pnpm dev
```

---

### Issue: Vercel build fails with "Command not found: pnpm"

**Why it happens:**
Vercel needs to know to use pnpm.

**Solution:**
Add to project root (if not exists): `.npmrc`
```
package-manager=pnpm
```

Or in Vercel dashboard:
- Settings → General → Build & Development Settings
- Install Command: `pnpm install`

---

### Issue: Build succeeds locally but fails on Vercel

**Why it happens:**
Different Node.js version or missing environment variables.

**Solution:**
1. Check Vercel build logs for specific error
2. Match Node.js version (add `engines` in package.json):
```json
"engines": {
  "node": ">=20.0.0"
}
```
3. Check that all imports are correct (case-sensitive on Vercel)

---

## Next Steps

Phase 0 is complete! You now have:
- ✅ Next.js 15 app with App Router
- ✅ Tailwind CSS with terminal color palette
- ✅ shadcn/ui configured
- ✅ Dark theme
- ✅ Working CI/CD pipeline
- ✅ Live production URL

**What's next:**

1. **Phase 1: MVP Content** - Build the actual marketing content
   - Hero section with value proposition
   - Features grid (6 feature cards)
   - Quick start section
   - Footer with links
   - See tutorial: `docs/tutorials/web-phase-1-mvp-content.md`

2. **Share for Feedback** - Get early feedback on the foundation
   - Share Vercel preview URL with team
   - Verify design direction before building content

3. **Plan Phase 2** - Start thinking about:
   - Terminal recordings you'll need
   - Animation ideas
   - Screenshot preparation

---

## References

### Official Documentation
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Vercel Deployment](https://vercel.com/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)

### Design Inspiration
- [Linear.app](https://linear.app) - Clean dark design
- [Vercel.com](https://vercel.com) - Modern layout
- [Supabase.com](https://supabase.com) - Developer-focused

### Related Papyrus Docs
- Main README: `/CLAUDE.md`
- Development plan: `/docs/WEB_DEVELOPMENT_PLAN.md`
- CLI docs: `/packages/cli/CLAUDE.md`

---

**Congratulations!** You've completed Phase 0. The foundation is solid and ready for content.

Move on to **Phase 1** to build the actual marketing pages.
