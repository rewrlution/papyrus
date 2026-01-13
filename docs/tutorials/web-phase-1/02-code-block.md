# Building a Code Block Component

A terminal-styled code block with syntax highlighting and integrated copy button.

## What We're Building

A `CodeBlock` component that:
- Displays code in a terminal-style container
- Integrates the CopyButton from Tutorial 01
- Handles text overflow with horizontal scrolling
- Looks great on mobile and desktop
- Uses monospace font (JetBrains Mono)

**Why we need this:** Developer documentation requires code blocks that are easy to read and copy. Our component should match the terminal aesthetic of Papyrus.

**Expected outcome:** A reusable component for displaying install commands, CLI examples, and code snippets throughout the marketing site.

## Architecture

```
┌──────────────────────────────────┐
│        CodeBlock                 │
│  (Server Component - default)    │
└───────────┬──────────────────────┘
            │
            ├─ <pre> (preserve whitespace)
            ├─ <code> (monospace font)
            └─ <CopyButton> (client component)
```

**Why this architecture:**
- **Server Component:** No interactivity needed (except copy button)
- **Pre + Code tags:** Semantic HTML for code blocks
- **Embedded CopyButton:** Positioned absolutely in top-right corner
- **Horizontal scroll:** Preserves code formatting on narrow screens

**Trade-offs considered:**
- Could use syntax highlighting library (Shiki, Prism), but plain text is simpler for MVP
- Could make background configurable, but terminal black is on-brand
- Could add line numbers, but adds complexity for minimal benefit

## Prerequisites

**Required:**
- Tutorial 01 completed (CopyButton component)
- Phase 0 completed (Tailwind CSS configured)
- JetBrains Mono font loaded (from Phase 0)

**Assumed knowledge:**
- HTML semantic elements (`<pre>`, `<code>`)
- CSS positioning (absolute vs. relative)
- Tailwind CSS utility classes

## Implementation

### Step 1: Create the CodeBlock Component

**Goal:** Build a terminal-styled container for code with an integrated copy button

Create the component file:

```typescript
// components/shared/code-block.tsx
import { CopyButton } from "./copy-button";

interface CodeBlockProps {
  /**
   * The code text to display
   */
  children: string;

  /**
   * Optional language identifier (for future syntax highlighting)
   * @default "bash"
   */
  language?: string;

  /**
   * Optional className for custom styling
   */
  className?: string;

  /**
   * Whether to show the copy button
   * @default true
   */
  showCopyButton?: boolean;
}

export function CodeBlock({
  children,
  language = "bash",
  className = "",
  showCopyButton = true,
}: CodeBlockProps) {
  // Clean up code text (remove extra whitespace)
  const code = children.trim();

  return (
    <div className={`relative group ${className}`}>
      {/* Terminal-style container */}
      <div className="relative overflow-hidden rounded-lg border border-terminal-dim/20 bg-terminal-black">
        {/* Optional: Add terminal header bar */}
        <div className="flex items-center gap-1.5 border-b border-terminal-dim/10 bg-terminal-dim/5 px-4 py-2">
          {/* Terminal dots (decorative) */}
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/60" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
            <div className="h-3 w-3 rounded-full bg-green-500/60" />
          </div>

          {/* Language label */}
          {language && (
            <span className="ml-3 text-xs font-medium text-terminal-dim">
              {language}
            </span>
          )}
        </div>

        {/* Code content */}
        <div className="relative">
          <pre className="overflow-x-auto p-4">
            <code className="font-mono text-sm text-terminal-text">
              {code}
            </code>
          </pre>

          {/* Copy button (absolute positioned) */}
          {showCopyButton && (
            <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
              <CopyButton text={code} size="sm" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Why this approach:**

**1. Server Component (default):**
- No `"use client"` directive needed
- Static content doesn't require client-side JavaScript
- Better performance (smaller bundle, faster load)
- CopyButton handles its own client-side logic

**2. Pre and Code Tags:**
- `<pre>` preserves whitespace and line breaks (critical for code)
- `<code>` is semantic HTML (tells browsers/screen readers it's code)
- Search engines understand this structure better

**3. Terminal Header Bar:**
- Mimics macOS/Linux terminal windows (familiar to developers)
- Colored dots are purely decorative (visual polish)
- Language label helps users identify code type

**4. Group Hover Pattern:**
- `group` class on parent div
- `group-hover:opacity-100` on copy button
- Button only visible on hover (cleaner UI)
- Mobile: Button always visible (no hover state on touch devices)

**5. Overflow Handling:**
- `overflow-x-auto` on `<pre>` enables horizontal scrolling
- Preserves code formatting (no line wrapping)
- Mobile-friendly (users can swipe to see full code)

**6. Relative Positioning:**
- Parent has `relative` positioning
- Copy button has `absolute` positioning
- Button stays in top-right corner regardless of code length

### Step 2: Add Mobile-Friendly Styles

**Goal:** Ensure code blocks work well on small screens

The component above already handles mobile, but let's understand why:

```typescript
// The key mobile-friendly features:

// 1. Horizontal scroll (not line wrapping)
<pre className="overflow-x-auto p-4">

// 2. Responsive text size (sm = 0.875rem = 14px)
<code className="font-mono text-sm text-terminal-text">

// 3. Always show copy button on mobile (no hover)
// Tailwind's group-hover doesn't work on touch devices,
// so button stays visible

// 4. Touch-friendly button size (minimum 44x44px tap target)
// The sm size CopyButton is still large enough
```

**Why this matters:**
- 60%+ of web traffic is mobile
- Developers often read docs on phones/tablets
- Horizontal scroll is better than wrapping (preserves formatting)

### Step 3: Create Variant for Inline Code

**Goal:** Add a component for inline code snippets (within paragraphs)

Create a companion component for inline code:

```typescript
// components/shared/inline-code.tsx
interface InlineCodeProps {
  children: string;
  className?: string;
}

export function InlineCode({ children, className = "" }: InlineCodeProps) {
  return (
    <code
      className={`rounded bg-terminal-dim/10 px-1.5 py-0.5 font-mono text-sm text-terminal-cyan ${className}`}
    >
      {children}
    </code>
  );
}
```

**Usage example:**
```tsx
<p>
  Run <InlineCode>papyrus add</InlineCode> to create a new entry.
</p>
```

**Why separate components:**
- Inline code has different styling (no border, smaller padding)
- Inline code doesn't need copy button
- Block code is for multi-line, inline code is for single words/commands

### Step 4: Test the Component

**Goal:** Verify code blocks render correctly with various content

Create a test page:

```typescript
// app/test/code-block/page.tsx
import { CodeBlock } from "@/components/shared/code-block";
import { InlineCode } from "@/components/shared/inline-code";

export default function TestCodeBlockPage() {
  return (
    <div className="min-h-screen bg-terminal-black p-8 text-terminal-text">
      <div className="mx-auto max-w-4xl space-y-12">
        <h1 className="text-3xl font-bold text-terminal-cyan">
          Code Block Test
        </h1>

        {/* Basic usage */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-terminal-green">
            Basic Install Command
          </h2>
          <CodeBlock language="bash">
            npm install -g @rewrlution/papyrus-cli
          </CodeBlock>
        </section>

        {/* Multi-line code */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-terminal-green">
            Multi-Line Commands
          </h2>
          <CodeBlock language="bash">
            {`# Install Papyrus globally
npm install -g @rewrlution/papyrus-cli

# Register a new account
papyrus register

# Create your first entry
papyrus add`}
          </CodeBlock>
        </section>

        {/* Long line (tests horizontal scroll) */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-terminal-green">
            Long Command (Horizontal Scroll)
          </h2>
          <CodeBlock language="bash">
            curl -sSL https://api.papyrus.dev/journals/20240315 | jq '.content' | pbcopy
          </CodeBlock>
        </section>

        {/* Different languages */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-terminal-green">
            Different Languages
          </h2>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm text-terminal-dim">JavaScript:</p>
              <CodeBlock language="javascript">
                {`const papyrus = require('@rewrlution/papyrus-cli');
papyrus.add('Today I learned about code blocks!');`}
              </CodeBlock>
            </div>

            <div>
              <p className="mb-2 text-sm text-terminal-dim">JSON:</p>
              <CodeBlock language="json">
                {`{
  "date": "20240315",
  "content": "My journal entry",
  "tags": ["learning", "coding"]
}`}
              </CodeBlock>
            </div>

            <div>
              <p className="mb-2 text-sm text-terminal-dim">YAML:</p>
              <CodeBlock language="yaml">
                {`papyrus:
  editor: vim
  sync: true
  api_url: https://api.papyrus.dev`}
              </CodeBlock>
            </div>
          </div>
        </section>

        {/* Without copy button */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-terminal-green">
            Without Copy Button
          </h2>
          <CodeBlock language="bash" showCopyButton={false}>
            papyrus --version
          </CodeBlock>
        </section>

        {/* Inline code examples */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-terminal-green">
            Inline Code
          </h2>
          <div className="space-y-2 text-base">
            <p>
              To start journaling, run <InlineCode>papyrus add</InlineCode> in
              your terminal.
            </p>
            <p>
              Your entries are stored in{" "}
              <InlineCode>~/.local/share/papyrus/</InlineCode> by default.
            </p>
            <p>
              Use <InlineCode>papyrus sync</InlineCode> to backup to the cloud.
            </p>
          </div>
        </section>

        {/* Responsive test */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-terminal-green">
            Responsive Test (Resize Browser)
          </h2>
          <p className="text-sm text-terminal-dim">
            This should scroll horizontally on narrow screens:
          </p>
          <CodeBlock language="bash">
            echo "This is a very long command that will definitely overflow on mobile devices and require horizontal scrolling to see the full content"
          </CodeBlock>
        </section>
      </div>
    </div>
  );
}
```

**How to test:**

1. Start dev server:
   ```bash
   pnpm dev
   ```

2. Visit `http://localhost:3000/test/code-block`

3. Test interactions:
   - Hover over code block → Copy button appears
   - Click copy button → Code copied to clipboard
   - Paste → Verify exact code (including line breaks)

4. Test responsive design:
   - Open browser DevTools (F12)
   - Toggle device toolbar (Cmd/Ctrl + Shift + M)
   - Test mobile sizes (375px, 414px)
   - Swipe horizontally on long code

5. Test accessibility:
   - Tab through page (should skip to copy button)
   - Screen reader should announce "code" elements

**Expected behavior:**
- ✅ Terminal header shows colored dots
- ✅ Language label displays correctly
- ✅ Copy button appears on hover
- ✅ Long code scrolls horizontally
- ✅ Multi-line code preserves formatting
- ✅ Inline code has cyan text
- ✅ Mobile: Can scroll code blocks

## Common Issues

### Issue: Code wrapping instead of scrolling

**Solution:** Ensure `overflow-x-auto` is on the `<pre>` tag, not the parent div.

```typescript
// Correct:
<pre className="overflow-x-auto p-4">
  <code>{code}</code>
</pre>

// Wrong:
<div className="overflow-x-auto">
  <pre className="p-4">
    <code>{code}</code>
  </pre>
</div>
```

**Why it happens:** The `<pre>` tag needs to be the scrollable container.

### Issue: Copy button not appearing on hover

**Solution:** Check the `group` and `group-hover` classes are applied correctly.

```typescript
// Parent must have "group" class
<div className="relative group">

// Child uses "group-hover" variant
<div className="opacity-0 group-hover:opacity-100">
```

**Why it happens:** Tailwind's group-hover only works when parent has `group` class.

### Issue: Terminal dots not aligned

**Solution:** Use flexbox with proper alignment.

```typescript
<div className="flex items-center gap-1.5">
  <div className="h-3 w-3 rounded-full bg-red-500/60" />
  <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
  <div className="h-3 w-3 rounded-full bg-green-500/60" />
</div>
```

**Why it happens:** Without `items-center`, dots may not align vertically.

### Issue: Font not monospace

**Solution:** Verify JetBrains Mono is loaded in your Tailwind config.

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      fontFamily: {
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
    },
  },
}
```

And in your layout:

```typescript
// app/layout.tsx
import { JetBrains_Mono } from 'next/font/google';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

// Apply to html tag
<html className={jetbrainsMono.variable}>
```

**Why it happens:** Tailwind's `font-mono` class uses your configured monospace font stack.

### Issue: Copy button too small on mobile

**Solution:** The `sm` size (default for CodeBlock) should be fine, but you can increase:

```typescript
<CopyButton text={code} size="default" />
// or
<CopyButton text={code} size="lg" />
```

**Why it happens:** Touch targets should be minimum 44x44px (Apple HIG).

**Current sizes:**
- `sm`: ~36px (acceptable for secondary actions)
- `default`: ~44px (minimum recommended)
- `lg`: ~52px (comfortable for all users)

### Issue: Line breaks not preserved

**Solution:** Use template literals for multi-line strings:

```typescript
// Correct:
<CodeBlock>
  {`line 1
line 2
line 3`}
</CodeBlock>

// Wrong:
<CodeBlock>
  line 1
  line 2
  line 3
</CodeBlock>
```

**Why it happens:** React normalizes whitespace in JSX. Template literals preserve it.

## Testing

### Manual Testing Checklist

```markdown
- [ ] Single-line code displays correctly
- [ ] Multi-line code preserves line breaks
- [ ] Long code scrolls horizontally
- [ ] Copy button appears on hover
- [ ] Copy button hidden when showCopyButton={false}
- [ ] Terminal header shows colored dots
- [ ] Language label displays correctly
- [ ] Code uses monospace font
- [ ] Inline code has cyan text
- [ ] Mobile: Code scrollable with finger swipe
- [ ] Mobile: Copy button visible (no hover on touch)
- [ ] Tab navigation reaches copy button
- [ ] Different languages display correctly
```

### Visual Regression Testing (Optional)

For production apps, take screenshots to detect visual changes:

```bash
# Using Playwright
pnpm add -D @playwright/test

# Create visual test
// tests/code-block.spec.ts
import { test, expect } from '@playwright/test';

test('code block renders correctly', async ({ page }) => {
  await page.goto('/test/code-block');

  // Wait for fonts to load
  await page.waitForLoadState('networkidle');

  // Take screenshot
  await expect(page).toHaveScreenshot('code-block.png');
});
```

## Enhancements (Optional)

### Add Syntax Highlighting

Use Shiki for beautiful syntax highlighting:

```bash
pnpm add shiki
```

```typescript
// lib/syntax-highlighter.ts
import { codeToHtml } from 'shiki';

export async function highlightCode(code: string, language: string) {
  const html = await codeToHtml(code, {
    lang: language,
    theme: 'one-dark-pro',
  });
  return html;
}

// Update CodeBlock to use it
export async function CodeBlock({ children, language }) {
  const highlighted = await highlightCode(children, language);

  return (
    <div dangerouslySetInnerHTML={{ __html: highlighted }} />
  );
}
```

**Trade-offs:**
- ✅ Better visual hierarchy (keywords, strings, comments colored)
- ✅ Easier to read complex code
- ❌ Adds bundle size (~50-100KB)
- ❌ Requires async rendering (Server Component)

### Add Line Numbers

Show line numbers for long code blocks:

```typescript
export function CodeBlock({ children, showLineNumbers = false }) {
  const lines = children.split('\n');

  return (
    <pre className="overflow-x-auto p-4">
      <code>
        {showLineNumbers ? (
          lines.map((line, index) => (
            <div key={index} className="flex">
              <span className="mr-4 text-terminal-dim">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span>{line}</span>
            </div>
          ))
        ) : (
          children
        )}
      </code>
    </pre>
  );
}
```

### Add File Name Header

Show which file the code is from:

```typescript
interface CodeBlockProps {
  children: string;
  language?: string;
  fileName?: string;
}

export function CodeBlock({ children, language, fileName }) {
  return (
    <div className="relative group">
      <div className="rounded-lg border border-terminal-dim/20">
        {/* File name header */}
        {fileName && (
          <div className="border-b border-terminal-dim/10 bg-terminal-dim/5 px-4 py-2">
            <span className="font-mono text-sm text-terminal-cyan">
              {fileName}
            </span>
          </div>
        )}

        {/* Terminal header bar */}
        <div className="flex items-center gap-1.5 border-b border-terminal-dim/10 bg-terminal-dim/5 px-4 py-2">
          {/* ... terminal dots */}
        </div>

        {/* Code content */}
        {/* ... */}
      </div>
    </div>
  );
}
```

**Usage:**
```tsx
<CodeBlock fileName="package.json" language="json">
  {packageJson}
</CodeBlock>
```

### Add Copy Confirmation Toast

Show a toast notification on successful copy:

```typescript
import { toast } from 'sonner';

// In CopyButton component
const handleCopy = async () => {
  await navigator.clipboard.writeText(text);
  toast.success('Copied to clipboard!');
  setCopied(true);
};
```

## Next Steps

Now that you have working code blocks:

1. **Continue to Tutorial 03:** [Hero Section Component](./03-hero-section.md)
   - Use CodeBlock for the install command
   - Build the main hero section
   - Add Papyrus ASCII logo

2. **Explore Shiki:** [shiki.style](https://shiki.style)
   - Syntax highlighting library
   - 100+ themes available
   - Try different color schemes

3. **Learn About Pre Tag:** [MDN Pre Element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/pre)
   - When to use `<pre>`
   - CSS styling considerations
   - Accessibility features

## References

**HTML Elements:**
- [`<pre>` Element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/pre)
- [`<code>` Element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/code)

**Tailwind CSS:**
- [Overflow Utilities](https://tailwindcss.com/docs/overflow)
- [Group Hover](https://tailwindcss.com/docs/hover-focus-and-other-states#styling-based-on-parent-state)

**Syntax Highlighting:**
- [Shiki](https://shiki.style) - Fast, beautiful syntax highlighter
- [Prism](https://prismjs.com/) - Lightweight alternative

**Typography:**
- [JetBrains Mono](https://www.jetbrains.com/lp/mono/) - Free monospace font
- [Fira Code](https://github.com/tonsky/FiraCode) - Another great option

---

**Time to complete:** 15-20 minutes

**Difficulty:** Beginner

**Key Takeaways:**
- ✅ Use `<pre>` and `<code>` for semantic code blocks
- ✅ Horizontal scroll preserves formatting on mobile
- ✅ Group hover pattern for conditional visibility
- ✅ Server Components by default (better performance)
- ✅ Terminal aesthetics enhance developer branding

**Continue to:** [03-hero-section.md](./03-hero-section.md) →
