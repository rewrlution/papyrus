# Building the Site Footer

A comprehensive footer with navigation links, social icons, and branding.

## What We're Building

A `SiteFooter` component that:
- Displays a 4-column layout (Brand, Product, Resources, Community)
- Shows GitHub and Email icons with links
- Includes navigation link lists
- Has copyright notice and MIT license badge
- Shows "Made with ❤️ by developers" tagline
- Stacks columns on mobile (responsive)

**Why we need this:** Footers provide secondary navigation, legal information, and social proof. They're the last thing visitors see and an opportunity to drive engagement (GitHub stars, email signups, documentation).

**Expected outcome:** A professional, informative footer that matches the terminal aesthetic and provides clear pathways to additional resources.

## Architecture

```
┌─────────────────────────────────────────┐
│           SiteFooter                    │
│        (Server Component)               │
└──────────────┬──────────────────────────┘
               │
               ├─ Logo + Tagline
               ├─ Column Grid (4 columns)
               │  ├─ Product (Features, Docs)
               │  ├─ Resources (GitHub, Issues)
               │  ├─ Community (Twitter, Email)
               │  └─ Legal (empty for future)
               └─ Bottom Bar
                  ├─ Copyright
                  ├─ License Badge
                  └─ "Made with ❤️" tagline
```

**Why this architecture:**
- **Server Component:** Static links, no client interactivity
- **Column grid:** Organized navigation (scannable)
- **Bottom bar:** Legal/branding separate from navigation
- **Responsive:** Columns stack on mobile (1 column)

**Trade-offs considered:**
- Could add newsletter signup, but keeping it simple for MVP
- Could add more social links (Twitter, Discord), but starting with GitHub
- Could add sitemap links, but primary navigation is enough

## Prerequisites

**Required:**
- `lucide-react` installed (icons)
- Phase 0 completed (Next.js Link component)
- Understanding of footer UX patterns

**Assumed knowledge:**
- React component composition
- Next.js Link vs. external links
- Responsive grid layouts

## Implementation

### Step 1: Define Footer Link Data Structure

**Goal:** Create a type-safe structure for footer links

Define the link types and data:

```typescript
// components/sections/site-footer.tsx
import Link from "next/link";
import { Github, Mail } from "lucide-react";

interface FooterLink {
  /**
   * Link text
   */
  label: string;

  /**
   * Link destination (internal or external)
   */
  href: string;

  /**
   * Whether link is external (opens in new tab)
   */
  external?: boolean;
}

interface FooterColumn {
  /**
   * Column heading
   */
  title: string;

  /**
   * Links in this column
   */
  links: FooterLink[];
}

const footerColumns: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Quick Start", href: "#quick-start" },
      { label: "Installation", href: "#quick-start" },
      { label: "CLI Commands", href: "https://github.com/rewrlution/papyrus#commands", external: true },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "https://github.com/rewrlution/papyrus#readme", external: true },
      { label: "GitHub Repository", href: "https://github.com/rewrlution/papyrus", external: true },
      { label: "Report an Issue", href: "https://github.com/rewrlution/papyrus/issues", external: true },
      { label: "Changelog", href: "https://github.com/rewrlution/papyrus/releases", external: true },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "GitHub Discussions", href: "https://github.com/rewrlution/papyrus/discussions", external: true },
      { label: "Contributing", href: "https://github.com/rewrlution/papyrus/blob/main/CONTRIBUTING.md", external: true },
      { label: "Code of Conduct", href: "https://github.com/rewrlution/papyrus/blob/main/CODE_OF_CONDUCT.md", external: true },
    ],
  },
];
```

**Why this approach:**

**1. TypeScript Interfaces:**
- Ensures all links have required fields
- `external` flag determines link behavior
- Self-documenting structure

**2. Grouped by Purpose:**
- **Product:** What Papyrus does (features, installation)
- **Resources:** Help and documentation
- **Community:** How to engage (discussions, contributing)
- Logical grouping improves scannability

**3. Mix of Internal and External Links:**
- Internal: Anchor links (`#features`, `#quick-start`)
- External: GitHub URLs (docs, issues, repo)
- `external` flag adds `target="_blank"` and security attributes

**4. Realistic Links:**
- Point to actual resources (GitHub README, Issues, Discussions)
- No placeholder URLs or "Coming Soon"
- Users can immediately navigate

### Step 2: Create the SiteFooter Component

**Goal:** Build the complete footer with all sections

Create the footer component:

```typescript
// components/sections/site-footer.tsx
import Link from "next/link";
import { Github, Mail, Heart } from "lucide-react";
import { PapyrusLogo } from "@/components/shared/papyrus-logo";

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

const footerColumns: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Quick Start", href: "#quick-start" },
      { label: "Installation", href: "#quick-start" },
      { label: "CLI Commands", href: "https://github.com/rewrlution/papyrus#commands", external: true },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "https://github.com/rewrlution/papyrus#readme", external: true },
      { label: "GitHub Repository", href: "https://github.com/rewrlution/papyrus", external: true },
      { label: "Report an Issue", href: "https://github.com/rewrlution/papyrus/issues", external: true },
      { label: "Changelog", href: "https://github.com/rewrlution/papyrus/releases", external: true },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "GitHub Discussions", href: "https://github.com/rewrlution/papyrus/discussions", external: true },
      { label: "Contributing", href: "https://github.com/rewrlution/papyrus/blob/main/CONTRIBUTING.md", external: true },
      { label: "Code of Conduct", href: "https://github.com/rewrlution/papyrus/blob/main/CODE_OF_CONDUCT.md", external: true },
    ],
  },
];

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-terminal-black text-terminal-text">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="mb-4 text-[0.4rem] sm:text-[0.5rem]">
              <PapyrusLogo />
            </div>
            <p className="text-sm text-terminal-dim max-w-xs mb-4">
              AI-powered journaling for developers. Write, browse, and sync
              journal entries directly from your terminal.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <Link
                href="https://github.com/rewrlution/papyrus"
                target="_blank"
                rel="noopener noreferrer"
                className="text-terminal-dim transition-colors hover:text-terminal-cyan"
                aria-label="GitHub Repository"
              >
                <Github className="h-5 w-5" />
              </Link>
              <Link
                href="mailto:rewrlution@gmail.com"
                className="text-terminal-dim transition-colors hover:text-terminal-cyan"
                aria-label="Email Contact"
              >
                <Mail className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Footer Columns */}
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-terminal-text mb-4">
                {column.title}
              </h3>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <FooterLink {...link} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-terminal-dim/20 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            {/* Copyright */}
            <div className="flex flex-col items-center gap-2 text-sm text-terminal-dim sm:flex-row sm:gap-4">
              <p>© {currentYear} Papyrus CLI. All rights reserved.</p>
              <Link
                href="https://github.com/rewrlution/papyrus/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded bg-terminal-dim/10 px-2 py-1 text-xs font-medium text-terminal-green transition-colors hover:bg-terminal-dim/20"
              >
                MIT License
              </Link>
            </div>

            {/* Made with love */}
            <div className="flex items-center gap-1.5 text-sm text-terminal-dim">
              <span>Made with</span>
              <Heart className="h-4 w-4 fill-terminal-red text-terminal-red" />
              <span>by developers, for developers</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

interface FooterLinkProps {
  label: string;
  href: string;
  external?: boolean;
}

function FooterLink({ label, href, external }: FooterLinkProps) {
  const linkClasses =
    "text-sm text-terminal-dim transition-colors hover:text-terminal-cyan hover:underline underline-offset-4";

  if (external) {
    return (
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClasses}
      >
        {label}
      </Link>
    );
  }

  return (
    <Link href={href} className={linkClasses}>
      {label}
    </Link>
  );
}
```

**Why this approach:**

**1. Four-Column Grid:**
```typescript
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"

// Mobile:  1 column (stack all)
// Tablet:  2 columns (Product + Resources, Community + empty)
// Desktop: 4 columns (all side-by-side)
```

**2. Brand Column Spans Two:**
```typescript
className="sm:col-span-2 lg:col-span-1"

// Tablet: Takes 2 columns (more space for logo and description)
// Desktop: Takes 1 column (equal with others)
```

**3. Dynamic Copyright Year:**
```typescript
const currentYear = new Date().getFullYear();

// Automatically updates each year (no manual maintenance)
```

**4. Social Icons:**
- GitHub (primary call-to-action: star the repo)
- Email (contact for questions/feedback)
- Icons only (no text labels) for clean look
- Aria-labels for screen readers

**5. MIT License Badge:**
- Styled like a tag/badge (visual distinction)
- Links to actual LICENSE file
- Green color (terminal theme, positive connotation)
- Communicates open-source nature

**6. Heart Icon:**
- Filled red heart (emotional touch)
- Humanizes the footer
- "Made by developers, for developers" (target audience)

**7. External Link Handling:**
- `target="_blank"` (opens in new tab)
- `rel="noopener noreferrer"` (security + privacy)
- Separate FooterLink component (DRY)

**8. Hover Effects:**
- Text color changes to cyan (brand color)
- Underline on hover (clear affordance)
- `underline-offset-4` (space between text and underline)

### Step 3: Understanding Footer Layout Patterns

**Goal:** Learn common footer grid patterns

**Desktop layout (4 columns):**
```
┌──────────────┬──────────┬───────────┬──────────────┐
│ Brand        │ Product  │ Resources │ Community    │
│ Logo         │ Features │ Docs      │ Discussions  │
│ Description  │ Quick... │ GitHub    │ Contributing │
│ [GitHub][✉️] │ Install  │ Issues    │ Code of...   │
│              │ Commands │ Changelog │              │
└──────────────┴──────────┴───────────┴──────────────┘
───────────────────────────────────────────────────────
│ © 2024 | MIT       Made with ❤️ by developers     │
└────────────────────────────────────────────────────┘
```

**Mobile layout (1 column):**
```
┌──────────────────────┐
│ Brand                │
│ Logo                 │
│ Description          │
│ [GitHub] [✉️]        │
├──────────────────────┤
│ Product              │
│ • Features           │
│ • Quick Start        │
├──────────────────────┤
│ Resources            │
│ • Docs               │
│ • GitHub             │
├──────────────────────┤
│ Community            │
│ • Discussions        │
│ • Contributing       │
├──────────────────────┤
│ © 2024 | MIT         │
│ Made with ❤️         │
└──────────────────────┘
```

**Why this pattern:**
- **Desktop:** Horizontal layout (uses wide screens efficiently)
- **Mobile:** Vertical stack (easy scrolling, all info accessible)
- **Brand first:** Logo and description anchor the footer
- **Bottom bar:** Legal info separated (visual hierarchy)

### Step 4: Customize Logo Size for Footer

**Goal:** Ensure logo doesn't dominate footer

The footer uses a smaller logo:

```typescript
<div className="text-[0.4rem] sm:text-[0.5rem]">
  <PapyrusLogo />
</div>

// Result:
// Mobile:  0.4rem (6.4px) - very small
// Tablet+: 0.5rem (8px) - still small but readable
```

**Why small:**
- Footer logo is secondary branding (hero has large logo)
- Doesn't compete with navigation links
- Still recognizable (ASCII art scales down well)

**Alternative:** Hide logo on mobile, show on desktop:

```typescript
<div className="hidden sm:block text-[0.5rem]">
  <PapyrusLogo />
</div>
```

### Step 5: Test the Component

**Goal:** Verify footer renders correctly and all links work

Create a test page:

```typescript
// app/test/footer/page.tsx
import { SiteFooter } from "@/components/sections/site-footer";

export default function TestFooterPage() {
  return (
    <div className="flex min-h-screen flex-col bg-terminal-black">
      {/* Spacer to push footer down */}
      <div className="flex-1 p-8 text-terminal-text">
        <p className="text-center">Scroll down to see footer</p>
      </div>

      <SiteFooter />
    </div>
  );
}
```

**How to test:**

1. Start dev server:
   ```bash
   pnpm dev
   ```

2. Visit `http://localhost:3000/test/footer`

3. Test content:
   - Logo displays (small size)
   - Description text readable
   - Social icons (GitHub, Email) visible
   - All 3 columns (Product, Resources, Community)
   - All links have labels

4. Test links:
   - Click internal links (`#features`) → Should scroll to section (when on full page)
   - Click GitHub link → Opens in new tab
   - Click Email link → Opens mail client
   - All external links open in new tab

5. Test responsive design:
   - Mobile (375px): 1 column, all stacked
   - Tablet (768px): 2 columns (Brand spans 2)
   - Desktop (1024px): 4 columns side-by-side

6. Test bottom bar:
   - Copyright year is current (2024 or later)
   - MIT License badge styled correctly
   - "Made with ❤️" displays
   - Heart icon is filled and red

7. Test hover effects:
   - Hover links → Text turns cyan
   - Hover links → Underline appears
   - Hover social icons → Icons turn cyan
   - Transitions smooth

**Expected behavior:**
- ✅ Footer at bottom of page
- ✅ All 3 columns display
- ✅ All links working
- ✅ External links open new tabs
- ✅ Icons have hover effects
- ✅ Copyright year dynamic
- ✅ Responsive layout works

## Common Issues

### Issue: Footer not sticking to bottom

**Solution:** Use flex layout on parent container:

```typescript
// app/layout.tsx or page.tsx
<div className="flex min-h-screen flex-col">
  <main className="flex-1">
    {/* Page content */}
  </main>
  <SiteFooter />
</div>
```

**Why it happens:** Footer needs `flex-1` on main content to push it down.

### Issue: Logo too large in footer

**Solution:** Use smaller font size:

```typescript
// Very small for footer context
<div className="text-[0.4rem]">
  <PapyrusLogo />
</div>
```

**Why it happens:** Hero logo is large, footer should be subtle.

### Issue: External links not opening in new tab

**Solution:** Ensure `target="_blank"` on external links:

```typescript
<Link
  href="https://github.com/..."
  target="_blank"
  rel="noopener noreferrer"
>
  GitHub
</Link>
```

**Why it happens:** By default, Next.js Link opens in same tab.

### Issue: Heart icon not filled

**Solution:** Use both `fill` and `text` color:

```typescript
<Heart className="h-4 w-4 fill-terminal-red text-terminal-red" />

// fill: Fills the inside
// text (stroke): Sets the outline color
```

**Why it happens:** Lucide icons are stroked by default. `fill` class fills them.

### Issue: Copyright year hardcoded

**Solution:** Use JavaScript date:

```typescript
const currentYear = new Date().getFullYear();

// Then: © {currentYear} Papyrus CLI
```

**Why it happens:** Hardcoded years require manual updates annually.

### Issue: Columns not aligning on desktop

**Solution:** Ensure grid is `lg:grid-cols-4` (not `lg:grid-cols-3`):

```typescript
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"

// Brand (col 1) + Product (col 2) + Resources (col 3) + Community (col 4)
```

**Why it happens:** Wrong number of columns in grid definition.

### Issue: Links hard to see (low contrast)

**Solution:** Adjust text color or add hover state:

```typescript
// Make default text lighter
className="text-terminal-dim hover:text-terminal-cyan"

// Or use brighter default
className="text-terminal-text/70 hover:text-terminal-cyan"
```

**Why it happens:** `text-terminal-dim` might be too dark on dark backgrounds.

## Testing

### Manual Testing Checklist

```markdown
**Content:**
- [ ] Logo displays in footer
- [ ] Description text readable
- [ ] GitHub icon visible and linked
- [ ] Email icon visible and linked
- [ ] 3 columns (Product, Resources, Community)
- [ ] All column titles displayed
- [ ] All links have labels
- [ ] Copyright year is current
- [ ] MIT License badge displayed
- [ ] "Made with ❤️" tagline visible

**Links:**
- [ ] Internal links work (#features, #quick-start)
- [ ] GitHub repo link opens new tab
- [ ] Email link opens mail client
- [ ] All external links have target="_blank"
- [ ] All external links have rel="noopener noreferrer"

**Responsive:**
- [ ] Mobile (375px): 1 column stack
- [ ] Tablet (768px): 2 columns (Brand spans 2)
- [ ] Desktop (1024px+): 4 columns
- [ ] Brand column spans correctly at each breakpoint

**Interactive:**
- [ ] Hover link → Text turns cyan
- [ ] Hover link → Underline appears
- [ ] Hover social icon → Icon turns cyan
- [ ] Transitions smooth (no jank)

**Visual:**
- [ ] Heart icon filled and red
- [ ] Logo small (doesn't dominate footer)
- [ ] Spacing consistent between columns
- [ ] Bottom bar separated with border
- [ ] All text readable (sufficient contrast)
```

### Accessibility Checklist

```markdown
- [ ] Social icons have aria-label attributes
- [ ] Footer uses <footer> semantic HTML
- [ ] Links have descriptive text (not "click here")
- [ ] External links indicate they open new tabs (via aria-label or title)
- [ ] Color contrast meets WCAG AA (4.5:1 minimum)
- [ ] Links have visible focus states (keyboard navigation)
```

## Enhancements (Optional)

### Add Newsletter Signup

Collect emails for updates:

```typescript
"use client";

import { useState } from "react";

function NewsletterSignup() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter signup
    console.log("Newsletter signup:", email);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <label htmlFor="email" className="sr-only">
        Email address
      </label>
      <div className="flex gap-2">
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 rounded-md bg-terminal-dim/10 px-3 py-2 text-sm"
          required
        />
        <button
          type="submit"
          className="rounded-md bg-terminal-cyan px-4 py-2 text-sm font-medium text-terminal-black"
        >
          Subscribe
        </button>
      </div>
    </form>
  );
}
```

### Add More Social Links

Include Twitter, Discord, etc.:

```typescript
import { Twitter, MessageCircle } from "lucide-react";

<div className="flex items-center gap-4">
  <Link href="https://github.com/..."><Github /></Link>
  <Link href="https://twitter.com/..."><Twitter /></Link>
  <Link href="https://discord.gg/..."><MessageCircle /></Link>
  <Link href="mailto:..."><Mail /></Link>
</div>
```

### Add Back to Top Button

Smooth scroll to top:

```typescript
"use client";

function BackToTop() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={scrollToTop}
      className="flex items-center gap-2 text-terminal-dim hover:text-terminal-cyan"
    >
      <ArrowUp className="h-4 w-4" />
      <span>Back to top</span>
    </button>
  );
}
```

### Add Language Selector

For multi-language sites:

```typescript
<select className="rounded-md bg-terminal-dim/10 px-3 py-1 text-sm">
  <option value="en">English</option>
  <option value="es">Español</option>
  <option value="fr">Français</option>
</select>
```

## Next Steps

Now that you have a complete footer:

1. **Continue to Tutorial 07:** [Compose Home Page](./07-compose-page.md)
   - Import all sections
   - Compose into single page
   - Test full layout

2. **Learn About Footer Patterns:** [Footer Design Best Practices](https://www.nngroup.com/articles/footers/)
   - What to include in footers
   - Link organization strategies
   - Mobile footer design

3. **Explore Next.js Link:** [Next.js Link Docs](https://nextjs.org/docs/app/api-reference/components/link)
   - Prefetching behavior
   - Scroll restoration
   - Link props

## References

**Next.js:**
- [Link Component](https://nextjs.org/docs/app/api-reference/components/link)
- [Layout Component](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts)

**Icons:**
- [Lucide Icons](https://lucide.dev)
- [Heart Icon](https://lucide.dev/icons/heart)

**Design Patterns:**
- [Footer Design](https://www.nngroup.com/articles/footers/)
- [Footer Best Practices](https://www.smashingmagazine.com/2009/06/redesigning-the-footer/)

**Inspiration:**
- [Linear Footer](https://linear.app) - Clean and minimal
- [Vercel Footer](https://vercel.com) - Multi-column layout
- [GitHub Footer](https://github.com) - Link organization

---

**Time to complete:** 20-30 minutes

**Difficulty:** Beginner-Intermediate

**Key Takeaways:**
- ✅ Footers provide secondary navigation and legal info
- ✅ External links need `target="_blank"` and `rel="noopener noreferrer"`
- ✅ Dynamic copyright year saves maintenance
- ✅ Grid layouts make responsive footers easy
- ✅ Small touches (heart icon, MIT badge) add personality

**Continue to:** [07-compose-page.md](./07-compose-page.md) →
