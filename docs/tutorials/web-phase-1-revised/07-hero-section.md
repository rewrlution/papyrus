# 07: Build Hero Section

**Why now:** Create the first thing visitors see - the main value proposition.

## Goal

Build Hero section with ASCII logo, headline, and CTAs using components we've installed.

## Prerequisites

At this point you should have:
- ✅ Tailwind CSS with terminal colors
- ✅ Geist fonts
- ✅ cn() utility
- ✅ Button component (shadcn)
- ✅ lucide-react icons

## Step 1: Create Sections Directory

```bash
mkdir -p components/sections
```

## Step 2: Create Hero Component

Create `components/sections/hero.tsx`:

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

## Step 3: Update Page

Update `app/page.tsx`:

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

## Step 4: Verify

```bash
pnpm dev
```

Should see:
- ASCII logo in cyan
- Large headline
- Install command in terminal-style box
- GitHub button with icon
- Responsive on mobile

## Component Breakdown

**Uses all components we've added:**
- Tailwind terminal colors ✅
- Geist fonts ✅
- Button component ✅
- Github icon from lucide-react ✅
- Responsive utilities ✅

**Why this order:**
Each component was added ONLY when needed for this Hero section!

## Next

→ [08: Add Card Component](./08-add-card.md) - Prepare for Features section
