# Phase 1: MVP Content

Building the core marketing content for the Papyrus CLI website.

## What We're Building

**Goal:** Create a launchable marketing website with complete messaging, features showcase, and clear calls-to-action.

**What problem does this solve?**

- Communicate value proposition clearly to developers
- Showcase Papyrus CLI's key features
- Provide easy installation and onboarding path
- Create a shareable, professional web presence

**Expected outcome:**

- Fully functional marketing site ready to launch
- Hero section with compelling headline
- 6 feature cards with icons and descriptions
- Quick start guide with copy-to-clipboard
- Professional footer with links
- Mobile responsive design
- Basic SEO optimization

---

## Architecture

```
Home Page Structure:
┌─────────────────────────────────────────────────────────┐
│                       Header (Future)                    │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                      Hero Section                        │
│  - ASCII Logo                                            │
│  - Headline + Subheadline                               │
│  - Primary CTA (Install command + copy button)          │
│  - Secondary CTA (GitHub link)                          │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                    Features Grid                         │
│  ┌──────┐  ┌──────┐  ┌──────┐                          │
│  │  ⚡  │  │  📅  │  │  🎨  │                          │
│  │ Fast │  │ Date │  │ TUI  │                          │
│  └──────┘  └──────┘  └──────┘                          │
│  ┌──────┐  ┌──────┐  ┌──────┐                          │
│  │  ☁️  │  │  🔐  │  │  💾  │                          │
│  │ Sync │  │ Safe │  │Local │                          │
│  └──────┘  └──────┘  └──────┘                          │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                    Quick Start Section                   │
│  - Installation commands (npm, pnpm, yarn)              │
│  - 4-step getting started                               │
│  - Syntax-highlighted code blocks                       │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                         Footer                           │
│  - Links (GitHub, Docs, Issues)                         │
│  - Contact info                                          │
│  - Copyright & License                                   │
└─────────────────────────────────────────────────────────┘

Component Architecture:
app/
└── page.tsx (orchestrates sections)

components/
├── sections/
│   ├── hero.tsx           # Hero with CTAs
│   ├── features.tsx       # 6 feature cards
│   ├── quick-start.tsx    # Install guide
│   └── site-footer.tsx    # Footer links
└── shared/
    ├── copy-button.tsx    # Copy-to-clipboard
    └── code-block.tsx     # Syntax highlighted code
```

**Why this architecture:**

- **Section-based** - Each section is isolated and reusable
- **Component separation** - Shared components in `shared/`
- **Mobile-first** - Responsive grid and stacking
- **Progressive disclosure** - Hero → Features → How to start
- **Clear CTAs** - Multiple paths to install

**Trade-offs considered:**

- Static content vs CMS: Static is simpler for MVP
- Single page vs multi-page: Single page for marketing simplicity
- Animations: Deferred to Phase 2 for faster MVP

---

## Prerequisites

**Required:**

- Phase 0 completed (foundation setup)
- Dev server running: `pnpm dev`
- shadcn/ui initialized
- Tailwind configured

**Assumed knowledge:**

- React functional components
- Tailwind CSS classes
- TypeScript interfaces
- Next.js App Router

**Nice to have:**

- Figma/design tools (for visual planning)
- Content writing skills
- Basic accessibility knowledge

---

## Implementation

### Step 1: Install Required shadcn/ui Components

**Goal:** Add the UI primitives we'll need for the content sections.

```bash
cd packages/web

# Install components we'll use
npx shadcn@latest add card
npx shadcn@latest add button
npx shadcn@latest add separator
```

This creates:

- `components/ui/card.tsx` - For feature cards
- `components/ui/button.tsx` - For CTAs
- `components/ui/separator.tsx` - For visual dividers

**Why these components:**

- Card: Accessible, styled containers for features
- Button: Consistent button styling across site
- Separator: Visual breaks between sections

---

### Step 2: Create Copy Button Component

**Goal:** Build a reusable copy-to-clipboard button for code snippets.

Create `packages/web/components/shared/copy-button.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CopyButtonProps {
  text: string;
  className?: string;
}

export function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleCopy}
      className={className}
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4 mr-2" />
          Copy
        </>
      )}
    </Button>
  );
}
```

**Why this component:**

- **Client-side** - Uses browser clipboard API
- **Visual feedback** - Shows "Copied!" for 2 seconds
- **Accessible** - Includes ARIA label
- **Reusable** - Works for any text snippet

---

### Step 3: Create Code Block Component

**Goal:** Build a syntax-highlighted code block with copy button.

Create `packages/web/components/shared/code-block.tsx`:

```typescript
import { CopyButton } from "./copy-button";

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
}

export function CodeBlock({ code, language = "bash", showLineNumbers = false }: CodeBlockProps) {
  return (
    <div className="relative group">
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton text={code} />
      </div>
      <pre className="bg-terminal-darkgray border border-terminal-gray rounded-lg p-4 overflow-x-auto">
        <code className={`language-${language} text-terminal-green font-mono text-sm`}>
          {code}
        </code>
      </pre>
    </div>
  );
}
```

**Why this component:**

- **Terminal styling** - Matches CLI aesthetic
- **Copy button** - Shows on hover
- **Responsive** - Scrolls horizontally on mobile
- **Simple** - No heavy syntax highlighter for MVP (Shiki in Phase 2)

---

### Step 4: Create Hero Section

**Goal:** Build the hero section with headline, CTAs, and ASCII logo.

Create `packages/web/components/sections/hero.tsx`:

```typescript
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/shared/code-block";
import { Github } from "lucide-react";

export function Hero() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <div className="max-w-5xl mx-auto text-center space-y-8">
        {/* ASCII Logo */}
        <pre className="text-terminal-cyan text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-mono overflow-x-auto">
{`██████╗  █████╗ ██████╗ ██╗   ██╗██████╗ ██╗   ██╗███████╗
██╔══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝██╔══██╗██║   ██║██╔════╝
██████╔╝███████║██████╔╝ ╚████╔╝ ██████╔╝██║   ██║███████╗
██╔═══╝ ██╔══██║██╔═══╝   ╚██╔╝  ██╔══██╗██║   ██║╚════██║
██║     ██║  ██║██║        ██║   ██║  ██║╚██████╔╝███████║
╚═╝     ╚═╝  ╚═╝╚═╝        ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝`}
        </pre>

        {/* Headline */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-terminal-text tracking-tight">
            Journal Like You Code
          </h1>
          <p className="text-xl sm:text-2xl text-terminal-lightgray max-w-3xl mx-auto">
            Capture your thoughts, track your progress, and reflect on your journey—right in your terminal.
          </p>
        </div>

        {/* Primary CTA: Install Command */}
        <div className="max-w-2xl mx-auto">
          <CodeBlock code="npm install -g @rewrlution/papyrus-cli" />
        </div>

        {/* Secondary CTA: GitHub */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Button asChild size="lg" className="text-lg">
            <a
              href="https://github.com/rewrlution/papyrus"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="mr-2 h-5 w-5" />
              View on GitHub
            </a>
          </Button>
        </div>

        {/* Subtext */}
        <p className="text-sm text-terminal-lightgray pt-8">
          AI-powered journaling for developers. Local-first, markdown-based, and completely free.
        </p>
      </div>
    </section>
  );
}
```

**Why this design:**

- **ASCII logo** - Recognizable brand identity
- **Clear value prop** - "Journal Like You Code" is memorable
- **Immediate action** - Install command front and center
- **Social proof** - GitHub link for credibility
- **Responsive** - Text scales on mobile
- **Terminal aesthetic** - Cyan, dark background, mono font

---

### Step 5: Create Features Section

**Goal:** Build the features grid with 6 cards showcasing key capabilities.

Create `packages/web/components/sections/features.tsx`:

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Calendar, Sparkles, Cloud, Lock, HardDrive } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Quick Journaling",
    description: "Write in your favorite editor—vim, nano, VS Code, or any text editor. No context switching, no distractions.",
  },
  {
    icon: Calendar,
    title: "Date-Based Organization",
    description: "Automatic YYYYMMDD format. Simple, predictable, and grep-able. Your journals are organized by design.",
  },
  {
    icon: Sparkles,
    title: "Interactive Terminal UI",
    description: "Beautiful React-based TUI with vim-style navigation (j/k). Browse and read entries without leaving the terminal.",
  },
  {
    icon: Cloud,
    title: "Cloud Sync",
    description: "Backup and access from any device. Smart conflict resolution. Sync when you want, not when you're forced to.",
  },
  {
    icon: Lock,
    title: "Secure & Private",
    description: "JWT authentication. Encrypted storage. You own your data. No tracking, no ads, no data mining.",
  },
  {
    icon: HardDrive,
    title: "Local-First",
    description: "Plain markdown files stored locally. Grep-able, version-controllable, and future-proof. Works offline.",
  },
];

export function Features() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-terminal-text">
            Built for Developers
          </h2>
          <p className="text-lg text-terminal-lightgray max-w-2xl mx-auto">
            All the features you need to journal without leaving your workflow.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="bg-terminal-darkgray border-terminal-gray hover:border-terminal-cyan transition-colors"
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-terminal-gray rounded-lg">
                      <Icon className="h-6 w-6 text-terminal-cyan" />
                    </div>
                    <CardTitle className="text-xl text-terminal-text">
                      {feature.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-terminal-lightgray">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

**Why this design:**

- **6 key features** - Not overwhelming, covers main value props
- **Icons** - Visual anchors from lucide-react (terminal-friendly)
- **Grid layout** - 3 cols desktop, 2 tablet, 1 mobile
- **Hover effect** - Border changes to cyan (interactive feedback)
- **Clear descriptions** - Benefits, not just features

---

### Step 6: Create Quick Start Section

**Goal:** Build the installation and onboarding guide.

Create `packages/web/components/sections/quick-start.tsx`:

```typescript
import { CodeBlock } from "@/components/shared/code-block";

const installCommands = [
  { manager: "npm", command: "npm install -g @rewrlution/papyrus-cli" },
  { manager: "pnpm", command: "pnpm add -g @rewrlution/papyrus-cli" },
  { manager: "yarn", command: "yarn global add @rewrlution/papyrus-cli" },
];

const gettingStarted = [
  {
    step: 1,
    title: "Register",
    command: "papyrus register",
    description: "Create your account and sync your journals across devices.",
  },
  {
    step: 2,
    title: "Add Entry",
    command: "papyrus add",
    description: "Write your first journal entry. Opens in your default editor.",
  },
  {
    step: 3,
    title: "Browse Entries",
    command: "papyrus app",
    description: "Launch the interactive TUI to read and navigate your journals.",
  },
  {
    step: 4,
    title: "Sync",
    command: "papyrus sync",
    description: "Backup your entries to the cloud. Access from anywhere.",
  },
];

export function QuickStart() {
  return (
    <section className="py-24 px-6 bg-terminal-black">
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Install Section */}
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-terminal-text">
              Get Started
            </h2>
            <p className="text-lg text-terminal-lightgray">
              Install with your favorite package manager
            </p>
          </div>

          {/* Installation Options */}
          <div className="space-y-4">
            {installCommands.map((install) => (
              <div key={install.manager} className="space-y-2">
                <div className="text-sm text-terminal-lightgray font-mono">
                  # {install.manager}
                </div>
                <CodeBlock code={install.command} />
              </div>
            ))}
          </div>
        </div>

        {/* Getting Started Steps */}
        <div className="space-y-8">
          <div className="text-center">
            <h3 className="text-2xl sm:text-3xl font-bold text-terminal-text">
              Four Steps to Your First Entry
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {gettingStarted.map((step) => (
              <div
                key={step.step}
                className="space-y-4 p-6 bg-terminal-darkgray border border-terminal-gray rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-terminal-cyan text-terminal-black font-bold">
                    {step.step}
                  </div>
                  <h4 className="text-xl font-semibold text-terminal-text">
                    {step.title}
                  </h4>
                </div>
                <CodeBlock code={step.command} />
                <p className="text-terminal-lightgray">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* System Requirements */}
        <div className="text-center space-y-4 pt-8 border-t border-terminal-gray">
          <h4 className="text-lg font-semibold text-terminal-text">
            System Requirements
          </h4>
          <div className="flex flex-wrap justify-center gap-4 text-terminal-lightgray">
            <span>Node.js 18+</span>
            <span>•</span>
            <span>Linux / macOS / Windows (WSL)</span>
            <span>•</span>
            <span>Your favorite text editor</span>
          </div>
        </div>
      </div>
    </section>
  );
}
```

**Why this design:**

- **Multiple package managers** - Supports npm, pnpm, yarn
- **Step-by-step guide** - 4 clear steps to get started
- **Visual hierarchy** - Numbered steps with icons
- **Code blocks** - Every command is copy-able
- **System requirements** - Sets expectations

---

### Step 7: Create Footer Section

**Goal:** Build the footer with links, contact, and legal info.

Create `packages/web/components/sections/site-footer.tsx`:

```typescript
import { Separator } from "@/components/ui/separator";
import { Github, Mail } from "lucide-react";

const links = {
  product: [
    { label: "Documentation", href: "#docs" },
    { label: "GitHub", href: "https://github.com/rewrlution/papyrus" },
    { label: "Issues", href: "https://github.com/rewrlution/papyrus/issues" },
    { label: "Changelog", href: "https://github.com/rewrlution/papyrus/releases" },
  ],
  resources: [
    { label: "CLI Package", href: "#cli" },
    { label: "API Package", href: "#api" },
    { label: "Shared Package", href: "#shared" },
  ],
};

export function SiteFooter() {
  return (
    <footer className="border-t border-terminal-gray bg-terminal-black">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="space-y-4 md:col-span-2">
            <div className="font-mono text-2xl font-bold text-terminal-cyan">
              PAPYRUS
            </div>
            <p className="text-terminal-lightgray max-w-md">
              An AI-powered journaling tool built for developers. Journal like you code—right in your terminal.
            </p>
            <div className="flex gap-4">
              <a
                href="https://github.com/rewrlution/papyrus"
                target="_blank"
                rel="noopener noreferrer"
                className="text-terminal-lightgray hover:text-terminal-cyan transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-6 w-6" />
              </a>
              <a
                href="mailto:rewrlution@gmail.com"
                className="text-terminal-lightgray hover:text-terminal-cyan transition-colors"
                aria-label="Email"
              >
                <Mail className="h-6 w-6" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-terminal-text uppercase tracking-wider">
              Product
            </h3>
            <ul className="space-y-2">
              {links.product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="text-terminal-lightgray hover:text-terminal-cyan transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-terminal-text uppercase tracking-wider">
              Resources
            </h3>
            <ul className="space-y-2">
              {links.resources.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-terminal-lightgray hover:text-terminal-cyan transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="bg-terminal-gray mb-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-terminal-lightgray">
          <div>
            © {new Date().getFullYear()} Papyrus. Open source under MIT License.
          </div>
          <div>
            Made with ❤️ by developers, for developers
          </div>
        </div>
      </div>
    </footer>
  );
}
```

**Why this design:**

- **Organized links** - Product and Resources sections
- **Social icons** - GitHub and email
- **Brand identity** - Papyrus logo and tagline
- **Legal info** - Copyright and license
- **Hover effects** - Links change to cyan

---

### Step 8: Update Home Page

**Goal:** Compose all sections into the main page.

Update `packages/web/app/page.tsx`:

```typescript
import { Hero } from "@/components/sections/hero";
import { Features } from "@/components/sections/features";
import { QuickStart } from "@/components/sections/quick-start";
import { SiteFooter } from "@/components/sections/site-footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <QuickStart />
      <SiteFooter />
    </main>
  );
}
```

**Why this structure:**

- **Clean composition** - Each section is self-contained
- **Easy to reorder** - Just swap import order
- **Easy to test** - Each section can be tested independently
- **Easy to extend** - Add new sections without touching others

---

### Step 9: Update SEO Metadata

**Goal:** Enhance the metadata in the root layout for better SEO.

Update `packages/web/app/layout.tsx` to improve the metadata:

```typescript
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Papyrus - AI-Powered Journaling for Developers",
  description:
    "Journal like you code. Papyrus is a terminal-based journaling tool for developers. Write in your favorite editor, sync across devices, and keep your data local-first with plain markdown files.",
  keywords: [
    "journaling",
    "CLI",
    "terminal",
    "developer tools",
    "markdown",
    "local-first",
    "vim",
    "terminal UI",
    "developer journaling",
    "code journal",
  ],
  authors: [{ name: "Rewrlution", email: "rewrlution@gmail.com" }],
  creator: "Rewrlution",
  publisher: "Rewrlution",
  openGraph: {
    title: "Papyrus - AI-Powered Journaling for Developers",
    description:
      "Journal like you code. Terminal-based journaling with vim-style navigation, cloud sync, and local markdown storage.",
    type: "website",
    locale: "en_US",
    url: "https://papyrus.dev", // Update with actual domain
    siteName: "Papyrus",
  },
  twitter: {
    card: "summary_large_image",
    title: "Papyrus - AI-Powered Journaling for Developers",
    description: "Journal like you code. Terminal-based journaling tool for developers.",
    // Add when available:
    // images: ["/og-image.png"],
    // creator: "@papyrusdev",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    // Add more when available:
    // apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
```

**Why these improvements:**

- **Better description** - More keywords naturally integrated
- **Open Graph** - Better social media previews
- **Twitter Card** - Optimized for Twitter sharing
- **Robots meta** - Explicit crawling instructions
- **Rich keywords** - SEO-friendly terms

---

### Step 10: Add Favicon

**Goal:** Create a simple favicon for browser tabs.

For MVP, create a simple text-based favicon. Create `packages/web/app/favicon.ico`:

Option 1: Use an online generator (quickest):

1. Go to [favicon.io](https://favicon.io/favicon-generator/)
2. Settings:
   - Text: "P"
   - Background: #0a0a0a (terminal black)
   - Font Color: #00d9ff (terminal cyan)
   - Font: Monospace
   - Size: 64
3. Download and place in `packages/web/app/favicon.ico`

Option 2: Use existing CLI logo:

- Take a screenshot of the ASCII logo
- Crop to square
- Resize to 64x64
- Convert to .ico format

**Why a favicon:**

- Brand recognition in browser tabs
- Professional appearance
- Helps users find the tab

---

### Step 11: Test Responsive Design

**Goal:** Verify the site works on all screen sizes.

Test on different viewports:

```bash
# Start dev server
pnpm dev
```

Open `http://localhost:3000` and test:

**Desktop (1920x1080):**

- [ ] Features grid shows 3 columns
- [ ] Text is readable (not too large)
- [ ] Hero logo is appropriately sized
- [ ] All sections have proper spacing

**Tablet (768x1024):**

- [ ] Features grid shows 2 columns
- [ ] Quick start shows 2 columns
- [ ] Font sizes scale down
- [ ] No horizontal scroll

**Mobile (375x667):**

- [ ] Features grid shows 1 column (stacked)
- [ ] Quick start shows 1 column
- [ ] ASCII logo scales or scrolls
- [ ] Buttons are tap-friendly (44px min)
- [ ] No text overflow

Use browser DevTools:

1. Open DevTools (F12)
2. Click device toolbar icon
3. Test on iPhone SE, iPhone 12, iPad, Desktop

**Common fixes:**

- Text too small on mobile: Increase base font size
- Horizontal scroll: Check for fixed widths, use `max-w-*` instead
- Buttons too small: Use `size="lg"` on mobile
- ASCII logo breaks: Wrap in `overflow-x-auto`

---

### Step 12: Accessibility Audit

**Goal:** Ensure the site is accessible to all users.

**Manual checks:**

1. **Keyboard navigation:**
   - Tab through all interactive elements
   - Links and buttons should have visible focus
   - No keyboard traps

2. **Screen reader:**
   - Install screen reader (NVDA on Windows, VoiceOver on Mac)
   - Navigate with screen reader
   - All images should have alt text (when added)
   - Links should have descriptive text

3. **Color contrast:**
   - Use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
   - Text on background should be WCAG AA compliant (4.5:1 ratio)
   - Our terminal colors should pass:
     - #e0e0e0 on #0a0a0a: Pass ✓
     - #00d9ff on #0a0a0a: Check manually

**Automated checks:**

Install Lighthouse:

```bash
# Lighthouse is built into Chrome DevTools
# Or install CLI:
npm install -g lighthouse

# Run audit
lighthouse http://localhost:3000 --view
```

Target scores:

- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+
- Performance: 80+ (will improve in Phase 2)

**Common accessibility issues:**

- Missing alt text on images (add when images are added)
- Insufficient color contrast (adjust if needed)
- Missing ARIA labels (add to icon buttons)
- Heading hierarchy skipped (ensure h1 → h2 → h3 order)

---

### Step 13: Performance Check

**Goal:** Ensure fast load times.

**Test page load:**

```bash
# Build for production
pnpm build

# Start production server
pnpm start

# Open http://localhost:3000
```

**Metrics to check:**

- **First Contentful Paint (FCP):** < 1.8s (good)
- **Largest Contentful Paint (LCP):** < 2.5s (good)
- **Time to Interactive (TTI):** < 3.8s (good)
- **Cumulative Layout Shift (CLS):** < 0.1 (good)

**Use Chrome DevTools:**

1. Open DevTools → Performance tab
2. Click Record
3. Reload page
4. Stop recording
5. Review metrics

**Common performance issues:**

- Large JavaScript bundles: Check bundle size with `pnpm build`
- Render-blocking resources: Ensure fonts are optimized
- Large images: Optimize before adding (Phase 2)

**For MVP:**

- Bundle size should be < 200KB
- Page should load in < 2 seconds

---

### Step 14: Build and Test Production

**Goal:** Verify the production build works perfectly.

```bash
cd packages/web

# Clean previous builds
rm -rf .next

# Build for production
pnpm build

# Check for errors
# Should see:
# ✓ Generating static pages
# ✓ Finalizing page optimization

# Preview production build
pnpm start

# Open http://localhost:3000
```

**Production checklist:**

- [ ] No build errors
- [ ] No TypeScript errors
- [ ] No lint warnings
- [ ] All pages generate successfully
- [ ] Site loads fast
- [ ] All links work
- [ ] Copy buttons work
- [ ] Styles render correctly
- [ ] Fonts load

---

### Step 15: Deploy to Vercel

**Goal:** Push to production.

```bash
# From monorepo root
git add .
git commit -m "feat(web): complete Phase 1 MVP content

- Add Hero section with ASCII logo and CTAs
- Add Features grid with 6 key features
- Add Quick Start guide with install steps
- Add Footer with links and contact
- Implement copy-to-clipboard for code blocks
- Add responsive design for mobile/tablet/desktop
- Improve SEO metadata and Open Graph tags
- Ensure accessibility (WCAG AA)"

git push origin your-branch-name
```

Vercel will automatically:

1. Detect the push
2. Start a new deployment
3. Build the site
4. Deploy to preview URL
5. Show status in GitHub (if connected)

**Check deployment:**

1. Go to Vercel dashboard
2. Find your project
3. Click latest deployment
4. Check build logs
5. Visit preview URL
6. Test all functionality

**If deployment fails:**

- Check build logs for errors
- Verify `next.config.js` is correct
- Ensure all imports are correct
- Check environment variables (if any)

---

## Testing

### Manual Testing Checklist

**Visual Testing:**

- [ ] Hero section renders correctly
- [ ] ASCII logo is cyan and centered
- [ ] Features grid shows all 6 cards
- [ ] Icons render correctly
- [ ] Quick start shows all 4 steps
- [ ] Footer has all links
- [ ] Colors match terminal palette
- [ ] Fonts are Geist Sans/Mono

**Functional Testing:**

- [ ] Copy buttons work (install commands)
- [ ] Copy shows "Copied!" feedback
- [ ] GitHub link opens in new tab
- [ ] All footer links work
- [ ] External links have rel="noopener"
- [ ] No console errors

**Responsive Testing:**

- [ ] Desktop (1920x1080): 3-column grid
- [ ] Tablet (768x1024): 2-column grid
- [ ] Mobile (375x667): 1-column stack
- [ ] ASCII logo responsive
- [ ] No horizontal scroll
- [ ] Touch targets ≥ 44px

**Cross-Browser Testing:**

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Android

**Performance Testing:**

- [ ] Lighthouse score ≥ 80
- [ ] Page loads < 2 seconds
- [ ] Bundle size < 200KB
- [ ] No render-blocking resources

**SEO Testing:**

- [ ] Meta title correct
- [ ] Meta description correct
- [ ] Open Graph tags present
- [ ] Twitter Card tags present
- [ ] Favicon displays

---

## Common Issues

### Issue: Copy button doesn't work

**Why it happens:**
Browser clipboard API not available (HTTP instead of HTTPS, or old browser).

**Solution:**

- Test on HTTPS (production)
- Or test localhost (clipboard API works on localhost)
- Add fallback for old browsers:

```typescript
const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(text);
    setCopied(true);
  } catch (err) {
    // Fallback: select text
    console.error('Copy failed', err);
  }
};
```

---

### Issue: Features grid not responsive

**Why it happens:**
Tailwind responsive classes not applying correctly.

**Solution:**
Check Tailwind config `content` paths:

```typescript
content: [
  "./app/**/*.{ts,tsx}",
  "./components/**/*.{ts,tsx}",
],
```

Restart dev server after changing config.

---

### Issue: Fonts not loading

**Why it happens:**
Geist fonts not installed or imported incorrectly.

**Solution:**

```bash
# Install geist package
pnpm add geist

# Verify import in layout.tsx
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

# Verify CSS variables in tailwind.config.ts
fontFamily: {
  sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
  mono: ["var(--font-geist-mono)", "monospace"],
},
```

---

### Issue: Build fails with "Cannot find module"

**Why it happens:**
Import path is wrong or file doesn't exist.

**Solution:**

- Check file path is correct (case-sensitive)
- Ensure `@/` alias is configured in tsconfig.json
- Verify all files are created
- Restart TypeScript server in IDE

---

### Issue: ASCII logo overflows on mobile

**Why it happens:**
Fixed font size too large for small screens.

**Solution:**
Add responsive font sizes and horizontal scroll:

```typescript
<pre className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl overflow-x-auto">
```

Or simplify logo on mobile:

```typescript
{/* Mobile: Short version */}
<div className="block sm:hidden">
  <div className="text-4xl font-bold font-mono text-terminal-cyan">
    PAPYRUS
  </div>
</div>

{/* Desktop: Full ASCII */}
<pre className="hidden sm:block text-6xl ...">
  {/* Full ASCII art */}
</pre>
```

---

### Issue: Links not working after build

**Why it happens:**
Static export doesn't support `<Link>` for external URLs.

**Solution:**
Use `<a>` tags for external links:

```typescript
// External link: use <a>
<a href="https://github.com/..." target="_blank" rel="noopener noreferrer">
  GitHub
</a>

// Internal link: use Next.js <Link>
import Link from "next/link";
<Link href="/about">About</Link>
```

---

## Enhancements (Optional)

These can be added later if needed:

1. **Smooth Scroll:**

   ```typescript
   // Add to globals.css
   html {
     scroll-behavior: smooth;
   }
   ```

2. **Who's It For Section:**
   - Add 3 persona cards (Terminal Devotee, Privacy-Conscious, Reflective Engineer)
   - Similar structure to features grid

3. **Comparison Table:**
   - Papyrus vs Notion/Obsidian/Day One
   - Shows competitive advantages

4. **Stats Section:**
   - npm downloads
   - GitHub stars
   - Number of journals created
   - (Requires API integration)

5. **Newsletter Signup:**
   - Email capture form
   - Mailchimp/ConvertKit integration

6. **Blog Section:**
   - Add `/blog` route
   - Use MDX for blog posts
   - RSS feed

---

## Next Steps

Phase 1 is complete! You now have:

- ✅ Complete marketing website
- ✅ Hero with clear value proposition
- ✅ Features showcase (6 cards)
- ✅ Quick start guide
- ✅ Professional footer
- ✅ Copy-to-clipboard functionality
- ✅ Responsive design
- ✅ Basic SEO
- ✅ Live on Vercel

**What's next:**

1. **Share for Feedback:**
   - Share Vercel URL with users
   - Post on Twitter/Reddit/HN
   - Gather feedback on messaging

2. **Phase 2: Visual Polish & Motion:**
   - Create terminal recordings (asciinema)
   - Add animations (Framer Motion)
   - Integrate terminal demos
   - Enhanced visuals

3. **Phase 3: Growth & Optimization:**
   - Advanced SEO (sitemap, structured data)
   - Analytics setup
   - Additional content sections
   - Performance optimizations

4. **Iterate Based on Feedback:**
   - Adjust messaging if needed
   - Add FAQ if users have questions
   - Add comparison table if users ask "vs X"

---

## References

### Official Documentation

- [Next.js App Router](https://nextjs.org/docs/app)
- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)

### Design Resources

- [Terminal Color Palettes](https://terminal.sexy/)
- [Web Accessibility](https://webaim.org/resources/)
- [Open Graph Protocol](https://ogp.me/)

### Tools

- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Favicon Generator](https://favicon.io/)

### Related Papyrus Docs

- Development plan: `/docs/WEB_DEVELOPMENT_PLAN.md`
- Phase 0 tutorial: `/docs/tutorials/web-phase-0-foundation.md`
- Main README: `/CLAUDE.md`

---

**Congratulations!** You've built a complete, launchable marketing website for Papyrus CLI.

The site is ready to share with the world. Time to get feedback and start Phase 2! 🚀
