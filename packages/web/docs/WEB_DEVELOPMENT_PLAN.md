# Papyrus CLI Marketing Website - Development Plan

This document outlines the phased development plan for the Papyrus CLI marketing website.

## 🎯 Project Overview

**Goal:** Create a modern, performant marketing website for Papyrus CLI that showcases its features and drives adoption.

**Target Audience:**

- Developers who work primarily in the terminal
- Engineers who value privacy and local-first tools
- Tech professionals who want to journal without context switching
- CLI enthusiasts who prefer keyboard-driven workflows

**Tech Stack:**

- **Framework:** Next.js 15 (App Router, Static Site Generation)
- **Styling:** Tailwind CSS v4
- **Components:** shadcn/ui (Radix UI primitives)
- **Fonts:** Geist Sans + JetBrains Mono
- **Animations:** Framer Motion (Phase 2)
- **Deployment:** Vercel (free tier)

---

## 📋 Development Phases

### Phase 0: Foundation & Deploy Pipeline (Days 1-2)

**Goal:** Establish infrastructure and deploy pipeline

**Deliverables:**

- ✅ Next.js 15 app with App Router configured
- ✅ Tailwind CSS v4 setup with terminal color palette
- ✅ shadcn/ui initialized and configured
- ✅ Basic layout structure (Header, Footer, Container)
- ✅ Dark theme foundation
- ✅ Vercel deployment pipeline
- ✅ Live URL with basic landing page

**Tech Debt Risk:** ⚠️ Low - Pure foundation work

**Effort:** 4-6 hours

**Tutorial:** See `docs/tutorials/web-phase-0-foundation.md`

---

### Phase 1: MVP Content (Days 3-5)

**Goal:** Launchable marketing site with all core messaging

**Deliverables:**

**1.1 Hero Section**

- Headline: "Journal Like You Code" or "AI-Powered Journaling for Developers"
- Subheadline with value proposition
- Primary CTA: Install command with copy button
- Secondary CTA: GitHub link
- Simple terminal aesthetic background

**1.2 Features Grid**

- 6 feature cards:
  1. ⚡ Quick Journaling (write in your editor)
  2. 📅 Date-Based Organization (YYYYMMDD format)
  3. 🎨 Interactive Terminal UI (vim-style navigation)
  4. ☁️ Cloud Sync (optional backup)
  5. 🔐 Secure & Private (JWT auth, encrypted)
  6. 💾 Local-First (plain markdown)
- Icon/emoji for each
- Title + description
- Responsive grid layout

**1.3 Quick Start Section**

- Installation commands (npm, pnpm, yarn)
- Copy-to-clipboard buttons
- 4-step getting started guide:
  1. Install
  2. Register
  3. Start journaling (`papyrus add`)
  4. Browse entries (`papyrus app`)
- Syntax-highlighted code blocks (using Shiki)

**1.4 Footer**

- Navigation links: GitHub, Docs, Issues
- Email: rewrlution@gmail.com
- Copyright & MIT License
- Social links (if applicable)
- "Made with ❤️ by developers, for developers"

**1.5 Basic SEO**

- Meta tags (title, description, keywords)
- Open Graph tags for social sharing
- Favicon
- Responsive design

**Tech Debt Risk:** ✅ Very Low - Clean, simple components

**Effort:** 12-16 hours

**Tutorial:** See `docs/tutorials/web-phase-1-mvp-content.md`

---

### Phase 2: Visual Polish & Motion (Days 6-8)

**Goal:** Make it "wow" with animations and real demos

**Deliverables:**

**2.1 Terminal Recordings** (REQUIRES USER ACTION)
Create 3-5 terminal recordings using [asciinema](https://asciinema.org/):

1. `papyrus add` flow (30 sec)
2. `papyrus app` browsing (30 sec)
3. `papyrus sync` workflow (20 sec)
4. Full onboarding flow (60 sec)
5. Optional: vim navigation showcase

**Recording tips:**

- Clean terminal, no clutter
- Good typing speed, no typos
- Show real content (not lorem ipsum)
- Keep videos under 60 seconds

**2.2 Integrate Terminal Demos**

- Install `asciinema-player`
- Embed recordings in hero section
- Add recordings to features section
- Play/pause controls
- Lazy load videos for performance

**2.3 Animations**

- Install Framer Motion
- Hero section: Fade in on load
- Features: Scroll-triggered reveals (stagger effect)
- Buttons: Hover effects
- Smooth page transitions
- Terminal cursor blinking animation

**2.4 Enhanced Visuals**

- Terminal color accents (green success, cyan info, yellow warning)
- Subtle gradients or noise textures
- Better icons (Lucide React)
- Screenshot PNGs from actual CLI usage
- Terminal window frames for code blocks

**Tech Debt Risk:** ⚠️ Low-Medium - Keep animations simple

**Effort:** 8-12 hours

**Tutorial:** TBD (will be created in Phase 2)

---

### Phase 3: Growth & Optimization (Days 9-10)

**Goal:** SEO, analytics, and conversion optimization

**Deliverables:**

**3.1 Analytics**

- Enable Vercel Analytics (built-in)
- Track events:
  - Install command copies
  - GitHub link clicks
  - Page views and bounce rate
  - Time on page

**3.2 SEO Enhancements**

- Generate `sitemap.xml`
- Add structured data (JSON-LD)
- Optimize all images (WebP format, proper sizes)
- Add `robots.txt`
- Submit to Google Search Console
- Add canonical URLs

**3.3 Additional Content**

- "Who's It For?" section (3 personas):
  1. The Terminal Devotee
  2. The Privacy-Conscious Developer
  3. The Reflective Engineer
- Comparison table (Papyrus vs alternatives)
- Community/Support section
- FAQ section (if needed)
- Technical specs section

**3.4 Performance Audit**

- Lighthouse score check (target: 90+)
- Optimize bundle size
- Lazy load below-the-fold content
- Image optimization review
- Mobile testing (responsive design)
- Accessibility audit (WCAG compliance)

**Tech Debt Risk:** ✅ Very Low - Standard optimizations

**Effort:** 4-6 hours

**Tutorial:** TBD (will be created in Phase 3)

---

### Phase 4: Nice-to-Haves (Future)

**Goal:** Polish and extras (build only if needed)

**Potential additions:**

- Blog section (Next.js MDX)
- Changelog page (auto-generated from GitHub releases)
- Interactive playground (embed terminal in browser)
- Newsletter signup (email list)
- Dark/Light mode toggle
- Keyboard shortcuts showcase (interactive demo)
- Testimonials/social proof
- Video tutorial section
- Community showcase (featured journals, use cases)

**Build these only if:**

- Phases 1-3 are deployed and working
- You're getting user traction
- Users are explicitly asking for them

---

## 📊 Summary Timeline

| Phase   | Duration | Effort | Deploy?           | Priority |
| ------- | -------- | ------ | ----------------- | -------- |
| Phase 0 | 1-2 days | 4-6h   | ✅ Yes            | **P0**   |
| Phase 1 | 3-5 days | 12-16h | ✅ **MVP LAUNCH** | **P0**   |
| Phase 2 | 2-3 days | 8-12h  | ✅ Yes            | **P1**   |
| Phase 3 | 1-2 days | 4-6h   | ✅ Yes            | **P2**   |
| Phase 4 | TBD      | TBD    | Optional          | P3       |

**Total (Phases 0-3):** ~10 days of work (spread over 2-3 weeks)

---

## 🎨 Design Direction

### Visual Style

- **Dark theme** (primary) - terminal aesthetic
- **Monospace fonts** for code/terminal content
- **Terminal color palette:**
  - Background: `#0a0a0a` (terminal black)
  - Primary: `#00ff00` or `#00d9ff` (terminal green/cyan)
  - Accent: `#ffdd00` (terminal yellow)
  - Text: `#e0e0e0` (light gray)
  - Dim: `#666666` (dark gray)

### Typography

- **UI Text:** Geist Sans (clean, modern)
- **Code/Terminal:** JetBrains Mono (with ligatures)
- **Scale:** Base 16px, headings 1.5-3rem

### Components

- **Minimalist** - Clean, focused, no clutter
- **Animated terminals** - Show actual CLI usage
- **Code snippets** - Syntax highlighted with copy buttons
- **Cards** - Subtle borders, no heavy shadows
- **Buttons** - Terminal-style (outlined, fill on hover)

---

## 🛠️ Monorepo Integration

### Package Structure

Add `packages/web` to the existing monorepo:

```
packages/
├── cli/              # Command-line interface
├── api/              # Backend API server
├── shared/           # Shared types and utilities
└── web/              # Marketing website (NEW)
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   └── globals.css
    ├── components/
    │   ├── ui/           # shadcn components
    │   ├── sections/     # Hero, Features, etc.
    │   └── shared/       # Header, Footer, etc.
    ├── lib/
    │   └── utils.ts
    ├── public/
    │   └── assets/
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.ts
    └── next.config.js
```

### Workspace Integration

```json
// packages/web/package.json
{
  "name": "@rewrlution/papyrus-web",
  "dependencies": {
    "@rewrlution/papyrus-shared": "workspace:*" // Share types!
  }
}
```

**Benefits:**

- Share TypeScript types between CLI, API, and Web
- Consistent date formats, schemas
- Single monorepo for all Papyrus projects
- Easy to transition to web app later

---

## 🚀 Development Workflow

### Initial Setup

```bash
# From monorepo root
cd packages/web

# Install dependencies (pnpm handles workspace)
pnpm install

# Run dev server
pnpm dev

# Open http://localhost:3000
```

### Development Commands

```bash
# Development
pnpm dev              # Start Next.js dev server (localhost:3000)

# Build
pnpm build            # Build for production (static export)
pnpm start            # Preview production build locally

# Lint & Format
pnpm lint             # Run ESLint
pnpm format           # Run Prettier

# Type Checking
pnpm type-check       # Run TypeScript compiler
```

### Deployment Workflow

1. **Connect to Vercel:**
   - Sign up at [vercel.com](https://vercel.com)
   - Import GitHub repository
   - Select `packages/web` as root directory
   - Framework preset: Next.js
   - Build command: `cd ../.. && pnpm build --filter=@rewrlution/papyrus-web`
   - Output directory: `packages/web/.next`

2. **Auto-Deploy:**
   - Push to branch → Vercel auto-deploys
   - Preview URLs for each commit
   - Production deploy on merge to main

3. **Custom Domain (Optional):**
   - Add domain in Vercel dashboard
   - Update DNS records
   - SSL auto-configured

---

## 🛡️ Tech Debt Prevention

### Component Organization

```
components/
├── ui/                    # shadcn components (copy-paste from shadcn/ui)
│   ├── button.tsx
│   ├── card.tsx
│   └── ...
├── sections/              # Page sections (one file per section)
│   ├── hero.tsx
│   ├── features.tsx
│   ├── quick-start.tsx
│   └── footer.tsx
└── shared/                # Reusable across sections
    ├── header.tsx
    ├── copy-button.tsx
    └── code-block.tsx
```

### Best Practices

1. **Keep Components Small**
   - Each section in its own file
   - Extract at 3rd use, not before
   - Max 200 lines per component

2. **TypeScript Strictly**
   - No `any` types
   - Props interfaces for all components
   - Use types from `@rewrlution/papyrus-shared` when applicable

3. **Tailwind Patterns**
   - Use `cn()` helper for conditional classes
   - Extract repeated patterns to components
   - Keep class strings readable

4. **Performance First**
   - Next.js `<Image>` for all images
   - Lazy load heavy components (`dynamic` import)
   - Use `loading="lazy"` for iframes

5. **Accessibility**
   - Semantic HTML (`<nav>`, `<main>`, `<section>`)
   - ARIA labels for icon buttons
   - Keyboard navigation support
   - Color contrast (WCAG AA minimum)

---

## 📝 Content Writing Guidelines

### Tone & Voice

- **Professional but friendly** - Talk like a developer, not a marketer
- **Concise** - Developers are busy, get to the point
- **Honest** - No hype, no fluff, no "revolutionary" claims
- **Technical** - It's okay to use technical terms (terminal, markdown, etc.)

### Headlines

- **Hero:** "Journal Like You Code" or "AI-Powered Journaling for Developers"
- **Features:** Action-oriented ("Write in Your Editor", not "Editor Integration")
- **CTAs:** Direct ("Install Now", "View on GitHub", not "Get Started")

### Copy Length

- **Hero subheadline:** 15-20 words max
- **Feature descriptions:** 15-25 words
- **Quick start steps:** 5-10 words per step
- **Footer links:** 1-2 words

---

## 🎯 Success Metrics

### Phase 1 (MVP Launch)

- [ ] Site live on Vercel
- [ ] All core messaging complete
- [ ] Mobile responsive
- [ ] Basic SEO tags
- [ ] Copy button works
- [ ] GitHub link works

### Phase 2 (Polish)

- [ ] Terminal demos embedded
- [ ] Animations smooth
- [ ] Lighthouse score 80+
- [ ] No console errors
- [ ] Fast page load (<2s)

### Phase 3 (Growth)

- [ ] Lighthouse score 90+
- [ ] Analytics tracking
- [ ] Sitemap generated
- [ ] Submitted to search engines
- [ ] All content sections complete

### User Metrics (Post-Launch)

- Install command copies (track with analytics)
- GitHub link clicks
- Time on page
- Bounce rate
- npm downloads (external metric)

---

## 🔗 References

### Technologies

- [Next.js 15 Docs](https://nextjs.org/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Vercel Deployment](https://vercel.com/docs)

### Design Inspiration

- [Linear.app](https://linear.app) - Clean, dark, minimal
- [Supabase.com](https://supabase.com) - Developer-focused
- [shadcn.com](https://ui.shadcn.com) - Beautiful components
- [Vercel.com](https://vercel.com) - Modern layout

### Content Examples

- [Warp Terminal](https://www.warp.dev/) - Dev tool marketing
- [Raycast](https://www.raycast.com/) - Keyboard-first UX
- [Fig](https://fig.io/) - Terminal tool marketing

---

## 📞 Questions & Support

If you have questions while implementing:

1. Check the tutorials in `docs/tutorials/`
2. Review the TUTOR-PRINCIPLES in `docs/TUTOR-PRINCIPLES.md`
3. Refer to package docs: `packages/web/README.md` (created in Phase 0)

---

**Next Steps:**

1. Start with Phase 0: `docs/tutorials/web-phase-0-foundation.md`
2. Follow the tutorial step-by-step
3. Deploy to Vercel
4. Move to Phase 1: `docs/tutorials/web-phase-1-mvp-content.md`

**Happy building!** 🚀
