# 05: Basic Layout

Create the root layout (required by Next.js App Router).

## Goal

Set up minimal root layout with basic metadata.

## Create app/layout.tsx

Create `packages/web/app/layout.tsx`:

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Papyrus - AI-Powered Journaling for Developers",
  description: "Journal like you code. Capture your thoughts right in your terminal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

## Code Explanation

### Metadata Export
```typescript
export const metadata: Metadata = { ... }
```
Defines SEO metadata for the site (title, description).

**Automatically used by Next.js for:**
- `<title>` tag
- `<meta name="description">` tag
- Open Graph tags (social media previews)

### Root Layout Component
```typescript
export default function RootLayout({ children })
```
Wraps all pages in the app. Required by Next.js App Router.

**`children` prop:**
- Automatically filled by Next.js
- Contains the current page content
- Different for each route

### HTML Structure
```html
<html lang="en">
  <body>{children}</body>
</html>
```
Minimal valid HTML structure.

## What We're NOT Including

### ❌ Font Imports
```typescript
import { GeistSans } from "geist/font/sans";
```
**Why skip:** No custom fonts yet. Browser defaults work fine for now.

### ❌ CSS Imports
```typescript
import "./globals.css";
```
**Why skip:** No CSS file yet. Add in Phase 1 with Tailwind.

### ❌ className on body
```typescript
<body className="dark">
```
**Why skip:** No styling yet.

## Verify Syntax

```bash
# Check TypeScript accepts the file
npx tsc --noEmit
```

Should have no errors.

## Next

→ [06: Basic Page](./06-basic-page.md) - Create the home page
