# Phase 0.7: Root Layout

Create the root layout with Geist fonts, SEO metadata, and HTML structure.

## What We're Building

**Goal:** Set up the Next.js root layout that wraps all pages, configures Geist fonts for optimal performance, and adds comprehensive SEO metadata.

**Why:** The root layout is the foundation of every page. It defines the HTML structure, loads fonts, imports global styles, and sets metadata that search engines and social media platforms use.

**What you'll learn:**
- How Next.js App Router layouts work
- Why we use `next/font` for font optimization
- How to structure SEO metadata
- HTML document structure best practices

---

## Prerequisites

- Completed [06-global-styles.md](./06-global-styles.md)
- `app/globals.css` exists
- Basic understanding of React and SEO

---

## Understanding Next.js Layouts

### What is a Layout?

A **layout** is a React component that wraps page content. It persists across navigation (doesn't re-render).

```typescript
// app/layout.tsx (root layout - wraps everything)
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <nav>Navigation</nav>     {/* Persists across pages */}
        {children}                 {/* Page content changes */}
        <footer>Footer</footer>    {/* Persists across pages */}
      </body>
    </html>
  );
}
```

### Layout Hierarchy

```
app/
├── layout.tsx              # Root layout (required)
├── page.tsx                # Home page
├── about/
│   ├── layout.tsx         # About section layout (optional)
│   └── page.tsx           # About page
└── blog/
    ├── layout.tsx         # Blog layout (optional)
    └── [slug]/
        └── page.tsx       # Blog post page
```

**How it nests:**
```jsx
<RootLayout>
  <BlogLayout>
    <BlogPostPage />
  </BlogLayout>
</RootLayout>
```

**Why layouts:**
- ✅ Shared UI (nav, footer) doesn't re-render
- ✅ Shared state persists
- ✅ Better performance (less React work)
- ✅ Cleaner code organization

### Root Layout Requirements

The root layout MUST:
1. Export a default React component
2. Accept `children` prop
3. Include `<html>` and `<body>` tags
4. Be in `app/layout.tsx`

```typescript
// Minimal valid root layout
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

**Why it's required:**
Next.js needs to control the entire HTML document for static export.

---

## Understanding next/font

### Font Loading Problem

**Traditional approach:**
```html
<!-- Loads from Google Fonts CDN -->
<link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet">
```

**Problems:**
- ❌ Extra network request (blocking)
- ❌ FOUT (Flash of Unstyled Text)
- ❌ FOIT (Flash of Invisible Text)
- ❌ Privacy concerns (Google tracks users)
- ❌ Slower (CDN in different location)

**next/font solution:**
```typescript
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });
```

**Benefits:**
- ✅ **Self-hosted** - No external requests
- ✅ **Automatic optimization** - Subset fonts, remove unused glyphs
- ✅ **Zero layout shift** - Size adjustments calculated at build time
- ✅ **Preloaded** - Font loaded before page render
- ✅ **Privacy-friendly** - No tracking

### Geist Fonts

**Geist** is Vercel's open-source font family (2024):

```typescript
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
```

**Why Geist:**
- ✅ Modern, clean design
- ✅ Excellent readability
- ✅ Optimized for developers (great mono font)
- ✅ Free and open-source
- ✅ Designed for UI (not just text)

**Geist vs Alternatives:**

| Font | Use Case | Vibe |
|------|----------|------|
| **Geist** | Modern dev tools | Clean, technical |
| Inter | General UI | Neutral, readable |
| Roboto | Material Design | Friendly, rounded |
| SF Pro | Apple-like | Polished, minimal |
| Helvetica | Corporate | Classic, formal |

**For Papyrus:** Geist fits the developer tool aesthetic perfectly.

---

## Implementation

### Step 1: Install Geist Font Package

Navigate to web package:

```bash
cd packages/web
```

Install Geist fonts:

```bash
pnpm add geist
```

**What this installs:**
- Geist Sans (regular text)
- Geist Mono (code, terminal text)
- Font optimization utilities

---

### Step 2: Create Root Layout

Create `app/layout.tsx`:

```bash
touch app/layout.tsx
```

Add the following code:

```typescript
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

/**
 * Site metadata for SEO and social sharing
 */
export const metadata: Metadata = {
  // Basic metadata
  title: {
    default: 'Papyrus - Developer Journaling for the Command Line',
    template: '%s | Papyrus',
  },
  description:
    'A powerful CLI tool for developers to capture thoughts, track progress, and reflect on their coding journey. Fast, efficient, and built for the terminal.',
  keywords: [
    'developer journal',
    'cli tool',
    'developer productivity',
    'command line',
    'journaling',
    'developer workflow',
    'note taking',
    'terminal app',
  ],

  // Author and branding
  authors: [{ name: 'Papyrus Team' }],
  creator: 'Papyrus Team',
  publisher: 'Papyrus',
  applicationName: 'Papyrus CLI',
  generator: 'Next.js',

  // Localization
  metadataBase: new URL('https://papyrus-cli.com'),
  alternates: {
    canonical: '/',
  },

  // OpenGraph (Facebook, LinkedIn)
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://papyrus-cli.com',
    siteName: 'Papyrus',
    title: 'Papyrus - Developer Journaling for the Command Line',
    description:
      'A powerful CLI tool for developers to capture thoughts, track progress, and reflect on their coding journey.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Papyrus - Developer Journaling',
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Papyrus - Developer Journaling for the Command Line',
    description:
      'A powerful CLI tool for developers to capture thoughts, track progress, and reflect on their coding journey.',
    images: ['/og-image.png'],
    creator: '@papyruscli',
  },

  // Icons and manifest
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',

  // Other metadata
  category: 'Developer Tools',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

/**
 * Root layout component
 * Wraps all pages with HTML structure, fonts, and global styles
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
```

**File location:** `/home/user/papyrus/packages/web/app/layout.tsx`

---

## Understanding the Root Layout

Let's break down each section and explain the design decisions.

### Font Configuration

```typescript
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
```

**What happens at build time:**
1. Next.js downloads font files
2. Generates CSS with `@font-face` rules
3. Creates CSS variable names (`--font-geist-sans`, `--font-geist-mono`)
4. Optimizes and self-hosts fonts

**Generated CSS:**
```css
@font-face {
  font-family: '__Geist_Sans_abc123';
  src: url('/_next/static/media/geist-sans.woff2') format('woff2');
  font-display: swap;
  font-weight: 100 900;
}
```

**CSS variables:**
```css
:root {
  --font-geist-sans: '__Geist_Sans_abc123', system-ui, sans-serif;
  --font-geist-mono: '__Geist_Mono_xyz789', monospace;
}
```

### HTML and Body Structure

```typescript
<html
  lang="en"
  className={`${GeistSans.variable} ${GeistMono.variable}`}
  suppressHydrationWarning
>
  <body className="min-h-screen bg-background font-sans antialiased">
    {children}
  </body>
</html>
```

**`lang="en"`:**
- Tells browsers and screen readers the language
- Improves accessibility
- Helps with hyphenation and spell-check

**`className` with font variables:**
```typescript
className={`${GeistSans.variable} ${GeistMono.variable}`}
```

**Expands to:**
```html
<html class="__variable_abc123 __variable_xyz789">
```

**Why on `<html>` tag:**
Makes font variables available to all elements.

**`suppressHydrationWarning`:**
Prevents React warnings about server/client HTML mismatch.

**Why needed:**
- Browser extensions modify HTML (dark mode, translation)
- Third-party scripts inject elements
- Doesn't affect functionality, just silences warnings

**Body classes:**
- `min-h-screen` - Minimum 100vh height (footer sticks to bottom)
- `bg-background` - Uses CSS variable (dark theme)
- `font-sans` - Applies Geist Sans
- `antialiased` - Smooth font rendering

---

## Understanding Metadata

### Basic Metadata

```typescript
title: {
  default: 'Papyrus - Developer Journaling for the Command Line',
  template: '%s | Papyrus',
}
```

**Default title:**
Used on home page and as fallback.

**Template:**
Used on other pages. `%s` is replaced with page title.

**Examples:**
```typescript
// Home page (no title override)
<title>Papyrus - Developer Journaling for the Command Line</title>

// About page
export const metadata = { title: 'About' };
<title>About | Papyrus</title>

// Docs page
export const metadata = { title: 'Documentation' };
<title>Documentation | Papyrus</title>
```

### Description and Keywords

```typescript
description: 'A powerful CLI tool for developers to...',
keywords: ['developer journal', 'cli tool', ...],
```

**Description:**
- Shows in Google search results
- Used by social media for previews
- Should be 150-160 characters
- Include primary keywords naturally

**Keywords:**
- Less important for SEO (Google ignores them)
- Useful for internal documentation
- Bing and other search engines may use them

**SEO tip:** Focus on description quality over keyword stuffing.

### Metadata Base

```typescript
metadataBase: new URL('https://papyrus-cli.com'),
alternates: {
  canonical: '/',
},
```

**metadataBase:**
Base URL for relative paths in metadata.

**Example:**
```typescript
// With metadataBase
openGraph: {
  images: ['/og-image.png'],
}

// Becomes
<meta property="og:image" content="https://papyrus-cli.com/og-image.png" />
```

**canonical:**
Tells search engines the preferred URL for this content.

**Why it matters:**
Prevents duplicate content penalties (e.g., www vs non-www).

### OpenGraph Metadata

```typescript
openGraph: {
  type: 'website',
  locale: 'en_US',
  url: 'https://papyrus-cli.com',
  siteName: 'Papyrus',
  title: 'Papyrus - Developer Journaling for the Command Line',
  description: '...',
  images: [
    {
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Papyrus - Developer Journaling',
    },
  ],
},
```

**What is OpenGraph:**
Protocol for rich social media previews (Facebook, LinkedIn, Discord).

**Generated HTML:**
```html
<meta property="og:type" content="website" />
<meta property="og:url" content="https://papyrus-cli.com" />
<meta property="og:title" content="Papyrus - Developer Journaling..." />
<meta property="og:description" content="..." />
<meta property="og:image" content="https://papyrus-cli.com/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="1200" />
```

**Result:**
When shared on Facebook/LinkedIn:
```
┌─────────────────────────────────────┐
│ [OG Image: 1200x630]                │
├─────────────────────────────────────┤
│ Papyrus - Developer Journaling...   │
│ A powerful CLI tool for developers  │
│ papyrus-cli.com                     │
└─────────────────────────────────────┘
```

**Recommended image size:**
- **1200x630px** (Facebook/LinkedIn)
- **1200x600px** (Twitter)
- **Format:** PNG or JPG
- **File size:** < 5MB

### Twitter Card

```typescript
twitter: {
  card: 'summary_large_image',
  title: '...',
  description: '...',
  images: ['/og-image.png'],
  creator: '@papyruscli',
},
```

**Card types:**
- `summary` - Small image (1:1 aspect ratio)
- `summary_large_image` - Large image (2:1 aspect ratio)
- `app` - App download card
- `player` - Video/audio player

**Why summary_large_image:**
More visual impact, better engagement.

**Creator:**
Twitter handle of content creator (clickable link).

### Icons and Manifest

```typescript
icons: {
  icon: '/favicon.ico',
  apple: '/apple-touch-icon.png',
},
manifest: '/site.webmanifest',
```

**favicon.ico:**
- Browser tab icon
- Bookmark icon
- Should be 32x32 or 16x16

**apple-touch-icon.png:**
- iOS home screen icon
- Should be 180x180

**site.webmanifest:**
- PWA manifest (name, colors, icons)
- Enables "Add to Home Screen"

**Note:** We'll create these files in a later phase.

### Robots Configuration

```typescript
robots: {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    'max-video-preview': -1,
    'max-image-preview': 'large',
    'max-snippet': -1,
  },
},
```

**index:** Allow search engines to index pages.

**follow:** Allow following links to crawl other pages.

**Googlebot-specific:**
- `max-video-preview: -1` - No limit on video preview length
- `max-image-preview: large` - Allow large image previews
- `max-snippet: -1` - No limit on text snippet length

**Generated HTML:**
```html
<meta name="robots" content="index, follow" />
<meta name="googlebot" content="index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1" />
```

---

## Common Issues

### Issue 1: "Error: Geist Sans is not a valid font"

**Cause:** Package not installed or import path wrong.

**Solution:**
```bash
pnpm add geist
```

**Verify import:**
```typescript
import { GeistSans } from 'geist/font/sans';
```

### Issue 2: Fonts not loading

**Cause:** Font variables not applied to `<html>` tag.

**Solution:** Verify:
```typescript
<html className={`${GeistSans.variable} ${GeistMono.variable}`}>
```

**Check in browser:**
```css
/* DevTools → Elements → <html> */
<html class="__variable_abc123 __variable_xyz789">
```

### Issue 3: Layout shift on page load

**Cause:** Font not preloaded or size-adjust missing.

**Solution:** Geist package handles this automatically. If issues persist:
```typescript
const geistSans = GeistSans({
  subsets: ['latin'],
  display: 'swap',      // Show fallback font immediately
  preload: true,        // Preload font
});
```

### Issue 4: Metadata not showing on social media

**Cause:** Image path incorrect or missing metadataBase.

**Solution:**
1. Verify `metadataBase` is set
2. Check image exists in `public/`
3. Test with [OpenGraph Debugger](https://www.opengraph.xyz/)

**Facebook cache:** Use [Sharing Debugger](https://developers.facebook.com/tools/debug/) to clear cache.

### Issue 5: TypeScript error on Metadata type

**Cause:** Missing Next.js types.

**Solution:**
```bash
pnpm add -D @types/react @types/react-dom @types/node
```

**Verify import:**
```typescript
import type { Metadata } from 'next';
```

---

## SEO Best Practices

### 1. Write Unique Descriptions

```typescript
// Good - specific, actionable
description: 'A powerful CLI tool for developers to capture thoughts, track progress, and reflect on their coding journey.'

// Bad - generic, vague
description: 'A great tool for developers. Try it now!'
```

### 2. Use Structured Data (Later)

```typescript
// Future enhancement
export const metadata = {
  ...
  other: {
    'application-ld+json': {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Papyrus',
      operatingSystem: 'macOS, Linux, Windows',
      applicationCategory: 'DeveloperApplication',
    },
  },
};
```

### 3. Optimize Images

**OG images:**
- Size: Exactly 1200x630px
- Format: PNG or JPG
- File size: < 300KB
- Include text (legible at small sizes)

### 4. Test Metadata

**Tools:**
- [OpenGraph Preview](https://www.opengraph.xyz/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [Google Rich Results Test](https://search.google.com/test/rich-results)

---

## Next Steps

Root layout is complete! Next tutorial:

**→ [08-first-page.md](./08-first-page.md)** - Create the home page and test the setup

**What's next:**
- Create a basic home page
- Test the dev server
- Verify fonts and styles work

---

## Summary

**What we built:**
- Root layout with HTML structure
- Geist fonts configuration (Sans and Mono)
- Comprehensive SEO metadata
- OpenGraph and Twitter Card support
- Accessibility attributes

**Key concepts:**
- Root layout wraps all pages (persists across navigation)
- `next/font` optimizes and self-hosts fonts
- Metadata improves SEO and social sharing
- CSS variables make fonts available globally

**Font setup:**
```typescript
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

<html className={`${GeistSans.variable} ${GeistMono.variable}`}>
```

**Metadata highlights:**
```typescript
export const metadata: Metadata = {
  title: { default: '...', template: '%s | Papyrus' },
  description: '...',
  openGraph: { ... },    // Facebook, LinkedIn
  twitter: { ... },      // Twitter
  robots: { ... },       // Search engines
};
```

**Remember:**
- Title template uses `%s` for page title
- OpenGraph images should be 1200x630px
- Metadata base enables relative URLs
- Test social cards before launch

---

## References

- [Next.js Metadata Documentation](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Next.js Font Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)
- [Geist Font on GitHub](https://github.com/vercel/geist-font)
- [OpenGraph Protocol](https://ogp.me/)
- [Twitter Card Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
