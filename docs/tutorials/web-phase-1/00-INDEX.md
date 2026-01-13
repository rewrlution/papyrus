# Phase 1: MVP Content - Tutorial Index

This phase builds the core marketing content for the Papyrus CLI website.

## 🎯 Goal

Create a launchable marketing website with complete messaging, features showcase, and clear calls-to-action.

## 📚 Tutorial Sequence

Follow these tutorials **in order**:

### 1. [Copy Button Component](./01-copy-button.md) ⏱️ 20 min
- Build reusable copy-to-clipboard button
- Understand client-side interactions
- Learn React state management
- Add visual feedback

### 2. [Code Block Component](./02-code-block.md) ⏱️ 15 min
- Create syntax-highlighted code blocks
- Integrate copy button
- Style for terminal aesthetic
- Handle overflow on mobile

### 3. [Hero Section](./03-hero-section.md) ⏱️ 30 min
- Build hero with ASCII logo
- Add headline and value proposition
- Create primary CTA (install command)
- Add secondary CTA (GitHub link)
- Make responsive

### 4. [Features Section](./04-features-section.md) ⏱️ 30 min
- Create 6 feature cards
- Add icons and descriptions
- Build responsive grid (3-2-1 columns)
- Add hover effects

### 5. [Quick Start Section](./05-quick-start-section.md) ⏱️ 25 min
- Show installation options (npm, pnpm, yarn)
- Create 4-step getting started guide
- Add system requirements
- Style with terminal theme

### 6. [Footer Section](./06-footer-section.md) ⏱️ 20 min
- Build footer with links
- Add social icons
- Include contact information
- Add copyright and license

### 7. [Compose Home Page](./07-compose-page.md) ⏱️ 15 min
- Import all sections
- Compose into single page
- Test layout and spacing
- Verify responsive design

### 8. [SEO Optimization](./08-seo-optimization.md) ⏱️ 30 min
- **Learn SEO fundamentals**
- Update metadata for search engines
- Add Open Graph tags
- Configure Twitter Cards
- Add structured data
- Create favicon

### 9. [Testing & Deployment](./09-testing-deployment.md) ⏱️ 25 min
- Test responsive design
- Run accessibility audit
- Check performance
- Build for production
- Deploy to Vercel
- Verify live site

---

## 📊 Total Time Estimate

**3-4 hours** (including reading, coding, and testing)

## ✅ Prerequisites

Before starting:
- [ ] Phase 0 completed (foundation setup)
- [ ] Dev server working (`pnpm dev`)
- [ ] shadcn/ui installed
- [ ] Understanding of React components
- [ ] Basic Tailwind CSS knowledge

## 🎓 What You'll Learn

**Technical Skills:**
- React component composition
- Client-side interactions ("use client")
- Responsive design patterns
- SEO best practices
- Accessibility guidelines

**Concepts:**
- Component architecture (sections vs shared)
- Progressive enhancement
- Mobile-first design
- SEO fundamentals (NEW!)
- Meta tags and social sharing
- Web performance

## 🏁 Success Criteria

By the end of Phase 1, you'll have:
- ✅ Complete marketing website
- ✅ All content sections (Hero, Features, Quick Start, Footer)
- ✅ Copy-to-clipboard functionality
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ SEO-optimized metadata
- ✅ Accessible to all users
- ✅ Live on Vercel
- ✅ Ready to share publicly

## 📖 SEO Learning Module

Tutorial 08 includes a comprehensive SEO guide covering:

### What is SEO?
- How search engines work
- Why SEO matters for marketing sites
- Key ranking factors

### Technical SEO
- Title tags and meta descriptions
- Heading hierarchy (H1, H2, H3)
- Semantic HTML
- Page load speed

### Social Media SEO
- Open Graph (Facebook, LinkedIn)
- Twitter Cards
- Preview images (og:image)

### Structured Data
- JSON-LD format
- Schema.org types
- Rich snippets

**No prior SEO knowledge required!** The tutorial explains everything from scratch.

## 🆘 Getting Help

**If you encounter issues:**
1. Check the "Common Issues" section in each tutorial
2. Verify all previous tutorials completed successfully
3. Check browser console for errors
4. Test in different browsers

**Common troubleshooting:**
- Copy button not working → Check HTTPS or localhost
- Layout broken → Check Tailwind config content paths
- Icons missing → Verify lucide-react installed
- Build fails → Run `pnpm type-check`

## 📁 What We'll Build

### Component Structure

```
components/
├── sections/               # Large page sections
│   ├── hero.tsx           # Hero with logo and CTAs
│   ├── features.tsx       # 6 feature cards grid
│   ├── quick-start.tsx    # Installation guide
│   └── site-footer.tsx    # Footer with links
└── shared/                # Reusable components
    ├── copy-button.tsx    # Copy to clipboard
    └── code-block.tsx     # Code with syntax highlighting
```

### Final Page Structure

```
app/page.tsx
├── <Hero />
├── <Features />
├── <QuickStart />
└── <SiteFooter />
```

## 🎨 Design System

### Typography Scale
- Hero headline: `text-4xl` to `text-7xl` (responsive)
- Section headings: `text-3xl` to `text-5xl`
- Body text: `text-base` to `text-lg`
- Small text: `text-sm`

### Color Palette
- Background: `bg-terminal-black` (#0a0e14)
- Text: `text-terminal-text` (#e0e0e0)
- Primary: `text-terminal-cyan` (#00d9ff)
- Accent: `text-terminal-green` (#a6e22e)
- Warning: `text-terminal-yellow` (#e5c07b)

### Spacing System
- Section padding: `py-24` (6rem top/bottom)
- Section margins: `mb-16` (4rem between sections)
- Container: `max-w-7xl mx-auto px-6`

### Responsive Breakpoints
- Mobile: `< 640px` (sm)
- Tablet: `640px - 1024px` (md, lg)
- Desktop: `> 1024px` (xl, 2xl)

## 🚀 Ready to Start?

Begin with **[01-copy-button.md](./01-copy-button.md)** →

---

## 💡 Tips for Success

**Coding:**
- Type code yourself (builds muscle memory)
- Use TypeScript strict mode (catch errors early)
- Test each component immediately (don't wait until the end)
- Use browser DevTools (inspect elements, check console)

**Design:**
- Test on mobile first (easiest to scale up)
- Use browser responsive mode (Cmd/Ctrl + Shift + M)
- Check color contrast (use DevTools accessibility panel)
- Test with screen reader (basic navigation)

**SEO:**
- Read tutorial 08 carefully (foundational knowledge)
- Check preview in browser (view page source)
- Test social previews (use opengraph.xyz or twitter validator)
- Measure performance (Lighthouse in DevTools)

**Deployment:**
- Commit often (git commit after each tutorial)
- Test production build locally (pnpm build && pnpm start)
- Check Vercel preview (every push gets a URL)
- Share for feedback early (don't wait for perfection)

---

## 📋 Tutorial Checklist

Track your progress:

- [ ] 01. Copy Button Component
- [ ] 02. Code Block Component
- [ ] 03. Hero Section
- [ ] 04. Features Section
- [ ] 05. Quick Start Section
- [ ] 06. Footer Section
- [ ] 07. Compose Home Page
- [ ] 08. SEO Optimization (Learn SEO!)
- [ ] 09. Testing & Deployment

**Estimated completion time:** One afternoon or two short sessions.

---

## 🎯 What Happens After Phase 1?

After completing Phase 1, you'll have a **launchable MVP**:
- ✅ Share on Twitter, Reddit, Hacker News
- ✅ Get feedback from users
- ✅ Measure analytics (clicks, installs)

**Phase 2 (Optional):**
- Add terminal recordings (asciinema)
- Add animations (Framer Motion)
- Create visual demos
- Polish interactions

**Phase 3 (Optional):**
- Advanced SEO (sitemap, robots.txt)
- Analytics integration
- Additional content sections
- Performance optimizations

**But first, let's build Phase 1!** 🚀

---

**Continue to:** [01-copy-button.md](./01-copy-button.md) →
