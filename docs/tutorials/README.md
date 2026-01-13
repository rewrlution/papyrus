# Papyrus Web Tutorials

Tutorials for building the Papyrus CLI marketing website.

## 📁 Directory Structure

```
docs/tutorials/
├── README.md                         # This file
│
├── web-phase-0-foundation.md         # Single-file Phase 0 (complete)
├── web-phase-1-mvp-content.md        # Single-file Phase 1 (complete)
│
├── web-phase-0-revised/              # ⭐ RECOMMENDED: Split Phase 0 (progressive)
│   ├── 00-INDEX.md
│   ├── 01-project-setup.md
│   ├── 02-minimal-package.md
│   ├── 03-typescript-config.md
│   ├── 04-nextjs-config.md
│   ├── 05-basic-layout.md
│   ├── 06-basic-page.md
│   ├── 07-test-locally.md
│   └── 08-build-deploy.md
│
├── web-phase-1-revised/              # ⭐ RECOMMENDED: Split Phase 1 (progressive)
│   ├── 00-INDEX.md
│   ├── 01-add-tailwind.md
│   ├── 02-terminal-colors.md
│   ├── 03-add-fonts.md
│   ├── 04-add-utilities.md
│   ├── 05-shadcn-button.md
│   ├── 06-add-icons.md
│   ├── 07-hero-section.md
│   ├── 08-add-card.md
│   ├── 09-features-section.md
│   ├── 10-copy-button.md
│   ├── 11-quick-start.md
│   ├── 12-add-separator.md
│   ├── 13-footer.md
│   └── 14-seo.md
│
├── web-phase-0/                      # OLD: Installs everything upfront
│   └── [11 tutorials]
│
└── web-phase-1/                      # OLD: Assumes all deps installed
    └── [8 tutorials]
```

## 🎯 Which Tutorials to Use?

### **Recommended: Revised Tutorials** ⭐

**Use:**
- `web-phase-0-revised/` - Minimal setup
- `web-phase-1-revised/` - Progressive installation

**Why:**
- ✅ Progressive disclosure principle
- ✅ Install packages ONLY when needed
- ✅ Understand WHY each dependency exists
- ✅ Minimal dependencies in Phase 0
- ✅ No duplicate configs (uses monorepo's)
- ✅ Clear "Why now?" before each step

**Time:** ~4 hours total (1 hour Phase 0, 3 hours Phase 1)

### Single-File Tutorials

**Use:**
- `web-phase-0-foundation.md` - Complete Phase 0 in one file
- `web-phase-1-mvp-content.md` - Complete Phase 1 in one file

**Why:**
- ✅ Quick reference
- ✅ See entire phase at once
- ✅ Progressive approach (updated!)
- ✅ Search friendly (one file to search)

**Time:** ~4 hours total (faster reading, same implementation)

### Old Tutorials (NOT Recommended)

**Avoid:**
- `web-phase-0/` - Installs 20+ packages upfront
- `web-phase-1/` - Assumes everything already installed

**Why avoid:**
- ❌ Installs unnecessary packages early
- ❌ Duplicates monorepo configs
- ❌ No explanation of WHY packages are needed
- ❌ Over-engineered for Phase 0

## 📋 Tutorial Comparison

### Phase 0: Setup

| Aspect | OLD (`web-phase-0/`) | NEW (`web-phase-0-revised/`) |
|--------|---------------------|------------------------------|
| **Tutorials** | 11 files | 8 files |
| **Time** | 2-3 hours | ~1 hour |
| **Dependencies** | 20+ packages | 7 packages |
| **Includes** | Tailwind, shadcn, fonts, icons | Only Next.js + React + TS |
| **Scripts** | Duplicate lint/format | Uses monorepo's |
| **Principle** | Install everything upfront | Minimal working setup |

### Phase 1: Content

| Aspect | OLD (`web-phase-1/`) | NEW (`web-phase-1-revised/`) |
|--------|---------------------|------------------------------|
| **Tutorials** | 8 files | 14 files |
| **Time** | 2-3 hours | ~3 hours |
| **Approach** | Assume deps installed | Install as needed |
| **Learning** | How to build | WHY each dependency |
| **Order** | Components first | Progressive needs |

## 🎓 Learning Philosophy

### Progressive Disclosure

**Old Approach:**
```
Phase 0: Install everything
   ↓
Phase 1: Use some of it
```

**New Approach:**
```
Phase 0: Minimal setup (7 packages)
   ↓
Phase 1 Step 1: Need styling → Install Tailwind
   ↓
Phase 1 Step 2: Need dark theme → Add colors
   ↓
Phase 1 Step 3: Need typography → Add fonts
   ↓
...and so on
```

### Key Principle

**"Why now?" before "How to"**

Every package installation answers:
- **WHAT** the package does
- **WHY** you need it NOW
- **WHEN** to use it

## 🚀 Quick Start

### For Beginners

Start here: **`web-phase-0-revised/00-INDEX.md`**

Then: **`web-phase-1-revised/00-INDEX.md`**

### For Experienced Developers

Read the single files:
1. `web-phase-0-foundation.md`
2. `web-phase-1-mvp-content.md`

They're updated with progressive approach.

## 📚 Additional Resources

- **Development Plan:** `/docs/WEB_DEVELOPMENT_PLAN.md`
- **Tutor Principles:** `/docs/TUTOR-PRINCIPLES.md`
- **Monorepo Guide:** `/CLAUDE.md`

## 🆘 Need Help?

1. Check "Common Issues" in each tutorial
2. Review `/docs/TUTOR-PRINCIPLES.md`
3. Check `/docs/WEB_DEVELOPMENT_PLAN.md`
4. Ask for clarification on unclear steps

---

**Happy learning!** 🎉

Remember: The goal is to understand WHY, not just copy-paste code.
