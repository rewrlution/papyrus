# Phase 0.8: First Page

Create the home page to test your Next.js setup with fonts, styles, and Tailwind CSS.

## What We're Building

**Goal:** Create a basic home page that displays the Papyrus ASCII logo, tests Tailwind CSS, and verifies that fonts and global styles are working correctly.

**Why:** Before building complex components, we need to verify that our entire setup works. This page serves as a smoke test for TypeScript, Next.js, Tailwind, fonts, and CSS variables.

**What you'll learn:**
- How Next.js App Router pages work
- How to create React Server Components
- How to use Tailwind classes effectively
- How to test your development setup

---

## Prerequisites

- Completed [07-root-layout.md](./07-root-layout.md)
- `app/layout.tsx` exists with fonts configured
- `app/globals.css` exists with Tailwind directives
- Basic understanding of React

---

## Understanding Next.js Pages

### What is a Page?

A **page** is a React component that renders at a specific route. The file name determines the route.

```
app/
├── page.tsx           →  /          (home page)
├── about/
│   └── page.tsx      →  /about     (about page)
└── docs/
    ├── page.tsx      →  /docs      (docs index)
    └── [slug]/
        └── page.tsx  →  /docs/*    (dynamic docs page)
```

**File naming rules:**
- Must be named `page.tsx` (or `.js`, `.jsx`)
- Export a default React component
- Can export metadata for SEO

### Server Components vs Client Components

**Next.js 15 defaults to Server Components:**

```typescript
// Server Component (default)
export default function Page() {
  return <div>Hello</div>;
}
```

**Server Components:**
- ✅ Run on the server (or at build time for static export)
- ✅ Can directly fetch data
- ✅ Smaller bundle size (less JavaScript sent to browser)
- ✅ Better SEO (HTML rendered on server)
- ❌ Can't use `useState`, `useEffect`, or browser APIs
- ❌ Can't handle click events directly

**Client Components:**
```typescript
'use client';  // Directive at top of file

export default function Page() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**Client Components:**
- ✅ Can use hooks (`useState`, `useEffect`)
- ✅ Can handle events (`onClick`, `onChange`)
- ✅ Can use browser APIs (localStorage, window)
- ❌ Larger bundle size (JavaScript sent to browser)

**For our home page:**
We'll start with a Server Component (static content only). We'll add Client Components later for interactive elements.

---

## Implementation

### Step 1: Create the Home Page

Navigate to the app directory:

```bash
cd packages/web/app
```

Create `page.tsx`:

```bash
touch page.tsx
```

Add the following code:

```typescript
import type { Metadata } from 'next';

/**
 * Home page metadata
 * Overrides default metadata from root layout
 */
export const metadata: Metadata = {
  title: 'Papyrus - Developer Journaling for the Command Line',
};

/**
 * Home page component
 * Tests Next.js setup, Tailwind CSS, fonts, and global styles
 */
export default function HomePage() {
  return (
    <main className="min-h-screen bg-terminal-black">
      {/* Hero Section */}
      <section className="container-custom py-20">
        {/* ASCII Logo */}
        <div className="mb-8">
          <pre className="font-mono text-terminal-cyan text-sm sm:text-base md:text-lg overflow-x-auto">
            {`
██████╗  █████╗ ██████╗ ██╗   ██╗██████╗ ██╗   ██╗███████╗
██╔══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝██╔══██╗██║   ██║██╔════╝
██████╔╝███████║██████╔╝ ╚████╔╝ ██████╔╝██║   ██║███████╗
██╔═══╝ ██╔══██║██╔═══╝   ╚██╔╝  ██╔══██╗██║   ██║╚════██║
██║     ██║  ██║██║        ██║   ██║  ██║╚██████╔╝███████║
╚═╝     ╚═╝  ╚═╝╚═╝        ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝
            `.trim()}
          </pre>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-terminal-white mb-6">
          Developer Journaling
          <br />
          <span className="text-terminal-cyan text-glow">
            for the Command Line
          </span>
        </h1>

        {/* Description */}
        <p className="text-lg sm:text-xl text-terminal-gray max-w-2xl mb-8">
          A powerful CLI tool for developers to capture thoughts, track
          progress, and reflect on their coding journey. Fast, efficient, and
          built for the terminal.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="#install"
            className="btn-primary text-center"
          >
            Get Started
          </a>
          <a
            href="#features"
            className="btn-secondary text-center"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* Feature Preview Section */}
      <section className="container-custom py-16" id="features">
        <h2 className="text-3xl font-bold text-terminal-white mb-8">
          Why Papyrus?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="card">
            <h3 className="text-xl font-semibold text-terminal-green mb-3">
              ⚡ Lightning Fast
            </h3>
            <p className="text-terminal-gray">
              Write in your favorite editor. No slow web interfaces, just pure
              terminal efficiency.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="card">
            <h3 className="text-xl font-semibold text-terminal-cyan mb-3">
              🔒 Private & Secure
            </h3>
            <p className="text-terminal-gray">
              Your journals are yours. Local-first with optional sync. No ads,
              no tracking.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="card">
            <h3 className="text-xl font-semibold text-terminal-yellow mb-3">
              🎨 Developer-First
            </h3>
            <p className="text-terminal-gray">
              Markdown support, vim keybindings, and a CLI designed by
              developers, for developers.
            </p>
          </div>
        </div>
      </section>

      {/* Installation Preview */}
      <section className="container-custom py-16" id="install">
        <h2 className="text-3xl font-bold text-terminal-white mb-8">
          Quick Start
        </h2>

        <div className="code-block max-w-2xl">
          <code className="text-terminal-green">
            $ npm install -g @rewrlution/papyrus-cli
            <br />$ papyrus add
            <br />
            <span className="text-terminal-yellow">
              ✨ Journal created for 2025-01-13
            </span>
          </code>
        </div>

        <p className="text-terminal-gray mt-6 max-w-2xl">
          Get started in seconds. Write your first journal entry today.
        </p>
      </section>

      {/* Footer */}
      <footer className="container-custom py-8 border-t border-terminal-gray/20">
        <p className="text-terminal-gray text-center">
          Built with ❤️ for developers
        </p>
      </footer>
    </main>
  );
}
```

**File location:** `/home/user/papyrus/packages/web/app/page.tsx`

---

## Understanding the Home Page

### Page Metadata

```typescript
export const metadata: Metadata = {
  title: 'Papyrus - Developer Journaling for the Command Line',
};
```

**What it does:** Overrides the default title from root layout.

**Result:**
```html
<title>Papyrus - Developer Journaling for the Command Line</title>
```

**If we used template:**
```typescript
export const metadata = {
  title: 'Home',
};

// Would become (using root layout template):
<title>Home | Papyrus</title>
```

**Why we don't use template for home page:**
Home page should have the full brand title, not "Home | Papyrus".

### Main Element Structure

```typescript
<main className="min-h-screen bg-terminal-black">
```

**`<main>` tag:**
- Semantic HTML (improves accessibility)
- Tells screen readers this is the primary content
- Better SEO (search engines prioritize main content)

**`min-h-screen`:**
- Minimum height of 100vh (full viewport height)
- Ensures footer doesn't float up on short pages

**`bg-terminal-black`:**
- Uses Tailwind config color (`#0A0E14`)
- Dark background (terminal aesthetic)

### ASCII Logo

```typescript
<pre className="font-mono text-terminal-cyan text-sm sm:text-base md:text-lg overflow-x-auto">
  {`
██████╗  █████╗ ██████╗ ██╗   ██╗██████╗ ██╗   ██╗███████╗
...
  `.trim()}
</pre>
```

**`<pre>` tag:**
- Preserves whitespace and line breaks
- Necessary for ASCII art

**`font-mono`:**
- Uses Geist Mono (monospace font)
- Required for ASCII art to align correctly

**`text-terminal-cyan`:**
- Cyan color (terminal aesthetic)
- High contrast against dark background

**Responsive text sizes:**
- `text-sm` - Default (small screens)
- `sm:text-base` - Medium screens
- `md:text-lg` - Large screens

**`overflow-x-auto`:**
- Horizontal scroll on narrow screens
- Prevents logo from breaking layout

**`.trim()`:**
- Removes leading/trailing whitespace
- Prevents extra blank lines

### Responsive Typography

```typescript
<h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-terminal-white mb-6">
```

**Responsive sizes:**
```
Mobile:  text-4xl  (2.25rem / 36px)
Tablet:  text-5xl  (3rem / 48px)
Desktop: text-6xl  (3.75rem / 60px)
```

**Breakpoints:**
- `sm:` - 640px and up
- `md:` - 768px and up
- `lg:` - 1024px and up

**Why responsive typography:**
- Better readability on all devices
- Prevents text from being too large on mobile
- Makes better use of space on desktop

### Text Glow Effect

```typescript
<span className="text-terminal-cyan text-glow">
  for the Command Line
</span>
```

**`text-glow` class:**
Defined in `globals.css`:
```css
.text-glow {
  text-shadow: 0 0 10px currentColor;
}
```

**Effect:**
Creates a subtle glow around text (terminal aesthetic).

**`currentColor`:**
Uses the element's text color (cyan) for the glow.

### Responsive Flexbox

```typescript
<div className="flex flex-col sm:flex-row gap-4">
```

**Mobile layout:**
```
[Get Started]
[Learn More]
```

**Desktop layout:**
```
[Get Started] [Learn More]
```

**How it works:**
- `flex` - Flexbox container
- `flex-col` - Stack vertically (default/mobile)
- `sm:flex-row` - Row layout on small screens and up
- `gap-4` - 1rem (16px) spacing between items

### Grid Layout

```typescript
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
```

**Mobile (< 768px):**
```
┌─────────────┐
│  Feature 1  │
├─────────────┤
│  Feature 2  │
├─────────────┤
│  Feature 3  │
└─────────────┘
```

**Desktop (≥ 768px):**
```
┌──────┬──────┬──────┐
│ Feat │ Feat │ Feat │
│  1   │  2   │  3   │
└──────┴──────┴──────┘
```

**Classes explained:**
- `grid` - CSS Grid container
- `grid-cols-1` - 1 column (mobile)
- `md:grid-cols-3` - 3 columns (desktop)
- `gap-6` - 1.5rem (24px) spacing

### Using Component Classes

```typescript
<div className="card">
```

**Defined in globals.css:**
```css
.card {
  @apply bg-background border border-border rounded-lg p-6;
  @apply transition-shadow hover:shadow-lg hover:shadow-primary/5;
}
```

**Generated styles:**
- Dark background
- Gray border
- Rounded corners
- Padding
- Hover effect (subtle shadow)

### Code Block Styling

```typescript
<div className="code-block max-w-2xl">
  <code className="text-terminal-green">
    $ npm install -g @rewrlution/papyrus-cli
  </code>
</div>
```

**`code-block` class:**
Defined in `globals.css`:
```css
.code-block {
  @apply bg-background border border-primary/20 rounded-lg p-4;
  @apply font-mono text-sm text-secondary;
}
```

**Visual effect:**
```
┌─────────────────────────────────────┐
│ $ npm install -g @rewrlution/...   │
│ $ papyrus add                       │
│ ✨ Journal created for 2025-01-13  │
└─────────────────────────────────────┘
  └─ Cyan border, dark background, green text
```

---

## Step 2: Start the Development Server

From the web package directory:

```bash
cd packages/web
pnpm dev
```

**Expected output:**
```
   ▲ Next.js 15.1.6
   - Local:        http://localhost:3000
   - Experiments (use with caution):
     · output: "export"

 ✓ Ready in 2.3s
```

**What this does:**
- Starts Next.js development server
- Watches files for changes
- Hot reloads on save
- Compiles TypeScript
- Processes Tailwind CSS

---

## Step 3: Test in Browser

Open your browser and navigate to:

```
http://localhost:3000
```

**What you should see:**

1. **ASCII Logo** in cyan (Papyrus banner)
2. **Headline** with glowing cyan text
3. **Description** in gray
4. **Two buttons** (Get Started, Learn More)
5. **Three feature cards** in a grid
6. **Code block** with installation commands
7. **Footer** at the bottom

**Visual style:**
- Dark background (terminal black)
- High contrast text (white, cyan, green, yellow)
- Clean, modern layout
- Responsive design

---

## Testing Checklist

### Visual Tests

- [ ] ASCII logo displays correctly (not broken/misaligned)
- [ ] Fonts load (Geist Sans for text, Geist Mono for code)
- [ ] Colors match terminal palette (cyan, green, yellow)
- [ ] Text glow effect visible on headline
- [ ] Buttons have proper styling
- [ ] Feature cards have borders and rounded corners
- [ ] Code block has syntax highlighting colors

### Responsive Tests

**Resize browser window:**

- [ ] Mobile (< 640px): Single column layout
- [ ] Tablet (640-768px): Buttons in a row, features stacked
- [ ] Desktop (> 768px): 3-column feature grid
- [ ] ASCII logo scrolls horizontally on narrow screens

**Test breakpoints:**
```
400px  → Very narrow (mobile)
640px  → Small (tablet)
768px  → Medium (small laptop)
1024px → Large (desktop)
```

### Functionality Tests

- [ ] Links work (scroll to sections)
- [ ] Hover effects on buttons (color change)
- [ ] Hover effects on cards (shadow)
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Hot reload works (edit page, see changes)

### Browser DevTools Tests

**Check in Elements tab:**
```html
<html class="__variable_abc123 __variable_xyz789">
  <body class="min-h-screen bg-background font-sans antialiased">
```

**Font variables loaded:**
```css
:root {
  --font-geist-sans: ...;
  --font-geist-mono: ...;
}
```

**Tailwind classes generated:**
```css
.bg-terminal-black { background-color: #0A0E14; }
.text-terminal-cyan { color: #00D9FF; }
```

---

## Common Issues

### Issue 1: Page shows blank white screen

**Cause:** JavaScript error or missing import.

**Solution:**
1. Open browser console (F12)
2. Check for errors
3. Verify `layout.tsx` imports `globals.css`

**Also check:**
```typescript
// app/layout.tsx
import './globals.css';  // Must be present
```

### Issue 2: ASCII logo is misaligned

**Cause:** Font not monospace or extra whitespace.

**Solution:**
1. Verify `font-mono` class is applied
2. Check that Geist Mono loaded (DevTools → Network)
3. Use `.trim()` on template string

### Issue 3: Colors not showing

**Cause:** Tailwind config or globals.css issue.

**Solution:**
1. Restart dev server: `Ctrl+C`, then `pnpm dev`
2. Delete `.next`: `rm -rf .next`
3. Verify `tailwind.config.ts` has terminal colors

### Issue 4: Text glow not visible

**Cause:** CSS not loaded or class not defined.

**Solution:**
1. Check `globals.css` has `.text-glow` in `@layer utilities`
2. Verify CSS is imported in `layout.tsx`
3. Try stronger glow: `text-glow-strong`

### Issue 5: Layout shifts on page load

**Cause:** Fonts loading slowly.

**Solution:**
Geist fonts should be preloaded automatically. If issue persists:
1. Check Network tab for font files
2. Verify fonts are self-hosted (not external CDN)
3. Check console for font loading errors

### Issue 6: TypeScript errors in editor

**Cause:** Missing types or stale cache.

**Solution:**
```bash
# Restart TypeScript server (VS Code)
Cmd+Shift+P → "TypeScript: Restart TS Server"

# Or rebuild
pnpm build
```

---

## Next Steps

Your first page is working! Next tutorial:

**→ [09-utils.md](./09-utils.md)** - Create utility functions (cn helper)

**What's next:**
- Create `cn()` function for class merging
- Set up utilities folder
- Prepare for shadcn/ui components

---

## Summary

**What we built:**
- Home page with ASCII logo
- Responsive layout (mobile, tablet, desktop)
- Terminal-inspired design
- Feature cards
- Installation code block
- Tested fonts and Tailwind CSS

**Key concepts:**
- Next.js pages are `page.tsx` files
- Server Components by default (no 'use client')
- Metadata can be overridden per page
- Tailwind responsive utilities (sm:, md:, lg:)

**Page structure:**
```typescript
export const metadata = { title: '...' };  // SEO

export default function Page() {            // Component
  return <main>...</main>;
}
```

**Tailwind patterns used:**
```typescript
// Responsive typography
className="text-4xl sm:text-5xl md:text-6xl"

// Responsive layout
className="flex flex-col sm:flex-row"

// Grid
className="grid grid-cols-1 md:grid-cols-3 gap-6"

// Custom classes
className="card code-block text-glow"
```

**Remember:**
- Use semantic HTML (`<main>`, `<section>`)
- Test on multiple screen sizes
- Use component classes for repeated patterns
- Terminal colors for brand identity

---

## References

- [Next.js Pages Documentation](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts)
- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Tailwind Flexbox](https://tailwindcss.com/docs/flex)
- [Tailwind Grid](https://tailwindcss.com/docs/grid-template-columns)
