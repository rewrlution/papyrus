# SEO Optimization: From Fundamentals to Implementation

Learn how search engines work, why SEO matters, and how to optimize your marketing site.

## What We're Learning

This tutorial teaches:
- **SEO Fundamentals** (40%): What SEO is, how it works, and why it matters
- **Implementation** (60%): Practical SEO techniques for your Papyrus site

By the end, you'll understand not just *how* to add meta tags, but *why* they matter and what each one does.

**Why this matters:** Even the best product won't get users if nobody can find it. SEO makes your site discoverable on Google, shareable on social media, and accessible to everyone.

**Expected outcome:** A marketing site optimized for search engines, social sharing, and user discovery.

---

## Part 1: SEO Fundamentals (Learning)

### What is SEO? (Explain Like I'm 5)

**SEO** stands for **Search Engine Optimization**. It's the practice of making your website easier for search engines to understand and rank.

**Think of it like a library:**
- Your website = A book
- Search engines (Google) = The librarian
- SEO = The book's title, summary, and index that help the librarian find and recommend it

**Without SEO:**
- Librarian doesn't know what your book is about
- Can't recommend it to people searching for that topic
- Book sits on shelf, unread

**With SEO:**
- Clear title tells librarian what it's about
- Summary helps them match it to searches
- Index helps them find specific information
- Book gets recommended and read

### How Search Engines Work

Search engines follow a 3-step process:

#### 1. Crawling (Discovery)

**What it is:** Search engines send "bots" (automated programs) to visit websites and find pages.

**How it works:**
- Bot starts at a known page (your home page)
- Follows every link it finds
- Discovers new pages through links
- Stores page URLs for processing

**Real-world example:**
```
Google bot visits papyrus.dev
↓
Finds link to /docs
↓
Visits papyrus.dev/docs
↓
Finds link to /features
↓
Visits papyrus.dev/features
(and so on...)
```

**Why it matters:**
- If your page has no links pointing to it, bots can't find it
- Dead links (404 errors) waste the bot's time
- More internal links = faster discovery

#### 2. Indexing (Understanding)

**What it is:** Search engines analyze pages and store information about them.

**What they look at:**
- **Title tag:** What is this page about? (most important)
- **Headings (H1, H2, H3):** What topics does it cover?
- **Text content:** What information does it provide?
- **Images:** Alt text describing images
- **Links:** What pages does it link to? What sites link to it?
- **Metadata:** Description, keywords, language

**Real-world example:**
```
Google reads your page and stores:
- Title: "Papyrus CLI - Journal Like You Code"
- Main topic: "terminal journaling for developers"
- Keywords: "CLI", "journal", "developer", "terminal"
- Links: GitHub repo, documentation
```

**Why it matters:**
- Well-structured content is easier to index
- Clear titles and headings improve understanding
- Missing metadata = missed ranking opportunities

#### 3. Ranking (Ordering Results)

**What it is:** When someone searches, the engine decides which pages to show and in what order.

**Ranking factors** (simplified):
1. **Relevance:** Does the page match the search query?
2. **Quality:** Is the content helpful and accurate?
3. **Authority:** Do other sites link to this page?
4. **User experience:** Is the page fast, mobile-friendly, secure?
5. **Freshness:** Is the content up-to-date?

**Real-world example:**
```
User searches: "terminal journal app"

Google ranks pages:
1. Papyrus (exact match, fast site, GitHub links)
2. Competitor A (similar, but slower site)
3. Blog post (mentions it, but not dedicated tool)
```

**Why it matters:**
- Higher ranking = more visibility = more users
- First page gets 90%+ of clicks
- Position 1 gets 30%+ of clicks

### Why SEO Matters for Marketing Sites

**The numbers:**
- 68% of online experiences begin with a search engine
- 53% of all website traffic comes from organic search
- First page of Google captures 90% of clicks
- **If you're not on page 1, you're invisible**

**For Papyrus specifically:**
- Developers search for "terminal journal", "CLI journal app", "developer journaling"
- Without SEO, they find competitors
- With SEO, they find you
- More traffic = more installs = more users

**ROI of SEO:**
- Free traffic (unlike paid ads)
- Compounds over time (better rankings = more links = even better rankings)
- Builds authority (high ranking = trusted tool)

### Key Ranking Factors (What Google Looks At)

#### 1. Title Tag (Most Important!)

**What it is:** The `<title>` in your HTML `<head>`.

**Why it matters:**
- First thing Google reads
- Appears in search results (blue clickable link)
- Appears in browser tab
- Heavily weighted in ranking algorithm

**Best practices:**
- **Length:** 50-60 characters (longer gets truncated)
- **Include keyword:** Front-load most important terms
- **Be descriptive:** Tell users what the page is about
- **Unique:** Every page should have different title

**Examples:**
```html
<!-- Good -->
<title>Papyrus CLI - Journal Like You Code | Terminal Journaling Tool</title>

<!-- Bad: Too long -->
<title>Papyrus CLI - The Best Terminal-Based Journaling Application for Developers Who Want to Journal Directly from Command Line</title>

<!-- Bad: Too vague -->
<title>Home</title>

<!-- Bad: Keyword stuffing -->
<title>Journal, Journaling, CLI Journal, Terminal Journal, Developer Journal</title>
```

#### 2. Meta Description

**What it is:** A short summary of the page (150-160 characters).

**Why it matters:**
- Appears in search results (under the title)
- Doesn't directly affect ranking, but affects click-through rate
- Higher CTR = more traffic = indirect ranking boost

**Best practices:**
- **Length:** 150-160 characters
- **Compelling:** Convince users to click
- **Include keyword:** Match search intent
- **Call to action:** "Try it", "Learn more", "Get started"

**Examples:**
```html
<!-- Good -->
<meta name="description" content="Write journal entries in your favorite editor. Browse with vim-style navigation. Sync to cloud. Free, open-source terminal journaling for developers." />

<!-- Bad: Too short -->
<meta name="description" content="A journaling app." />

<!-- Bad: Too long (gets truncated) -->
<meta name="description" content="Papyrus is an incredibly powerful and feature-rich terminal-based journaling application specifically designed for developers who want to maintain a daily journal without leaving their command line environment and who value privacy and local-first data storage." />
```

#### 3. Heading Hierarchy (H1, H2, H3)

**What it is:** HTML heading tags that structure your content.

**Why it matters:**
- Helps Google understand page structure
- Improves accessibility (screen readers use headings to navigate)
- Affects keyword rankings (H1 > H2 > H3 in importance)

**Best practices:**
- **One H1 per page:** Your main headline
- **Logical hierarchy:** H1 → H2 → H3 (don't skip levels)
- **Descriptive:** Headings should describe the section
- **Keywords:** Include relevant terms naturally

**Examples:**
```html
<!-- Good structure -->
<h1>Papyrus CLI - Journal Like You Code</h1>
  <h2>Features</h2>
    <h3>Quick Journaling</h3>
    <h3>Cloud Sync</h3>
  <h2>Quick Start</h2>
    <h3>Installation</h3>
    <h3>Getting Started</h3>

<!-- Bad: Multiple H1s -->
<h1>Papyrus CLI</h1>
<h1>Features</h1>
<h1>Quick Start</h1>

<!-- Bad: Skipping levels -->
<h1>Papyrus</h1>
  <h3>Features</h3>  <!-- Should be H2 -->

<!-- Bad: Using headings for styling -->
<h4>This is just big text</h4>  <!-- Use CSS instead -->
```

#### 4. Semantic HTML

**What it is:** Using HTML tags that describe their meaning (not just appearance).

**Why it matters:**
- Google understands page structure better
- Screen readers navigate more easily
- Better accessibility = better UX = better rankings

**Examples:**
```html
<!-- Good: Semantic -->
<header>
  <nav>
    <a href="/">Home</a>
  </nav>
</header>

<main>
  <article>
    <h1>Main Content</h1>
    <section>
      <h2>Section 1</h2>
    </section>
  </article>
</main>

<footer>
  <p>Copyright info</p>
</footer>

<!-- Bad: Non-semantic -->
<div class="header">
  <div class="navigation">
    <a href="/">Home</a>
  </div>
</div>

<div class="main-content">
  <div class="article">
    <div class="title">Main Content</div>
  </div>
</div>
```

#### 5. Page Speed (Core Web Vitals)

**What it is:** How fast your page loads and responds to user input.

**Why it matters:**
- Google officially ranks faster sites higher
- Users abandon slow sites (53% leave if load > 3 seconds)
- Mobile users especially sensitive to speed

**Key metrics:**
- **LCP (Largest Contentful Paint):** < 2.5 seconds (when main content visible)
- **FID (First Input Delay):** < 100ms (how fast page responds to clicks)
- **CLS (Cumulative Layout Shift):** < 0.1 (how much page jumps around)

**How to improve:**
- Optimize images (use WebP, lazy loading)
- Minimize JavaScript (code split, tree shake)
- Use caching (CDN, browser cache)
- Server-side rendering (Next.js does this!)

### Social Media SEO

Social media platforms generate previews when you share links. These use special meta tags.

#### Open Graph (Facebook, LinkedIn, Discord)

**What it is:** Meta tags that control how your page looks when shared.

**Tags:**
```html
<meta property="og:title" content="Papyrus CLI - Journal Like You Code" />
<meta property="og:description" content="Write journal entries in your terminal..." />
<meta property="og:image" content="https://papyrus.dev/og-image.png" />
<meta property="og:url" content="https://papyrus.dev" />
<meta property="og:type" content="website" />
```

**Why it matters:**
- Controls preview image, title, description
- Better previews = more clicks
- More clicks = more traffic

#### Twitter Cards

**What it is:** Similar to Open Graph, but for Twitter/X.

**Tags:**
```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="="twitter:title" content="Papyrus CLI" />
<meta name="twitter:description" content="Journal in your terminal..." />
<meta name="twitter:image" content="https://papyrus.dev/twitter-image.png" />
```

**Card types:**
- `summary`: Small image, title, description
- `summary_large_image`: Large image (recommended)
- `app`: Mobile app install card
- `player`: Video/audio player card

#### Preview Image Best Practices

**Size:** 1200x630 pixels (2:1 ratio)
**Format:** PNG or JPG
**File size:** < 300KB (faster loading)
**Content:**
- Include logo/brand
- Include key message (e.g., "Journal Like You Code")
- Use high contrast (readable when small)
- No text smaller than 40px font size

### Structured Data (JSON-LD)

**What it is:** Machine-readable data that helps search engines understand your site.

**Why it matters:**
- Enables "rich snippets" in search results (star ratings, prices, etc.)
- Helps Google understand relationships (who made this, what type of thing is it)
- Can increase click-through rate with enhanced results

**Common types:**
- `WebSite`: Your website's basic info
- `Organization`: Your company/project info
- `SoftwareApplication`: For software products (like Papyrus!)
- `Article`: For blog posts
- `FAQPage`: For FAQ sections

**Example:**
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Papyrus CLI",
  "description": "Terminal-based journaling for developers",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "macOS, Linux, Windows",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
```

**Where to add:**
```html
<script type="application/ld+json">
  {structured data here}
</script>
```

---

## Part 2: Implementation (Doing)

Now that you understand SEO fundamentals, let's implement them on the Papyrus site.

### Step 1: Add Comprehensive Metadata

**Goal:** Optimize the page for search engines and social media

Update `app/layout.tsx` with complete metadata:

```typescript
// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  // Basic metadata
  title: {
    default: "Papyrus CLI - Journal Like You Code",
    template: "%s | Papyrus CLI", // For other pages: "About | Papyrus CLI"
  },
  description:
    "Write journal entries in your favorite editor. Browse with vim-style navigation. Sync to cloud. Free, open-source terminal journaling for developers.",

  // Keywords (less important than before, but still useful)
  keywords: [
    "terminal journal",
    "CLI journal",
    "developer journal",
    "command line journaling",
    "terminal diary",
    "vim journal",
    "local-first journaling",
    "markdown journal",
  ],

  // Author and creator
  authors: [{ name: "Rewrlution", url: "https://github.com/rewrlution" }],
  creator: "Rewrlution",

  // Open Graph (Facebook, LinkedIn, Discord)
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://papyrus.dev", // Update with your actual domain
    siteName: "Papyrus CLI",
    title: "Papyrus CLI - Journal Like You Code",
    description:
      "Write journal entries in your favorite editor. Browse with vim-style navigation. Sync to cloud. Free, open-source terminal journaling for developers.",
    images: [
      {
        url: "/og-image.png", // We'll create this
        width: 1200,
        height: 630,
        alt: "Papyrus CLI - Terminal Journaling for Developers",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "Papyrus CLI - Journal Like You Code",
    description:
      "Write journal entries in your terminal. Browse with vim navigation. Sync to cloud. Free & open-source.",
    images: ["/twitter-image.png"], // Can be same as og-image.png
    creator: "@rewrlution", // Update with your Twitter handle
  },

  // Icons and theme
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  // Mobile web app
  appleWebApp: {
    capable: true,
    title: "Papyrus CLI",
    statusBarStyle: "black-translucent",
  },

  // Verification (for Google Search Console)
  verification: {
    google: "YOUR_GOOGLE_VERIFICATION_CODE", // Add after submitting to Search Console
  },

  // Other
  robots: {
    index: true, // Allow indexing
    follow: true, // Allow following links
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
```

**What each field does:**

- **title.default:** Main page title (search results, browser tab)
- **title.template:** Pattern for other pages (e.g., "About %s" → "About | Papyrus CLI")
- **description:** Shows in search results under title (most important for CTR)
- **keywords:** Less important now, but helps with context
- **openGraph:** Controls Facebook/LinkedIn/Discord previews
- **twitter:** Controls Twitter/X preview cards
- **icons:** Favicon and Apple touch icon
- **robots:** Tells crawlers to index and follow links

### Step 2: Add Structured Data

**Goal:** Help search engines understand Papyrus is a software application

Create a component for JSON-LD structured data:

```typescript
// components/shared/structured-data.tsx
export function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      // Organization
      {
        "@type": "Organization",
        "@id": "https://papyrus.dev/#organization",
        name: "Papyrus CLI",
        url: "https://papyrus.dev",
        logo: {
          "@type": "ImageObject",
          url: "https://papyrus.dev/logo.png",
        },
        sameAs: [
          "https://github.com/rewrlution/papyrus",
        ],
      },

      // Website
      {
        "@type": "WebSite",
        "@id": "https://papyrus.dev/#website",
        url: "https://papyrus.dev",
        name: "Papyrus CLI",
        description: "Terminal-based journaling for developers",
        publisher: {
          "@id": "https://papyrus.dev/#organization",
        },
      },

      // Software Application
      {
        "@type": "SoftwareApplication",
        name: "Papyrus CLI",
        applicationCategory: "DeveloperApplication",
        operatingSystem: ["macOS", "Linux", "Windows"],
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        description:
          "Write journal entries in your favorite editor. Browse with vim-style navigation. Sync to cloud. Free, open-source terminal journaling for developers.",
        url: "https://papyrus.dev",
        downloadUrl: "https://github.com/rewrlution/papyrus",
        softwareVersion: "1.0.0", // Update with actual version
        license: "https://opensource.org/licenses/MIT",
        programmingLanguage: "TypeScript",
        codeRepository: "https://github.com/rewrlution/papyrus",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
```

Add to layout:

```typescript
// app/layout.tsx
import { StructuredData } from "@/components/shared/structured-data";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <StructuredData />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

**What this does:**
- Tells Google: "This is a software application"
- Specifies: Free, open-source, works on macOS/Linux/Windows
- May enable rich snippets (app download button, ratings, etc.)

### Step 3: Create Social Media Preview Images

**Goal:** Create og-image.png and twitter-image.png

You'll need to create preview images. Here's what to include:

**og-image.png (1200x630 pixels):**
- Dark background (#0a0e14 - terminal black)
- Papyrus ASCII logo in cyan
- Tagline: "Journal Like You Code"
- Subtitle: "Terminal journaling for developers"
- Optional: Screenshot of TUI

**Quick creation options:**

1. **Using Figma/Canva:**
   - Create 1200x630 canvas
   - Add background, logo, text
   - Export as PNG

2. **Using code (Next.js OG Image):**
```typescript
// app/og-image/route.tsx
import { ImageResponse } from "next/og";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0e14",
          color: "#00d9ff",
          fontFamily: "monospace",
        }}
      >
        <div style={{ fontSize: 80, marginBottom: 20 }}>PAPYRUS</div>
        <div style={{ fontSize: 40, color: "#e0e0e0" }}>
          Journal Like You Code
        </div>
        <div style={{ fontSize: 24, color: "#666", marginTop: 20 }}>
          Terminal journaling for developers
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
```

3. **Placeholder (for now):**
Create a simple image and save to `public/og-image.png` and `public/twitter-image.png`.

### Step 4: Add Favicon

**Goal:** Create favicon.ico for browser tabs

**Quick creation:**
1. Create 32x32 pixel image (Papyrus logo or "P" letter)
2. Save as `public/favicon.ico`
3. Optionally create `public/apple-touch-icon.png` (180x180)

**Using online tool:**
- Visit [favicon.io](https://favicon.io/)
- Upload logo or use text generator
- Download and add to `public/` folder

### Step 5: Verify SEO Implementation

**Goal:** Check that metadata is correct

**Test 1: View Page Source**
```bash
# Visit your site
open http://localhost:3000

# View source (Cmd/Ctrl + U)
# Look for:
- <title>Papyrus CLI - Journal Like You Code</title>
- <meta name="description" content="...">
- <meta property="og:title" content="...">
- <meta name="twitter:card" content="...">
- <script type="application/ld+json">...</script>
```

**Test 2: Open Graph Preview**
- Visit [opengraph.xyz](https://www.opengraph.xyz/)
- Enter your URL (or localhost URL)
- See how it looks on Facebook, LinkedIn, Discord

**Test 3: Twitter Card Validator**
- Visit [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- Enter your URL
- Check preview appearance

**Test 4: Google Rich Results Test**
- Visit [Rich Results Test](https://search.google.com/test/rich-results)
- Enter your URL
- Check if structured data is valid

**Test 5: Lighthouse SEO Audit**
```bash
# Build for production
pnpm build && pnpm start

# Open Chrome DevTools → Lighthouse
# Run SEO audit
# Should score 90+
```

## Common Issues

### Issue: Meta tags not showing in view source

**Solution:** Ensure metadata is in `layout.tsx`, not `page.tsx`:

```typescript
// Correct: app/layout.tsx
export const metadata = { /* ... */ };

// Wrong: app/page.tsx (works, but layout is better)
export const metadata = { /* ... */ };
```

**Why:** Layout metadata applies to all pages. Page metadata is page-specific.

### Issue: Open Graph image not displaying

**Solution:** Check image URL is absolute (not relative):

```typescript
// Correct:
images: [{ url: "https://papyrus.dev/og-image.png" }],

// Wrong:
images: [{ url: "/og-image.png" }], // Relative URL doesn't work in previews
```

**Why:** Social media platforms need full URLs to fetch images.

### Issue: Structured data validation errors

**Solution:** Use [Schema.org validator](https://validator.schema.org/):

```bash
# Copy your JSON-LD
# Paste into validator
# Fix any errors highlighted
```

**Common errors:**
- Missing required fields
- Wrong data types (number vs. string)
- Invalid URLs

### Issue: Lighthouse SEO score low

**Common reasons:**
- Missing meta description
- Not mobile-friendly (viewport tag missing)
- Links don't have descriptive text
- Images missing alt attributes
- Headings not in order (H1 → H3, skipping H2)

## Testing

### SEO Checklist

```markdown
**Basic SEO:**
- [ ] Title tag present (50-60 chars)
- [ ] Meta description present (150-160 chars)
- [ ] One H1 per page
- [ ] Headings in logical order (H1 → H2 → H3)
- [ ] Images have alt attributes
- [ ] Links have descriptive text

**Open Graph:**
- [ ] og:title
- [ ] og:description
- [ ] og:image (1200x630)
- [ ] og:url
- [ ] og:type="website"

**Twitter Card:**
- [ ] twitter:card="summary_large_image"
- [ ] twitter:title
- [ ] twitter:description
- [ ] twitter:image

**Structured Data:**
- [ ] JSON-LD script present
- [ ] Valid schema.org format
- [ ] No validation errors

**Technical:**
- [ ] Favicon exists
- [ ] Apple touch icon exists (optional)
- [ ] Robots meta tag allows indexing
- [ ] Page loads < 3 seconds
- [ ] Mobile-friendly (viewport meta tag)
```

### Validation Tools

```markdown
- [ ] View source shows all meta tags
- [ ] opengraph.xyz preview looks good
- [ ] Twitter Card Validator shows correct preview
- [ ] Google Rich Results Test passes
- [ ] Lighthouse SEO score > 90
- [ ] No console errors in production
```

## Next Steps

Now that your site is SEO-optimized:

1. **Continue to Tutorial 09:** [Testing & Deployment](./09-testing-deployment.md)
   - Final testing checklist
   - Deploy to Vercel
   - Post-deployment verification

2. **Submit to Google:** [Google Search Console](https://search.google.com/search-console)
   - Add your site
   - Submit sitemap
   - Monitor performance

3. **Learn More About SEO:**
   - [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
   - [Moz Beginner's Guide to SEO](https://moz.com/beginners-guide-to-seo)
   - [Ahrefs SEO Guide](https://ahrefs.com/seo)

## References

**SEO Fundamentals:**
- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Moz Beginner's Guide](https://moz.com/beginners-guide-to-seo)

**Meta Tags:**
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)

**Structured Data:**
- [Schema.org](https://schema.org/)
- [Google Structured Data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)

**Tools:**
- [Open Graph Preview](https://www.opengraph.xyz/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [Rich Results Test](https://search.google.com/test/rich-results)
- [Favicon Generator](https://favicon.io/)

---

**Time to complete:** 30-40 minutes

**Difficulty:** Intermediate

**Key Takeaways:**
- ✅ SEO is about helping search engines understand your site
- ✅ Title tag is the most important ranking factor
- ✅ Social media previews drive clicks (Open Graph, Twitter Cards)
- ✅ Structured data helps search engines categorize your site
- ✅ Page speed and mobile-friendliness are ranking factors
- ✅ SEO compounds over time (better rankings → more links → better rankings)

**Continue to:** [09-testing-deployment.md](./09-testing-deployment.md) →
