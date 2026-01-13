# Phase 1 Revised: MVP Content (Progressive)

Building marketing content by adding features ONLY when needed.

## 🎯 Goal

Create a complete marketing website by progressively adding styling, components, and content - one feature at a time.

## 📚 Tutorial Sequence

Follow these tutorials **in order** - each adds what the next one needs:

### 1. [Add Tailwind CSS](./01-add-tailwind.md) ⏱️ 15 min
**Why now:** Need styling for actual UI components
- Install Tailwind, PostCSS, Autoprefixer
- Configure Tailwind
- Create globals.css
- Test with basic styles

### 2. [Add Terminal Colors](./02-terminal-colors.md) ⏱️ 10 min
**Why now:** Want dark theme for CLI aesthetic
- Configure custom terminal color palette
- Update globals.css with dark theme
- Test colors on page

### 3. [Add Fonts](./03-add-fonts.md) ⏱️ 10 min
**Why now:** Need better typography
- Install Geist Sans and Mono
- Configure font variables
- Update layout with fonts

### 4. [Add Utilities](./04-add-utilities.md) ⏱️ 5 min
**Why now:** Need class merging for components
- Install clsx and tailwind-merge
- Create cn() utility function
- Prepare for shadcn/ui

### 5. [Add shadcn Button](./05-shadcn-button.md) ⏱️ 15 min
**Why now:** Hero section needs CTA button
- Install class-variance-authority
- Configure shadcn/ui
- Create Button component

### 6. [Add Icons](./06-add-icons.md) ⏱️ 5 min
**Why now:** Button needs GitHub icon
- Install lucide-react
- Add icon to button

### 7. [Build Hero Section](./07-hero-section.md) ⏱️ 20 min
**Why now:** First visible content
- Create sections directory
- Build Hero component
- Add ASCII logo, headline, CTA
- Update page to use Hero

### 8. [Add Card Component](./08-add-card.md) ⏱️ 10 min
**Why now:** Features section needs cards
- Create Card component (shadcn)
- Understand Card variants

### 9. [Build Features Section](./09-features-section.md) ⏱️ 20 min
**Why now:** Showcase key features
- Create Features component
- Add 6 feature cards with icons
- Grid layout

### 10. [Build Copy Button](./10-copy-button.md) ⏱️ 10 min
**Why now:** Quick Start needs copy functionality
- Create shared components directory
- Build CopyButton with clipboard API
- Handle client-side interactivity

### 11. [Build Quick Start](./11-quick-start.md) ⏱️ 20 min
**Why now:** Show installation instructions
- Create CodeBlock component
- Build QuickStart section
- Multiple package managers
- 4-step guide

### 12. [Add Separator](./12-add-separator.md) ⏱️ 5 min
**Why now:** Footer needs visual divider
- Create Separator component

### 13. [Build Footer](./13-footer.md) ⏱️ 15 min
**Why now:** Complete the page
- Build SiteFooter component
- Links, contact, copyright
- Update page

### 14. [Enhance SEO](./14-seo.md) ⏱️ 10 min
**Why now:** Ready to launch
- Enhanced metadata
- Open Graph tags
- Twitter cards

---

## 📊 Total Time

**~3 hours** (progressive, educational)

## 🎓 Learning Approach

**Progressive Disclosure:**
- Each step answers "Why now?"
- Install packages only when needed
- Understand the purpose of each dependency
- Build features in logical order

## ✅ What You'll Build

By the end of Phase 1 Revised:
- ✅ Complete marketing website
- ✅ Dark terminal theme
- ✅ Professional typography
- ✅ Interactive components
- ✅ Hero, Features, Quick Start, Footer
- ✅ Copy-to-clipboard functionality
- ✅ Mobile responsive
- ✅ SEO optimized

## 📦 Dependencies Added

Through Phase 1, you'll install (in order):
1. tailwindcss, postcss, autoprefixer
2. geist (fonts)
3. clsx, tailwind-merge
4. class-variance-authority
5. lucide-react

**Total: ~15 packages** (vs 20+ installed upfront in old approach)

## 🧠 Key Principle

**"Why now?" before "How to"**

Every package installation is motivated by a concrete need in the next step. You'll understand:
- WHAT each package does
- WHY you need it
- WHEN to use it

## 🚀 Ready to Start?

Begin with **[01: Add Tailwind CSS](./01-add-tailwind.md)** →

---

**Prerequisite:** [Phase 0 Revised](../web-phase-0-revised/00-INDEX.md) completed
