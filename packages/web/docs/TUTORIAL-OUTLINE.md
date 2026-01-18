# Papyrus Web - Phase 1 Tutorial Outline

This document outlines the tutorials for building the Papyrus marketing website. Each tutorial follows the principles in `WEB-TUTOR-PRINCIPLES.md`.

## Overview

**Phase 1 Goal:** Create a launchable marketing website with complete messaging, features showcase, and clear calls-to-action.

**Target Audience:** Developers familiar with React basics, learning Next.js App Router and Tailwind CSS.

**Prerequisites:**

- Next.js project initialized with Tailwind CSS
- Node.js 18+
- pnpm installed
- Basic React knowledge

---

## Teaching Philosophy

**Top-Down Approach:**

1. First, see the whole page structure (the forest)
2. Then, set up the tools we'll use (shadcn/ui)
3. Then, build each section one by one (the trees)
4. Extract shared components WHEN we need them (not before)

**Progressive Complexity:**

- Start with placeholder content
- Replace placeholders with real components
- Add interactivity when needed
- Extract reusable pieces only when used twice

---

## Tutorial Series Structure

```
Phase 1: MVP Content (Top-Down)
├── Tutorial 1: Page Structure & Setup
│   ├── 1.1 See the complete page layout (placeholders)
│   ├── 1.2 Initialize shadcn/ui
│   └── 1.3 Add lucide-react icons
├── Tutorial 2: Hero Section
│   ├── 2.1 Create Hero with headline and tagline
│   ├── 2.2 Add ASCII logo
│   ├── 2.3 Build InstallCommand component (extracted here)
│   └── 2.4 Add GitHub CTA button
├── Tutorial 3: Features Section
│   ├── 3.1 Define feature data
│   ├── 3.2 Build FeatureCard using shadcn Card
│   └── 3.3 Create responsive grid
├── Tutorial 4: Quick Start Section
│   ├── 4.1 Reuse InstallCommand for package managers
│   ├── 4.2 Build step-by-step guide
│   └── 4.3 Add system requirements
├── Tutorial 5: Footer Section
│   ├── 5.1 Footer layout with grid
│   ├── 5.2 Link groups
│   └── 5.3 Social icons and copyright
├── Tutorial 6: SEO & Polish
│   ├── 6.1 Add metadata for SEO
│   ├── 6.2 Add Open Graph tags
│   └── 6.3 Add favicon
└── Tutorial 7: Testing & Deployment
    ├── 7.1 Responsive testing
    ├── 7.2 Accessibility audit
    └── 7.3 Deploy to Vercel
```

---

## Tutorial 1: Page Structure & Setup

### What We're Building

First, understand the complete page layout. Then set up the tools we'll use.

### Learning Objectives

- See the big picture before diving into details
- Set up shadcn/ui using the CLI
- Understand where each section will go

### Sections

#### 1.1 See the Complete Page Layout

**Goal:** Create the page with placeholder sections so you understand the structure.

**What you'll see:**

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

**Code Output:**

- `app/page.tsx` - Main page with placeholder sections
- `components/sections/hero.tsx` - Placeholder
- `components/sections/features.tsx` - Placeholder
- `components/sections/quick-start.tsx` - Placeholder
- `components/sections/site-footer.tsx` - Placeholder

**Key Principle:** See the forest before the trees.

#### 1.2 Initialize shadcn/ui

**Goal:** Set up shadcn/ui using the CLI (not manually).

**Content:**

- Run `npx shadcn@latest init`
- Understanding what the CLI creates (lib/utils.ts, components.json)
- Add Button component: `npx shadcn@latest add button`
- Add Card component: `npx shadcn@latest add card`

**Code Output:**

- `lib/utils.ts` - Created by CLI
- `components/ui/button.tsx` - Created by CLI
- `components/ui/card.tsx` - Created by CLI
- `components.json` - shadcn configuration

**Key Principle:** Use CLI tools, don't reinvent the wheel.

#### 1.3 Add Icons

**Goal:** Install lucide-react for icons we'll use later.

**Content:**

- `pnpm add lucide-react`
- Brief overview of available icons

### Testing Checklist

- [ ] Page shows 4 placeholder sections
- [ ] shadcn Button component works
- [ ] shadcn Card component works
- [ ] lucide-react icons import correctly

---

## Tutorial 2: Hero Section

### What We're Building

Replace the Hero placeholder with the real hero section.

### Learning Objectives

- Build a marketing hero section
- Handle ASCII art in React
- Create the InstallCommand component (first shared component)
- Use shadcn Button for CTAs

### Sections

#### 2.1 Create Hero with Headline and Tagline

**Goal:** Add the main headline and tagline.

**Content:**

- Replace placeholder with real content
- Responsive typography (text-4xl → text-7xl)
- Terminal color styling

#### 2.2 Add ASCII Logo

**Goal:** Display the Papyrus ASCII logo.

**Content:**

- Using `<pre>` for ASCII art
- Responsive sizing
- Cyan terminal color

#### 2.3 Build InstallCommand Component

**Goal:** Create the npm-style install command with copy button.

**Why now:** We need it for the hero CTA. This is the first place we need copy functionality.

**Content:**

- "use client" directive (needs browser clipboard API)
- useState for copied state
- lucide-react icons (Copy, Check)
- Tailwind styling (no custom theme needed)

**Code Output:**

- `components/shared/install-command.tsx`

**Key Principle:** Extract shared components when first needed, not before.

#### 2.4 Add GitHub CTA Button

**Goal:** Add secondary CTA linking to GitHub.

**Content:**

- shadcn Button with variant="outline"
- GitHub icon from lucide-react
- External link attributes (target="\_blank", rel="noopener")

**Code Output:**

- `components/sections/hero.tsx` (complete)

### Testing Checklist

- [ ] ASCII logo displays correctly
- [ ] Headline is readable at all sizes
- [ ] Install command copies to clipboard
- [ ] GitHub button opens in new tab
- [ ] No horizontal scroll on mobile

---

## Tutorial 3: Features Section

### What We're Building

Replace the Features placeholder with a responsive grid of feature cards.

### Learning Objectives

- Map data to React components
- Use shadcn Card component
- Build responsive grids with Tailwind

### Sections

#### 3.1 Define Feature Data

**Goal:** Create the feature data array.

**Content:**

- TypeScript interface for features
- 6 features with icons, titles, descriptions
- Benefit-focused copy

#### 3.2 Build FeatureCard Using shadcn Card

**Goal:** Create feature cards using shadcn/ui Card.

**Content:**

- Card, CardHeader, CardContent, CardTitle
- Icon styling
- Hover effects with Tailwind

#### 3.3 Create Responsive Grid

**Goal:** Arrange cards in responsive grid (1 → 2 → 3 columns).

**Content:**

- CSS Grid with Tailwind
- Mobile-first breakpoints
- Gap and spacing

**Code Output:**

- `components/sections/features.tsx` (complete)

### Testing Checklist

- [ ] All 6 features display with icons
- [ ] 3 columns on desktop, 2 on tablet, 1 on mobile
- [ ] Hover effects work
- [ ] Cards are accessible

---

## Tutorial 4: Quick Start Section

### What We're Building

Replace the Quick Start placeholder with installation options and getting started steps.

### Learning Objectives

- Reuse the InstallCommand component
- Create step-by-step guides
- Present multiple options clearly

### Sections

#### 4.1 Reuse InstallCommand for Package Managers

**Goal:** Show npm, pnpm, and yarn installation options.

**Content:**

- Reusing InstallCommand from Tutorial 2
- Data array for package managers
- Labels for each option

**Key Principle:** Now we're using InstallCommand twice - extraction was justified.

#### 4.2 Build Step-by-Step Guide

**Goal:** Create 4-step onboarding flow.

**Content:**

- Step data structure
- Numbered indicators
- InstallCommand for each step's command

#### 4.3 Add System Requirements

**Goal:** Show system requirements.

**Content:**

- Simple text display
- Visual separator

**Code Output:**

- `components/sections/quick-start.tsx` (complete)

### Testing Checklist

- [ ] All 3 package manager options shown
- [ ] All 4 steps display correctly
- [ ] Copy buttons work on all commands
- [ ] Responsive: stacks on mobile

---

## Tutorial 5: Footer Section

### What We're Building

Replace the Footer placeholder with links, social icons, and copyright.

### Learning Objectives

- Structure a multi-column footer
- Handle external vs internal links
- Add accessible icon links

### Sections

#### 5.1 Footer Layout with Grid

**Goal:** Create the basic footer grid structure.

**Content:**

- Semantic `<footer>` element
- Grid layout (brand + link columns)
- Border and background styling

#### 5.2 Link Groups

**Goal:** Add Product and Resources link groups.

**Content:**

- Link data structure
- External link handling (target, rel)
- Hover states

#### 5.3 Social Icons and Copyright

**Goal:** Add GitHub/email icons and copyright.

**Content:**

- lucide-react icons (Github, Mail)
- Accessible icon links (aria-label)
- Dynamic copyright year

**Code Output:**

- `components/sections/site-footer.tsx` (complete)

### Testing Checklist

- [ ] All links work
- [ ] External links open in new tab
- [ ] Icons have accessible labels
- [ ] Copyright year is current

---

## Tutorial 6: SEO & Polish

### What We're Building

Add metadata for search engines and social sharing.

### Learning Objectives

- Configure Next.js metadata
- Add Open Graph tags
- Create favicon

### Sections

#### 6.1 Add Metadata for SEO

**Goal:** Add title and description.

**Content:**

- Next.js Metadata API
- Title template
- Description

#### 6.2 Add Open Graph Tags

**Goal:** Optimize social sharing.

**Content:**

- og:title, og:description, og:type
- Twitter card tags

#### 6.3 Add Favicon

**Goal:** Add favicon.

**Content:**

- Using favicon.io generator or simple icon
- Placing in app/favicon.ico

**Code Output:**

- `app/layout.tsx` (updated with metadata)
- `app/favicon.ico`

### Testing Checklist

- [ ] Browser tab shows correct title
- [ ] View source shows meta tags
- [ ] Favicon displays

---

## Tutorial 7: Testing & Deployment

### What We're Building

Verify everything works and deploy to production.

### Learning Objectives

- Test responsive design
- Audit accessibility
- Deploy with Vercel

### Sections

#### 7.1 Responsive Testing

**Goal:** Verify site works on all devices.

**Content:**

- Using browser DevTools
- Viewport sizes to test (375, 768, 1024)
- Common issues checklist

#### 7.2 Accessibility Audit

**Goal:** Ensure site is accessible.

**Content:**

- Keyboard navigation
- Lighthouse accessibility score
- Color contrast

#### 7.3 Deploy to Vercel

**Goal:** Deploy to production.

**Content:**

- Git commit
- Vercel deployment
- Verify production site

### Testing Checklist

- [ ] Lighthouse Accessibility ≥ 90
- [ ] Lighthouse Performance ≥ 80
- [ ] No console errors
- [ ] All features work in production

---

## File Structure After Phase 1

```
packages/web/
├── app/
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx        # With SEO metadata
│   └── page.tsx          # Imports all sections
├── components/
│   ├── sections/
│   │   ├── hero.tsx
│   │   ├── features.tsx
│   │   ├── quick-start.tsx
│   │   └── site-footer.tsx
│   ├── shared/
│   │   └── install-command.tsx  # Extracted in Tutorial 2
│   └── ui/
│       ├── button.tsx    # From shadcn CLI
│       └── card.tsx      # From shadcn CLI
├── lib/
│   └── utils.ts          # From shadcn CLI
└── components.json       # shadcn config
```

---

## Summary

| Tutorial                  | What You Build              | Key Skills               |
| ------------------------- | --------------------------- | ------------------------ |
| 1. Page Structure & Setup | Placeholders + shadcn setup | Top-down view, CLI tools |
| 2. Hero Section           | Hero + InstallCommand       | First shared component   |
| 3. Features Section       | Feature grid                | shadcn Card, CSS Grid    |
| 4. Quick Start Section    | Install options, steps      | Reusing components       |
| 5. Footer Section         | Links, icons                | External links, a11y     |
| 6. SEO & Polish           | Metadata, favicon           | Next.js Metadata API     |
| 7. Testing & Deployment   | Final checks                | Lighthouse, Vercel       |

**Key Principles Applied:**

- **Top-down:** See page structure first (Tutorial 1)
- **Use CLI:** shadcn/ui via CLI, not manual setup (Tutorial 1)
- **Extract when needed:** InstallCommand created in Tutorial 2, reused in Tutorial 4
- **Progressive:** Placeholders → Real content → Polish

---

## Next Phase Preview

**Phase 2: Visual Polish & Motion** will cover:

- Terminal demo recordings (asciinema)
- Scroll animations (Framer Motion)
- Enhanced code highlighting (Shiki)
- Dark/light mode toggle
