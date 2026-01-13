# 04: Next.js Config

Configure Next.js for static export with minimal settings.

## Goal

Set up Next.js to generate static HTML files for Vercel deployment.

## Create next.config.js

Create `packages/web/next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
```

## Settings Explained

### `output: 'export'`
Generates static HTML files instead of running a Node.js server.

**Why:**
- Faster (served from CDN)
- Cheaper (no server costs)
- Simpler (no server maintenance)
- Perfect for marketing sites

### `reactStrictMode: true`
Enables React's strict mode to catch bugs during development.

**What it does:**
- Double-invokes component functions to find side effects
- Warns about deprecated APIs
- Helps write better React code

### `images: { unoptimized: true }`
Disables Next.js image optimization.

**Why required for static export:**
- Image optimization needs a server
- Static export has no server
- Images still work, just not automatically optimized

## What We're NOT Configuring

### ❌ `transpilePackages`
```javascript
transpilePackages: ['@rewrlution/papyrus-shared']
```
**Why skip:** Not using shared package yet. Add later if needed.

### ❌ `env` Variables
**Why skip:** No environment variables needed yet.

### ❌ `redirects` or `rewrites`
**Why skip:** Single page site for now.

## Verify Config

```bash
# Check Next.js accepts the config
npx next --help
```

Should show Next.js CLI help (confirms Next.js is installed and config is valid).

## Next

→ [05: Basic Layout](./05-basic-layout.md) - Create root layout file
