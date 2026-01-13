# Phase 0.6: Global Styles

Create global CSS with Tailwind directives, CSS variables, and dark theme setup.

## What We're Building

**Goal:** Set up global styles that combine Tailwind CSS with custom CSS variables for theming, establish a dark-first design system, and prepare for component styling.

**Why:** Global styles provide the foundation for consistent styling across the entire site. CSS variables enable dynamic theming and make it easy to maintain design tokens.

**What you'll learn:**
- How Tailwind directives work (`@tailwind`, `@layer`)
- Why we use CSS variables for theming
- How to set up a dark-first design system
- CSS cascade layers and their benefits

---

## Prerequisites

- Completed [05-tailwind-setup.md](./05-tailwind-setup.md)
- `tailwind.config.ts` exists
- `postcss.config.js` exists
- Basic understanding of CSS

---

## Understanding Global Styles in Next.js

### Where Global Styles Live

Next.js App Router requires global styles in the root layout:

```
app/
├── layout.tsx          # Imports globals.css
└── globals.css         # Global styles (this file)
```

**How it works:**
```typescript
// app/layout.tsx
import './globals.css';  // Imported once, applies to all pages

export default function RootLayout({ children }) {
  return <html>{children}</html>;
}
```

**Alternatives considered:**
- **Component-level CSS:** Doesn't work for base styles (html, body)
- **CSS-in-JS:** Adds runtime cost, not needed for static site
- **Inline styles:** Can't use pseudo-selectors or media queries

**Why global CSS file:**
- ✅ Zero runtime cost (static CSS)
- ✅ Standard CSS syntax
- ✅ Works with Tailwind directives
- ✅ Easy to maintain

### Tailwind Directives

Tailwind uses special `@` directives processed by PostCSS:

```css
@tailwind base;        /* Reset styles, default elements */
@tailwind components;  /* Component classes (if defined) */
@tailwind utilities;   /* Utility classes (bg-*, text-*, etc.) */
```

**What each directive does:**

**1. `@tailwind base`**
- Resets browser default styles
- Sets sensible defaults (no margins on headings, etc.)
- Includes Preflight (Tailwind's CSS reset)

**2. `@tailwind components`**
- Inserts component classes defined with `@layer components`
- Empty by default (we'll use shadcn/ui for components)

**3. `@tailwind utilities`**
- Inserts all utility classes (`.bg-red-500`, `.flex`, etc.)
- Only includes classes used in your code (tree-shaken)

**Order matters:**
```css
/* Correct order (specificity: base < components < utilities) */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Wrong order (utilities get overridden by components) */
@tailwind utilities;
@tailwind components;
@tailwind base;
```

### CSS Variables vs Static Colors

**Static approach:**
```css
.card {
  background-color: #0A0E14;
  color: #FFFFFF;
}
```

**CSS variables approach:**
```css
:root {
  --color-background: #0A0E14;
  --color-foreground: #FFFFFF;
}

.card {
  background-color: var(--color-background);
  color: var(--color-foreground);
}
```

**Why CSS variables:**
- ✅ **Theming:** Change colors globally by updating variables
- ✅ **Dark mode:** Override variables for dark theme
- ✅ **Component variants:** Reuse variables in different contexts
- ✅ **Dynamic changes:** Can update with JavaScript if needed

**Example theme switching:**
```css
/* Light theme */
:root {
  --color-background: #FFFFFF;
  --color-text: #0A0E14;
}

/* Dark theme */
.dark {
  --color-background: #0A0E14;
  --color-text: #FFFFFF;
}
```

---

## Implementation

### Step 1: Create Global Styles File

Navigate to the app directory:

```bash
cd packages/web/app
```

Create `globals.css`:

```bash
touch globals.css
```

Add the following content:

```css
/* Tailwind CSS directives */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* CSS Variables for theming */
@layer base {
  :root {
    /* Color palette - Dark theme (default) */
    --color-background: 10 14 20;        /* #0A0E14 - terminal black */
    --color-foreground: 255 255 255;     /* #FFFFFF - white */
    --color-muted: 108 122 137;          /* #6C7A89 - gray */
    --color-muted-foreground: 200 200 200;

    /* Brand colors */
    --color-primary: 0 217 255;          /* #00D9FF - cyan */
    --color-primary-foreground: 10 14 20;
    --color-secondary: 166 226 46;       /* #A6E22E - green */
    --color-secondary-foreground: 10 14 20;
    --color-accent: 229 192 123;         /* #E5C07B - yellow */
    --color-accent-foreground: 10 14 20;

    /* UI colors */
    --color-border: 108 122 137;         /* #6C7A89 - gray */
    --color-input: 108 122 137;
    --color-ring: 0 217 255;             /* cyan focus ring */

    /* Semantic colors */
    --color-success: 166 226 46;         /* green */
    --color-warning: 229 192 123;        /* yellow */
    --color-error: 255 85 85;            /* red */

    /* Spacing and sizing */
    --radius: 0.5rem;                    /* 8px border radius */
    --font-sans: var(--font-geist-sans);
    --font-mono: var(--font-geist-mono);
  }
}

/* Base element styles */
@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    @apply font-sans antialiased;
  }

  h1, h2, h3, h4, h5, h6 {
    @apply font-sans font-semibold;
  }

  code {
    @apply font-mono text-sm;
  }

  a {
    @apply text-primary hover:text-primary/80 transition-colors;
  }
}

/* Custom utility classes */
@layer utilities {
  /* Terminal-style text effects */
  .text-glow {
    text-shadow: 0 0 10px currentColor;
  }

  .text-glow-strong {
    text-shadow: 0 0 20px currentColor, 0 0 30px currentColor;
  }

  /* Container with max-width and padding */
  .container-custom {
    @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
  }

  /* Focus styles for accessibility */
  .focus-ring {
    @apply focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background;
  }
}

/* Component layer for reusable patterns */
@layer components {
  /* Terminal-style code block */
  .code-block {
    @apply bg-background border border-primary/20 rounded-lg p-4;
    @apply font-mono text-sm text-secondary;
  }

  /* Card component base */
  .card {
    @apply bg-background border border-border rounded-lg p-6;
    @apply transition-shadow hover:shadow-lg hover:shadow-primary/5;
  }

  /* Button base (will be overridden by shadcn components) */
  .btn {
    @apply inline-flex items-center justify-center;
    @apply px-4 py-2 rounded-lg font-medium;
    @apply transition-colors focus-ring;
  }

  .btn-primary {
    @apply btn bg-primary text-primary-foreground;
    @apply hover:bg-primary/90;
  }

  .btn-secondary {
    @apply btn bg-secondary text-secondary-foreground;
    @apply hover:bg-secondary/90;
  }
}
```

**File location:** `/home/user/papyrus/packages/web/app/globals.css`

---

## Understanding the Global Styles

Let's break down each section and explain the design decisions.

### Tailwind Directives

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Order explanation:**
1. **Base:** Foundation styles (resets, defaults)
2. **Components:** Reusable component classes
3. **Utilities:** Utility classes (highest specificity)

**This order ensures:**
- Base styles are easily overridden by components
- Components are easily overridden by utilities
- Utilities always win (intentional)

### CSS Variables - Color Format

```css
--color-background: 10 14 20;  /* RGB without commas */
```

**Why RGB format without commas?**

This format works with Tailwind's opacity modifiers:

```tsx
<div className="bg-background/50">
  {/* Becomes: rgb(10 14 20 / 0.5) */}
</div>
```

**How it works:**
```css
/* CSS variable */
--color-primary: 0 217 255;

/* Tailwind generates */
.bg-primary {
  background-color: rgb(var(--color-primary));
}

.bg-primary/50 {
  background-color: rgb(var(--color-primary) / 0.5);
}
```

**Alternative (doesn't work with opacity):**
```css
/* Old format - can't use /50 modifier */
--color-primary: #00D9FF;
```

### Color Variable Naming

```css
--color-background: 10 14 20;
--color-foreground: 255 255 255;
--color-primary: 0 217 255;
--color-primary-foreground: 10 14 20;
```

**Naming convention:**
- **background:** Surface color
- **foreground:** Text color on that surface
- **primary:** Brand color
- **primary-foreground:** Text color on primary background

**Why paired colors:**
```tsx
{/* Always readable (foreground contrasts with background) */}
<button className="bg-primary text-primary-foreground">
  Click me
</button>
```

**Ensures accessibility:** Foreground/background pairs have sufficient contrast.

### Semantic Colors

```css
--color-success: 166 226 46;   /* green */
--color-warning: 229 192 123;  /* yellow */
--color-error: 255 85 85;      /* red */
```

**Why semantic names:**
- Clear meaning (success = positive action)
- Easy to find (search for "success" not "green")
- Rebrandable (change green to blue, keep "success")

**Usage:**
```tsx
<div className="text-success">Operation completed!</div>
<div className="text-warning">Are you sure?</div>
<div className="text-error">Failed to save</div>
```

### Border Radius Variable

```css
--radius: 0.5rem;  /* 8px */
```

**Why a variable:**
- Consistent border radius across all components
- Easy to change globally (try 4px vs 8px vs 12px)
- Works with Tailwind's `rounded` utilities

**Usage:**
```tsx
<div className="rounded-[var(--radius)]">
  {/* Uses global radius value */}
</div>
```

### Base Element Styles

```css
@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    @apply font-sans antialiased;
  }
}
```

**`*` selector:**
Sets default border color for all elements (ensures consistency).

**`body` styles:**
- `bg-background` - Uses CSS variable (dark by default)
- `text-foreground` - Text color
- `font-sans` - Uses Geist Sans font
- `antialiased` - Smooth font rendering

**Why `@layer base`:**
Keeps specificity low (can be overridden by utilities).

### Typography Defaults

```css
h1, h2, h3, h4, h5, h6 {
  @apply font-sans font-semibold;
}

code {
  @apply font-mono text-sm;
}

a {
  @apply text-primary hover:text-primary/80 transition-colors;
}
```

**Headings:**
- Same font as body (font-sans)
- Semibold weight (visually distinct)

**Code:**
- Monospace font (Geist Mono)
- Slightly smaller (text-sm)

**Links:**
- Primary color (cyan)
- Hover state (80% opacity)
- Smooth transition

**Why style base elements:**
- Markdown content works out of the box
- Consistent typography
- Don't need to add classes to every heading

### Custom Utility Classes

```css
@layer utilities {
  .text-glow {
    text-shadow: 0 0 10px currentColor;
  }
}
```

**Why custom utilities:**
- Terminal aesthetic (glowing text)
- Reusable across components
- Can be combined with Tailwind classes

**Usage:**
```tsx
<h1 className="text-terminal-cyan text-glow">
  Papyrus
</h1>
```

**Generates:**
```
Papyrus
  └─ cyan text with subtle glow (terminal effect)
```

### Component Classes

```css
@layer components {
  .card {
    @apply bg-background border border-border rounded-lg p-6;
    @apply transition-shadow hover:shadow-lg hover:shadow-primary/5;
  }
}
```

**Why component classes:**
- Common patterns (cards, buttons)
- Reduce duplication
- Easy to update globally

**When to use:**
- Pattern appears 3+ times
- Want global control
- Not using a component library

**When NOT to use:**
- One-off styles (use utilities)
- Already using shadcn/ui (their components)

**Note:** We'll mostly use shadcn/ui components, these are fallbacks.

---

## Step 2: Using CSS Variables in Tailwind Config

Update `tailwind.config.ts` to reference the CSS variables:

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
        // Terminal colors (static)
        terminal: {
          black: '#0A0E14',
          cyan: '#00D9FF',
          green: '#A6E22E',
          yellow: '#E5C07B',
          white: '#FFFFFF',
          gray: '#6C7A89',
        },
        // Theme colors (from CSS variables)
        background: 'rgb(var(--color-background))',
        foreground: 'rgb(var(--color-foreground))',
        primary: {
          DEFAULT: 'rgb(var(--color-primary))',
          foreground: 'rgb(var(--color-primary-foreground))',
        },
        secondary: {
          DEFAULT: 'rgb(var(--color-secondary))',
          foreground: 'rgb(var(--color-secondary-foreground))',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent))',
          foreground: 'rgb(var(--color-accent-foreground))',
        },
        muted: {
          DEFAULT: 'rgb(var(--color-muted))',
          foreground: 'rgb(var(--color-muted-foreground))',
        },
        border: 'rgb(var(--color-border))',
        input: 'rgb(var(--color-input))',
        ring: 'rgb(var(--color-ring))',
        success: 'rgb(var(--color-success))',
        warning: 'rgb(var(--color-warning))',
        error: 'rgb(var(--color-error))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
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

**What changed:**
- Added theme colors that reference CSS variables
- Added border radius variants
- Kept static terminal colors for direct use

**Why both static and variable colors:**
- **Static (terminal.cyan):** Use in design system, documentation
- **Variables (primary):** Use in components (themeable)

---

## Common Issues

### Issue 1: "Unknown at rule @tailwind"

**Cause:** VS Code doesn't recognize Tailwind directives.

**Solution:**
1. Install "Tailwind CSS IntelliSense" extension
2. Reload window: `Cmd+Shift+P` → "Reload Window"

**Alternative:** Add to `.vscode/settings.json`:
```json
{
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

### Issue 2: CSS variables not working

**Cause:** Forgot `rgb()` wrapper in Tailwind config.

**Solution:** Always wrap variables:
```typescript
// Wrong
background: 'var(--color-background)'

// Correct
background: 'rgb(var(--color-background))'
```

**Why:** Variables contain RGB values (not hex), need `rgb()` function.

### Issue 3: Styles not applying

**Cause:** Globals.css not imported in layout.

**Solution:** Verify `app/layout.tsx` imports styles (next tutorial).

### Issue 4: Custom classes not working

**Cause:** `@layer` in wrong order or typo.

**Solution:**
1. Check layer name: `@layer base`, `@layer components`, `@layer utilities`
2. Verify order: base → components → utilities
3. Restart dev server

### Issue 5: Opacity modifiers not working

**Cause:** Color format is wrong (hex instead of RGB).

**Solution:**
```css
/* Wrong - can't use bg-primary/50 */
--color-primary: #00D9FF;

/* Correct - enables bg-primary/50 */
--color-primary: 0 217 255;
```

---

## CSS Best Practices

### 1. Use CSS Variables for Theming

```css
/* Good - themeable */
:root {
  --color-accent: 229 192 123;
}

.highlight {
  color: rgb(var(--color-accent));
}

/* Avoid - hardcoded */
.highlight {
  color: #E5C07B;
}
```

### 2. Group Related Variables

```css
/* Good - grouped by purpose */
:root {
  /* Colors */
  --color-background: 10 14 20;
  --color-foreground: 255 255 255;

  /* Spacing */
  --space-section: 5rem;
  --space-component: 2rem;
}
```

### 3. Use @apply Sparingly

```css
/* Good - simple composition */
.card {
  @apply bg-background border border-border rounded-lg p-6;
}

/* Avoid - too many utilities */
.card {
  @apply bg-background border border-border rounded-lg p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary;
}
```

**When utilities list is long:** Use component classes or extract to React component.

### 4. Use Semantic Color Names

```tsx
// Good
<div className="bg-background text-foreground">

// Avoid
<div className="bg-[#0A0E14] text-[#FFFFFF]">
```

---

## Next Steps

Global styles are complete! Next tutorial:

**→ [07-root-layout.md](./07-root-layout.md)** - Create root layout with fonts and metadata

**What's next:**
- Import global styles
- Set up Geist fonts
- Add SEO metadata
- Create HTML structure

---

## Summary

**What we built:**
- Global CSS file with Tailwind directives
- CSS variables for theming
- Dark-first color palette
- Custom utility classes for terminal aesthetics
- Component base classes

**Key concepts:**
- `@tailwind` directives inject Tailwind CSS
- `@layer` controls specificity
- CSS variables enable theming
- RGB format (no commas) works with opacity modifiers

**Color system:**
```css
/* Variables in RGB format */
--color-primary: 0 217 255;

/* Used in Tailwind */
background: 'rgb(var(--color-primary))'

/* Enables opacity modifiers */
className="bg-primary/50"
```

**Custom utilities:**
```css
.text-glow          /* Terminal text effect */
.container-custom   /* Max-width container */
.focus-ring         /* Accessible focus styles */
```

**Remember:**
- Always use RGB format for color variables
- Import globals.css in root layout (next step)
- Use semantic color names (background, foreground, primary)
- Keep custom utilities minimal (use Tailwind when possible)

---

## References

- [Tailwind CSS Layers](https://tailwindcss.com/docs/adding-custom-styles#using-css-and-layer)
- [Tailwind CSS Variables](https://tailwindcss.com/docs/customizing-colors#using-css-variables)
- [CSS Custom Properties (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [Next.js Global Styles](https://nextjs.org/docs/app/building-your-application/styling/css#global-styles)
