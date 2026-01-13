# 02: Add Terminal Colors

**Why now:** We want a dark theme with terminal aesthetic for CLI branding.

## Goal

Configure custom color palette inspired by terminal colors.

## Step 1: Update Tailwind Config

Update `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          black: "#0a0a0a",
          darkgray: "#1a1a1a",
          gray: "#2a2a2a",
          lightgray: "#666666",
          text: "#e0e0e0",
          green: "#00ff00",
          cyan: "#00d9ff",
          yellow: "#ffdd00",
          red: "#ff4444",
        },
      },
    },
  },
  plugins: [],
}
```

## Step 2: Add Dark Theme Base

Update `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-terminal-black text-terminal-text;
  }
}
```

## Step 3: Use Terminal Colors

Update `app/page.tsx`:

```typescript
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4 text-terminal-cyan">PAPYRUS</h1>
      <p className="text-xl mb-2 text-terminal-text">AI-Powered Journaling for Developers</p>
      <p className="text-lg text-terminal-lightgray mb-4">Journal like you code. Right in your terminal.</p>
      <code className="bg-terminal-darkgray text-terminal-green px-4 py-2 rounded border border-terminal-gray">
        npm install -g @rewrlution/papyrus-cli
      </code>
    </main>
  );
}
```

## Step 4: Verify

```bash
pnpm dev
```

Should see dark background with terminal colors!

## Color Palette

- `terminal-black` - Page background
- `terminal-darkgray` - Card backgrounds
- `terminal-gray` - Borders
- `terminal-lightgray` - Secondary text
- `terminal-text` - Primary text
- `terminal-cyan` - Primary accent (links, headings)
- `terminal-green` - Success/code
- `terminal-yellow` - Warnings
- `terminal-red` - Errors

## Next

→ [03: Add Fonts](./03-add-fonts.md) - Install Geist fonts for better typography
