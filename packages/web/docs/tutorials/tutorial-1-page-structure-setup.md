# Tutorial 1: Page Structure & Setup

See the complete page layout first, then set up the tools we'll use.

## What We're Building

**Goal:** Understand the big picture before diving into details.

By the end of this tutorial, you'll have:

1. A page with placeholder sections showing where everything goes
2. shadcn/ui set up and ready to use
3. Icons installed for later use

**Visual overview of the final page:**

```
┌─────────────────────────────────────────────────────────────┐
│                         HERO                                 │
│        (ASCII logo, headline, install command, CTA)          │
├─────────────────────────────────────────────────────────────┤
│                       FEATURES                               │
│              (6 cards in responsive grid)                    │
├─────────────────────────────────────────────────────────────┤
│                     QUICK START                              │
│         (install options + getting started steps)            │
├─────────────────────────────────────────────────────────────┤
│                        FOOTER                                │
│              (links, social icons, copyright)                │
└─────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

**Required:**

- Next.js project with Tailwind CSS (`packages/web`)
- Terminal open in `packages/web` directory
- Dev server running: `pnpm dev`

**Assumed knowledge:**

- Basic React (components, props)
- Command line basics

---

## Step 1: See the Complete Page Layout

**Goal:** Create placeholder sections so you understand the page structure.

### 1.1 Create Section Placeholders

First, create the section components with placeholder content. This lets you see the whole page structure before building each section.

Create `packages/web/components/sections/hero.tsx`:

```tsx
// components/sections/hero.tsx
export function Hero() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center p-6 bg-black">
      <div className="text-center space-y-6">
        <p className="text-gray-500 text-sm">[ ASCII LOGO GOES HERE ]</p>
        <h1 className="text-4xl font-bold text-white">Journal Like You Code</h1>
        <p className="text-gray-400">
          AI-powered journaling from your terminal
        </p>
        <div className="p-4 bg-gray-800 rounded text-gray-500">
          [ INSTALL COMMAND GOES HERE ]
        </div>
        <div className="text-gray-500">[ GITHUB BUTTON GOES HERE ]</div>
      </div>
    </section>
  );
}
```

Create `packages/web/components/sections/features.tsx`:

```tsx
// components/sections/features.tsx
export function Features() {
  return (
    <section className="py-24 px-6 bg-gray-950">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Built for Developers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="p-6 bg-gray-900 rounded-lg border border-gray-800"
            >
              <p className="text-gray-500">[ FEATURE CARD {i} ]</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

Create `packages/web/components/sections/quick-start.tsx`:

```tsx
// components/sections/quick-start.tsx
export function QuickStart() {
  return (
    <section className="py-24 px-6 bg-black">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Quick Start
        </h2>
        <div className="space-y-8">
          <div className="p-4 bg-gray-900 rounded-lg text-gray-500">
            [ PACKAGE MANAGER OPTIONS: npm / pnpm / yarn ]
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 bg-gray-900 rounded-lg text-gray-500">
                [ STEP {i} ]
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
```

Create `packages/web/components/sections/site-footer.tsx`:

```tsx
// components/sections/site-footer.tsx
export function SiteFooter() {
  return (
    <footer className="py-12 px-6 bg-gray-950 border-t border-gray-800">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <p className="text-white font-bold">Papyrus</p>
            <p className="text-gray-500 text-sm mt-2">
              AI-powered journaling for developers
            </p>
          </div>
          <div className="text-gray-500">[ PRODUCT LINKS ]</div>
          <div className="text-gray-500">[ RESOURCE LINKS ]</div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800 text-gray-500 text-sm">
          [ COPYRIGHT + SOCIAL ICONS ]
        </div>
      </div>
    </footer>
  );
}
```

### 1.2 Assemble the Page

Update `packages/web/app/page.tsx` to use all sections:

```tsx
// app/page.tsx
import { Hero } from '@/components/sections/hero';
import { Features } from '@/components/sections/features';
import { QuickStart } from '@/components/sections/quick-start';
import { SiteFooter } from '@/components/sections/site-footer';

export default function Home() {
  return (
    <main>
      <Hero />
      <Features />
      <QuickStart />
      <SiteFooter />
    </main>
  );
}
```

### 1.3 View the Page Structure

Start the dev server and view the page:

```bash
cd packages/web
pnpm dev
# Open http://localhost:3000
```

You should see:

- **Hero** - Full-screen section with placeholders
- **Features** - Grid of 6 placeholder cards
- **Quick Start** - Steps placeholder
- **Footer** - Links placeholder

**This is the forest.** Now you know where everything goes. In the following tutorials, we'll replace each placeholder with real content.

---

## Step 2: Initialize shadcn/ui

**Goal:** Set up shadcn/ui using the CLI (not manually).

### 2.1 Run the shadcn CLI

```bash
cd packages/web
npx shadcn@latest init
```

The CLI will ask some questions. Recommended answers:

```
Which style would you like to use? › Default
Which color would you like to use as base color? › Neutral
Would you like to use CSS variables for colors? › yes
```

**What the CLI creates:**

| File                         | Purpose                                         |
| ---------------------------- | ----------------------------------------------- |
| `lib/utils.ts`               | The `cn()` utility for merging Tailwind classes |
| `components.json`            | shadcn configuration                            |
| Updates `tailwind.config.ts` | Adds shadcn theme variables                     |
| Updates `globals.css`        | Adds CSS variables                              |

### 2.2 Add Button Component

```bash
npx shadcn@latest add button
```

This creates `components/ui/button.tsx` with:

- Multiple variants (default, outline, ghost, etc.)
- Multiple sizes (sm, default, lg)
- Proper accessibility
- All dependencies installed automatically

### 2.3 Add Card Component

```bash
npx shadcn@latest add card
```

This creates `components/ui/card.tsx` which we'll use for feature cards.

### 2.4 Test shadcn Components

Update the Hero placeholder to use the shadcn Button:

```tsx
// components/sections/hero.tsx
import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center p-6 bg-black">
      <div className="text-center space-y-6">
        <p className="text-gray-500 text-sm">[ ASCII LOGO GOES HERE ]</p>
        <h1 className="text-4xl font-bold text-white">Journal Like You Code</h1>
        <p className="text-gray-400">
          AI-powered journaling from your terminal
        </p>
        <div className="p-4 bg-gray-800 rounded text-gray-500">
          [ INSTALL COMMAND GOES HERE ]
        </div>
        {/* Test: shadcn Button */}
        <Button variant="outline">View on GitHub</Button>
      </div>
    </section>
  );
}
```

Refresh the page. You should see a styled button.

**Key Principle:** Use CLI tools, don't reinvent the wheel. The shadcn CLI handles all dependencies and configuration.

---

## Step 3: Add Icons

**Goal:** Install lucide-react for icons we'll use later.

### 3.1 Install lucide-react

```bash
pnpm add lucide-react
```

### 3.2 Test an Icon

Update the Hero to include a GitHub icon:

```tsx
// components/sections/hero.tsx
import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react';

export function Hero() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center p-6 bg-black">
      <div className="text-center space-y-6">
        <p className="text-gray-500 text-sm">[ ASCII LOGO GOES HERE ]</p>
        <h1 className="text-4xl font-bold text-white">Journal Like You Code</h1>
        <p className="text-gray-400">
          AI-powered journaling from your terminal
        </p>
        <div className="p-4 bg-gray-800 rounded text-gray-500">
          [ INSTALL COMMAND GOES HERE ]
        </div>
        {/* Test: shadcn Button with lucide icon */}
        <Button variant="outline">
          <Github className="mr-2 h-4 w-4" />
          View on GitHub
        </Button>
      </div>
    </section>
  );
}
```

Refresh the page. You should see the GitHub icon in the button.

---

## Testing Checklist

```bash
cd packages/web
pnpm dev
# Open http://localhost:3000
```

- [ ] **Page shows 4 sections** - Hero, Features, Quick Start, Footer
- [ ] **Placeholders visible** - Gray text indicating what goes where
- [ ] **shadcn Button works** - Styled button appears in Hero
- [ ] **Icon displays** - GitHub icon shows in button

---

## Common Issues

### Issue: "Module not found: Can't resolve '@/components/...'"

**Why:** Path alias not configured.

**Solution:** The shadcn CLI should configure this. If not, ensure `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

Restart the dev server after changes.

---

### Issue: shadcn CLI fails

**Why:** Various possible reasons.

**Solution:** Try running with explicit options:

```bash
npx shadcn@latest init --defaults
```

Or manually create `components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

---

## File Structure After Tutorial 1

```
packages/web/
├── app/
│   ├── globals.css        # Updated by shadcn
│   ├── layout.tsx
│   └── page.tsx           # Imports all sections
├── components/
│   ├── sections/
│   │   ├── hero.tsx       # Placeholder + test Button
│   │   ├── features.tsx   # Placeholder
│   │   ├── quick-start.tsx # Placeholder
│   │   └── site-footer.tsx # Placeholder
│   └── ui/
│       ├── button.tsx     # From shadcn CLI
│       └── card.tsx       # From shadcn CLI
├── lib/
│   └── utils.ts           # From shadcn CLI (cn utility)
├── components.json        # shadcn config
└── package.json           # Now includes lucide-react
```

---

## Summary

In this tutorial, you:

1. **Saw the big picture** - Created placeholder sections to understand page structure
2. **Set up shadcn/ui** - Using CLI, not manual setup
3. **Added icons** - Installed lucide-react

**What you have now:**

- A page showing where Hero, Features, Quick Start, and Footer will go
- shadcn/ui ready with Button and Card components
- Icons ready to use

**What's next:**

- Tutorial 2: Replace Hero placeholder with real content
- Tutorial 3: Replace Features placeholder with real content
- And so on...

**Key Principles Applied:**

- **Top-down:** See the forest before the trees
- **Use CLI:** Let shadcn handle the complexity
- **Progressive:** Start with placeholders, replace incrementally

---

## Next Steps

**Tutorial 2: Hero Section** will:

- Replace the Hero placeholder with real content
- Add the ASCII logo
- Build the InstallCommand component (our first shared component)
- Add the GitHub CTA using shadcn Button

The InstallCommand is created in Tutorial 2 (not before) because that's when we first need it.
