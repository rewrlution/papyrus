# 01: Add Tailwind CSS

**Why now:** We need styling to build actual UI components.

## Goal

Install and configure Tailwind CSS for utility-first styling.

## Step 1: Install Tailwind

From `packages/web`:

```bash
pnpm add tailwindcss postcss autoprefixer
```

**What these do:**
- `tailwindcss` - Utility-first CSS framework
- `postcss` - CSS processor (required by Tailwind)
- `autoprefixer` - Adds vendor prefixes automatically

## Step 2: Initialize Tailwind

```bash
npx tailwindcss init -p
```

Creates:
- `tailwind.config.js` - Tailwind configuration
- `postcss.config.js` - PostCSS configuration

## Step 3: Configure Tailwind

Update `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**Key setting:** `content` tells Tailwind where to look for class names.

## Step 4: Create globals.css

Create `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Step 5: Import globals.css

Update `app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import "./globals.css";  // Add this line

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

## Step 6: Test Tailwind

Update `app/page.tsx`:

```typescript
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">PAPYRUS</h1>
      <p className="text-xl mb-2">AI-Powered Journaling for Developers</p>
      <p className="text-lg text-gray-600 mb-4">Journal like you code. Right in your terminal.</p>
      <code className="bg-gray-100 px-4 py-2 rounded">npm install -g @rewrlution/papyrus-cli</code>
    </main>
  );
}
```

## Step 7: Verify

```bash
pnpm dev
```

Open `http://localhost:3000` - should see centered, styled text!

## What We Have

✅ Tailwind CSS installed
✅ Configured for app/ and components/
✅ globals.css created
✅ Basic styling working

## Next

→ [02: Add Terminal Colors](./02-terminal-colors.md) - Configure dark theme palette
