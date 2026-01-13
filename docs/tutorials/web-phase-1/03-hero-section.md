# Building the Hero Section

The main hero section with ASCII logo, headline, and call-to-action buttons.

## What We're Building

A `Hero` component that:
- Displays the Papyrus ASCII logo in terminal cyan
- Shows the main headline: "Journal Like You Code"
- Includes a compelling subheadline with value proposition
- Features an install command with integrated CodeBlock
- Provides a GitHub button for secondary action
- Scales responsively across all screen sizes

**Why we need this:** The hero is the first thing visitors see. It must immediately communicate what Papyrus is, who it's for, and how to get started. A strong hero converts browsers into users.

**Expected outcome:** An attention-grabbing, conversion-optimized hero section that sets the tone for the entire site.

## Architecture

```
┌─────────────────────────────────────────┐
│              Hero                       │
│       (Server Component)                │
└───────────────┬─────────────────────────┘
                │
                ├─ ASCII Logo (Papyrus branding)
                ├─ Headline (H1)
                ├─ Subheadline (value prop)
                ├─ <CodeBlock> (install command)
                └─ GitHub Button (secondary CTA)
```

**Why this architecture:**
- **Server Component:** Static content, no client-side interactivity needed
- **Single section component:** All hero content in one file (easy to edit)
- **Embedded CodeBlock:** Reuse component from Tutorial 02
- **Semantic HTML:** `<header>`, `<h1>`, `<p>` for SEO
- **Responsive design:** Mobile-first with Tailwind breakpoints

**Trade-offs considered:**
- Could split into smaller components (Logo, Headline, CTA), but over-componentization hurts readability
- Could make headline configurable via props, but it's static content (no need)
- Could add background animation, but keeping it simple for MVP

## Prerequisites

**Required:**
- Tutorial 01 completed (CopyButton)
- Tutorial 02 completed (CodeBlock)
- Phase 0 completed (Tailwind CSS, fonts)

**Assumed knowledge:**
- Tailwind responsive design (`sm:`, `md:`, `lg:` prefixes)
- Next.js Link component
- Semantic HTML (`<header>`, `<h1>`)

## Implementation

### Step 1: Create the Papyrus ASCII Logo

**Goal:** Create a component for the Papyrus ASCII art logo

First, let's create a dedicated logo component:

```typescript
// components/shared/papyrus-logo.tsx
interface PapyrusLogoProps {
  /**
   * Whether to show the logo in full width (no max-width constraint)
   * @default false
   */
  fullWidth?: boolean;

  /**
   * Optional className for custom styling
   */
  className?: string;
}

export function PapyrusLogo({ fullWidth = false, className = "" }: PapyrusLogoProps) {
  return (
    <pre
      className={`font-mono text-terminal-cyan select-none ${
        fullWidth ? "" : "max-w-full overflow-x-auto"
      } ${className}`}
      aria-label="Papyrus"
    >
      {`
██████╗  █████╗ ██████╗ ██╗   ██╗██████╗ ██╗   ██╗███████╗
██╔══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝██╔══██╗██║   ██║██╔════╝
██████╔╝███████║██████╔╝ ╚████╔╝ ██████╔╝██║   ██║███████╗
██╔═══╝ ██╔══██║██╔═══╝   ╚██╔╝  ██╔══██╗██║   ██║╚════██║
██║     ██║  ██║██║        ██║   ██║  ██║╚██████╔╝███████║
╚═╝     ╚═╝  ╚═╝╚═╝        ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝
      `.trim()}
    </pre>
  );
}
```

**Why this approach:**

**1. Separate Component:**
- Reusable across site (hero, 404 page, footer)
- Easy to update logo styling in one place
- Can control visibility (hide on mobile, show on desktop)

**2. Pre Tag:**
- Preserves ASCII art spacing (critical for alignment)
- Uses monospace font (characters must be equal width)
- `select-none` prevents accidental text selection

**3. Aria Label:**
- Screen readers announce "Papyrus" instead of reading ASCII characters
- Improves accessibility (blind users don't hear gibberish)

**4. Overflow Handling:**
- ASCII art is wide (~60 characters)
- On mobile, can overflow → horizontal scroll
- `overflow-x-auto` allows scrolling to see full logo

### Step 2: Create the Hero Component

**Goal:** Build the complete hero section with all elements

Create the hero section component:

```typescript
// components/sections/hero.tsx
import Link from "next/link";
import { Github } from "lucide-react";
import { CodeBlock } from "@/components/shared/code-block";
import { PapyrusLogo } from "@/components/shared/papyrus-logo";

export function Hero() {
  return (
    <header className="relative overflow-hidden border-b border-terminal-dim/20 bg-terminal-black">
      {/* Container */}
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        {/* Content wrapper - centered */}
        <div className="mx-auto max-w-4xl text-center">
          {/* ASCII Logo */}
          <div className="mb-8 flex justify-center">
            <div className="text-[0.4rem] sm:text-[0.5rem] md:text-[0.6rem] lg:text-xs">
              <PapyrusLogo />
            </div>
          </div>

          {/* Tagline / Subtitle */}
          <div className="mb-4">
            <p className="text-sm font-medium tracking-wide text-terminal-green sm:text-base">
              AI-Powered Journaling for Developers
            </p>
          </div>

          {/* Main Headline (H1) */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-terminal-text sm:text-5xl md:text-6xl lg:text-7xl">
            Journal Like You{" "}
            <span className="text-terminal-cyan">Code</span>
          </h1>

          {/* Subheadline / Value Proposition */}
          <p className="mb-10 text-base leading-relaxed text-terminal-dim sm:text-lg md:text-xl lg:max-w-3xl lg:mx-auto">
            Write, browse, and sync journal entries directly from your terminal.
            No context switching. No distractions. Just you, your thoughts, and
            your favorite editor.
          </p>

          {/* Primary CTA: Install Command */}
          <div className="mb-8 mx-auto max-w-2xl">
            <p className="mb-3 text-sm font-medium text-terminal-text">
              Get started in seconds:
            </p>
            <CodeBlock language="bash">
              npm install -g @rewrlution/papyrus-cli
            </CodeBlock>
          </div>

          {/* Secondary CTA: GitHub Link */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            {/* View on GitHub Button */}
            <Link
              href="https://github.com/rewrlution/papyrus"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-terminal-dim/40 bg-terminal-dim/10 px-6 py-3 font-medium text-terminal-text transition-all hover:border-terminal-cyan hover:bg-terminal-cyan/10 hover:text-terminal-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-terminal-black"
            >
              <Github className="h-5 w-5" />
              <span>View on GitHub</span>
            </Link>

            {/* Optional: Documentation Link */}
            <Link
              href="#quick-start"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-medium text-terminal-dim transition-colors hover:text-terminal-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-terminal-black"
            >
              <span>Quick Start Guide</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Optional: Subtle background gradient */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-terminal-cyan/5 to-transparent"
        aria-hidden="true"
      />
    </header>
  );
}
```

**Why this approach:**

**1. Semantic HTML:**
- `<header>` element for page header section
- `<h1>` for main headline (SEO: only one H1 per page)
- `<p>` for text content (proper document structure)
- `<Link>` for navigation (Next.js component)

**2. Responsive Typography:**
- Mobile: `text-4xl` (2.25rem / 36px)
- Tablet: `text-5xl` to `text-6xl`
- Desktop: `text-7xl` (4.5rem / 72px)
- Scales up with viewport width (progressive enhancement)

**3. Responsive Logo Size:**
- Mobile: `text-[0.4rem]` (very small, ~6px)
- Tablet: `text-[0.5rem]` to `text-[0.6rem]`
- Desktop: `text-xs` (0.75rem / 12px)
- ASCII art scales with font size

**4. Layout Strategy:**
- Centered content (`text-center`, `mx-auto`)
- Max width constraint (`max-w-4xl`) prevents lines from being too wide
- Padding scales with viewport (`py-24` to `py-32`)
- Flex for button group (stacks on mobile, rows on desktop)

**5. Call-to-Action Hierarchy:**
- **Primary CTA:** Install command (most prominent)
- **Secondary CTA:** GitHub button (outlined, less emphasis)
- **Tertiary CTA:** Quick Start link (text only, subtle)
- Order matches user journey: install → explore code → learn more

**6. Accessibility Features:**
- Focus rings on all interactive elements
- External links have `rel="noopener noreferrer"` (security)
- Aria-hidden on decorative elements (gradient)
- Semantic HTML structure (screen reader friendly)

**7. Visual Hierarchy:**
- Tagline: Small, green (supporting text)
- Headline: Largest, white with cyan accent (focal point)
- Subheadline: Medium gray (readable but not competing)
- CTA: Prominent with terminal styling

### Step 3: Understanding Responsive Design Patterns

**Goal:** Learn how Tailwind breakpoints work in this component

Tailwind uses mobile-first breakpoints:

```typescript
// This code:
className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl"

// Means:
// Default (< 640px):  text-4xl  (36px)
// sm (≥ 640px):       text-5xl  (48px)
// md (≥ 768px):       text-6xl  (60px)
// lg (≥ 1024px):      text-7xl  (72px)
```

**Mobile-first strategy:**
1. Write base styles for mobile
2. Add larger breakpoints to enhance for bigger screens
3. Each breakpoint overrides the previous one

**Button stacking example:**
```typescript
className="flex-col sm:flex-row"

// Mobile:  flex-col  (vertical stack)
// Tablet+: flex-row  (horizontal row)
```

**Why mobile-first:**
- Most web traffic is mobile (60%+)
- Easier to enhance up than strip down
- Better performance (fewer overrides)

### Step 4: Add Color Palette Variables

**Goal:** Ensure terminal colors are defined in Tailwind config

Verify your `tailwind.config.ts` has the terminal colors:

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          black: "#0a0e14",      // Background
          text: "#e0e0e0",       // Primary text
          dim: "#666666",        // Secondary text
          cyan: "#00d9ff",       // Primary accent
          green: "#a6e22e",      // Success/accent
          yellow: "#e5c07b",     // Warning/highlight
          red: "#ff6b6b",        // Error
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

**If colors are missing:**
1. Add them to your config
2. Restart dev server (`pnpm dev`)
3. Verify IntelliSense shows `text-terminal-cyan`

### Step 5: Test the Hero Component

**Goal:** Verify the hero renders correctly across all screen sizes

Create a test page:

```typescript
// app/test/hero/page.tsx
import { Hero } from "@/components/sections/hero";

export default function TestHeroPage() {
  return (
    <div className="min-h-screen bg-terminal-black">
      <Hero />

      {/* Spacer to see scroll behavior */}
      <div className="p-8 text-terminal-text">
        <p className="text-center">
          Scroll up to see the hero section
        </p>
      </div>
    </div>
  );
}
```

**How to test:**

1. Start dev server:
   ```bash
   pnpm dev
   ```

2. Visit `http://localhost:3000/test/hero`

3. Test responsive design:
   - Open DevTools (F12)
   - Toggle device toolbar (Cmd/Ctrl + Shift + M)
   - Test breakpoints:
     - Mobile: 375px, 414px
     - Tablet: 768px, 834px
     - Desktop: 1024px, 1440px, 1920px

4. Verify each element:
   - ASCII logo scales appropriately
   - Headline text size increases on larger screens
   - Buttons stack vertically on mobile
   - Buttons display horizontally on tablet+
   - Install command has working copy button

5. Test interactions:
   - Hover GitHub button → Border glows cyan
   - Click GitHub button → Opens in new tab
   - Click Quick Start → Scrolls to anchor (when added)
   - Hover/click copy button in CodeBlock

6. Test accessibility:
   - Tab through all interactive elements
   - Verify focus rings are visible
   - Screen reader announces "Papyrus" for logo

**Expected behavior:**
- ✅ Logo visible and cyan colored
- ✅ Headline large and legible
- ✅ Subheadline clearly communicates value
- ✅ Install command has copy button
- ✅ GitHub button links to repository
- ✅ All text readable on dark background
- ✅ Responsive across all screen sizes

## Common Issues

### Issue: ASCII logo wraps or breaks alignment

**Solution:** Ensure you're using a monospace font and preserving whitespace.

```typescript
// Must use <pre> tag (not <p> or <div>)
<pre className="font-mono">
  {asciiArt}
</pre>

// Verify font-mono is JetBrains Mono (or similar)
```

**Why it happens:** ASCII art requires equal-width characters. Proportional fonts break alignment.

### Issue: Logo too wide on mobile

**Solution:** Scale down the font size for mobile:

```typescript
// Use very small font sizes on mobile
className="text-[0.4rem] sm:text-[0.5rem] md:text-xs"
```

**Alternative:** Hide logo on mobile, show on tablet+:

```typescript
<div className="hidden sm:flex">
  <PapyrusLogo />
</div>
```

**Why it happens:** ASCII art is ~60 characters wide. Mobile screens are ~40 characters at readable font size.

### Issue: Buttons not stacking on mobile

**Solution:** Use `flex-col` as base, then `sm:flex-row`:

```typescript
<div className="flex flex-col gap-4 sm:flex-row">
  <button>Primary</button>
  <button>Secondary</button>
</div>
```

**Why it happens:** If you only specify `flex-row`, it won't stack on mobile.

### Issue: GitHub link doesn't open in new tab

**Solution:** Ensure `target="_blank"` is present:

```typescript
<Link
  href="https://github.com/..."
  target="_blank"
  rel="noopener noreferrer"
>
  View on GitHub
</Link>
```

**Why it happens:** By default, Next.js Link opens in same tab.

**Security note:** Always use `rel="noopener noreferrer"` with `target="_blank"` to prevent security vulnerabilities.

### Issue: Focus rings not visible

**Solution:** Ensure `focus-visible:ring` classes are applied:

```typescript
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-cyan"
```

**Why it happens:** Default focus outline may be hidden by CSS reset.

### Issue: Text too wide on large screens

**Solution:** Add max-width constraint:

```typescript
<p className="max-w-3xl mx-auto">
  Long text that should wrap...
</p>
```

**Why it happens:** Reading long lines is hard (optimal: 60-80 characters). Max-width improves readability.

### Issue: Gradient not visible

**Solution:** Check z-index and positioning:

```typescript
<div className="absolute inset-x-0 top-0 -z-10">
  {/* Gradient */}
</div>
```

**Why it happens:** Gradient may be covering content (wrong z-index).

## Testing

### Manual Testing Checklist

```markdown
**Visual:**
- [ ] ASCII logo displays in cyan
- [ ] Logo scales appropriately on mobile/desktop
- [ ] Headline is large and bold
- [ ] "Code" is highlighted in cyan
- [ ] Subheadline is readable (gray, not too dim)
- [ ] Install command visible in CodeBlock
- [ ] Buttons have correct colors and borders

**Responsive:**
- [ ] Mobile (375px): Logo small, headline 36px, buttons stacked
- [ ] Tablet (768px): Logo medium, headline 60px, buttons row
- [ ] Desktop (1024px+): Logo readable, headline 72px, full width

**Interactive:**
- [ ] Hover GitHub button → Border glows cyan
- [ ] Click GitHub button → Opens new tab
- [ ] Click Quick Start → Smooth scroll (when implemented)
- [ ] Copy button in CodeBlock works
- [ ] Tab navigation works (all elements focusable)

**Accessibility:**
- [ ] Screen reader announces "Papyrus" for logo
- [ ] H1 tag present (only one on page)
- [ ] Focus rings visible on all buttons
- [ ] External link has rel="noopener noreferrer"
- [ ] Color contrast sufficient (4.5:1 minimum)

**Performance:**
- [ ] No layout shift on load (CLS < 0.1)
- [ ] Fast paint (FCP < 1.8s)
- [ ] No console errors
```

### Lighthouse Audit

Run a Lighthouse audit to check performance:

```bash
# Build for production
pnpm build

# Start production server
pnpm start

# Open Chrome DevTools
# Lighthouse tab → Generate report
```

**Target scores:**
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

## Enhancements (Optional)

### Add Animated Gradient Background

Create a subtle animated gradient:

```typescript
<div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
  <div className="absolute -top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-terminal-cyan/20 blur-3xl" />
  <div className="absolute top-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-terminal-green/10 blur-3xl" />
</div>
```

### Add Typing Animation to Headline

Animate the headline text to type out:

```bash
pnpm add typed.js
```

```typescript
"use client";

import { useEffect, useRef } from "react";
import Typed from "typed.js";

export function AnimatedHeadline() {
  const el = useRef(null);

  useEffect(() => {
    const typed = new Typed(el.current, {
      strings: ["Journal Like You Code"],
      typeSpeed: 50,
      showCursor: true,
      cursorChar: "_",
    });

    return () => typed.destroy();
  }, []);

  return <h1 ref={el} />;
}
```

### Add Installation Options Tabs

Let users choose package manager:

```typescript
"use client";

import { useState } from "react";
import { CodeBlock } from "./code-block";

export function InstallTabs() {
  const [manager, setManager] = useState<"npm" | "pnpm" | "yarn">("npm");

  const commands = {
    npm: "npm install -g @rewrlution/papyrus-cli",
    pnpm: "pnpm add -g @rewrlution/papyrus-cli",
    yarn: "yarn global add @rewrlution/papyrus-cli",
  };

  return (
    <div>
      <div className="mb-3 flex gap-2">
        {(["npm", "pnpm", "yarn"] as const).map((pm) => (
          <button
            key={pm}
            onClick={() => setManager(pm)}
            className={/* ... */}
          >
            {pm}
          </button>
        ))}
      </div>
      <CodeBlock language="bash">{commands[manager]}</CodeBlock>
    </div>
  );
}
```

### Add System Requirements Badge

Show compatibility information:

```typescript
<div className="mt-4 flex items-center justify-center gap-2 text-sm text-terminal-dim">
  <span>Requires Node.js 18+</span>
  <span>•</span>
  <span>Works on macOS, Linux, Windows</span>
</div>
```

## Next Steps

Now that you have a compelling hero section:

1. **Continue to Tutorial 04:** [Features Section Component](./04-features-section.md)
   - Build a 6-card features grid
   - Add icons for each feature
   - Create responsive layouts

2. **Explore Next.js Link:** [Next.js Link Docs](https://nextjs.org/docs/app/api-reference/components/link)
   - Client-side navigation
   - Prefetching behavior
   - Scroll restoration

3. **Learn About Web Typography:** [Practical Typography](https://practicaltypography.com/)
   - Font size scales
   - Line height ratios
   - Optimal line lengths

## References

**Next.js:**
- [Link Component](https://nextjs.org/docs/app/api-reference/components/link)
- [Image Component](https://nextjs.org/docs/app/api-reference/components/image)

**Tailwind CSS:**
- [Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Typography](https://tailwindcss.com/docs/font-size)
- [Colors](https://tailwindcss.com/docs/customizing-colors)

**Icons:**
- [Lucide Icons](https://lucide.dev)
- [Heroicons](https://heroicons.com/)

**Accessibility:**
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

**Design:**
- [Linear.app Hero](https://linear.app) - Inspiration
- [Vercel.com Hero](https://vercel.com) - Responsive design
- [Supabase.com Hero](https://supabase.com) - Developer-focused

---

**Time to complete:** 30-40 minutes

**Difficulty:** Intermediate

**Key Takeaways:**
- ✅ Mobile-first responsive design with Tailwind breakpoints
- ✅ Semantic HTML improves SEO and accessibility
- ✅ Visual hierarchy guides user attention (headline → CTA)
- ✅ ASCII art requires monospace fonts and `<pre>` tags
- ✅ External links need `rel="noopener noreferrer"` for security

**Continue to:** [04-features-section.md](./04-features-section.md) →
