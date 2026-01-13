# Phase 0.4: Next.js Configuration

Configure Next.js 15 for static site generation and monorepo integration.

## What We're Building

**Goal:** Set up Next.js to generate a fully static website that can be deployed anywhere (Vercel, Netlify, GitHub Pages, or any static host).

**Why:** Papyrus marketing site is content-focused with no dynamic server logic. Static generation gives us:
- **Fastest performance** - Pre-rendered HTML
- **Free hosting** - No server costs
- **Global CDN** - Instant load times worldwide
- **SEO-friendly** - Crawlers see complete HTML

**What you'll learn:**
- Why static export vs server-side rendering
- How to configure Next.js output modes
- Monorepo package transpilation
- Image optimization for static sites

---

## Prerequisites

- Completed [03-typescript-config.md](./03-typescript-config.md)
- `packages/web/tsconfig.json` exists
- Basic understanding of static vs dynamic sites

---

## Understanding Next.js Output Modes

Next.js supports three output modes:

### 1. Server (default)

```javascript
// Default mode (no config needed)
```

**How it works:**
- Runs a Node.js server
- Server-side rendering (SSR) for each request
- Can use API routes
- Dynamic data fetching

**Use when:** You need server-side logic, authentication, or real-time data.

**Papyrus CLI needs this?** No. Our marketing site is static content.

### 2. Standalone

```javascript
output: 'standalone'
```

**How it works:**
- Minimal Node.js server bundle
- Includes only needed dependencies
- Optimized for Docker containers
- Self-contained deployment

**Use when:** Deploying to your own infrastructure (AWS, GCP, self-hosted).

**Papyrus CLI needs this?** No. We're deploying to Vercel/static hosts.

### 3. Export (Static)

```javascript
output: 'export'
```

**How it works:**
- Generates static HTML files for all pages
- No Node.js server required
- Deploy to any static host (S3, Netlify, Vercel, GitHub Pages)
- Fast builds and deployments

**Use when:** Content-focused site with no server logic.

**Papyrus CLI needs this?** **Yes!** Perfect for marketing sites.

### Why Static Export for Papyrus

**Advantages:**
- ✅ **Free hosting** - No server costs
- ✅ **Fast** - Pre-rendered HTML, instant loads
- ✅ **Simple deployment** - Just HTML/CSS/JS files
- ✅ **Scalable** - CDN handles any traffic
- ✅ **Reliable** - No server crashes
- ✅ **Portable** - Works on any host

**Trade-offs:**
- ❌ No API routes (we don't need them)
- ❌ No server-side rendering per request (we don't need it)
- ❌ No dynamic routes without `generateStaticParams` (we'll handle this)

**For Papyrus marketing site:**
- Content is static (features, pricing, docs)
- No user authentication
- No real-time data
- **Static export is perfect**

---

## Implementation

### Step 1: Create Next.js Configuration

Navigate to the web package:

```bash
cd packages/web
```

Create `next.config.js`:

```bash
touch next.config.js
```

Add the following configuration:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Generate static HTML files (no Node.js server)
  output: 'export',

  // Disable image optimization for static export
  // (static export doesn't support Next.js Image Optimization API)
  images: {
    unoptimized: true,
  },

  // Transpile shared package from monorepo
  // (Next.js needs to process TypeScript from our shared package)
  transpilePackages: ['@rewrlution/papyrus-shared'],

  // Strict mode for better error detection in development
  reactStrictMode: true,

  // Trailing slashes for cleaner URLs
  // /about -> /about/ (works better with static hosts)
  trailingSlash: true,

  // Base path for deployment to subdirectory
  // Leave empty for root deployment (default)
  // Set to '/papyrus' if deploying to example.com/papyrus/
  basePath: '',

  // Disable powered-by header (security)
  poweredByHeader: false,
};

module.exports = nextConfig;
```

**File location:** `/home/user/papyrus/packages/web/next.config.js`

---

## Understanding the Configuration

Let's break down each option and why it's needed.

### Output Mode

```javascript
output: 'export'
```

**What it does:** Tells Next.js to generate static HTML files instead of running a server.

**Build process:**
```
next build
  ↓
Generates files in ./out/
  ├── index.html           (home page)
  ├── about/index.html     (about page)
  ├── _next/               (JS, CSS bundles)
  └── assets/              (images, fonts)
```

**Deployment:**
```bash
# Upload the ./out/ folder to any static host
vercel deploy
# or
netlify deploy --dir=out
# or
aws s3 sync out/ s3://my-bucket/
```

**What features are disabled:**
- API Routes (`/api/*` endpoints)
- Server-side rendering per request
- Incremental Static Regeneration (ISR)
- Middleware (can't run server-side logic)

**What still works:**
- Client-side routing (React Router)
- Client-side data fetching (fetch, axios)
- All React features
- CSS, Tailwind, animations

### Image Configuration

```javascript
images: {
  unoptimized: true,
}
```

**What it does:** Disables Next.js automatic image optimization.

**Why it's required:**
Next.js Image Optimization requires a server to:
- Resize images on-demand
- Convert formats (WebP, AVIF)
- Serve optimized images

Static export has no server, so we disable optimization.

**What this means:**
```jsx
// Still works, but no automatic optimization
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Papyrus"
  width={200}
  height={50}
/>
```

**How to optimize images:**
1. **Manual optimization:** Use tools like ImageOptim, Squoosh, or Sharp to pre-optimize images
2. **Build-time optimization:** Use next-image-export-optimizer plugin
3. **CDN optimization:** Use Vercel/Cloudflare image optimization (available on static sites)

**For Papyrus:**
- Pre-optimize logo and hero images
- Use SVG where possible (scalable, small)
- Use WebP format for photos
- Keep images under 200KB

### Transpile Packages

```javascript
transpilePackages: ['@rewrlution/papyrus-shared']
```

**What it does:** Tells Next.js to process TypeScript files from the `shared` package.

**Why it's needed:**
By default, Next.js only transpiles files in the current package. Monorepo packages are treated as external dependencies (like npm packages).

**Without this config:**
```
Error: Cannot use TypeScript files from @rewrlution/papyrus-shared
```

**With this config:**
```
✓ Next.js transpiles shared package TypeScript
✓ Can import types and functions
✓ Hot reload works across packages
```

**Example usage:**
```typescript
// In packages/web/app/page.tsx
import { DateStringSchema, DATE_FORMAT } from '@rewrlution/papyrus-shared';

const today = DateStringSchema.parse('2025-01-13');
```

**Multiple packages:**
```javascript
transpilePackages: [
  '@rewrlution/papyrus-shared',
  '@rewrlution/papyrus-another',
]
```

### React Strict Mode

```javascript
reactStrictMode: true
```

**What it does:** Enables additional runtime checks in development.

**Checks performed:**
- Identifies unsafe lifecycle methods
- Warns about legacy string ref API
- Detects unexpected side effects
- Validates deprecated APIs

**Example warning:**
```
Warning: Using UNSAFE_componentWillMount in strict mode
```

**Why enable it:**
- Catches bugs early in development
- Prepares for future React versions
- No performance impact in production
- **Best practice for all React apps**

**Does it slow down development?**
- Renders components twice in dev mode
- Helps find bugs caused by non-pure components
- Disabled automatically in production

### Trailing Slashes

```javascript
trailingSlash: true
```

**What it does:** Adds trailing slashes to all URLs.

**Without trailing slash:**
```
/about          → /about.html (served by server)
/blog/post      → /blog/post.html
```

**With trailing slash:**
```
/about/         → /about/index.html (works on any host)
/blog/post/     → /blog/post/index.html
```

**Why this matters for static export:**

Static hosting works with directory structure:
```
out/
├── about/
│   └── index.html        ← Accessed via /about/
└── blog/
    └── post/
        └── index.html    ← Accessed via /blog/post/
```

**Without trailing slashes:** Some hosts return 404 for `/about` (looking for `about.html` instead of `about/index.html`)

**With trailing slashes:** All hosts serve `about/index.html` for `/about/`

**SEO impact:**
- Google treats `/about` and `/about/` as different URLs
- Trailing slashes provide consistency
- Pick one and stick with it

### Base Path

```javascript
basePath: ''
```

**What it does:** Prefix for all routes.

**Use cases:**

**Root deployment (default):**
```javascript
basePath: ''

// Deployed to: example.com/
// Routes:
//   /          → example.com/
//   /about/    → example.com/about/
```

**Subdirectory deployment:**
```javascript
basePath: '/papyrus'

// Deployed to: example.com/papyrus/
// Routes:
//   /          → example.com/papyrus/
//   /about/    → example.com/papyrus/about/
```

**When to use:**
- Deploying to GitHub Pages user site: `basePath: ''`
- Deploying to GitHub Pages project site: `basePath: '/repo-name'`
- Deploying to subdomain: `basePath: ''`
- Deploying to subfolder: `basePath: '/subfolder'`

**For Papyrus:**
- Deploying to `papyrus-cli.com` (root domain)
- Use `basePath: ''`

### Powered-By Header

```javascript
poweredByHeader: false
```

**What it does:** Removes `X-Powered-By: Next.js` HTTP header.

**Default behavior:**
```
HTTP/1.1 200 OK
X-Powered-By: Next.js
Content-Type: text/html
```

**With poweredByHeader: false:**
```
HTTP/1.1 200 OK
Content-Type: text/html
```

**Why disable it:**
- **Security:** Don't advertise tech stack to attackers
- **Clean headers:** Less metadata sent to browsers
- **Performance:** Slightly smaller headers

**Does it matter?** Not much, but it's a best practice.

---

## Step 2: Test the Configuration

Verify Next.js can read the config:

```bash
# From packages/web/
npx next info
```

**Expected output:**
```
Operating System:
  Platform: linux
  Arch: x64
  Version: #1 SMP

Binaries:
  Node: 20.x.x
  npm: 10.x.x
  Yarn: N/A
  pnpm: 10.x.x

Relevant Packages:
  next: 15.1.6
  react: 19.0.0
  react-dom: 19.0.0
  typescript: 5.7.3

Next.js Config:
  output: "export"
```

**What this shows:**
- Next.js version
- Output mode is set to "export"
- All packages detected

---

## Alternative Configurations

### Configuration for Server-Side Rendering

If you later need SSR for a blog with dynamic content:

```javascript
const nextConfig = {
  // Remove output: 'export'
  images: {
    // Re-enable optimization
    unoptimized: false,
  },
  // Add experimental features
  experimental: {
    ppr: true, // Partial Prerendering
  },
};
```

### Configuration for Hybrid (SSG + SSR)

Mix static and dynamic pages:

```javascript
const nextConfig = {
  // No output specified (default: server)

  // Generate static pages at build time
  generateStaticParams: true,

  // Use ISR for some pages
  revalidate: 3600, // Revalidate every hour
};
```

**Note:** This requires a server (not compatible with static export).

### Configuration for i18n (Internationalization)

If adding multiple languages:

```javascript
const nextConfig = {
  i18n: {
    locales: ['en', 'es', 'fr'],
    defaultLocale: 'en',
  },
  // Note: i18n requires server mode
  // Not compatible with output: 'export'
};
```

**For static sites with i18n:** Use client-side i18n libraries (next-intl, react-i18next).

---

## Common Issues

### Issue 1: "Error: Page "/api/hello" is incompatible with output: export"

**Cause:** Trying to use API routes with static export.

**Solution:** Remove API routes or switch to server mode.

**Why it happens:** API routes require a server to run. Static export generates only HTML/CSS/JS.

**Alternative:** Use external API (Vercel Serverless Functions, Netlify Functions, Cloudflare Workers).

### Issue 2: Images not loading after build

**Cause:** Using `next/image` without `unoptimized: true`.

**Solution:** Already set in our config. Verify:
```javascript
images: {
  unoptimized: true,
}
```

**Alternative:** Use `<img>` tags instead of `next/image`:
```jsx
// Works without config
<img src="/logo.png" alt="Papyrus" />
```

### Issue 3: "Module not found: Can't resolve '@rewrlution/papyrus-shared'"

**Cause:** `transpilePackages` missing or incorrect.

**Solution:** Verify config includes:
```javascript
transpilePackages: ['@rewrlution/papyrus-shared']
```

**Also check:** Shared package is built:
```bash
cd ../shared
pnpm build
```

### Issue 4: 404 errors in production

**Cause:** Missing `trailingSlash: true` or base path incorrect.

**Solution:**
1. Add `trailingSlash: true`
2. Rebuild: `pnpm build`
3. Test locally: `npx serve out`

**Check:** URLs end with `/` (e.g., `/about/` not `/about`)

### Issue 5: Blank page after deployment

**Cause:** Incorrect `basePath` for subdirectory deployment.

**Solution:**
- Root domain: `basePath: ''`
- Subdirectory: `basePath: '/your-subfolder'`

**Test:** Open browser console for errors.

---

## Next.js Best Practices

### 1. Use Environment Variables

```javascript
// next.config.js
const nextConfig = {
  env: {
    SITE_NAME: 'Papyrus',
    SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://papyrus-cli.com',
  },
};
```

**Access in components:**
```typescript
const siteUrl = process.env.SITE_URL;
```

**For secrets:** Use `.env.local` (not committed to git).

### 2. Optimize Build Output

```javascript
const nextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};
```

**What it does:** Removes `console.log()` in production builds.

### 3. Configure Headers (for server mode)

```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
};
```

**Note:** Headers don't work with `output: 'export'`. Set headers in hosting provider (Vercel, Netlify).

---

## Next Steps

Next.js configuration is complete! Next tutorial:

**→ [05-tailwind-setup.md](./05-tailwind-setup.md)** - Set up Tailwind CSS v4 with terminal colors

**What's next:**
- Install and configure Tailwind CSS
- Create terminal color palette
- Set up PostCSS

---

## Summary

**What we built:**
- Next.js config for static site generation
- Image optimization disabled (required for static export)
- Monorepo package transpilation
- Trailing slashes for better static hosting
- Security headers removed

**Key concepts:**
- `output: 'export'` generates static HTML
- Static sites = faster, cheaper, more reliable
- `transpilePackages` needed for monorepo
- Trailing slashes prevent 404s on static hosts

**Configuration highlights:**
```javascript
{
  output: 'export',                    // Static HTML generation
  images: { unoptimized: true },       // Required for static
  transpilePackages: ['@rewrlution/papyrus-shared'], // Monorepo
  trailingSlash: true,                 // Better URL structure
  reactStrictMode: true,               // Catch bugs early
}
```

**Remember:**
- Static export = no server required
- Pre-optimize images manually
- Use trailing slashes for consistent URLs
- Build shared package before running dev server

---

## References

- [Next.js Static Export Documentation](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Next.js Configuration Options](https://nextjs.org/docs/app/api-reference/next-config-js)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Transpile Packages](https://nextjs.org/docs/app/api-reference/next-config-js/transpilePackages)
