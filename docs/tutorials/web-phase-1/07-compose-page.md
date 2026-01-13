# Composing the Home Page

Bringing all sections together into a complete, production-ready landing page.

## What We're Building

The main `app/page.tsx` file that:
- Imports all section components (Hero, Features, QuickStart, Footer)
- Renders sections in logical order
- Uses semantic HTML structure (`<main>`, `<section>`)
- Ensures smooth anchor link navigation
- Provides a cohesive user experience

**Why we need this:** Individual components are useless without a page to render them. This tutorial assembles all our work into a complete, shippable marketing site.

**Expected outcome:** A fully functional landing page that visitors can navigate, read, and convert (install Papyrus).

## Architecture

```
┌─────────────────────────────────────┐
│        app/page.tsx                 │
│     (Server Component)              │
└──────────────┬──────────────────────┘
               │
               ├─ <Hero />
               ├─ <Features />
               ├─ <QuickStart />
               └─ <SiteFooter />
```

**Why this architecture:**
- **Server Component:** All sections are static (no client-side JavaScript needed)
- **Single page:** Marketing sites are often one-page (no routing needed)
- **Linear flow:** Hero → Features → Quick Start → Footer (conversion funnel)
- **Semantic HTML:** Proper document structure for SEO

**Trade-offs considered:**
- Could split into multiple pages (/features, /docs), but one-page is simpler for MVP
- Could add header navigation, but anchor links from footer work fine
- Could add scroll animations, but keeping it simple initially

## Prerequisites

**Required:**
- Tutorials 01-06 completed (all components built)
- Understanding of Next.js App Router
- Understanding of React component composition

**Assumed knowledge:**
- Next.js file-based routing
- Server Components vs. Client Components
- Semantic HTML (`<main>`, `<header>`, `<footer>`)

## Implementation

### Step 1: Create the Home Page

**Goal:** Compose all sections into the main landing page

Update or create the home page:

```typescript
// app/page.tsx
import { Hero } from "@/components/sections/hero";
import { Features } from "@/components/sections/features";
import { QuickStart } from "@/components/sections/quick-start";
import { SiteFooter } from "@/components/sections/site-footer";

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <Hero />

      {/* Main Content */}
      <main>
        {/* Features Section */}
        <Features />

        {/* Quick Start Section */}
        <QuickStart />
      </main>

      {/* Site Footer */}
      <SiteFooter />
    </>
  );
}
```

**Why this approach:**

**1. Semantic HTML Structure:**
- Hero uses `<header>` internally (page header)
- Main content wrapped in `<main>` (primary content)
- Footer uses `<footer>` internally (page footer)
- Screen readers and search engines understand document structure

**2. No Additional Wrapper:**
- Each section manages its own layout (padding, max-width)
- No need for extra `<div>` containers
- Cleaner DOM structure

**3. Server Component (default):**
- No `"use client"` directive needed
- Entire page rendered on server
- Better performance (smaller bundle, faster load)
- Better SEO (content available to crawlers)

**4. Import Path Aliases:**
```typescript
import { Hero } from "@/components/sections/hero";

// "@/" refers to project root (configured in tsconfig.json)
// Cleaner than: "../../components/sections/hero"
```

### Step 2: Verify Import Paths

**Goal:** Ensure all components are exported and importable

Check that all components export correctly:

```typescript
// components/sections/hero.tsx
export function Hero() { /* ... */ }

// components/sections/features.tsx
export function Features() { /* ... */ }

// components/sections/quick-start.tsx
export function QuickStart() { /* ... */ }

// components/sections/site-footer.tsx
export function SiteFooter() { /* ... */ }
```

**If you encounter import errors:**

1. Check file names match import paths
2. Ensure components use named exports (not default exports)
3. Verify `@` alias is configured in `tsconfig.json`:

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Step 3: Test the Complete Page

**Goal:** Verify all sections render and layout looks correct

View the page:

```bash
# Start dev server
pnpm dev

# Visit home page
open http://localhost:3000
```

**What to check:**

1. **Visual inspection:**
   - Hero displays at top
   - Features section below hero
   - Quick Start section below features
   - Footer at bottom

2. **Spacing:**
   - Each section has appropriate padding
   - No double borders between sections
   - Consistent spacing throughout

3. **Scroll behavior:**
   - Smooth scrolling (if configured)
   - All sections visible on scroll
   - Footer appears when scrolled to bottom

4. **Anchor links:**
   - Click footer link to `#features` → Scrolls to Features section
   - Click footer link to `#quick-start` → Scrolls to Quick Start section
   - URL updates to include hash (`/#features`)

5. **Responsive design:**
   - Mobile (375px): All sections stack vertically
   - Tablet (768px): Grid layouts adjust (2 columns)
   - Desktop (1024px+): Full grid layouts (3 columns)

**Expected behavior:**
- ✅ All sections visible
- ✅ Proper visual hierarchy (Hero → Features → Quick Start → Footer)
- ✅ Anchor links work
- ✅ Responsive across all breakpoints
- ✅ No console errors
- ✅ No layout shifts

### Step 4: Add Smooth Scrolling (Optional)

**Goal:** Enhance anchor link navigation with smooth scrolling

Add smooth scrolling behavior to the entire page:

```typescript
// app/globals.css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* Enable smooth scrolling for anchor links */
  html {
    scroll-behavior: smooth;
  }

  /* Prevent layout shift from scrollbar */
  html {
    overflow-y: scroll;
  }
}
```

**Why this helps:**
- Anchor links animate smoothly instead of jumping
- Better UX (users see the transition)
- No JavaScript required (pure CSS)

**Alternative (JavaScript approach):**

```typescript
// For more control over scroll behavior
"use client";

import { useEffect } from "react";

export default function HomePage() {
  useEffect(() => {
    // Handle anchor link clicks
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLAnchorElement;
      if (target.hash) {
        e.preventDefault();
        const element = document.querySelector(target.hash);
        element?.scrollIntoView({ behavior: "smooth" });
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <>
      <Hero />
      {/* ... */}
    </>
  );
}
```

**For MVP:** Use CSS approach (simpler, no JavaScript needed).

### Step 5: Add Metadata for SEO

**Goal:** Prepare the page for search engines (full SEO in Tutorial 08)

Add basic metadata to the page:

```typescript
// app/page.tsx
import { Metadata } from "next";
import { Hero } from "@/components/sections/hero";
import { Features } from "@/components/sections/features";
import { QuickStart } from "@/components/sections/quick-start";
import { SiteFooter } from "@/components/sections/site-footer";

export const metadata: Metadata = {
  title: "Papyrus CLI - Journal Like You Code",
  description:
    "AI-powered journaling for developers. Write, browse, and sync journal entries directly from your terminal. No context switching. No distractions.",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <main>
        <Features />
        <QuickStart />
      </main>
      <SiteFooter />
    </>
  );
}
```

**Why add metadata:**
- Search engines use title and description
- Social media uses these for link previews
- Browser tab shows the title
- Better discoverability

**Note:** Tutorial 08 will cover comprehensive SEO (Open Graph, Twitter Cards, etc.).

### Step 6: Test Full User Journey

**Goal:** Simulate a real visitor's experience

Walk through the complete user journey:

**Scenario 1: First-time visitor**
1. Lands on home page (`/`)
2. Reads hero headline and subheadline
3. Clicks copy button on install command
4. Scrolls down to read features
5. Continues to Quick Start section
6. Copies more commands
7. Clicks GitHub link in footer (opens new tab)

**Scenario 2: Returning visitor**
1. Lands on home page from email/tweet
2. Scrolls directly to Quick Start (knows what Papyrus is)
3. Copies commands
4. Leaves to install

**Scenario 3: Mobile user**
1. Taps install command copy button
2. Swipes to read features
3. Taps GitHub link (opens in-app browser)

**Test each scenario:**
- Does the page load fast? (< 2 seconds)
- Is the value proposition clear? (within 5 seconds)
- Are CTAs obvious? (copy button, GitHub link)
- Can you complete the journey without friction?

### Step 7: Performance Check

**Goal:** Ensure the page loads quickly

Run a quick performance check:

```bash
# Build for production
pnpm build

# Start production server
pnpm start

# Open browser
open http://localhost:3000
```

**Check Chrome DevTools:**

1. Open DevTools (F12)
2. Go to Network tab
3. Refresh page (Cmd/Ctrl + R)
4. Check metrics:
   - **Page size:** Should be < 500KB (without images)
   - **Load time:** Should be < 2 seconds (local)
   - **Requests:** Should be < 20 (fewer is better)

5. Go to Lighthouse tab
6. Run audit (Mobile + Desktop)
7. Check scores:
   - **Performance:** Should be 80+ (90+ ideal)
   - **Accessibility:** Should be 90+
   - **Best Practices:** Should be 90+
   - **SEO:** Should be 80+ (will improve in Tutorial 08)

**If scores are low:**
- Check for console errors
- Ensure images are optimized (Next.js `<Image>`)
- Verify no blocking scripts
- Check for unused CSS/JS

**Note:** Tutorial 09 will cover comprehensive performance testing.

## Common Issues

### Issue: Section IDs not matching anchor links

**Solution:** Verify each section has the correct `id` attribute:

```typescript
// components/sections/features.tsx
<section id="features">
  {/* ... */}
</section>

// components/sections/quick-start.tsx
<section id="quick-start">
  {/* ... */}
</section>
```

**Why it happens:** Anchor links like `#features` need matching `id="features"` to work.

### Issue: Double borders between sections

**Solution:** Each section should have only `border-bottom`, not `border-top`:

```typescript
// Correct:
<section className="border-b border-terminal-dim/20">

// Wrong:
<section className="border-y border-terminal-dim/20">  // Both top and bottom
```

**Why it happens:** Adjacent sections with `border-bottom` create single borders. Top borders would double.

### Issue: Footer not at bottom of page

**Solution:** Ensure layout uses flex:

```typescript
// app/layout.tsx
<body className="flex min-h-screen flex-col">
  {children}
</body>

// app/page.tsx
<main className="flex-1">
  {/* sections */}
</main>
```

**Why it happens:** Footer needs content to push it down (flex-1 on main).

### Issue: Import errors ("Cannot find module")

**Solution:** Check file paths and exports:

```bash
# File exists?
ls components/sections/hero.tsx

# Named export?
grep "export function Hero" components/sections/hero.tsx

# Alias configured?
cat tsconfig.json | grep "@"
```

**Why it happens:** Typo in file name, missing export, or misconfigured path alias.

### Issue: Sections overlapping or misaligned

**Solution:** Check each section manages its own padding:

```typescript
// Each section should have:
<section className="py-24 sm:py-32">
  <div className="mx-auto max-w-7xl px-6 lg:px-8">
    {/* Content */}
  </div>
</section>
```

**Why it happens:** Inconsistent padding or missing container divs.

### Issue: Console errors in production build

**Solution:** Check the build output:

```bash
pnpm build

# Look for errors in output
# Fix any TypeScript errors
# Re-run build
```

**Why it happens:** Development server is more lenient than production build.

## Testing

### Visual Testing Checklist

```markdown
**Layout:**
- [ ] Hero at top (full width)
- [ ] Features below hero
- [ ] Quick Start below features
- [ ] Footer at bottom
- [ ] No gaps between sections
- [ ] No double borders between sections
- [ ] Consistent padding on all sections

**Content:**
- [ ] Hero headline visible
- [ ] Install command in hero
- [ ] 6 feature cards displayed
- [ ] 4 quick start steps visible
- [ ] Footer links all present
- [ ] All text readable

**Responsive:**
- [ ] Mobile (375px): Sections stack vertically
- [ ] Tablet (768px): Grids adjust (2 columns)
- [ ] Desktop (1024px+): Full layout (3 columns)
- [ ] Logo scales appropriately
- [ ] No horizontal scroll on any breakpoint

**Interactive:**
- [ ] All copy buttons work
- [ ] Anchor links scroll to sections
- [ ] GitHub links open in new tab
- [ ] Email link opens mail client
- [ ] Smooth scroll enabled
```

### User Journey Testing

```markdown
**First-time visitor:**
- [ ] Understands what Papyrus is (< 5 sec)
- [ ] Sees clear CTA (install command)
- [ ] Can copy install command (1 click)
- [ ] Learns key features (scan features section)
- [ ] Knows next steps (Quick Start section)

**Returning visitor:**
- [ ] Can quickly find install command (hero)
- [ ] Can jump to Quick Start (footer link)
- [ ] Can access GitHub (footer link)

**Mobile user:**
- [ ] Can tap copy button (large enough)
- [ ] Can read all text (no tiny fonts)
- [ ] Can scroll smoothly (no jank)
- [ ] Can navigate to all sections
```

### Performance Testing Checklist

```markdown
- [ ] Build succeeds without errors
- [ ] Production build < 500KB
- [ ] Page loads < 2 seconds (local)
- [ ] Lighthouse Performance score > 80
- [ ] Lighthouse Accessibility score > 90
- [ ] No console errors in production
- [ ] No layout shift (CLS < 0.1)
```

## Enhancements (Optional)

### Add Scroll Progress Indicator

Show scroll progress at top of page:

```typescript
"use client";

import { useEffect, useState } from "react";

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      setProgress(scrollPercent);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-terminal-dim/20">
      <div
        className="h-full bg-terminal-cyan transition-all"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
```

### Add "Skip to Content" Link

Accessibility for keyboard users:

```typescript
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-terminal-cyan focus:px-4 focus:py-2 focus:text-terminal-black"
>
  Skip to main content
</a>

<main id="main-content">
  {/* ... */}
</main>
```

### Add Loading State

Show loading indicator while page loads:

```typescript
"use client";

import { useState, useEffect } from "react";

export function LoadingScreen() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-50 bg-terminal-black flex items-center justify-center">
      <div className="animate-pulse text-terminal-cyan">
        Loading...
      </div>
    </div>
  );
}
```

### Add Scroll-to-Top Button

Appears after scrolling down:

```typescript
"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 500);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-8 right-8 z-40 rounded-full bg-terminal-cyan p-3 text-terminal-black shadow-lg transition-all hover:scale-110"
      aria-label="Scroll to top"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
```

## Next Steps

Now that you have a complete landing page:

1. **Continue to Tutorial 08:** [SEO Optimization](./08-seo-optimization.md)
   - **Learn SEO fundamentals** (how search engines work)
   - Add comprehensive metadata
   - Implement Open Graph tags
   - Add structured data

2. **Review Next.js Layouts:** [Next.js Layouts Docs](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts)
   - Root layout vs. page layouts
   - Layout composition patterns
   - Metadata in layouts

3. **Explore Composition Patterns:** [Component Composition](https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children)
   - Children props
   - Render props
   - Compound components

## References

**Next.js:**
- [Pages and Layouts](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts)
- [Metadata Object](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [File Conventions](https://nextjs.org/docs/app/api-reference/file-conventions)

**React:**
- [Component Composition](https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children)
- [Server Components](https://react.dev/reference/react/use-server)

**Web Performance:**
- [Core Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview/)

**Accessibility:**
- [Skip Links](https://webaim.org/techniques/skipnav/)
- [Semantic HTML](https://developer.mozilla.org/en-US/docs/Glossary/Semantics#semantic_elements)

---

**Time to complete:** 15-20 minutes

**Difficulty:** Beginner

**Key Takeaways:**
- ✅ Semantic HTML structure improves SEO and accessibility
- ✅ Server Components are default in Next.js 15 (better performance)
- ✅ Each section should manage its own layout (padding, max-width)
- ✅ Anchor links require matching `id` attributes on sections
- ✅ Always test the complete user journey, not just individual components

**Continue to:** [08-seo-optimization.md](./08-seo-optimization.md) →
