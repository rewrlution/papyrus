# Web Development Tutor Principles

These principles guide how technical tutorials and code should be written for the Papyrus web package. Use this as a reference when creating tutorials, explaining concepts, or writing code.

**Feed this document to Claude at the start of web development sessions to maintain consistent quality and approach.**

## Core Philosophy

**Goal**: Help developers understand and implement web features efficiently, writing maintainable React/Next.js code without over-engineering.

**Values**:

- **Clarity** over cleverness
- **Simplicity** over flexibility
- **Working code** over theory
- **Understanding** over memorization

## Key Principles

### 1. Top-Down Approach

Start with the big picture, then drill down into details.

**Structure:**

1. **Show the end goal** - What are we building?
2. **Explain the architecture** - How do components fit together?
3. **Provide implementation** - Actual working code
4. **Cover edge cases** - Optional advanced topics

**Example:**

```markdown
## Building Features Section

**Goal:** A responsive grid of 6 feature cards showcasing Papyrus CLI capabilities.

**Architecture:**
```

┌─────────────────────────────────────────────────────────────┐
│ Features Section │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ │ FeatureCard │ │ FeatureCard │ │ FeatureCard │ │
│ │ - Icon │ │ - Icon │ │ - Icon │ │
│ │ - Title │ │ - Title │ │ - Title │ │
│ │ - Desc │ │ - Desc │ │ - Desc │ │
│ └──────────────┘ └──────────────┘ └──────────────┘ │
└─────────────────────────────────────────────────────────────┘

Component Structure:
components/sections/features.tsx
├── Features (section wrapper)
├── features[] (data array)
└── Card (from shadcn/ui)

```

**Implementation:**
[Complete working code...]

**Advanced:**
- Animation on scroll
- Hover effects
- Dark/light mode variants
```

**Why this works:**

- Gives context before diving into code
- Shows how pieces connect
- Allows skipping advanced topics if not needed

### 2. Proper Componentization

Break code into logical, reusable pieces, but avoid premature abstraction.

**Good componentization:**

- ✅ Separate sections (Hero, Features, QuickStart, Footer)
- ✅ Extract shared UI (CopyButton, CodeBlock)
- ✅ Co-locate related code (component + types + styles)
- ✅ Use shadcn/ui for primitives (Button, Card, etc.)
- ✅ Reusable when actually needed

**Bad componentization:**

- ❌ Over-abstraction (generic `<Section>` wrapper for one-time use)
- ❌ Too many props ("config objects" for simple components)
- ❌ Deep component nesting
- ❌ Excessive context providers
- ❌ "Future-proofing" that never gets used

**Rule of thumb:**

- **Once**: Inline it
- **Twice**: Consider extracting
- **Three times**: Definitely extract

**Example:**

```typescript
// Good: Clear separation, shared components extracted
// components/sections/hero.tsx
export function Hero() {
  return (
    <section className="...">
      <h1>Journal Like You Code</h1>
      <CodeBlock code="npm install -g @rewrlution/papyrus-cli" />
      <Button asChild><a href="...">View on GitHub</a></Button>
    </section>
  );
}

// components/shared/code-block.tsx (used in multiple places)
export function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="...">
      <code>{code}</code>
      <CopyButton text={code} />
    </pre>
  );
}

// Bad: Over-engineered for simple use case
interface SectionProps {
  variant: 'hero' | 'features' | 'footer';
  layout: 'centered' | 'grid' | 'stack';
  theme: ThemeConfig;
  animations: AnimationConfig;
  children: React.ReactNode;
}

function Section({ variant, layout, theme, animations, children }: SectionProps) {
  // 100 lines of complexity for basic section wrapper
}
```

**Why this matters:**

- Easier to understand small, focused components
- Can change one part without breaking others
- Testing is simpler
- But over-abstraction makes code hard to follow

### 3. No Unnecessary Complexity

Keep it simple. Don't add features "just in case."

**Avoid:**

- ❌ Configuration for things that don't need configuring
- ❌ Context providers for simple prop drilling (2-3 levels is fine)
- ❌ Custom hooks for one-line operations
- ❌ Generic utilities that could be inline
- ❌ State management libraries for simple state
- ❌ Over-engineered error boundaries for static content

**Embrace:**

- ✅ Direct, straightforward JSX
- ✅ Clear, explicit props
- ✅ Simple Tailwind classes
- ✅ Standard Next.js patterns
- ✅ Built-in React hooks (useState, useEffect)

**Example - Start with the simplest version that works:**

```typescript
// Level 1: Simplest possible (plain HTML + Tailwind)
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-2 rounded hover:bg-gray-700 text-gray-400"
    >
      {copied ? "✓" : "Copy"}
    </button>
  );
}

// Level 2: With icons (add lucide-react)
import { Check, Copy } from "lucide-react";

function CopyButton({ text }: { text: string }) {
  // ... same logic
  return (
    <button onClick={handleCopy} className="p-2 rounded hover:bg-gray-700">
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

// Level 3: With shadcn Button (if you need variants/consistency)
import { Button } from "@/components/ui/button";

function CopyButton({ text }: { text: string }) {
  // ... same logic
  return (
    <Button variant="ghost" size="sm" onClick={handleCopy}>
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}
```

**Bad: Over-engineered from the start**

```typescript
const CopyContext = createContext<CopyContextValue | null>(null);

function CopyProvider({ children, config }: CopyProviderProps) {
  // 50 lines of context setup for a simple copy button
}

function useCopy(options?: CopyOptions) {
  // 30 lines of custom hook for basic clipboard operation
}
```

**Why this matters:**

- Simpler code is easier to understand and maintain
- Less code means fewer bugs
- Complexity should match the actual problem
- Start simple, add complexity only when needed

### 4. Complete Working Code Examples

Provide real, runnable code rather than pseudo-code or fragments.

**Do this:**

```typescript
// components/shared/copy-button.tsx
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

**Not this:**

```typescript
// Pseudo-code
function CopyButton({ text }) {
  // ... state management
  // Handle copy click
  // Show feedback
  return <Button>...</Button>;
}
```

**Why this matters:**

- Developers can copy-paste and run immediately
- Shows all the details (imports, types, "use client")
- No ambiguity about implementation

### 5. Use Popular Libraries (Don't Reinvent the Wheel)

Leverage well-tested, community-maintained libraries for common tasks.

**Use existing solutions for:**

- ✅ UI primitives (shadcn/ui - Button, Card, etc.)
- ✅ Icons (lucide-react)
- ✅ Styling (Tailwind CSS)
- ✅ Fonts (Geist via next/font)
- ✅ Animations (Framer Motion - Phase 2)
- ✅ Code highlighting (Shiki - Phase 2)

**IMPORTANT: Use CLIs and generators, not manual setup:**

```bash
# Good: Use shadcn CLI to add components
npx shadcn@latest init        # One-time setup
npx shadcn@latest add button  # Adds Button with all dependencies

# Bad: Manually creating button.tsx, utils.ts, installing dependencies...
```

The CLI handles:

- Installing dependencies (clsx, tailwind-merge, cva, etc.)
- Creating utility files (lib/utils.ts)
- Configuring paths and TypeScript
- Creating properly structured components

**Consider building custom when:**

- Library adds too much complexity for your needs
- No good library exists for your specific use case
- Library is unmaintained or has security issues
- Performance is critical and library is too slow

**Example:**

```typescript
// Good: Use shadcn/ui Card (installed via CLI)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function FeatureCard({ title, description, icon: Icon }) {
  return (
    <Card>
      <CardHeader>
        <Icon className="h-6 w-6" />
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{description}</CardContent>
    </Card>
  );
}

// Bad: Custom card implementation
function FeatureCard({ title, description, icon }) {
  // 50 lines of custom styling, accessibility, hover states...
}
```

**Why this matters:**

- shadcn/ui components are accessible and well-tested
- Consistent styling across the application
- Focus on your unique content, not infrastructure
- CLIs eliminate setup errors and save time

### 5.5. Mimic Existing Patterns

When building common UI elements, reference well-known implementations.

**Before building, ask:**

- How does [popular site] implement this?
- What's the expected behavior users are familiar with?
- Can I find a reference implementation to mimic?

**Examples of patterns to reference:**

| Component                 | Reference                      |
| ------------------------- | ------------------------------ |
| Install command with copy | npm package pages              |
| Code blocks               | GitHub, documentation sites    |
| Navigation                | Vercel, Next.js docs           |
| Feature cards             | Tailwind, Stripe landing pages |

**Why this matters:**

- Users already know how these patterns work
- Reduces design decisions
- Provides clear implementation target

### 6. Explain Why, Not Just How

Help learners understand the reasoning behind decisions.

**When introducing a new concept:**

- Explain the problem it solves
- Show alternatives and trade-offs
- Justify the chosen approach

**Good:**

```markdown
We use "use client" directive on CopyButton because:

1. **Browser API** - `navigator.clipboard` only works in the browser
2. **State** - We need `useState` for the "copied" feedback
3. **Event handlers** - `onClick` requires client-side JavaScript

Alternative: Could use a server action with progressive enhancement, but adds complexity for simple UX feedback.
```

**Not enough:**

```markdown
Here's the CopyButton component with "use client".
```

**When to skip explanations:**

- Reader has stated knowledge level
- Concept is industry-standard (e.g., "React component")
- Documentation is reference material, not tutorial

**Why this matters:**

- Understanding principles > memorizing patterns
- Developers can apply knowledge to new situations
- Easier to evaluate if approach fits their needs

### 7. Progressive Disclosure

Start simple, add complexity only when needed.

**Tutorial flow:**

```markdown
## Step 1: Basic Hero Section (minimal, working)

[Simple code with headline and CTA]

## Step 2: Add ASCII Logo (brand identity)

[Code with ASCII art pre element]

## Step 3: Add Responsive Styling (mobile support)

[Code with responsive Tailwind classes]

## Optional: Advanced Topics

- Scroll animations
- Dark/light mode
- A/B testing headlines
```

**Why this works:**

- Can stop at any level if it meets needs
- Not overwhelmed by advanced features upfront
- Clear progression of complexity

### 8. Provide Context

Show how pieces fit into the larger system.

**Always include:**

- ✅ File paths (`// components/sections/hero.tsx`)
- ✅ All necessary imports
- ✅ "use client" directive when needed
- ✅ Where the component is used
- ✅ Project structure context

**Example:**

```typescript
// components/sections/hero.tsx
// This component is imported in app/page.tsx
// and renders as the first section of the home page

import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/shared/code-block";
import { Github } from "lucide-react";

export function Hero() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      {/* ... */}
    </section>
  );
}
```

**Why this matters:**

- Understand where code lives in the project
- Know how to import and use the code
- See the bigger picture

### 9. Use Consistent Patterns

Follow project conventions and established patterns.

**In this project:**

- **Sections**: `components/sections/<section-name>.tsx`
- **Shared UI**: `components/shared/<component-name>.tsx`
- **UI Primitives**: `components/ui/<component>.tsx` (shadcn)
- **Pages**: `app/page.tsx`, `app/<route>/page.tsx`
- **Layouts**: `app/layout.tsx`
- **Styling**: Tailwind CSS with custom terminal theme
- **Icons**: lucide-react
- **Client components**: "use client" at top when needed

**Naming conventions:**

- Components: PascalCase (`Hero`, `FeatureCard`)
- Files: kebab-case (`quick-start.tsx`, `copy-button.tsx`)
- CSS classes: Tailwind utilities
- Custom colors: `terminal-*` prefix

**Why this matters:**

- Predictable structure
- Easier onboarding
- Consistent codebase

### 10. Accessibility-First Code

Write accessible code from the start, not as an afterthought.

**Always include:**

- ✅ Semantic HTML (`<section>`, `<nav>`, `<main>`, `<footer>`)
- ✅ ARIA labels for icon-only buttons
- ✅ Proper heading hierarchy (h1 → h2 → h3)
- ✅ Keyboard navigation support
- ✅ Sufficient color contrast
- ✅ Focus indicators

**Example:**

```typescript
// Good: Accessible icon button
<Button
  size="sm"
  variant="ghost"
  onClick={handleCopy}
  aria-label="Copy to clipboard"  // Screen reader support
>
  <Copy className="h-4 w-4" />
</Button>

// Good: Semantic structure
<section aria-labelledby="features-heading">
  <h2 id="features-heading">Built for Developers</h2>
  {/* Feature cards */}
</section>

// Bad: Missing accessibility
<div onClick={handleCopy}>
  <Copy />
</div>
```

**Why this matters:**

- Inclusive design benefits everyone
- Legal requirements (WCAG)
- Better SEO
- shadcn/ui handles most of this, but verify custom code

### 11. Responsive Design by Default

Mobile-first approach with Tailwind breakpoints.

**Pattern:**

```typescript
// Mobile-first: start with mobile styles, add breakpoints for larger screens
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards stack on mobile, 2-col tablet, 3-col desktop */}
</div>

<h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
  {/* Text scales up at each breakpoint */}
</h1>
```

**Breakpoints:**

- `sm`: 640px (large phones)
- `md`: 768px (tablets)
- `lg`: 1024px (laptops)
- `xl`: 1280px (desktops)
- `2xl`: 1536px (large desktops)

**Why this matters:**

- Most users browse on mobile
- Tailwind makes responsive design easy
- Consistent breakpoint system

### 12. Test-Friendly Code

Write code that's easy to test, and show how to test it.

**Testable component characteristics:**

- Props over global state
- Pure rendering logic
- Isolated side effects
- Clear input/output contracts

**Example:**

```typescript
// Testable: Props-driven, predictable
interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function FeatureCard({ title, description, icon: Icon }: FeatureCardProps) {
  return (
    <Card>
      <CardHeader>
        <Icon className="h-6 w-6" data-testid="feature-icon" />
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{description}</CardContent>
    </Card>
  );
}

// Test
it("renders feature card with title and description", () => {
  render(<FeatureCard title="Quick Journaling" description="Write fast" icon={Zap} />);
  expect(screen.getByText("Quick Journaling")).toBeInTheDocument();
  expect(screen.getByText("Write fast")).toBeInTheDocument();
});
```

**Why this matters:**

- Confidence in refactoring
- Catch bugs early
- Living documentation

## Tutorial Structure Template

Use this template for web development tutorials:

```markdown
# [Feature Name]

Brief description of what we're building and why (1-2 sentences).

## What We're Building

- Clear goal statement
- What problem does this solve?
- Expected outcome (visual or functional)

## Architecture
```

Visual diagram of component structure

```

**Why this architecture:**
- Reason for design choices
- Trade-offs considered

## Prerequisites

**Required:**
- Previous tutorials completed
- shadcn/ui components installed

**Assumed knowledge:**
- "Basic React" (can skip useState explanation)
- "Familiar with Tailwind" (can skip class explanation)

## Implementation

### Step 1: [Setup/Foundation]
**Goal:** [What this step achieves]

[Complete code with file path]

**Why this approach:**
[Brief explanation]

### Step 2: [Core Component]
[Same structure...]

### Step 3: [Integration]
[Same structure...]

## Testing

### Manual Testing Checklist
- [ ] Visual appearance matches design
- [ ] Responsive at all breakpoints
- [ ] Interactive elements work
- [ ] Accessible with keyboard

### Automated Testing
[Test code examples]

## Common Issues

**Issue:** [Problem description]
- **Solution:** [How to fix]
- **Why it happens:** [Explanation]

## Enhancements (Optional)

Ideas for extending the feature.

## Next Steps

- What to build next
- Related tutorials
```

## Code Examples Best Practices

### Always Include:

- ✅ File path: `// components/sections/hero.tsx`
- ✅ "use client" directive when needed
- ✅ All necessary imports
- ✅ Complete TypeScript interfaces
- ✅ Tailwind classes for styling
- ✅ ARIA labels for accessibility

### Avoid:

- ❌ `// ... rest of the code`
- ❌ `// TODO: implement this`
- ❌ Partial code that won't run
- ❌ Inline styles (use Tailwind)
- ❌ `any` TypeScript type
- ❌ Over-commenting obvious JSX

### Format:

```typescript
// components/sections/feature-name.tsx
"use client"; // Only if needed

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "lucide-react";

interface ComponentProps {
  title: string;
  description: string;
}

export function ComponentName({ title, description }: ComponentProps) {
  const [state, setState] = useState(false);

  return (
    <section className="py-24 px-6">
      <h2 className="text-3xl font-bold">{title}</h2>
      <p className="text-lg text-muted-foreground">{description}</p>
    </section>
  );
}
```

## When to Deviate

These principles are guidelines, not laws. Deviate when:

1. **Performance critical**: Add complexity for performance (lazy loading, memoization)
2. **SEO requirements**: Server components over client components when possible
3. **External requirements**: Third-party API constraints
4. **Team standards**: Follow agreed-upon conventions
5. **Accessibility needs**: Add complexity for better accessibility
6. **Reader expertise**: Adjust depth based on stated knowledge level

**Always explain why you're deviating** from these principles.

## Checklist for Tutorials

Before publishing a tutorial, verify:

- [ ] Starts with clear goal and visual preview
- [ ] Shows component architecture diagram
- [ ] States prerequisites and assumed knowledge
- [ ] Shows complete, runnable code
- [ ] Explains why, not just what (for new concepts)
- [ ] Uses shadcn/ui and Tailwind appropriately
- [ ] Follows project conventions
- [ ] Includes file paths and all imports
- [ ] Provides testing checklist
- [ ] Has troubleshooting section
- [ ] Components are properly structured
- [ ] No unnecessary complexity
- [ ] Responsive design included
- [ ] Accessibility considered

## Checklist for Code

Before submitting code, verify:

- [ ] Uses shadcn/ui for UI primitives
- [ ] Uses Tailwind for styling (no inline styles)
- [ ] Properly componentized (single responsibility)
- [ ] No premature abstraction
- [ ] "use client" only when necessary
- [ ] TypeScript types throughout (no `any`)
- [ ] Accessible (ARIA labels, semantic HTML)
- [ ] Responsive (mobile-first breakpoints)
- [ ] Follows project patterns and structure
- [ ] Imports use `@/` alias

---

## Summary

**Remember these core values:**

1. **Top-down** - Big picture first, details later
2. **Proper componentization** - Extract at 3 uses, not before
3. **No unnecessary complexity** - Simple > clever
4. **Complete working examples** - Runnable, not pseudo-code
5. **Use popular libraries** - shadcn/ui, Tailwind, lucide-react
6. **Explain why** - Reasoning > mechanics (for new concepts)
7. **Accessibility-first** - Inclusive by default
8. **Responsive by default** - Mobile-first with Tailwind

**Goal:** Help developers be productive quickly while writing maintainable React/Next.js code.

**Motto:** Clarity and simplicity trump cleverness.
