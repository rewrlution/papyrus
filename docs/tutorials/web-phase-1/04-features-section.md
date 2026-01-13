# Building the Features Section

A responsive grid showcasing Papyrus CLI's key features with icons and descriptions.

## What We're Building

A `Features` component that:
- Displays 6 feature cards in a responsive grid
- Shows an icon for each feature (using Lucide icons)
- Includes a title and description for each feature
- Adapts layout: 3 columns (desktop), 2 columns (tablet), 1 column (mobile)
- Has subtle hover effects (border color change)
- Uses shadcn/ui Card component for consistent styling

**Why we need this:** Features showcase value propositions. Visitors need to quickly understand what makes Papyrus unique. A scannable grid with icons helps communicate key benefits at a glance.

**Expected outcome:** A professional, visually appealing features section that clearly communicates Papyrus's value to developers.

## Architecture

```
┌─────────────────────────────────────┐
│           Features                  │
│      (Server Component)             │
└──────────────┬──────────────────────┘
               │
               ├─ Section Header (H2)
               └─ Grid Container
                  ├─ FeatureCard (Quick)
                  ├─ FeatureCard (Date-Based)
                  ├─ FeatureCard (TUI)
                  ├─ FeatureCard (Sync)
                  ├─ FeatureCard (Secure)
                  └─ FeatureCard (Local-First)
```

**Why this architecture:**
- **Server Component:** Static content, no client interactivity
- **Single component:** All features in one file (easy to maintain)
- **Grid layout:** CSS Grid for responsive columns
- **shadcn/ui Card:** Consistent design system
- **Icon + Text pattern:** Universal recognition (faster comprehension)

**Trade-offs considered:**
- Could fetch features from CMS/JSON, but static is simpler for MVP
- Could make cards interactive (click to expand), but adds complexity
- Could use custom card design, but shadcn/ui is already configured

## Prerequisites

**Required:**
- Phase 0 completed (shadcn/ui installed)
- `lucide-react` installed (from Tutorial 01)
- Understanding of CSS Grid

**Assumed knowledge:**
- React component composition
- Tailwind CSS Grid utilities
- TypeScript interfaces

## Implementation

### Step 1: Install shadcn/ui Card Component

**Goal:** Add the Card component from shadcn/ui

Install the Card component:

```bash
npx shadcn@latest add card
```

This creates `components/ui/card.tsx` with these exports:
- `Card` - Root container
- `CardHeader` - Top section (title, description)
- `CardTitle` - Title text
- `CardDescription` - Subtitle text
- `CardContent` - Main content area
- `CardFooter` - Bottom section

**Why shadcn/ui:**
- Pre-built accessible components
- Tailwind-based (customizable with utility classes)
- Copy-paste installation (own your code)
- No runtime dependency (just source code)

### Step 2: Define Feature Data Structure

**Goal:** Create a type-safe data structure for features

First, define the feature type:

```typescript
// components/sections/features.tsx
import {
  Zap,
  Calendar,
  Terminal,
  Cloud,
  Lock,
  HardDrive,
  type LucideIcon,
} from "lucide-react";

interface Feature {
  /**
   * Icon component from lucide-react
   */
  icon: LucideIcon;

  /**
   * Feature title (short, actionable)
   */
  title: string;

  /**
   * Feature description (1-2 sentences, value-focused)
   */
  description: string;

  /**
   * Accent color for icon (terminal palette)
   */
  iconColor: string;
}

const features: Feature[] = [
  {
    icon: Zap,
    title: "Quick Journaling",
    description:
      "Write entries in your favorite editor (vim, nano, VS Code). No web forms, no distractions. Just you and your thoughts.",
    iconColor: "text-terminal-yellow",
  },
  {
    icon: Calendar,
    title: "Date-Based Organization",
    description:
      "Entries stored by date (YYYYMMDD format). Find any journal quickly. Time-travel through your thoughts with ease.",
    iconColor: "text-terminal-cyan",
  },
  {
    icon: Terminal,
    title: "Interactive Terminal UI",
    description:
      "Browse journals with vim-style navigation (j/k to scroll). Beautiful TUI built for keyboard warriors. No mouse required.",
    iconColor: "text-terminal-green",
  },
  {
    icon: Cloud,
    title: "Cloud Sync",
    description:
      "Optional cloud backup and sync. Access journals from any device. Your data is encrypted in transit and at rest.",
    iconColor: "text-terminal-cyan",
  },
  {
    icon: Lock,
    title: "Secure & Private",
    description:
      "JWT authentication with encrypted storage. Your journals are yours alone. We can't read them, and neither can anyone else.",
    iconColor: "text-terminal-red",
  },
  {
    icon: HardDrive,
    title: "Local-First Storage",
    description:
      "All entries stored as plain Markdown files. No vendor lock-in. Grep, backup, and version control your journals.",
    iconColor: "text-terminal-green",
  },
];
```

**Why this approach:**

**1. TypeScript Interface:**
- Ensures all features have required fields
- IntelliSense helps while adding new features
- Catches typos at compile time

**2. Lucide Icon Type:**
- `LucideIcon` type ensures valid icon components
- Icons are tree-shakeable (only imported icons bundled)
- Consistent size and styling

**3. Icon Colors from Terminal Palette:**
- Matches brand colors (terminal theme)
- Visual differentiation (easier to scan)
- Semantic meaning (yellow=fast, green=secure, red=important)

**4. Structured Descriptions:**
- 3 sentences pattern: What → Benefit → Detail
- "Quick Journaling" = "Write in editor → No distractions → Just thoughts"
- Focuses on user value (not technical specs)

### Step 3: Create the Features Component

**Goal:** Build the complete features section with grid layout

Create the features component:

```typescript
// components/sections/features.tsx
import {
  Zap,
  Calendar,
  Terminal,
  Cloud,
  Lock,
  HardDrive,
  type LucideIcon,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  iconColor: string;
}

const features: Feature[] = [
  {
    icon: Zap,
    title: "Quick Journaling",
    description:
      "Write entries in your favorite editor (vim, nano, VS Code). No web forms, no distractions. Just you and your thoughts.",
    iconColor: "text-terminal-yellow",
  },
  {
    icon: Calendar,
    title: "Date-Based Organization",
    description:
      "Entries stored by date (YYYYMMDD format). Find any journal quickly. Time-travel through your thoughts with ease.",
    iconColor: "text-terminal-cyan",
  },
  {
    icon: Terminal,
    title: "Interactive Terminal UI",
    description:
      "Browse journals with vim-style navigation (j/k to scroll). Beautiful TUI built for keyboard warriors. No mouse required.",
    iconColor: "text-terminal-green",
  },
  {
    icon: Cloud,
    title: "Cloud Sync",
    description:
      "Optional cloud backup and sync. Access journals from any device. Your data is encrypted in transit and at rest.",
    iconColor: "text-terminal-cyan",
  },
  {
    icon: Lock,
    title: "Secure & Private",
    description:
      "JWT authentication with encrypted storage. Your journals are yours alone. We can't read them, and neither can anyone else.",
    iconColor: "text-terminal-red",
  },
  {
    icon: HardDrive,
    title: "Local-First Storage",
    description:
      "All entries stored as plain Markdown files. No vendor lock-in. Grep, backup, and version control your journals.",
    iconColor: "text-terminal-green",
  },
];

export function Features() {
  return (
    <section
      id="features"
      className="border-b border-terminal-dim/20 bg-terminal-black py-24 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-terminal-text sm:text-4xl md:text-5xl">
            Everything You Need to{" "}
            <span className="text-terminal-cyan">Journal Effectively</span>
          </h2>
          <p className="mt-4 text-base text-terminal-dim sm:text-lg">
            Designed for developers who value speed, privacy, and simplicity.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  iconColor: string;
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  iconColor,
}: FeatureCardProps) {
  return (
    <Card className="group relative overflow-hidden border-terminal-dim/20 bg-terminal-black/50 transition-all duration-300 hover:border-terminal-cyan/40 hover:bg-terminal-dim/5">
      <CardHeader>
        {/* Icon */}
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-terminal-dim/10 transition-colors group-hover:bg-terminal-dim/20">
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>

        {/* Title */}
        <CardTitle className="text-xl font-semibold text-terminal-text">
          {title}
        </CardTitle>

        {/* Description */}
        <CardDescription className="mt-2 text-base text-terminal-dim">
          {description}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
```

**Why this approach:**

**1. Section Container:**
- `<section>` with `id="features"` for anchor links
- Border-bottom separates sections visually
- Padding scales with viewport (`py-24` to `py-32`)

**2. Grid System:**
```typescript
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"

// Mobile:  1 column  (stack all cards)
// Tablet:  2 columns (side-by-side pairs)
// Desktop: 3 columns (full grid)
```

**3. Gap Spacing:**
- `gap-6` (1.5rem / 24px) between cards
- Consistent spacing across all breakpoints
- Responsive (could use `gap-4 sm:gap-6 lg:gap-8` for scaling)

**4. Hover Effects:**
- `group` on Card (parent)
- `group-hover:border-terminal-cyan/40` (glowing border)
- `group-hover:bg-terminal-dim/5` (subtle background)
- `transition-all duration-300` (smooth animation)

**5. Icon Container:**
- Fixed size (`h-12 w-12`) for consistency
- Rounded background (visual weight)
- Hover effect (darker background)
- Flexbox centering (icon always centered)

**6. Semantic HTML:**
- `<section>` for major page section
- `<h2>` for section heading
- `<p>` for section description
- Proper heading hierarchy (H1 → H2 → H3)

**7. Map Over Features:**
- DRY principle (don't repeat card markup)
- Easy to add/remove features (edit array)
- Type-safe with TypeScript

### Step 4: Understanding CSS Grid Responsive Patterns

**Goal:** Learn how grid columns work at different breakpoints

**Mobile-first grid:**
```typescript
// Base (mobile): 1 column
grid-cols-1

// Tablet (≥640px): 2 columns
sm:grid-cols-2

// Desktop (≥1024px): 3 columns
lg:grid-cols-3
```

**Auto-placement:**
- Grid automatically places items in cells
- Items fill row-by-row, left-to-right
- No manual positioning needed

**Example with 6 items:**
```
Mobile (1 col):     Tablet (2 cols):    Desktop (3 cols):
┌─────┐            ┌─────┬─────┐       ┌─────┬─────┬─────┐
│  1  │            │  1  │  2  │       │  1  │  2  │  3  │
├─────┤            ├─────┼─────┤       ├─────┼─────┼─────┤
│  2  │            │  3  │  4  │       │  4  │  5  │  6  │
├─────┤            ├─────┼─────┤       └─────┴─────┴─────┘
│  3  │            │  5  │  6  │
├─────┤            └─────┴─────┘
│  4  │
├─────┤
│  5  │
├─────┤
│  6  │
└─────┘
```

**Why this works:**
- Mobile: Easy to scroll, one feature at a time
- Tablet: Utilizes horizontal space, still readable
- Desktop: Optimal density, scannable at a glance

### Step 5: Customize shadcn/ui Card Styling

**Goal:** Ensure Card component matches terminal theme

Verify the Card component uses terminal colors:

```typescript
// components/ui/card.tsx
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

// ... rest of Card components
```

**Customize if needed:**

If Card doesn't match the terminal theme, override in your component:

```typescript
<Card className="border-terminal-dim/20 bg-terminal-black/50">
  {/* ... */}
</Card>
```

**Why override:**
- shadcn/ui uses CSS variables (`bg-card`, `text-card-foreground`)
- Your theme might not have these defined
- Direct Tailwind classes ensure consistent styling

### Step 6: Test the Component

**Goal:** Verify features render correctly and respond to viewport changes

Create a test page:

```typescript
// app/test/features/page.tsx
import { Features } from "@/components/sections/features";

export default function TestFeaturesPage() {
  return (
    <div className="min-h-screen bg-terminal-black">
      <Features />

      {/* Spacer */}
      <div className="p-8 text-terminal-text text-center">
        <p>Scroll up to see features section</p>
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

2. Visit `http://localhost:3000/test/features`

3. Test responsive grid:
   - Open DevTools (F12)
   - Toggle device toolbar (Cmd/Ctrl + Shift + M)
   - Test breakpoints:
     - Mobile (375px): 1 column
     - Tablet (768px): 2 columns
     - Desktop (1024px): 3 columns
     - Wide (1440px+): 3 columns centered

4. Verify each card:
   - Icon displays correctly
   - Icon has proper color
   - Title is bold and readable
   - Description fits comfortably

5. Test hover effects:
   - Hover over card → Border glows cyan
   - Hover over card → Background lightens slightly
   - Hover over card → Icon background darkens
   - Transition is smooth (300ms)

6. Test accessibility:
   - Screen reader announces section heading
   - Cards are in logical reading order
   - All text is readable (sufficient contrast)

**Expected behavior:**
- ✅ 6 cards display in grid
- ✅ Grid responsive (1/2/3 columns)
- ✅ Icons colored correctly
- ✅ Hover effects smooth
- ✅ Text readable on all backgrounds
- ✅ No horizontal scroll on mobile

## Common Issues

### Issue: Grid not responding to breakpoints

**Solution:** Ensure Tailwind content paths include component directory:

```typescript
// tailwind.config.ts
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}", // Make sure this is included
  ],
}
```

**Why it happens:** Tailwind purges unused classes. If components aren't scanned, classes won't be generated.

### Issue: Icons not rendering

**Solution:** Verify lucide-react is installed and icons imported:

```bash
# Check installation
pnpm list lucide-react

# If not installed
pnpm add lucide-react
```

**Import check:**
```typescript
import { Zap, Calendar, Terminal } from "lucide-react";
// NOT: import Zap from "lucide-react/Zap"
```

**Why it happens:** Wrong import syntax or missing package.

### Issue: Cards all same width on desktop

**Solution:** This is intentional with `grid-cols-3`. If you want cards to be flexible:

```typescript
// Use auto-fit for flexible columns
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-auto-fit"

// Or use flex instead
className="flex flex-wrap gap-6"
```

**Why it happens:** CSS Grid with fixed columns creates equal-width columns.

### Issue: Hover effect not working

**Solution:** Check `group` and `group-hover` classes:

```typescript
// Parent must have "group"
<Card className="group">

// Child uses "group-hover"
<div className="group-hover:bg-terminal-dim/20">
```

**Why it happens:** Tailwind's group-hover variant requires parent with `group` class.

### Issue: Icon background not aligned

**Solution:** Use flexbox centering:

```typescript
<div className="flex h-12 w-12 items-center justify-center">
  <Icon className="h-6 w-6" />
</div>
```

**Why it happens:** Icons need both horizontal and vertical centering.

### Issue: Text overflowing card

**Solution:** Card content should auto-wrap. If not, check for fixed widths:

```typescript
// Remove any max-width or w-* classes on description
<CardDescription className="text-base">
  {description}
</CardDescription>
```

**Why it happens:** Fixed widths prevent text wrapping.

### Issue: Colors not showing

**Solution:** Verify terminal colors in Tailwind config:

```typescript
// tailwind.config.ts
colors: {
  terminal: {
    yellow: "#e5c07b",
    cyan: "#00d9ff",
    green: "#a6e22e",
    red: "#ff6b6b",
  },
}
```

**Why it happens:** Custom colors need to be defined in config.

## Testing

### Manual Testing Checklist

```markdown
**Layout:**
- [ ] Mobile (375px): 1 column, cards stacked
- [ ] Tablet (768px): 2 columns, 3 rows
- [ ] Desktop (1024px+): 3 columns, 2 rows
- [ ] All cards equal height in same row
- [ ] Consistent gap spacing between cards

**Content:**
- [ ] All 6 features display
- [ ] Each card has an icon
- [ ] Each card has a title
- [ ] Each card has a description
- [ ] Icons have correct colors (yellow, cyan, green, red)

**Interactive:**
- [ ] Hover card → Border glows cyan
- [ ] Hover card → Background lightens
- [ ] Hover card → Icon background darkens
- [ ] Transitions smooth (no jank)
- [ ] Mobile: Tap has visual feedback

**Accessibility:**
- [ ] Section has id="features" (for anchor links)
- [ ] Heading is H2 (proper hierarchy)
- [ ] Text contrast sufficient (WCAG AA)
- [ ] No interactive elements (cards are static)

**Visual:**
- [ ] Icons centered in background circle
- [ ] Text aligned left
- [ ] Card borders subtle but visible
- [ ] Hover state clearly different from default
```

### Responsive Testing Script

Test all breakpoints systematically:

```bash
# Mobile
375px width  → Should see 1 column

# Tablet
640px width  → Should see 2 columns (breakpoint)
768px width  → Should see 2 columns
834px width  → Should see 2 columns

# Desktop
1024px width → Should see 3 columns (breakpoint)
1280px width → Should see 3 columns
1440px width → Should see 3 columns
1920px width → Should see 3 columns (centered with max-width)
```

## Enhancements (Optional)

### Add Feature Statistics

Include numbers for credibility:

```typescript
{
  icon: Zap,
  title: "Quick Journaling",
  description: "Write entries in seconds, not minutes...",
  stat: "< 5 sec",
  statLabel: "to create entry",
}

// In component:
<div className="mt-4 flex items-baseline gap-2">
  <span className="text-2xl font-bold text-terminal-cyan">
    {feature.stat}
  </span>
  <span className="text-sm text-terminal-dim">
    {feature.statLabel}
  </span>
</div>
```

### Add Expandable Descriptions

Show more details on click:

```typescript
"use client";

import { useState } from "react";

function ExpandableFeatureCard({ feature }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card onClick={() => setExpanded(!expanded)}>
      <CardHeader>
        {/* Icon, Title, Description */}
      </CardHeader>

      {expanded && (
        <CardContent>
          <ul className="space-y-2 text-sm text-terminal-dim">
            <li>• Supports all text editors</li>
            <li>• Autosaves on exit</li>
            <li>• Template support</li>
          </ul>
        </CardContent>
      )}
    </Card>
  );
}
```

### Add Animation on Scroll

Reveal cards as user scrolls:

```bash
pnpm add framer-motion
```

```typescript
"use client";

import { motion } from "framer-motion";

export function Features() {
  return (
    <section>
      <div className="grid">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            <FeatureCard {...feature} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
```

### Add "Learn More" Links

Link to documentation pages:

```typescript
{
  icon: Terminal,
  title: "Interactive Terminal UI",
  description: "...",
  learnMoreUrl: "/docs/terminal-ui",
}

// In component:
<CardFooter>
  <Link href={feature.learnMoreUrl}>
    Learn more →
  </Link>
</CardFooter>
```

## Next Steps

Now that you have a compelling features section:

1. **Continue to Tutorial 05:** [Quick Start Section Component](./05-quick-start-section.md)
   - Build installation guide
   - Create 4-step getting started
   - Add system requirements

2. **Explore CSS Grid:** [CSS Tricks Grid Guide](https://css-tricks.com/snippets/css/complete-guide-grid/)
   - Advanced grid patterns
   - Grid template areas
   - Auto-placement algorithms

3. **Learn About Card Patterns:** [shadcn/ui Card](https://ui.shadcn.com/docs/components/card)
   - Card variants
   - Composition patterns
   - Accessibility features

## References

**Component Libraries:**
- [shadcn/ui Card](https://ui.shadcn.com/docs/components/card)
- [Radix UI](https://www.radix-ui.com/) (shadcn/ui's foundation)

**Icons:**
- [Lucide Icons](https://lucide.dev)
- [Icon best practices](https://www.nngroup.com/articles/icon-usability/)

**CSS Grid:**
- [CSS Grid Guide](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [Grid by Example](https://gridbyexample.com/)

**Design Inspiration:**
- [Linear Features](https://linear.app) - Clean card grid
- [Vercel Features](https://vercel.com) - Hover effects
- [Supabase Features](https://supabase.com) - Icon + text pattern

---

**Time to complete:** 30-40 minutes

**Difficulty:** Intermediate

**Key Takeaways:**
- ✅ CSS Grid enables responsive layouts with minimal code
- ✅ Icons improve scannability and comprehension
- ✅ Hover effects add polish without overwhelming
- ✅ Feature descriptions should focus on user value, not specs
- ✅ Type-safe data structures prevent errors

**Continue to:** [05-quick-start-section.md](./05-quick-start-section.md) →
