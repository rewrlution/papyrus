# Phase 0: Foundation & Deploy Pipeline - Tutorial Index

This phase establishes the foundation for the Papyrus CLI marketing website.

## 🎯 Goal

Set up a Next.js 15 marketing website with Tailwind CSS, shadcn/ui, and automated Vercel deployment.

## 📚 Tutorial Sequence

Follow these tutorials **in order**:

### 1. [Project Setup](./01-project-setup.md) ⏱️ 15 min
- Create the `packages/web` directory structure
- Understand monorepo integration
- Set up initial files and folders

### 2. [Package Configuration](./02-package-config.md) ⏱️ 10 min
- Configure `package.json` with all dependencies
- Understand npm scripts
- Learn about workspace dependencies

### 3. [TypeScript Configuration](./03-typescript-config.md) ⏱️ 10 min
- Set up TypeScript for Next.js
- Configure path aliases
- Enable monorepo type references

### 4. [Next.js Configuration](./04-nextjs-config.md) ⏱️ 10 min
- Configure Next.js for static export
- Set up transpilePackages for monorepo
- Understand output modes

### 5. [Tailwind Setup](./05-tailwind-setup.md) ⏱️ 15 min
- Configure Tailwind CSS v4
- Set up terminal color palette
- Add PostCSS configuration

### 6. [Global Styles](./06-global-styles.md) ⏱️ 10 min
- Create CSS variables for theming
- Set up dark mode
- Understand CSS layers

### 7. [Root Layout](./07-root-layout.md) ⏱️ 15 min
- Create root layout with fonts
- Set up metadata for SEO
- Understand Next.js layouts

### 8. [First Page](./08-first-page.md) ⏱️ 10 min
- Create the home page
- Test the dev server
- Verify Tailwind works

### 9. [Utility Functions](./09-utils.md) ⏱️ 5 min
- Create the `cn()` utility
- Understand class merging
- Prepare for shadcn/ui

### 10. [shadcn/ui Setup](./10-shadcn-init.md) ⏱️ 15 min
- Initialize shadcn/ui
- Install first components
- Understand component architecture

### 11. [Deployment](./11-deployment.md) ⏱️ 20 min
- Build for production
- Deploy to Vercel
- Set up auto-deployment

---

## 📊 Total Time Estimate

**2-3 hours** (including reading, typing, and testing)

## ✅ Prerequisites

Before starting:
- [ ] Node.js 20+ installed
- [ ] pnpm 10+ installed
- [ ] Git configured
- [ ] Code editor ready (VS Code recommended)
- [ ] Vercel account created (free tier)
- [ ] GitHub repository access

## 🎓 What You'll Learn

**Technical Skills:**
- Next.js 15 App Router
- Tailwind CSS v4 configuration
- TypeScript in a monorepo
- Static site generation
- Vercel deployment

**Concepts:**
- Monorepo architecture
- Component-based design
- CSS-in-JS with Tailwind
- Modern font loading
- SEO-friendly metadata

## 🏁 Success Criteria

By the end of Phase 0, you'll have:
- ✅ Working Next.js dev server
- ✅ Tailwind CSS with terminal colors
- ✅ shadcn/ui configured
- ✅ Live production URL on Vercel
- ✅ Auto-deployment pipeline
- ✅ Foundation ready for content (Phase 1)

## 🆘 Getting Help

**If you encounter issues:**
1. Check the "Common Issues" section in each tutorial
2. Verify you followed all steps in order
3. Check the main development plan: `/docs/WEB_DEVELOPMENT_PLAN.md`
4. Review TUTOR-PRINCIPLES: `/docs/TUTOR-PRINCIPLES.md`

**Common troubleshooting:**
- Build fails → Check TypeScript errors: `pnpm type-check`
- Styles not working → Restart dev server
- Module not found → Run `pnpm install` from monorepo root

## 📁 Project Structure Preview

After Phase 0, your structure will look like:

```
packages/web/
├── app/
│   ├── layout.tsx           # Root layout with fonts
│   ├── page.tsx             # Home page (basic)
│   ├── globals.css          # Global styles + Tailwind
│   └── favicon.ico          # Browser icon
├── components/
│   └── ui/                  # shadcn components (button, card, etc.)
├── lib/
│   └── utils.ts             # Utility functions
├── public/                  # Static assets
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript config
├── next.config.js           # Next.js config
├── tailwind.config.ts       # Tailwind config
├── postcss.config.js        # PostCSS config
├── .eslintrc.json          # ESLint rules
└── README.md               # Package documentation
```

## 🚀 Ready to Start?

Begin with **[01-project-setup.md](./01-project-setup.md)** →

---

**Tips for Success:**
- 💡 Type the code yourself (don't just copy-paste) to learn better
- 🧪 Test after each tutorial to catch errors early
- 📝 Read the "Why this approach" sections to understand decisions
- ⏸️ Take breaks - don't rush through all 11 tutorials at once
- 🤔 If something doesn't make sense, re-read the explanation section

**Let's build!** 🎉
