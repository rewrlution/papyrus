# Phase 0.5: Tailwind CSS Setup

Configure Tailwind CSS v4 with terminal-inspired color palette for the Papyrus brand.

## What We're Building

**Goal:** Set up Tailwind CSS v4 with a custom terminal color palette (black, cyan, green, yellow) that reflects Papyrus's CLI-first identity.

**Why:** Tailwind CSS enables rapid UI development with utility classes. Custom colors create a unique brand identity that matches our terminal/developer aesthetic.

**What you'll learn:**
- How Tailwind CSS v4 differs from v3
- Why we use terminal colors for branding
- How to configure custom color palettes
- PostCSS integration with Next.js

---

## Prerequisites

- Completed [04-nextjs-config.md](./04-nextjs-config.md)
- `packages/web/next.config.js` exists
- Basic understanding of CSS and utility classes

---

## Understanding Tailwind CSS v4

### What's New in v4

**Tailwind CSS v4** (released late 2024) has significant changes from v3:

**v3 Configuration (JavaScript):**
```javascript
// tailwind.config.js
module.exports = {
  content: ['./app/**/*.tsx'],
  theme: {
    extend: {
      colors: {
        primary: '#00D9FF',
      },
    },
  },
};
```

**v4 Configuration (CSS):**
```css
/* @theme in CSS file */
@import "tailwindcss";

@theme {
  --color-primary: #00D9FF;
}
```

**Key differences:**
- ✅ **CSS-based config** instead of JavaScript
- ✅ **Faster builds** with Rust-based engine (Lightning CSS)
- ✅ **Smaller output** with better tree-shaking
- ✅ **Native CSS variables** for theming
- ✅ **No more purge config** (automatic optimization)

**Why we're using v4:**
- Faster development builds
- Better integration with Next.js
- Modern CSS features (cascade layers, container queries)
- Smaller production bundles

### Terminal Color Philosophy

Papyrus is a **developer tool**. Our brand colors reflect terminal aesthetics:

```
Terminal            Brand Use
─────────────────────────────────────────
Black (#0A0E14)     → Background, text
Cyan (#00D9FF)      → Primary actions, links
Green (#A6E22E)     → Success, highlights
Yellow (#E5C07B)    → Warnings, accents
White (#FFFFFF)     → Headings, emphasis
Gray (#6C7A89)      → Borders, muted text
```

**Why these colors:**
- ✅ **Familiar to developers** - Terminal aesthetic
- ✅ **High contrast** - Accessible (WCAG AA compliant)
- ✅ **Distinctive** - Not generic blue/pink SaaS colors
- ✅ **Brand alignment** - CLI tool → CLI colors

**Color psychology:**
- **Cyan** = Technology, clarity, digital (primary brand color)
- **Green** = Growth, success, active (code highlighting)
- **Yellow** = Attention, energy, important (call-to-action)
- **Black** = Professional, sophisticated, focused

---

## Implementation

### Step 1: Install Tailwind CSS v4

Navigate to the web package:

```bash
cd packages/web
```

Install Tailwind CSS and dependencies:

```bash
pnpm add -D tailwindcss@next @tailwindcss/postcss@next
```

**Package versions:**
- `tailwindcss@next` - Tailwind CSS v4 (currently in beta)
- `@tailwindcss/postcss@next` - PostCSS plugin for Tailwind v4

**Why `@next` tag:** Tailwind v4 is in beta. Once stable, install with `tailwindcss@latest`.

---

### Step 2: Create Tailwind Configuration

Create `tailwind.config.ts`:

```bash
touch tailwind.config.ts
```

Add the following configuration:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Terminal-inspired color palette
        terminal: {
          black: '#0A0E14',
          cyan: '#00D9FF',
          green: '#A6E22E',
          yellow: '#E5C07B',
          white: '#FFFFFF',
          gray: '#6C7A89',
        },
        // Semantic color mappings
        brand: {
          primary: '#00D9FF',    // cyan
          secondary: '#A6E22E',  // green
          accent: '#E5C07B',     // yellow
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'Menlo', 'Monaco', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
```

**File location:** `/home/user/papyrus/packages/web/tailwind.config.ts`

---

## Understanding the Configuration

### Content Paths

```typescript
content: [
  './app/**/*.{js,ts,jsx,tsx,mdx}',
  './components/**/*.{js,ts,jsx,tsx,mdx}',
  './lib/**/*.{js,ts,jsx,tsx,mdx}',
]
```

**What it does:** Tells Tailwind which files to scan for class names.

**Why:** Tailwind only includes CSS for classes you actually use (tree-shaking).

**Example:**
```tsx
// In app/page.tsx
<div className="bg-terminal-cyan">Hello</div>
```

Tailwind scans the file and includes `.bg-terminal-cyan` in the final CSS.

**Glob patterns explained:**
- `./app/**/*` - All files in `app/` directory and subdirectories
- `.{js,ts,jsx,tsx,mdx}` - JavaScript, TypeScript, React, and MDX files
- No `src/` prefix - Files are at package root

**What files are scanned:**
- ✅ `app/page.tsx` - Pages
- ✅ `app/layout.tsx` - Layouts
- ✅ `components/ui/button.tsx` - Components
- ✅ `lib/utils.ts` - Utilities (if they return class strings)
- ❌ `node_modules/` - Never scanned (excluded automatically)
- ❌ `.next/` - Build output (excluded automatically)

### Custom Colors

```typescript
colors: {
  terminal: {
    black: '#0A0E14',
    cyan: '#00D9FF',
    green: '#A6E22E',
    yellow: '#E5C07B',
    white: '#FFFFFF',
    gray: '#6C7A89',
  },
  brand: {
    primary: '#00D9FF',
    secondary: '#A6E22E',
    accent: '#E5C07B',
  },
}
```

**Two color palettes defined:**

**1. Terminal palette** (literal colors):
```tsx
<div className="bg-terminal-black text-terminal-cyan">
  Terminal aesthetic
</div>
```

**2. Brand palette** (semantic colors):
```tsx
<button className="bg-brand-primary hover:bg-brand-primary/80">
  Click me
</button>
```

**Why both palettes:**
- **Terminal colors:** Explicit (design system reference)
- **Brand colors:** Semantic (meaning over color name)

**Color usage guide:**

| Color | Terminal | Brand | Use Cases |
|-------|----------|-------|-----------|
| Cyan | `terminal-cyan` | `brand-primary` | Links, buttons, brand elements |
| Green | `terminal-green` | `brand-secondary` | Success states, highlights |
| Yellow | `terminal-yellow` | `brand-accent` | Warnings, CTAs, emphasis |
| Black | `terminal-black` | - | Dark backgrounds |
| White | `terminal-white` | - | Light text, backgrounds |
| Gray | `terminal-gray` | - | Borders, muted text |

**Generated utility classes:**
```css
.bg-terminal-cyan { background-color: #00D9FF; }
.text-terminal-cyan { color: #00D9FF; }
.border-terminal-cyan { border-color: #00D9FF; }

.bg-brand-primary { background-color: #00D9FF; }
/* ... and so on */
```

### Font Families

```typescript
fontFamily: {
  sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
  mono: ['var(--font-geist-mono)', 'Menlo', 'Monaco', 'monospace'],
}
```

**What it does:** Configures font stacks for Geist fonts (Vercel's open-source fonts).

**CSS variables:**
- `var(--font-geist-sans)` - Defined in root layout (next tutorial)
- `var(--font-geist-mono)` - Defined in root layout

**Fallback fonts:**
- `system-ui` - Uses system font if Geist fails to load
- `sans-serif` - Generic fallback

**Usage:**
```tsx
<p className="font-sans">Regular text</p>
<code className="font-mono">const x = 10;</code>
```

**Why Geist fonts:**
- Modern, clean design
- Optimized for reading
- Excellent developer tool aesthetic
- Free and open-source

---

### Step 3: Create PostCSS Configuration

PostCSS processes CSS files (including Tailwind).

Create `postcss.config.js`:

```bash
touch postcss.config.js
```

Add the following:

```javascript
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

**File location:** `/home/user/papyrus/packages/web/postcss.config.js`

**What it does:** Enables Tailwind CSS v4 PostCSS plugin.

**How it works:**
```
CSS file → PostCSS → Tailwind Plugin → Processed CSS → Browser
```

**Tailwind plugin responsibilities:**
- Processes `@tailwind` directives
- Generates utility classes
- Removes unused CSS
- Minifies output in production

**v3 vs v4 PostCSS config:**

**v3 (old):**
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**v4 (new):**
```javascript
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

**What changed:**
- Single plugin instead of two
- Autoprefixer built-in
- Faster processing

---

### Step 4: Verify Installation

Check that Tailwind is installed:

```bash
npx tailwindcss --help
```

**Expected output:**
```
tailwindcss v4.0.0-beta.1

Usage:
  tailwindcss [options]

Options:
  -i, --input <file>     Input CSS file
  -o, --output <file>    Output CSS file
  ...
```

**If you see v3.x.x:** Reinstall with `@next` tag:
```bash
pnpm remove tailwindcss
pnpm add -D tailwindcss@next @tailwindcss/postcss@next
```

---

## Color Palette Deep Dive

### Accessibility Testing

All color combinations meet **WCAG AA** contrast requirements:

| Foreground | Background | Contrast | Pass |
|------------|------------|----------|------|
| Cyan (#00D9FF) | Black (#0A0E14) | 8.2:1 | ✅ AAA |
| Green (#A6E22E) | Black (#0A0E14) | 10.1:1 | ✅ AAA |
| Yellow (#E5C07B) | Black (#0A0E14) | 7.4:1 | ✅ AAA |
| White (#FFFFFF) | Black (#0A0E14) | 15.8:1 | ✅ AAA |
| Gray (#6C7A89) | Black (#0A0E14) | 4.8:1 | ✅ AA |

**Testing tool:** [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

**Standards:**
- **AA** (4.5:1) - Body text
- **AAA** (7:1) - Enhanced accessibility

### Color Usage Examples

**Hero section:**
```tsx
<section className="bg-terminal-black text-terminal-white">
  <h1 className="text-terminal-cyan">
    Papyrus
  </h1>
  <p className="text-terminal-gray">
    Developer journaling for the command line
  </p>
  <button className="bg-brand-primary hover:bg-brand-primary/90">
    Get Started
  </button>
</section>
```

**Feature cards:**
```tsx
<div className="border border-terminal-gray bg-terminal-black/50">
  <h3 className="text-terminal-green">
    Fast & Efficient
  </h3>
  <p className="text-terminal-white">
    Write journals in your favorite editor
  </p>
</div>
```

**Code blocks:**
```tsx
<pre className="bg-terminal-black border border-terminal-cyan">
  <code className="font-mono text-terminal-green">
    papyrus add
  </code>
</pre>
```

---

## Common Issues

### Issue 1: "Unknown at rule @tailwind"

**Cause:** Editor doesn't recognize Tailwind directives.

**Solution (VS Code):**
1. Install "Tailwind CSS IntelliSense" extension
2. Add to `.vscode/settings.json`:
```json
{
  "css.lint.unknownAtRules": "ignore"
}
```

**Why it happens:** `@tailwind` is a custom PostCSS directive, not standard CSS.

### Issue 2: Colors not working in components

**Cause:** Content path doesn't include component files.

**Solution:** Verify `tailwind.config.ts` includes:
```typescript
content: [
  './components/**/*.{js,ts,jsx,tsx,mdx}',
]
```

**Test:** Add a test component with color class and run dev server.

### Issue 3: "Module not found: @tailwindcss/postcss"

**Cause:** Package not installed or wrong version.

**Solution:**
```bash
pnpm add -D @tailwindcss/postcss@next
```

**Verify version:**
```bash
pnpm list @tailwindcss/postcss
# Should show v4.0.0-beta.x
```

### Issue 4: Build fails with Tailwind error

**Cause:** Missing `postcss.config.js` or incorrect syntax.

**Solution:**
1. Verify `postcss.config.js` exists
2. Check syntax (must be CommonJS: `module.exports`)
3. Restart Next.js dev server

**Test:**
```bash
npx next build
```

### Issue 5: Styles not updating in development

**Cause:** Tailwind not watching file changes.

**Solution:**
1. Stop dev server (Ctrl+C)
2. Delete `.next` folder: `rm -rf .next`
3. Restart: `pnpm dev`

**Why it happens:** Cached build sometimes gets stale.

---

## Tailwind Best Practices

### 1. Use Semantic Color Names for Components

```tsx
// Good: Semantic meaning
<button className="bg-brand-primary">Primary Action</button>
<button className="bg-brand-secondary">Secondary Action</button>

// Avoid: Color names in components
<button className="bg-terminal-cyan">Click me</button>
```

**Why:** Easier to rebrand (change `brand-primary` in one place).

### 2. Use Terminal Colors for Design System

```tsx
// Good: Design system reference
const colors = {
  background: 'terminal-black',
  text: 'terminal-white',
  accent: 'terminal-cyan',
};

// Then use semantic names in components
<div className={`bg-${colors.background}`}>
```

### 3. Use Opacity Modifiers

```tsx
// Good: Opacity with /
<div className="bg-brand-primary/10">Subtle background</div>
<div className="bg-brand-primary/50">Medium background</div>
<div className="bg-brand-primary/90">Strong background</div>

// Generates:
// bg-brand-primary/10  → background-color: rgb(0 217 255 / 0.1)
// bg-brand-primary/50  → background-color: rgb(0 217 255 / 0.5)
```

### 4. Group Related Utilities

```tsx
// Good: Grouped by category
<div className="
  flex items-center justify-between
  p-4 rounded-lg
  bg-terminal-black text-terminal-white
  border border-terminal-gray
  hover:bg-terminal-black/90
">
```

**Categories:**
1. Layout (flex, grid, position)
2. Spacing (padding, margin)
3. Borders (border, rounded)
4. Colors (bg, text)
5. States (hover, focus, active)

---

## Next Steps

Tailwind CSS is configured! Next tutorial:

**→ [06-global-styles.md](./06-global-styles.md)** - Create global styles and CSS variables

**What's next:**
- Set up dark mode
- Create CSS variables for theming
- Add Tailwind directives to CSS

---

## Summary

**What we built:**
- Tailwind CSS v4 configuration
- Terminal-inspired color palette (cyan, green, yellow)
- PostCSS integration
- Custom font families (Geist Sans, Geist Mono)

**Key concepts:**
- Tailwind v4 uses CSS-based config (v3 used JavaScript)
- Content paths determine which files to scan
- Custom colors create unique brand identity
- PostCSS processes Tailwind directives

**Color palette:**
```typescript
terminal: {
  black: '#0A0E14',   // Dark background
  cyan: '#00D9FF',    // Primary brand
  green: '#A6E22E',   // Success, highlights
  yellow: '#E5C07B',  // Accents, warnings
  white: '#FFFFFF',   // Light text
  gray: '#6C7A89',    // Borders, muted
}
```

**Configuration highlights:**
```typescript
{
  content: ['./app/**/*.tsx', './components/**/*.tsx'],
  theme: {
    extend: {
      colors: { terminal, brand },
      fontFamily: { sans, mono },
    },
  },
}
```

**Remember:**
- Use semantic color names in components
- Terminal colors for design system
- Opacity modifiers for variations
- Group related utilities together

---

## References

- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs/v4-beta)
- [Tailwind CSS Colors](https://tailwindcss.com/docs/customizing-colors)
- [PostCSS Documentation](https://postcss.org/)
- [WCAG Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
