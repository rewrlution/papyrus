# Building the Quick Start Section

A step-by-step getting started guide with installation options and numbered steps.

## What We're Building

A `QuickStart` component that:
- Shows installation options (npm, pnpm, yarn) with CodeBlocks
- Displays a 4-step getting started guide
- Uses numbered icons for visual progression
- Includes system requirements at the bottom
- Responsive layout (stacks on mobile, side-by-side on desktop)

**Why we need this:** After seeing the hero and features, visitors need clear next steps. A concise quick start guide removes friction and drives adoption. Make it easy, and users will try your tool.

**Expected outcome:** A conversion-optimized quick start section that guides new users from installation to first journal entry in 4 steps.

## Architecture

```
┌─────────────────────────────────────┐
│         QuickStart                  │
│      (Server Component)             │
└──────────────┬──────────────────────┘
               │
               ├─ Section Header (H2)
               ├─ Installation Options
               │  ├─ CodeBlock (npm)
               │  ├─ CodeBlock (pnpm)
               │  └─ CodeBlock (yarn)
               ├─ Getting Started Steps
               │  ├─ Step 1: Register
               │  ├─ Step 2: Add Entry
               │  ├─ Step 3: Browse
               │  └─ Step 4: Sync
               └─ System Requirements Footer
```

**Why this architecture:**
- **Server Component:** Static content, no client interactivity
- **Multiple CodeBlocks:** One per package manager (users choose)
- **Numbered steps:** Clear visual progression (1 → 2 → 3 → 4)
- **Icon + Command pattern:** Visual aid + actionable code
- **Requirements footer:** Sets expectations (Node version, OS)

**Trade-offs considered:**
- Could use tabs for package managers, but showing all is simpler for MVP
- Could make steps expandable, but keeping them visible improves scannability
- Could add video tutorial, but text is faster to scan and copy

## Prerequisites

**Required:**
- Tutorial 02 completed (CodeBlock component)
- `lucide-react` installed (icons for steps)
- Understanding of semantic HTML lists

**Assumed knowledge:**
- React component composition
- Tailwind responsive utilities
- Numbered lists vs. styled divs

## Implementation

### Step 1: Define Step Data Structure

**Goal:** Create a type-safe structure for getting started steps

Define the step interface and data:

```typescript
// components/sections/quick-start.tsx
import {
  UserPlus,
  PenTool,
  BookOpen,
  Cloud,
  type LucideIcon,
} from "lucide-react";

interface Step {
  /**
   * Step number (1-4)
   */
  number: number;

  /**
   * Icon component from lucide-react
   */
  icon: LucideIcon;

  /**
   * Step title (action-oriented)
   */
  title: string;

  /**
   * Step description (brief explanation)
   */
  description: string;

  /**
   * CLI command to execute
   */
  command: string;

  /**
   * Command language (for syntax highlighting)
   */
  language: string;
}

const steps: Step[] = [
  {
    number: 1,
    icon: UserPlus,
    title: "Register an Account",
    description: "Create your account and authenticate with the Papyrus API.",
    command: "papyrus register",
    language: "bash",
  },
  {
    number: 2,
    icon: PenTool,
    title: "Add Your First Entry",
    description: "Write your first journal entry in your favorite editor.",
    command: "papyrus add",
    language: "bash",
  },
  {
    number: 3,
    icon: BookOpen,
    title: "Browse Your Journals",
    description: "Launch the interactive TUI to read and navigate entries.",
    command: "papyrus app",
    language: "bash",
  },
  {
    number: 4,
    icon: Cloud,
    title: "Sync to the Cloud",
    description: "Backup your journals and access them from any device.",
    command: "papyrus sync",
    language: "bash",
  },
];
```

**Why this approach:**

**1. TypeScript Interface:**
- Ensures all steps have required fields
- Self-documenting code (clear what each step needs)
- IntelliSense while editing

**2. Action-Oriented Titles:**
- "Register an Account" (not "Account Setup")
- "Add Your First Entry" (not "Entry Creation")
- Imperative verbs (Register, Add, Browse, Sync)

**3. Brief Descriptions:**
- One sentence per step (scannable)
- Focuses on outcome (what user achieves)
- Sets expectations (editor, TUI, cloud)

**4. Real Commands:**
- Exact CLI commands users will run
- Copyable via CodeBlock
- No placeholders or pseudo-code

### Step 2: Create the QuickStart Component

**Goal:** Build the complete quick start section

Create the component:

```typescript
// components/sections/quick-start.tsx
import {
  UserPlus,
  PenTool,
  BookOpen,
  Cloud,
  type LucideIcon,
} from "lucide-react";
import { CodeBlock } from "@/components/shared/code-block";

interface Step {
  number: number;
  icon: LucideIcon;
  title: string;
  description: string;
  command: string;
  language: string;
}

const steps: Step[] = [
  {
    number: 1,
    icon: UserPlus,
    title: "Register an Account",
    description: "Create your account and authenticate with the Papyrus API.",
    command: "papyrus register",
    language: "bash",
  },
  {
    number: 2,
    icon: PenTool,
    title: "Add Your First Entry",
    description: "Write your first journal entry in your favorite editor.",
    command: "papyrus add",
    language: "bash",
  },
  {
    number: 3,
    icon: BookOpen,
    title: "Browse Your Journals",
    description: "Launch the interactive TUI to read and navigate entries.",
    command: "papyrus app",
    language: "bash",
  },
  {
    number: 4,
    icon: Cloud,
    title: "Sync to the Cloud",
    description: "Backup your journals and access them from any device.",
    command: "papyrus sync",
    language: "bash",
  },
];

export function QuickStart() {
  return (
    <section
      id="quick-start"
      className="border-b border-terminal-dim/20 bg-terminal-black py-24 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-terminal-text sm:text-4xl md:text-5xl">
            Get Started in{" "}
            <span className="text-terminal-cyan">Minutes</span>
          </h2>
          <p className="mt-4 text-base text-terminal-dim sm:text-lg">
            Install Papyrus and start journaling in four simple steps.
          </p>
        </div>

        {/* Installation Options */}
        <div className="mx-auto max-w-4xl mb-16">
          <h3 className="text-xl font-semibold text-terminal-text mb-6 text-center sm:text-left">
            Installation
          </h3>

          <div className="space-y-4">
            {/* npm */}
            <div>
              <p className="mb-2 text-sm font-medium text-terminal-dim">
                Using npm:
              </p>
              <CodeBlock language="bash">
                npm install -g @rewrlution/papyrus-cli
              </CodeBlock>
            </div>

            {/* pnpm */}
            <div>
              <p className="mb-2 text-sm font-medium text-terminal-dim">
                Using pnpm:
              </p>
              <CodeBlock language="bash">
                pnpm add -g @rewrlution/papyrus-cli
              </CodeBlock>
            </div>

            {/* yarn */}
            <div>
              <p className="mb-2 text-sm font-medium text-terminal-dim">
                Using Yarn:
              </p>
              <CodeBlock language="bash">
                yarn global add @rewrlution/papyrus-cli
              </CodeBlock>
            </div>
          </div>
        </div>

        {/* Getting Started Steps */}
        <div className="mx-auto max-w-4xl mb-16">
          <h3 className="text-xl font-semibold text-terminal-text mb-8 text-center sm:text-left">
            Getting Started
          </h3>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {steps.map((step) => (
              <StepCard key={step.number} {...step} />
            ))}
          </div>
        </div>

        {/* System Requirements */}
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg border border-terminal-dim/20 bg-terminal-dim/5 p-6">
            <h4 className="text-sm font-semibold text-terminal-text mb-3">
              System Requirements
            </h4>
            <ul className="space-y-2 text-sm text-terminal-dim">
              <li className="flex items-start">
                <span className="mr-2 text-terminal-cyan">•</span>
                <span>
                  <strong className="text-terminal-text">Node.js:</strong>{" "}
                  v18.0.0 or higher
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-terminal-cyan">•</span>
                <span>
                  <strong className="text-terminal-text">Operating System:</strong>{" "}
                  macOS, Linux, or Windows (WSL2)
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-terminal-cyan">•</span>
                <span>
                  <strong className="text-terminal-text">Terminal:</strong>{" "}
                  Any modern terminal emulator
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-terminal-cyan">•</span>
                <span>
                  <strong className="text-terminal-text">Optional:</strong>{" "}
                  vim, nano, or VS Code for journal editing
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

interface StepCardProps {
  number: number;
  icon: LucideIcon;
  title: string;
  description: string;
  command: string;
  language: string;
}

function StepCard({
  number,
  icon: Icon,
  title,
  description,
  command,
  language,
}: StepCardProps) {
  return (
    <div className="relative">
      {/* Step number badge */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-terminal-cyan/10 text-lg font-bold text-terminal-cyan">
          {number}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-terminal-dim/10">
          <Icon className="h-5 w-5 text-terminal-cyan" />
        </div>
      </div>

      {/* Title */}
      <h4 className="text-lg font-semibold text-terminal-text mb-2">
        {title}
      </h4>

      {/* Description */}
      <p className="text-sm text-terminal-dim mb-4">{description}</p>

      {/* Command */}
      <CodeBlock language={language}>{command}</CodeBlock>
    </div>
  );
}
```

**Why this approach:**

**1. Three Subsections:**
- Installation options (npm, pnpm, yarn)
- Getting started steps (1-4)
- System requirements (footer)
- Logical flow: install → use → check compatibility

**2. Installation Layout:**
- Vertical stack (easier to scan)
- Each option clearly labeled
- No tabs or dropdowns (all visible at once)
- Users choose based on their preference

**3. Step Grid:**
```typescript
className="grid grid-cols-1 sm:grid-cols-2"

// Mobile:  1 column (vertical steps)
// Tablet+: 2 columns (2x2 grid)
```

**4. Step Number Badge:**
- Circular background (visual weight)
- Cyan color (brand color)
- Large font (easy to scan)
- Separate from icon (dual visual cues)

**5. Step Content Structure:**
- Number + Icon (visual hierarchy)
- Title (action-oriented)
- Description (brief context)
- Command (actionable next step)
- Top-to-bottom reading flow

**6. System Requirements Box:**
- Subtle background (visually separated)
- Bullet points (scannable)
- Bold labels (Node.js, OS, Terminal)
- Optional items clearly marked

**7. Semantic HTML:**
- `<section id="quick-start">` for anchor links
- `<h2>` for main heading
- `<h3>` for subsection headings
- `<ul>` for requirements list
- Proper heading hierarchy (H2 → H3 → H4)

### Step 3: Understanding the Layout Strategy

**Goal:** Learn how the two-column step grid works

**Desktop layout (2 columns):**
```
┌─────────────────────┬─────────────────────┐
│  1. Register        │  2. Add Entry       │
│  [Icon] [Command]   │  [Icon] [Command]   │
├─────────────────────┼─────────────────────┤
│  3. Browse          │  4. Sync            │
│  [Icon] [Command]   │  [Icon] [Command]   │
└─────────────────────┴─────────────────────┘
```

**Mobile layout (1 column):**
```
┌─────────────────────┐
│  1. Register        │
│  [Icon] [Command]   │
├─────────────────────┤
│  2. Add Entry       │
│  [Icon] [Command]   │
├─────────────────────┤
│  3. Browse          │
│  [Icon] [Command]   │
├─────────────────────┤
│  4. Sync            │
│  [Icon] [Command]   │
└─────────────────────┘
```

**Why this works:**
- Mobile: Natural reading order (1 → 2 → 3 → 4)
- Desktop: Utilizes horizontal space, still scannable
- 2x2 grid fits perfectly above the fold on most screens

### Step 4: Style the Step Number Badge

**Goal:** Create a visually distinct number indicator

The step badge uses layered styles:

```typescript
// Circular container
className="flex h-10 w-10 items-center justify-center rounded-full bg-terminal-cyan/10"

// Text styling
className="text-lg font-bold text-terminal-cyan"

// Result: Cyan number in cyan circle (strong visual hierarchy)
```

**Design principles:**
- **Shape:** Circle suggests progression/flow
- **Color:** Cyan matches brand (same as CTA buttons)
- **Size:** Large enough to be focal point (10 = 2.5rem = 40px)
- **Background:** Subtle (10% opacity, not overwhelming)

**Alternative styles:**

```typescript
// Square badge (more modern)
className="rounded-lg bg-terminal-cyan text-terminal-black"

// Outlined badge (minimal)
className="rounded-full border-2 border-terminal-cyan text-terminal-cyan"

// Gradient badge (fancy)
className="rounded-full bg-gradient-to-br from-terminal-cyan to-terminal-green"
```

### Step 5: Test the Component

**Goal:** Verify quick start section renders and responds correctly

Create a test page:

```typescript
// app/test/quick-start/page.tsx
import { QuickStart } from "@/components/sections/quick-start";

export default function TestQuickStartPage() {
  return (
    <div className="min-h-screen bg-terminal-black">
      <QuickStart />

      {/* Spacer */}
      <div className="p-8 text-terminal-text text-center">
        <p>Scroll up to see quick start section</p>
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

2. Visit `http://localhost:3000/test/quick-start`

3. Test installation options:
   - All 3 package managers visible
   - Each has a label ("Using npm:")
   - Each command has copy button
   - Copy button works (paste to verify)

4. Test getting started steps:
   - All 4 steps visible
   - Steps numbered 1-4
   - Each has an icon
   - Each has a command
   - Grid is 2 columns on desktop
   - Grid is 1 column on mobile

5. Test system requirements:
   - Box has subtle background
   - All 4 requirements listed
   - Bullet points aligned
   - "Optional" item clearly marked

6. Test responsive design:
   - Mobile (375px): Steps stack vertically
   - Tablet (768px): Steps in 2x2 grid
   - Desktop (1024px+): Full layout

**Expected behavior:**
- ✅ 3 installation options displayed
- ✅ 4 steps in logical order
- ✅ Step numbers prominent and styled
- ✅ Icons match step themes
- ✅ All commands copyable
- ✅ System requirements readable
- ✅ Responsive layout works

## Common Issues

### Issue: Step grid not showing 2 columns on tablet

**Solution:** Verify breakpoint class:

```typescript
// Correct:
className="grid grid-cols-1 sm:grid-cols-2"

// Wrong:
className="grid grid-cols-1 md:grid-cols-2"  // Uses md instead of sm
```

**Why it happens:** `sm` breakpoint (640px) is more appropriate for tablets than `md` (768px).

### Issue: Step number badge not circular

**Solution:** Ensure fixed width and height are equal:

```typescript
// Correct:
className="h-10 w-10 rounded-full"

// Wrong:
className="h-10 w-12 rounded-full"  // Different dimensions = oval
```

**Why it happens:** `rounded-full` makes perfect circles only when width === height.

### Issue: CodeBlocks taking full width

**Solution:** This is expected behavior. If you want to constrain:

```typescript
<div className="max-w-md">
  <CodeBlock>{command}</CodeBlock>
</div>
```

**Why it happens:** CodeBlocks are designed to be responsive and fill their container.

### Issue: Icons not aligned with numbers

**Solution:** Use flexbox with `items-center`:

```typescript
<div className="flex items-center gap-3">
  <div>{number}</div>
  <div><Icon /></div>
</div>
```

**Why it happens:** Without vertical alignment, elements baseline-align by default.

### Issue: Requirements text too dim

**Solution:** Adjust color or add more contrast:

```typescript
// Lighter gray
className="text-terminal-dim"  // Change to: text-terminal-text/70

// Or adjust specific elements
<strong className="text-terminal-text">Node.js:</strong>
```

**Why it happens:** `text-terminal-dim` (#666) might be too dark on dark backgrounds.

### Issue: Steps out of order on mobile

**Solution:** This shouldn't happen with `grid-cols-1`. If it does, check CSS:

```typescript
// Ensure no custom order or flex-direction
className="grid grid-cols-1"  // Not flex-col-reverse
```

**Why it happens:** Some CSS properties can reverse visual order.

## Testing

### Manual Testing Checklist

```markdown
**Installation Section:**
- [ ] All 3 package managers shown (npm, pnpm, yarn)
- [ ] Each has a label
- [ ] Each has a CodeBlock
- [ ] Copy buttons work on all 3

**Steps Section:**
- [ ] 4 steps displayed
- [ ] Steps numbered 1-4
- [ ] Numbers are cyan and circular
- [ ] Each step has an icon
- [ ] Icons are cyan
- [ ] Titles are bold and clear
- [ ] Descriptions fit in one sentence
- [ ] Commands are in CodeBlocks
- [ ] Grid is 1 column on mobile
- [ ] Grid is 2 columns on tablet+

**Requirements Section:**
- [ ] Box has subtle background
- [ ] 4 requirements listed
- [ ] Bullets are cyan
- [ ] Bold labels stand out
- [ ] "Optional" item clear

**Responsive:**
- [ ] Mobile (375px): Vertical stack
- [ ] Tablet (768px): 2x2 grid
- [ ] Desktop (1024px+): 2x2 grid centered

**Interactive:**
- [ ] All copy buttons work
- [ ] Hover states on buttons
- [ ] No layout shift on interaction
```

### Content Review Checklist

```markdown
- [ ] Installation commands are correct (npm, pnpm, yarn)
- [ ] Step commands are real (not placeholders)
- [ ] Descriptions are brief (1 sentence each)
- [ ] Requirements are accurate (Node 18+, OS)
- [ ] No typos in commands or text
```

## Enhancements (Optional)

### Add Package Manager Tabs

Instead of showing all 3, use tabs:

```bash
pnpm add @radix-ui/react-tabs
```

```typescript
"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function InstallTabs() {
  return (
    <Tabs defaultValue="npm">
      <TabsList>
        <TabsTrigger value="npm">npm</TabsTrigger>
        <TabsTrigger value="pnpm">pnpm</TabsTrigger>
        <TabsTrigger value="yarn">Yarn</TabsTrigger>
      </TabsList>

      <TabsContent value="npm">
        <CodeBlock>npm install -g @rewrlution/papyrus-cli</CodeBlock>
      </TabsContent>

      {/* ... other tabs */}
    </Tabs>
  );
}
```

### Add Step Completion Checkboxes

Interactive checklist (client component):

```typescript
"use client";

import { useState } from "react";
import { Check } from "lucide-react";

export function InteractiveSteps() {
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  const toggleStep = (num: number) => {
    const newCompleted = new Set(completed);
    if (newCompleted.has(num)) {
      newCompleted.delete(num);
    } else {
      newCompleted.add(num);
    }
    setCompleted(newCompleted);
  };

  return (
    <div>
      {steps.map((step) => (
        <div key={step.number}>
          <button onClick={() => toggleStep(step.number)}>
            {completed.has(step.number) ? <Check /> : step.number}
          </button>
          {/* ... step content */}
        </div>
      ))}
    </div>
  );
}
```

### Add Video Tutorial

Embed a terminal recording:

```typescript
<div className="aspect-video rounded-lg overflow-hidden border border-terminal-dim/20">
  <video
    src="/videos/quick-start.mp4"
    controls
    className="w-full h-full"
  />
</div>
```

### Add Troubleshooting Accordion

Common issues and solutions:

```typescript
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

<Accordion>
  <AccordionItem value="node-version">
    <AccordionTrigger>
      Error: "Unsupported Node.js version"
    </AccordionTrigger>
    <AccordionContent>
      Upgrade to Node.js 18+: nvm install 18
    </AccordionContent>
  </AccordionItem>
  {/* ... more items */}
</Accordion>
```

## Next Steps

Now that you have a clear quick start guide:

1. **Continue to Tutorial 06:** [Footer Section Component](./06-footer-section.md)
   - Build site footer
   - Add navigation links
   - Include social icons

2. **Explore Radix UI Tabs:** [Radix Tabs](https://www.radix-ui.com/primitives/docs/components/tabs)
   - Accessible tab component
   - Keyboard navigation
   - ARIA attributes

3. **Learn About Progressive Disclosure:** [NN Group Article](https://www.nngroup.com/articles/progressive-disclosure/)
   - When to hide information
   - Accordion patterns
   - User control

## References

**Component Patterns:**
- [shadcn/ui Accordion](https://ui.shadcn.com/docs/components/accordion)
- [shadcn/ui Tabs](https://ui.shadcn.com/docs/components/tabs)

**Icons:**
- [Lucide Icons](https://lucide.dev)

**Design Patterns:**
- [Step-by-step guides](https://www.nngroup.com/articles/checklist/)
- [Installation docs best practices](https://documentation.divio.com/)

**Inspiration:**
- [Next.js Quick Start](https://nextjs.org/docs/getting-started)
- [Supabase Quick Start](https://supabase.com/docs/guides/getting-started)
- [Linear Setup Guide](https://linear.app/docs)

---

**Time to complete:** 25-35 minutes

**Difficulty:** Intermediate

**Key Takeaways:**
- ✅ Quick start guides should be concise (4 steps max)
- ✅ Show all options when there are only a few (avoid tabs for 3 items)
- ✅ Numbered steps create clear progression
- ✅ System requirements set user expectations
- ✅ Every step should have an actionable command

**Continue to:** [06-footer-section.md](./06-footer-section.md) →
