# Phase 0.11: Deployment

Build for production, test the static export, and deploy to Vercel with auto-deployment.

## What We're Building

**Goal:** Create a production build, verify the static export works correctly, and deploy to Vercel with automatic deployments on git push.

**Why:** A working deployment pipeline is essential. It validates your setup, provides a live preview URL, and enables continuous deployment for rapid iteration.

**What you'll learn:**
- How Next.js static export builds work
- How to test the production build locally
- How to deploy to Vercel
- How to set up auto-deployment from GitHub

---

## Prerequisites

- Completed [10-shadcn-init.md](./10-shadcn-init.md)
- Components installed and working
- Git repository initialized
- Vercel account (free tier) - Create at [vercel.com](https://vercel.com)

---

## Understanding Next.js Build Process

### Development vs Production

**Development mode (`pnpm dev`):**
```bash
pnpm dev
# → Runs Next.js dev server
# → Fast refresh (hot reload)
# → Source maps enabled
# → No optimization
# → TypeScript errors shown in browser
```

**Purpose:** Fast iteration, debugging

**Output:** No files generated (served from memory)

---

**Production mode (`pnpm build`):**
```bash
pnpm build
# → Compiles TypeScript
# → Optimizes JavaScript (minification, tree-shaking)
# → Generates static HTML files
# → Optimizes CSS (removes unused styles)
# → Creates production bundles
```

**Purpose:** Optimized for performance and size

**Output:** Static files in `out/` directory

---

### Static Export Process

With `output: 'export'` in `next.config.js`:

```
1. next build
   ↓
2. Compile all pages to HTML
   ↓
3. Generate static assets (CSS, JS, images)
   ↓
4. Output to ./out/ directory
   ↓
5. Ready to deploy (no Node.js server needed)
```

**Generated structure:**
```
out/
├── index.html              # Home page
├── about/
│   └── index.html         # About page (if exists)
├── _next/
│   ├── static/
│   │   ├── chunks/        # JavaScript bundles
│   │   ├── css/           # Stylesheets
│   │   └── media/         # Fonts, images
│   └── ...
└── [other static files]
```

**Deployment:**
Upload `out/` folder to any static host (Vercel, Netlify, S3, GitHub Pages, etc.)

---

## Implementation

### Step 1: Build for Production

Navigate to the web package:

```bash
cd packages/web
```

Run the production build:

```bash
pnpm build
```

**Expected output:**
```
   ▲ Next.js 15.1.6

   Creating an optimized production build ...
 ✓ Compiled successfully
 ✓ Linting and checking validity of types
 ✓ Collecting page data
 ✓ Generating static pages (3/3)
 ✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    5.2 kB         92.1 kB
└ ○ /favicon.ico                         0 B                0 B

○  (Static)  prerendered as static content

✓ Export successful. Files written to /home/user/papyrus/packages/web/out
```

**What this output means:**

**Route table:**
- `/` - Home page (5.2 kB HTML + 92.1 kB JavaScript)
- `○ (Static)` - Pre-rendered at build time

**Sizes:**
- **Size:** HTML file size
- **First Load JS:** Total JavaScript needed for initial page load
- Target: < 100 kB for good performance

**Exit code:**
- `0` - Success
- Non-zero - Build failed (check errors)

---

### Step 2: Inspect Build Output

Check the generated files:

```bash
ls -lh out/
```

**Expected files:**
```
total 24K
-rw-r--r-- 1 user user  7.8K index.html
drwxr-xr-x 3 user user  4.0K _next/
-rw-r--r-- 1 user user   15K favicon.ico
```

**View home page HTML:**
```bash
head -20 out/index.html
```

**Expected content:**
```html
<!DOCTYPE html>
<html lang="en" class="__variable_abc123 __variable_xyz789">
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>Papyrus - Developer Journaling for the Command Line</title>
    <meta name="description" content="A powerful CLI tool..."/>
    <link rel="stylesheet" href="/_next/static/css/abc123.css"/>
    <script src="/_next/static/chunks/main-xyz789.js" defer></script>
  </head>
  <body class="min-h-screen bg-background font-sans antialiased">
    <!-- Pre-rendered HTML content -->
    <main class="min-h-screen bg-terminal-black">
      <section class="container-custom py-20">
        <!-- Full page HTML here -->
      </section>
    </main>
  </body>
</html>
```

**What to check:**
- ✅ HTML includes full content (not just a root div)
- ✅ Metadata is present (title, description, OpenGraph)
- ✅ CSS is linked (in `<head>`)
- ✅ JavaScript is deferred (loads after HTML)
- ✅ Class names match your code

---

### Step 3: Test Locally

Serve the static files locally:

```bash
npx serve out
```

**Expected output:**
```
   ┌─────────────────────────────────────────┐
   │                                         │
   │   Serving!                              │
   │                                         │
   │   - Local:    http://localhost:3000     │
   │   - Network:  http://192.168.1.x:3000   │
   │                                         │
   │   Copied local address to clipboard!    │
   │                                         │
   └─────────────────────────────────────────┘
```

**What `serve` does:**
- Serves static files from `out/` directory
- No build step (just HTTP server)
- Simulates production environment

---

### Step 4: Verify Production Build

Open browser to `http://localhost:3000`

**Test checklist:**

**Visual tests:**
- [ ] Page loads correctly
- [ ] All content visible
- [ ] Fonts load (Geist Sans, Geist Mono)
- [ ] Colors match design (terminal palette)
- [ ] No layout shift on load
- [ ] Images load (if any)

**Functionality tests:**
- [ ] Links work
- [ ] Buttons have hover effects
- [ ] Responsive design works (resize window)
- [ ] No console errors
- [ ] No 404 errors for assets

**Performance tests:**
- [ ] Page loads fast (< 2 seconds)
- [ ] No flash of unstyled content (FOUC)
- [ ] Smooth interactions

**Browser DevTools checks:**

**Network tab:**
```
✓ index.html       (< 10 KB)
✓ main.js          (< 100 KB)
✓ styles.css       (< 20 KB)
✓ fonts            (< 200 KB total)
```

**Console tab:**
```
✓ No errors
✓ No warnings
```

**Lighthouse audit (optional):**
1. Open DevTools → Lighthouse
2. Click "Analyze page load"
3. Target scores:
   - Performance: > 90
   - Accessibility: > 95
   - Best Practices: > 90
   - SEO: > 95

---

### Step 5: Stop Local Server

Press `Ctrl+C` to stop the serve process.

---

## Deploying to Vercel

### Why Vercel?

**Advantages:**
- ✅ **Zero config:** Detects Next.js automatically
- ✅ **Fast CDN:** Global edge network
- ✅ **Free tier:** Generous limits (100 GB bandwidth/month)
- ✅ **Auto-deployment:** Git push → live in seconds
- ✅ **Preview URLs:** Every PR gets a preview URL
- ✅ **Analytics:** Built-in performance monitoring

**Alternatives:**
- **Netlify:** Similar features, good for static sites
- **Cloudflare Pages:** Fast, generous free tier
- **GitHub Pages:** Free, but slower builds
- **AWS S3 + CloudFront:** More control, more complex

**For Papyrus:** Vercel is the best choice (made by Next.js creators).

---

### Step 1: Prepare Git Repository

Ensure your code is committed:

```bash
cd /home/user/papyrus

# Check status
git status
```

**If you have uncommitted changes:**
```bash
# Add all files
git add .

# Commit
git commit -m "feat(web): complete Phase 0 setup"
```

**Push to GitHub:**
```bash
# If you haven't already
git remote add origin https://github.com/YOUR_USERNAME/papyrus.git

# Push
git push -u origin main
```

**What Vercel needs:**
- Git repository (GitHub, GitLab, or Bitbucket)
- Code pushed to remote
- `package.json` with build scripts

---

### Step 2: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your repositories

**Free tier limits:**
- 100 GB bandwidth/month
- Unlimited deployments
- Unlimited preview deployments
- 100 GB-hours serverless execution (not needed for static export)

---

### Step 3: Import Project

**In Vercel dashboard:**

1. Click "Add New..."
2. Select "Project"
3. Choose "Import Git Repository"
4. Find your `papyrus` repository
5. Click "Import"

**Import screen options:**

**Framework Preset:**
```
Framework Preset: Next.js
✓ Automatically detected
```

**Root Directory:**
```
Root Directory: packages/web

(Important: Set this to packages/web for monorepo)
```

**Build and Output Settings:**
```
Build Command: pnpm build
Output Directory: out
Install Command: pnpm install
```

**Environment Variables:**
```
(Leave empty for now)
```

**Click "Deploy"**

---

### Step 4: Wait for Deployment

Vercel will:
1. Clone your repository
2. Install dependencies (`pnpm install`)
3. Run build command (`pnpm build`)
4. Deploy to CDN

**Build log output:**
```
Cloning repository...
✓ Repository cloned

Installing dependencies...
✓ pnpm install completed (12.3s)

Building...
✓ next build completed (23.1s)

Deploying...
✓ Deployment completed (5.2s)

Production: https://papyrus-xyz123.vercel.app
```

**Total time:** 1-2 minutes

---

### Step 5: Test Production Deployment

Click the production URL (e.g., `https://papyrus-xyz123.vercel.app`)

**Verify:**
- [ ] Site loads
- [ ] All content visible
- [ ] Fonts load correctly
- [ ] No errors in console
- [ ] Responsive design works
- [ ] Fast load time (< 2 seconds)

**Test on different devices:**
- Desktop browser
- Mobile browser
- Different browsers (Chrome, Firefox, Safari)

---

### Step 6: Configure Custom Domain (Optional)

**In Vercel dashboard:**

1. Go to your project
2. Click "Settings" → "Domains"
3. Add your domain (e.g., `papyrus-cli.com`)
4. Follow DNS configuration instructions

**DNS setup (example for Cloudflare):**
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

**SSL:**
- Automatic (Vercel provides free SSL via Let's Encrypt)
- Renewals handled automatically

**Note:** Custom domain setup takes 24-48 hours for DNS propagation.

---

## Setting Up Auto-Deployment

### How Auto-Deployment Works

**Workflow:**
```
1. Push code to GitHub
   ↓
2. GitHub webhook notifies Vercel
   ↓
3. Vercel pulls latest code
   ↓
4. Vercel runs build
   ↓
5. Vercel deploys to production
   ↓
6. You get notification (optional)
```

**Branch rules:**
- `main` → Production deployment
- `develop` → Preview deployment
- Pull requests → Unique preview URLs

### Enable Auto-Deployment

**Already enabled!** Vercel sets this up automatically when you import a project.

**Verify:**
1. Go to project settings
2. Click "Git"
3. Check "Production Branch": `main` (or your default branch)

**Test auto-deployment:**

```bash
# Make a change
cd packages/web/app
echo "// Test change" >> page.tsx

# Commit and push
git add .
git commit -m "test: verify auto-deployment"
git push
```

**What happens:**
1. Vercel detects push
2. Starts new deployment
3. You get notification (if enabled)
4. Live in ~1 minute

**Check deployment:**
1. Go to Vercel dashboard
2. Click "Deployments"
3. See latest deployment in progress
4. Click to view build logs

---

## Environment Variables

### Adding Environment Variables

**In Vercel dashboard:**

1. Go to project settings
2. Click "Environment Variables"
3. Add variables:

```
Name: NEXT_PUBLIC_SITE_URL
Value: https://papyrus-cli.com
Environment: Production, Preview, Development
```

**Variable types:**

**`NEXT_PUBLIC_*`:**
- Exposed to browser (public)
- Use for API URLs, public keys

**Without prefix:**
- Server-side only
- Use for secrets, API keys

**Example variables for later:**
```
NEXT_PUBLIC_API_URL=https://api.papyrus-cli.com
NEXT_PUBLIC_ANALYTICS_ID=GA-123456789
```

### Using Environment Variables

**In code:**
```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
```

**In next.config.js:**
```javascript
module.exports = {
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};
```

**Note:** Environment variables are baked into the build (static export). Changing them requires a rebuild.

---

## Common Issues

### Issue 1: Build fails on Vercel

**Cause:** Missing dependencies or monorepo config.

**Solution:**
1. Check build logs in Vercel dashboard
2. Verify `Root Directory` is set to `packages/web`
3. Ensure `pnpm-workspace.yaml` is committed
4. Check that shared package builds successfully

**Debug locally:**
```bash
cd packages/web
pnpm build
```

### Issue 2: Page shows 404

**Cause:** Routing issue or incorrect output directory.

**Solution:**
1. Verify `output: 'export'` in `next.config.js`
2. Check that `out/` directory has `index.html`
3. Ensure `trailingSlash: true` (for consistent routing)

### Issue 3: Styles not loading

**Cause:** CSS not generated or path issue.

**Solution:**
1. Check `out/_next/static/css/` has CSS files
2. Verify `globals.css` is imported in `layout.tsx`
3. Clear Vercel cache: Settings → General → Clear cache

### Issue 4: Fonts not loading

**Cause:** Font files not included in build.

**Solution:**
1. Check `out/_next/static/media/` has font files
2. Verify Geist fonts installed: `pnpm list geist`
3. Check Network tab for 404s on font files

### Issue 5: Build succeeds but deployment fails

**Cause:** Output directory mismatch.

**Solution:**
1. Verify Output Directory: `out`
2. Check build command generates files in `out/`
3. Re-deploy: Deployments → ⋯ → Redeploy

### Issue 6: Auto-deployment not working

**Cause:** GitHub webhook not configured.

**Solution:**
1. Go to GitHub repo settings
2. Webhooks → Verify Vercel webhook exists
3. Re-connect: Vercel → Settings → Git → Disconnect & Reconnect

---

## Deployment Best Practices

### 1. Use Preview Deployments

**Create branches for features:**
```bash
git checkout -b feature/new-section
# Make changes
git push origin feature/new-section
```

**Result:**
- Vercel creates preview URL
- Test before merging to main
- No impact on production

### 2. Monitor Build Times

**Check build duration:**
- Target: < 1 minute
- Warning: > 2 minutes
- Investigate if > 5 minutes

**Optimize if slow:**
- Check for large dependencies
- Remove unused packages
- Use dynamic imports for large components

### 3. Enable Vercel Analytics (Optional)

**In Vercel dashboard:**
1. Project → Analytics
2. Enable Web Analytics
3. View performance metrics

**Metrics tracked:**
- Core Web Vitals (LCP, FID, CLS)
- Page load times
- Geographic distribution

### 4. Set Up Notifications

**In Vercel dashboard:**
1. Settings → Notifications
2. Enable deployment notifications
3. Choose: Email, Slack, or webhook

**Get notified when:**
- Deployment succeeds
- Deployment fails
- Build takes too long

---

## Performance Optimization

### Analyze Bundle Size

```bash
# Build with analysis
ANALYZE=true pnpm build
```

**Check output:**
```
Page                                      Size     First Load JS
┌ ○ /                                    5.2 kB         92.1 kB
```

**Target sizes:**
- First Load JS: < 100 kB (good), < 150 kB (okay)
- Page HTML: < 10 kB
- CSS: < 20 kB

**If too large:**
1. Check for large dependencies
2. Use dynamic imports
3. Remove unused code

### Optimize Images

**Best practices:**
- Use WebP format
- Compress images (< 200 KB)
- Use `next/image` (auto-optimization)
- Add `loading="lazy"` for below-fold images

### Enable Compression

**Vercel handles this automatically:**
- Gzip for older browsers
- Brotli for modern browsers

---

## Next Steps

**Phase 0 is complete!** 🎉

You now have:
- ✅ Working Next.js setup
- ✅ Tailwind CSS with terminal colors
- ✅ Global styles and theming
- ✅ Geist fonts
- ✅ shadcn/ui components
- ✅ Production deployment on Vercel
- ✅ Auto-deployment pipeline

**What's next:**

**Phase 1: Content & Components**
- Build hero section
- Create feature cards
- Add installation guide
- Build pricing section
- Create footer

**Phase 2: Interactivity**
- Add terminal animation
- Interactive code examples
- Newsletter signup
- Analytics integration

**Phase 3: Content Pages**
- Documentation
- Blog
- Changelog

---

## Summary

**What we built:**
- Production build pipeline
- Local testing with `serve`
- Deployment to Vercel
- Auto-deployment from GitHub

**Key concepts:**
- `next build` generates static files in `out/`
- Static export = no server needed
- Vercel detects Next.js automatically
- Git push triggers deployment

**Commands:**
```bash
# Build for production
pnpm build

# Test locally
npx serve out

# Deploy (via git push)
git push origin main
```

**Vercel setup:**
```
Root Directory: packages/web
Build Command: pnpm build
Output Directory: out
Install Command: pnpm install
```

**Remember:**
- Test locally before deploying
- Use preview deployments for features
- Monitor build times
- Set up deployment notifications
- Check Lighthouse scores regularly

---

## References

- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI](https://vercel.com/docs/cli)
- [Vercel Analytics](https://vercel.com/docs/analytics)
- [Web Vitals](https://web.dev/vitals/)

---

**Congratulations!** 🎉

Your Papyrus marketing website foundation is live. You've completed Phase 0 and have a solid foundation for building the full marketing site.

**Production URL:** Check your Vercel dashboard for your live URL.

**Next:** Start building content sections in Phase 1!
