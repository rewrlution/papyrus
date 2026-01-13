# Phase 0 Revised: Minimal Foundation & Deploy

Getting Next.js running and deployed with ONLY the essentials.

## 🎯 Goal

Get a basic Next.js 15 website deployed to Vercel with minimal dependencies. Add styling and features in Phase 1.

## 📚 Tutorial Sequence

Follow these tutorials **in order**:

### 1. [Project Setup](./01-project-setup.md) ⏱️ 5 min
- Create `packages/web` directory
- Set up minimal folder structure
- No complex configs yet

### 2. [Minimal Package Config](./02-minimal-package.md) ⏱️ 10 min
- Install ONLY: Next.js, React, TypeScript
- Create minimal `package.json`
- Understand why we skip other packages for now

### 3. [TypeScript Config](./03-typescript-config.md) ⏱️ 5 min
- Extend monorepo TypeScript config
- Add Next.js-specific settings
- Configure path aliases

### 4. [Next.js Config](./04-nextjs-config.md) ⏱️ 5 min
- Configure for static export
- Minimal settings only
- Ready for deployment

### 5. [Basic Layout](./05-basic-layout.md) ⏱️ 10 min
- Create root layout (required by Next.js)
- Add basic metadata
- No fonts or styling yet

### 6. [Basic Page](./06-basic-page.md) ⏱️ 5 min
- Create simple home page
- Plain HTML only
- Verify it works

### 7. [Test Locally](./07-test-locally.md) ⏱️ 10 min
- Install dependencies
- Run dev server
- Test the page loads

### 8. [Build & Deploy](./08-build-deploy.md) ⏱️ 20 min
- Build for production
- Deploy to Vercel
- Set up auto-deployment

---

## 📊 Total Time

**~1 hour** (minimal, focused setup)

## ✅ What You'll Have

By the end of Phase 0 Revised:
- ✅ Live Next.js website on Vercel
- ✅ Working CI/CD pipeline
- ✅ Minimal dependencies (only 6 packages!)
- ✅ Clean foundation ready for Phase 1

## ❌ What's NOT Included

(These come in Phase 1 when needed):
- ❌ Tailwind CSS
- ❌ Fonts
- ❌ UI component libraries
- ❌ Icons
- ❌ Styling utilities

## 🎓 Philosophy

**Progressive Disclosure:** Start with the absolute minimum to get deployed. Add features only when you need them in Phase 1.

**Why this approach:**
- Understand WHY each dependency exists
- Avoid unused packages
- Learn incrementally
- Faster setup

## 🚀 Ready to Start?

Begin with **[01-project-setup.md](./01-project-setup.md)** →

---

**Next:** [Phase 1 Revised](../web-phase-1-revised/00-INDEX.md) - Add styling and content progressively
