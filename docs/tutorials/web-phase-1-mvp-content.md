# Phase 1: MVP Content

Building the core marketing content for the Papyrus CLI website - progressively adding features as needed.

## What We're Building

**Goal:** Create a launchable marketing website with complete messaging, features showcase, and clear calls-to-action - adding styling and components progressively.

**What problem does this solve?**
- Communicate value proposition clearly to developers
- Showcase Papyrus CLI's key features
- Provide easy installation and onboarding path
- Create a shareable, professional web presence

**Expected outcome:**
- Fully functional marketing site ready to launch
- Hero section with compelling headline
- 6 feature cards with icons and descriptions
- Quick start guide with copy-to-clipboard
- Professional footer with links
- Mobile responsive design
- Basic SEO optimization

**What makes this different from Phase 0:**
- We'll install packages ONLY when we need them
- Each dependency is motivated by a concrete requirement
- You'll understand WHY each tool is necessary

---

## Architecture

```
Home Page Structure:
┌─────────────────────────────────────────────────────────┐
│                      Hero Section                        │
│  - ASCII Logo                                            │
│  - Headline + Subheadline                               │
│  - Primary CTA (Install command + copy button)          │
│  - Secondary CTA (GitHub link)                          │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                    Features Grid                         │
│  ┌──────┐  ┌──────┐  ┌──────┐                          │
│  │  ⚡  │  │  📅  │  │  🎨  │                          │
│  │ Fast │  │ Date │  │ TUI  │                          │
│  └──────┘  └──────┘  └──────┘                          │
│  ┌──────┐  ┌──────┐  ┌──────┐                          │
│  │  ☁️  │  │  🔐  │  │  💾  │                          │
│  │ Sync │  │ Safe │  │Local │                          │
│  └──────┘  └──────┘  └──────┘                          │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                    Quick Start Section                   │
│  - Installation commands (npm, pnpm, yarn)              │
│  - 4-step getting started                               │
│  - Syntax-highlighted code blocks                       │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                         Footer                           │
│  - Links (GitHub, Docs, Issues)                         │
│  - Contact info                                          │
│  - Copyright & License                                   │
└─────────────────────────────────────────────────────────┘

Component Architecture (built progressively):
app/
└── page.tsx (orchestrates sections)

components/
├── sections/
│   ├── hero.tsx           # Step 5
│   ├── features.tsx       # Step 8
│   ├── quick-start.tsx    # Step 10
│   └── site-footer.tsx    # Step 11
└── shared/
    ├── copy-button.tsx    # Step 9
    └── code-block.tsx     # Step 10

(shadcn/ui components installed as needed)
```

---

## Prerequisites

**Required:**
- Phase 0 completed (basic Next.js app running and deployed)
- Dev server can start: `pnpm dev` (from `packages/web`)
- Understanding of React functional components
- Basic Tailwind CSS knowledge

**Assumed knowledge:**
- React functional components
- TypeScript interfaces
- Next.js App Router basics

---

## Implementation

### Step 1: Add Tailwind CSS

**Goal:** Install Tailwind CSS for styling.

**Why now?** We're about to build actual UI components. We need a styling solution.

#### A. Install Tailwind and Dependencies

From `packages/web`:

```bash
pnpm add tailwindcss postcss autoprefixer
```

**What these packages do:**
- **tailwindcss** - Utility-first CSS framework
- **postcss** - CSS processor (Tailwind requires it)
- **autoprefixer** - Adds vendor prefixes automatically

#### B. Initialize Tailwind Config

```bash
npx tailwindcss init -p
```

This creates:
- `tailwind.config.js` - Tailwind configuration
- `postcss.config.js` - PostCSS configuration

#### C. Configure Tailwind

Update `packages/web/tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**Why these settings:**
- **content** - Tell Tailwind where to look for classes
- **extend** - We'll add custom colors next step
- **plugins** - None needed yet

#### D. Create Global CSS

Create `packages/web/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**What this does:**
- Imports Tailwind's base styles, component classes, and utilities

#### E. Import Global CSS

Update `packages/web/app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import "./globals.css";

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

**Test it:**

```bash
# From packages/web
pnpm dev
```

The page should still load. Let's add some basic Tailwind classes to verify it works:

Update `packages/web/app/page.tsx`:

```typescript
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">PAPYRUS</h1>
      <p className="text-xl mb-2">AI-Powered Journaling for Developers</p>
      <p className="text-lg text-gray-600 mb-4">Journal like you code. Right in your terminal.</p>
      <code className="bg-gray-100 px-4 py-2 rounded">npm install -g @rewrlution/papyrus-cli</code>
    </main>
  );
}
```

Open `http://localhost:3000` - you should see centered, styled text!

---

### Step 2: Add Terminal Color Palette

**Goal:** Configure dark terminal-inspired colors.

**Why now?** We want a terminal aesthetic for our CLI marketing site.

Update `packages/web/tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
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
      },
    },
  },
  plugins: [],
}
```

**Why these colors:**
- Dark backgrounds (terminal black/gray)
- Cyan primary color (terminal aesthetic)
- High contrast for accessibility
- Terminal green for success states

Update `packages/web/app/globals.css` to add dark theme base styles:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-terminal-black text-terminal-text;
  }
}
```

Update `packages/web/app/page.tsx` to use terminal colors:

```typescript
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4 text-terminal-cyan">PAPYRUS</h1>
      <p className="text-xl mb-2 text-terminal-text">AI-Powered Journaling for Developers</p>
      <p className="text-lg text-terminal-lightgray mb-4">Journal like you code. Right in your terminal.</p>
      <code className="bg-terminal-darkgray text-terminal-green px-4 py-2 rounded border border-terminal-gray">
        npm install -g @rewrlution/papyrus-cli
      </code>
    </main>
  );
}
```

**Test it:** Reload `http://localhost:3000` - should now have dark background with terminal colors!

---

### Step 3: Add Geist Fonts

**Goal:** Install Geist Sans and Geist Mono fonts.

**Why now?** We want professional typography. Geist fonts are modern, optimized, and free from Vercel.

Install the font package:

```bash
pnpm add geist
```

Update `packages/web/app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

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
    <html lang="en" className="dark">
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

Update `tailwind.config.js` to use the font variables:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
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
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [],
}
```

Update `packages/web/app/page.tsx` to use mono font for code:

```typescript
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4 text-terminal-cyan">PAPYRUS</h1>
      <p className="text-xl mb-2 text-terminal-text">AI-Powered Journaling for Developers</p>
      <p className="text-lg text-terminal-lightgray mb-4">Journal like you code. Right in your terminal.</p>
      <code className="bg-terminal-darkgray text-terminal-green px-4 py-2 rounded border border-terminal-gray font-mono">
        npm install -g @rewrlution/papyrus-cli
      </code>
    </main>
  );
}
```

**Test it:** Fonts should now look better and code should use monospace!

---

### Step 4: Add Utility Functions

**Goal:** Create the `cn()` helper for merging Tailwind classes.

**Why now?** We're about to build components that need conditional class merging.

Install dependencies:

```bash
pnpm add clsx tailwind-merge
```

**What these do:**
- **clsx** - Conditional class names helper
- **tailwind-merge** - Intelligently merges Tailwind classes

Create `packages/web/lib/utils.ts`:

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names with Tailwind-aware deduplication
 * Example: cn("text-red-500", "text-blue-500") → "text-blue-500"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Update `tsconfig.json` to ensure the lib path alias works:

The `@/*` path alias is already configured, so `@/lib/utils` will work!

---

### Step 5: Create Component Directories

**Goal:** Set up the folder structure for sections and shared components.

**Why now?** We're about to build our first section (Hero).

From `packages/web`:

```bash
mkdir -p components/sections
mkdir -p components/shared
```

---

### Step 6: Install shadcn/ui and Button Component

**Goal:** Set up shadcn/ui and install the Button component.

**Why now?** The Hero section needs a GitHub button (CTA).

#### A. Install Required Dependencies

```bash
pnpm add class-variance-authority
```

**What this does:**
- **class-variance-authority** - Type-safe component variants (required by shadcn)

#### B. Create shadcn UI Config

Create `packages/web/components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

#### C. Add CSS Variables for shadcn

Update `packages/web/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 4%;
    --foreground: 0 0% 88%;
    --card: 0 0% 10%;
    --card-foreground: 0 0% 88%;
    --popover: 0 0% 10%;
    --popover-foreground: 0 0% 88%;
    --primary: 180 100% 44%;
    --primary-foreground: 0 0% 4%;
    --secondary: 0 0% 16%;
    --secondary-foreground: 0 0% 88%;
    --muted: 0 0% 16%;
    --muted-foreground: 0 0% 60%;
    --accent: 60 100% 56%;
    --accent-foreground: 0 0% 4%;
    --destructive: 0 100% 63%;
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
    @apply bg-terminal-black text-terminal-text;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
```

Update `tailwind.config.js` to include shadcn colors:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
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
  plugins: [],
}
```

#### D. Install Button Component

Create `packages/web/components/ui` directory:

```bash
mkdir -p components/ui
```

Create `packages/web/components/ui/button.tsx`:

```typescript
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

**Why this approach:**
- Copy-paste component (no library dependency)
- Type-safe with TypeScript
- Flexible variants (outline, ghost, sizes)
- Accessible by default

---

### Step 7: Build Hero Section

**Goal:** Create the hero section with ASCII logo and CTAs.

**Why now?** This is the first thing visitors see - most important section.

Install lucide-react for icons:

```bash
pnpm add lucide-react
```

**Why lucide-react:**
- Tree-shakeable (only import icons you use)
- Consistent terminal-friendly style
- TypeScript support

Create `packages/web/components/sections/hero.tsx`:

```typescript
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";

export function Hero() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <div className="max-w-5xl mx-auto text-center space-y-8">
        {/* ASCII Logo */}
        <pre className="text-terminal-cyan text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-mono overflow-x-auto">
{`██████╗  █████╗ ██████╗ ██╗   ██╗██████╗ ██╗   ██╗███████╗
██╔══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝██╔══██╗██║   ██║██╔════╝
██████╔╝███████║██████╔╝ ╚████╔╝ ██████╔╝██║   ██║███████╗
██╔═══╝ ██╔══██║██╔═══╝   ╚██╔╝  ██╔══██╗██║   ██║╚════██║
██║     ██║  ██║██║        ██║   ██║  ██║╚██████╔╝███████║
╚═╝     ╚═╝  ╚═╝╚═╝        ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝`}
        </pre>

        {/* Headline */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-terminal-text tracking-tight">
            Journal Like You Code
          </h1>
          <p className="text-xl sm:text-2xl text-terminal-lightgray max-w-3xl mx-auto">
            Capture your thoughts, track your progress, and reflect on your journey—right in your terminal.
          </p>
        </div>

        {/* Primary CTA: Install Command */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-terminal-darkgray border border-terminal-gray rounded-lg p-6">
            <code className="text-terminal-green font-mono">
              npm install -g @rewrlution/papyrus-cli
            </code>
          </div>
        </div>

        {/* Secondary CTA: GitHub */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Button asChild size="lg" className="text-lg">
            <a
              href="https://github.com/rewrlution/papyrus"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="mr-2 h-5 w-5" />
              View on GitHub
            </a>
          </Button>
        </div>

        {/* Subtext */}
        <p className="text-sm text-terminal-lightgray pt-8">
          AI-powered journaling for developers. Local-first, markdown-based, and completely free.
        </p>
      </div>
    </section>
  );
}
```

Update `packages/web/app/page.tsx` to use Hero:

```typescript
import { Hero } from "@/components/sections/hero";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
    </main>
  );
}
```

**Test it:** The hero section should now display with ASCII logo, headline, install command, and GitHub button!

---

### Step 8: Install Card Component and Build Features Section

**Goal:** Build the features grid with 6 feature cards.

**Why now?** Features showcase is core messaging.

Create `packages/web/components/ui/card.tsx`:

```typescript
import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

export { Card, CardHeader, CardTitle, CardDescription, CardContent }
```

Create `packages/web/components/sections/features.tsx`:

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Calendar, Sparkles, Cloud, Lock, HardDrive } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Quick Journaling",
    description: "Write in your favorite editor—vim, nano, VS Code, or any text editor. No context switching, no distractions.",
  },
  {
    icon: Calendar,
    title: "Date-Based Organization",
    description: "Automatic YYYYMMDD format. Simple, predictable, and grep-able. Your journals are organized by design.",
  },
  {
    icon: Sparkles,
    title: "Interactive Terminal UI",
    description: "Beautiful React-based TUI with vim-style navigation (j/k). Browse and read entries without leaving the terminal.",
  },
  {
    icon: Cloud,
    title: "Cloud Sync",
    description: "Backup and access from any device. Smart conflict resolution. Sync when you want, not when you're forced to.",
  },
  {
    icon: Lock,
    title: "Secure & Private",
    description: "JWT authentication. Encrypted storage. You own your data. No tracking, no ads, no data mining.",
  },
  {
    icon: HardDrive,
    title: "Local-First",
    description: "Plain markdown files stored locally. Grep-able, version-controllable, and future-proof. Works offline.",
  },
];

export function Features() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-terminal-text">
            Built for Developers
          </h2>
          <p className="text-lg text-terminal-lightgray max-w-2xl mx-auto">
            All the features you need to journal without leaving your workflow.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="bg-terminal-darkgray border-terminal-gray hover:border-terminal-cyan transition-colors"
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-terminal-gray rounded-lg">
                      <Icon className="h-6 w-6 text-terminal-cyan" />
                    </div>
                    <CardTitle className="text-xl text-terminal-text">
                      {feature.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-terminal-lightgray">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

Update `packages/web/app/page.tsx`:

```typescript
import { Hero } from "@/components/sections/hero";
import { Features } from "@/components/sections/features";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
    </main>
  );
}
```

**Test it:** Features grid should display with 6 cards, icons, and hover effects!

---

### Step 9: Create Copy Button Component

**Goal:** Build a reusable copy-to-clipboard button.

**Why now?** Quick Start section needs copy functionality for code blocks.

Create `packages/web/components/shared/copy-button.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CopyButtonProps {
  text: string;
  className?: string;
}

export function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleCopy}
      className={className}
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4 mr-2" />
          Copy
        </>
      )}
    </Button>
  );
}
```

**Why "use client":**
- Uses browser clipboard API (client-side only)
- Uses React hooks (useState)

---

### Step 10: Create Code Block and Quick Start Section

**Goal:** Build code blocks with copy buttons and the Quick Start guide.

**Why now?** We need to show installation instructions.

Create `packages/web/components/shared/code-block.tsx`:

```typescript
import { CopyButton } from "./copy-button";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = "bash" }: CodeBlockProps) {
  return (
    <div className="relative group">
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton text={code} />
      </div>
      <pre className="bg-terminal-darkgray border border-terminal-gray rounded-lg p-4 overflow-x-auto">
        <code className={`language-${language} text-terminal-green font-mono text-sm`}>
          {code}
        </code>
      </pre>
    </div>
  );
}
```

Create `packages/web/components/sections/quick-start.tsx`:

```typescript
import { CodeBlock } from "@/components/shared/code-block";

const installCommands = [
  { manager: "npm", command: "npm install -g @rewrlution/papyrus-cli" },
  { manager: "pnpm", command: "pnpm add -g @rewrlution/papyrus-cli" },
  { manager: "yarn", command: "yarn global add @rewrlution/papyrus-cli" },
];

const gettingStarted = [
  {
    step: 1,
    title: "Register",
    command: "papyrus register",
    description: "Create your account and sync your journals across devices.",
  },
  {
    step: 2,
    title: "Add Entry",
    command: "papyrus add",
    description: "Write your first journal entry. Opens in your default editor.",
  },
  {
    step: 3,
    title: "Browse Entries",
    command: "papyrus app",
    description: "Launch the interactive TUI to read and navigate your journals.",
  },
  {
    step: 4,
    title: "Sync",
    command: "papyrus sync",
    description: "Backup your entries to the cloud. Access from anywhere.",
  },
];

export function QuickStart() {
  return (
    <section className="py-24 px-6 bg-terminal-black">
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Install Section */}
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-terminal-text">
              Get Started
            </h2>
            <p className="text-lg text-terminal-lightgray">
              Install with your favorite package manager
            </p>
          </div>

          {/* Installation Options */}
          <div className="space-y-4">
            {installCommands.map((install) => (
              <div key={install.manager} className="space-y-2">
                <div className="text-sm text-terminal-lightgray font-mono">
                  # {install.manager}
                </div>
                <CodeBlock code={install.command} />
              </div>
            ))}
          </div>
        </div>

        {/* Getting Started Steps */}
        <div className="space-y-8">
          <div className="text-center">
            <h3 className="text-2xl sm:text-3xl font-bold text-terminal-text">
              Four Steps to Your First Entry
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {gettingStarted.map((step) => (
              <div
                key={step.step}
                className="space-y-4 p-6 bg-terminal-darkgray border border-terminal-gray rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-terminal-cyan text-terminal-black font-bold">
                    {step.step}
                  </div>
                  <h4 className="text-xl font-semibold text-terminal-text">
                    {step.title}
                  </h4>
                </div>
                <CodeBlock code={step.command} />
                <p className="text-terminal-lightgray">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* System Requirements */}
        <div className="text-center space-y-4 pt-8 border-t border-terminal-gray">
          <h4 className="text-lg font-semibold text-terminal-text">
            System Requirements
          </h4>
          <div className="flex flex-wrap justify-center gap-4 text-terminal-lightgray">
            <span>Node.js 18+</span>
            <span>•</span>
            <span>Linux / macOS / Windows (WSL)</span>
            <span>•</span>
            <span>Your favorite text editor</span>
          </div>
        </div>
      </div>
    </section>
  );
}
```

Update `packages/web/app/page.tsx`:

```typescript
import { Hero } from "@/components/sections/hero";
import { Features } from "@/components/sections/features";
import { QuickStart } from "@/components/sections/quick-start";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <QuickStart />
    </main>
  );
}
```

**Test it:** Quick Start section should display with copy buttons that work on hover!

---

### Step 11: Install Separator and Build Footer

**Goal:** Create the site footer with links and copyright.

**Why now?** Complete the page with footer links and legal info.

Create `packages/web/components/ui/separator.tsx`:

```typescript
import * as React from "react"
import { cn } from "@/lib/utils"

const Separator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("shrink-0 bg-border h-[1px] w-full", className)}
    {...props}
  />
))
Separator.displayName = "Separator"

export { Separator }
```

Create `packages/web/components/sections/site-footer.tsx`:

```typescript
import { Separator } from "@/components/ui/separator";
import { Github, Mail } from "lucide-react";

const links = {
  product: [
    { label: "Documentation", href: "#docs" },
    { label: "GitHub", href: "https://github.com/rewrlution/papyrus" },
    { label: "Issues", href: "https://github.com/rewrlution/papyrus/issues" },
    { label: "Changelog", href: "https://github.com/rewrlution/papyrus/releases" },
  ],
  resources: [
    { label: "CLI Package", href: "#cli" },
    { label: "API Package", href: "#api" },
    { label: "Shared Package", href: "#shared" },
  ],
};

export function SiteFooter() {
  return (
    <footer className="border-t border-terminal-gray bg-terminal-black">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="space-y-4 md:col-span-2">
            <div className="font-mono text-2xl font-bold text-terminal-cyan">
              PAPYRUS
            </div>
            <p className="text-terminal-lightgray max-w-md">
              An AI-powered journaling tool built for developers. Journal like you code—right in your terminal.
            </p>
            <div className="flex gap-4">
              <a
                href="https://github.com/rewrlution/papyrus"
                target="_blank"
                rel="noopener noreferrer"
                className="text-terminal-lightgray hover:text-terminal-cyan transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-6 w-6" />
              </a>
              <a
                href="mailto:rewrlution@gmail.com"
                className="text-terminal-lightgray hover:text-terminal-cyan transition-colors"
                aria-label="Email"
              >
                <Mail className="h-6 w-6" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-terminal-text uppercase tracking-wider">
              Product
            </h3>
            <ul className="space-y-2">
              {links.product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="text-terminal-lightgray hover:text-terminal-cyan transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-terminal-text uppercase tracking-wider">
              Resources
            </h3>
            <ul className="space-y-2">
              {links.resources.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-terminal-lightgray hover:text-terminal-cyan transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="bg-terminal-gray mb-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-terminal-lightgray">
          <div>
            © {new Date().getFullYear()} Papyrus. Open source under MIT License.
          </div>
          <div>
            Made with ❤️ by developers, for developers
          </div>
        </div>
      </div>
    </footer>
  );
}
```

Update `packages/web/app/page.tsx`:

```typescript
import { Hero } from "@/components/sections/hero";
import { Features } from "@/components/sections/features";
import { QuickStart } from "@/components/sections/quick-start";
import { SiteFooter } from "@/components/sections/site-footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <QuickStart />
      <SiteFooter />
    </main>
  );
}
```

**Test it:** Complete page should now display with footer!

---

### Step 12: Enhance SEO Metadata

**Goal:** Improve metadata for better search engine optimization.

**Why now?** We're ready to launch - need good SEO.

Update `packages/web/app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Papyrus - AI-Powered Journaling for Developers",
  description:
    "Journal like you code. Papyrus is a terminal-based journaling tool for developers. Write in your favorite editor, sync across devices, and keep your data local-first with plain markdown files.",
  keywords: [
    "journaling",
    "CLI",
    "terminal",
    "developer tools",
    "markdown",
    "local-first",
    "vim",
    "terminal UI",
    "developer journaling",
    "code journal",
  ],
  authors: [{ name: "Rewrlution", email: "rewrlution@gmail.com" }],
  creator: "Rewrlution",
  publisher: "Rewrlution",
  openGraph: {
    title: "Papyrus - AI-Powered Journaling for Developers",
    description:
      "Journal like you code. Terminal-based journaling with vim-style navigation, cloud sync, and local markdown storage.",
    type: "website",
    locale: "en_US",
    url: "https://papyrus.dev",
    siteName: "Papyrus",
  },
  twitter: {
    card: "summary_large_image",
    title: "Papyrus - AI-Powered Journaling for Developers",
    description: "Journal like you code. Terminal-based journaling tool for developers.",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
```

---

### Step 13: Test Complete Site

**Goal:** Verify everything works together.

From `packages/web`:

```bash
# Test development
pnpm dev
```

Open `http://localhost:3000` and test:

**Visual checklist:**
- [ ] Hero section displays with ASCII logo
- [ ] Features grid shows 6 cards with icons
- [ ] Quick Start shows installation commands
- [ ] Footer displays with links
- [ ] Dark theme throughout
- [ ] Fonts render correctly (Geist Sans/Mono)
- [ ] Colors match terminal palette

**Functional checklist:**
- [ ] Copy buttons work on hover
- [ ] GitHub link opens in new tab
- [ ] All sections are responsive (test mobile)
- [ ] No console errors

**Build test:**

```bash
pnpm build
```

Should build successfully with no errors.

---

### Step 14: Deploy to Production

**Goal:** Push to production.

From monorepo root:

```bash
git add packages/web
git commit -m "feat(web): complete Phase 1 MVP content

- Add Tailwind CSS with terminal color palette
- Add Geist fonts for typography
- Implement Hero section with ASCII logo and CTAs
- Build Features grid with 6 key features
- Create Quick Start guide with copy-to-clipboard
- Add Footer with links and contact info
- Enhance SEO metadata
- All components built progressively"

git push origin your-branch-name
```

Vercel will automatically deploy. Check the dashboard for deployment status and URL.

---

## Testing

### Manual Testing Checklist

**Visual:**
- [ ] Hero section renders correctly
- [ ] ASCII logo is cyan and visible
- [ ] Features grid shows all 6 cards
- [ ] Icons render correctly
- [ ] Quick start shows all steps
- [ ] Footer has all links
- [ ] Terminal colors throughout

**Functional:**
- [ ] Copy buttons work
- [ ] Copy shows "Copied!" feedback
- [ ] GitHub link opens in new tab
- [ ] All links work
- [ ] No console errors

**Responsive:**
- [ ] Desktop (1920x1080): 3-column features grid
- [ ] Tablet (768x1024): 2-column grid
- [ ] Mobile (375x667): 1-column stack
- [ ] No horizontal scroll
- [ ] Touch targets ≥ 44px

**Performance:**
- [ ] Page loads < 2 seconds
- [ ] Lighthouse score ≥ 80
- [ ] No render-blocking resources

---

## What We Accomplished

Phase 1 is complete! You now have:
- ✅ Complete marketing website
- ✅ Tailwind CSS with terminal color palette
- ✅ Geist fonts for typography
- ✅ shadcn/ui components (Button, Card, Separator)
- ✅ lucide-react icons
- ✅ Hero with clear value proposition
- ✅ Features showcase (6 cards)
- ✅ Quick start guide with copy-to-clipboard
- ✅ Professional footer
- ✅ Responsive design
- ✅ Enhanced SEO
- ✅ Live on Vercel

**More importantly, you learned:**
- ✅ WHY each dependency is needed
- ✅ WHEN to install packages (progressive disclosure)
- ✅ HOW each tool contributes to the final product

---

## Next Steps

**Phase 2: Visual Polish & Motion** - Add animations and terminal recordings

In Phase 2, we'll add:
1. Terminal recordings (asciinema)
2. Animations (Framer Motion)
3. Enhanced visuals
4. Performance optimizations

See plan: `docs/WEB_DEVELOPMENT_PLAN.md`

---

## References

### Official Documentation
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [lucide-react](https://lucide.dev/)
- [Geist Fonts](https://vercel.com/font)

### Related Papyrus Docs
- Main README: `/CLAUDE.md`
- Development plan: `/docs/WEB_DEVELOPMENT_PLAN.md`
- Tutor principles: `/docs/TUTOR-PRINCIPLES.md`
- Phase 0 tutorial: `/docs/tutorials/web-phase-0-foundation.md`

---

**Congratulations!** You've built a complete marketing website using progressive disclosure.

Each dependency was added ONLY when needed, and you understand WHY it's there! 🚀
