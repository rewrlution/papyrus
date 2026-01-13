# Building a Copy-to-Clipboard Button Component

A reusable button component that copies text to the clipboard with visual feedback.

## What We're Building

A `CopyButton` component that:
- Copies text to the user's clipboard when clicked
- Shows visual feedback (checkmark icon when copied)
- Resets after 2 seconds
- Works in all modern browsers
- Follows accessible design patterns

**Why we need this:** Install commands and code snippets should be one-click copyable. Users expect this on modern developer websites.

**Expected outcome:** A single component we can reuse throughout the site for any "copy to clipboard" functionality.

## Architecture

```
┌─────────────────────────┐
│     CopyButton          │
│  (Client Component)     │
└───────────┬─────────────┘
            │
            ├─ useState (copied state)
            ├─ navigator.clipboard API
            ├─ onClick handler
            └─ Icon feedback (Copy → Check)
```

**Why this architecture:**
- **Client-side only:** Clipboard API only works in the browser, requires `"use client"` directive
- **Local state:** Component manages its own feedback state (no need for global state)
- **Self-contained:** All logic in one place, easy to reuse

**Trade-offs considered:**
- Could use a library (like `react-copy-to-clipboard`), but the native API is simple enough
- Could make feedback duration configurable, but 2 seconds is standard and works well
- Could add sound feedback, but visual is sufficient for accessibility

## Prerequisites

**Required:**
- Phase 0 completed (Next.js app setup)
- `lucide-react` installed (for icons)
- Basic understanding of React hooks (`useState`)

**Assumed knowledge:**
- React functional components
- TypeScript basics (interfaces, types)
- Event handlers in React

## Implementation

### Step 1: Install Icon Library

**Goal:** Add Lucide React for clean, modern icons

First, install the icon library we'll use throughout the site:

```bash
pnpm add lucide-react
```

**Why Lucide React:**
- Tree-shakeable (only bundle icons you use)
- Consistent design style
- Built specifically for React
- Large icon set (>1000 icons)
- Actively maintained

### Step 2: Create the CopyButton Component

**Goal:** Build the core copy-to-clipboard functionality

Create the component file:

```typescript
// components/shared/copy-button.tsx
"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  /**
   * The text to copy to the clipboard
   */
  text: string;

  /**
   * Optional className for custom styling
   */
  className?: string;

  /**
   * Button size (affects icon size and padding)
   * @default "default"
   */
  size?: "sm" | "default" | "lg";
}

export function CopyButton({
  text,
  className,
  size = "default"
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      // Use the Clipboard API to copy text
      await navigator.clipboard.writeText(text);

      // Show success feedback
      setCopied(true);

      // Reset after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      // Clipboard API can fail in certain contexts
      console.error("Failed to copy text:", error);
    }
  };

  // Size variants for icon and button
  const sizeClasses = {
    sm: "h-3.5 w-3.5",
    default: "h-4 w-4",
    lg: "h-5 w-5"
  };

  const buttonSizeClasses = {
    sm: "p-1.5",
    default: "p-2",
    lg: "p-2.5"
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        // Base styles
        "inline-flex items-center justify-center",
        "rounded-md",
        "border border-terminal-dim/20",
        "bg-terminal-black/50",
        "text-terminal-text",
        "transition-all duration-200",

        // Hover state
        "hover:bg-terminal-dim/10",
        "hover:border-terminal-cyan/40",
        "hover:text-terminal-cyan",

        // Focus state (keyboard navigation)
        "focus-visible:outline-none",
        "focus-visible:ring-2",
        "focus-visible:ring-terminal-cyan",
        "focus-visible:ring-offset-2",
        "focus-visible:ring-offset-terminal-black",

        // Active state
        "active:scale-95",

        // Size
        buttonSizeClasses[size],

        // Custom classes
        className
      )}
      aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}
      title={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? (
        <Check className={cn(sizeClasses[size], "text-terminal-green")} />
      ) : (
        <Copy className={sizeClasses[size]} />
      )}
    </button>
  );
}
```

**Why this approach:**

**1. Client Component (`"use client"`):**
- The Clipboard API only works in the browser
- React state (`useState`) requires client-side rendering
- Next.js 15 uses Server Components by default, so we opt-in to client rendering

**2. TypeScript Interface:**
- Makes component usage clear (IntelliSense shows all props)
- Catches errors at compile time (e.g., passing wrong prop types)
- Serves as inline documentation

**3. Async/Await for Clipboard:**
- `navigator.clipboard.writeText()` returns a Promise
- Using `async/await` makes the code cleaner than `.then()` chains
- Wrapped in `try/catch` to handle permission errors gracefully

**4. Timeout for State Reset:**
- 2 seconds gives user time to see the feedback
- `setTimeout` runs asynchronously, doesn't block UI
- State automatically resets without user action

**5. Size Variants:**
- Different contexts need different sizes (inline vs. standalone)
- Type-safe with TypeScript (can't pass invalid size)
- Uses Tailwind utility classes for consistency

**6. Accessibility Features:**
- `aria-label` tells screen readers what the button does
- `title` attribute shows tooltip on hover (helpful for all users)
- `focus-visible` ring for keyboard navigation (tab through page)
- Label changes based on state (copied vs. not copied)

**7. Visual Feedback:**
- Icon changes from Copy to Check (universal symbols)
- Color changes to green (success color in terminal palette)
- Button scales down slightly on click (tactile feedback)
- Border and background change on hover (affordance)

### Step 3: Understanding the cn() Utility

**Goal:** Learn how to conditionally combine CSS classes

The `cn()` utility comes from shadcn/ui and makes it easy to merge Tailwind classes:

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**What it does:**
- `clsx`: Combines class names conditionally
- `twMerge`: Removes conflicting Tailwind classes

**Example usage:**
```typescript
cn(
  "p-2",              // Always applied
  "bg-red-500",       // Base background
  className,          // User can override with "bg-blue-500"
  copied && "text-green-500"  // Conditional class
)
```

**Why we need this:**
- Tailwind classes can conflict (`p-2` and `p-4` both can't apply)
- `twMerge` ensures the last one wins (proper override behavior)
- `clsx` lets us write conditional classes cleanly

### Step 4: Test the Component

**Goal:** Verify the copy button works in isolation

Create a test page to verify functionality:

```typescript
// app/test/copy-button/page.tsx
import { CopyButton } from "@/components/shared/copy-button";

export default function TestCopyButtonPage() {
  return (
    <div className="min-h-screen bg-terminal-black p-8 text-terminal-text">
      <div className="mx-auto max-w-2xl space-y-8">
        <h1 className="text-3xl font-bold text-terminal-cyan">
          Copy Button Test
        </h1>

        {/* Default size */}
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Default Size</h2>
          <div className="flex items-center gap-2">
            <code className="rounded bg-terminal-dim/10 px-3 py-2 font-mono text-sm">
              npm install @rewrlution/papyrus-cli
            </code>
            <CopyButton text="npm install @rewrlution/papyrus-cli" />
          </div>
        </div>

        {/* Small size */}
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Small Size</h2>
          <div className="flex items-center gap-2">
            <code className="rounded bg-terminal-dim/10 px-2 py-1 font-mono text-xs">
              papyrus add
            </code>
            <CopyButton
              text="papyrus add"
              size="sm"
            />
          </div>
        </div>

        {/* Large size */}
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Large Size</h2>
          <div className="flex items-center gap-2">
            <code className="rounded bg-terminal-dim/10 px-4 py-3 font-mono">
              curl -sSL https://install.papyrus.dev | bash
            </code>
            <CopyButton
              text="curl -sSL https://install.papyrus.dev | bash"
              size="lg"
            />
          </div>
        </div>

        {/* Custom styling */}
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Custom Styling</h2>
          <div className="flex items-center gap-2">
            <code className="rounded bg-terminal-dim/10 px-3 py-2 font-mono text-sm">
              git clone https://github.com/rewrlution/papyrus.git
            </code>
            <CopyButton
              text="git clone https://github.com/rewrlution/papyrus.git"
              className="border-terminal-green/40 hover:border-terminal-green"
            />
          </div>
        </div>

        {/* Multiple instances */}
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Multiple Buttons</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-terminal-dim/10 px-3 py-2 font-mono text-sm">
                pnpm add @rewrlution/papyrus-cli
              </code>
              <CopyButton text="pnpm add @rewrlution/papyrus-cli" />
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-terminal-dim/10 px-3 py-2 font-mono text-sm">
                yarn add @rewrlution/papyrus-cli
              </code>
              <CopyButton text="yarn add @rewrlution/papyrus-cli" />
            </div>
          </div>
        </div>
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

2. Visit `http://localhost:3000/test/copy-button`

3. Test each button:
   - Click button → Icon should change to checkmark
   - Icon should be green
   - After 2 seconds → Icon should reset to copy symbol
   - Paste (Cmd/Ctrl + V) → Should paste the exact text

4. Test keyboard navigation:
   - Press Tab to focus button
   - Press Enter or Space to activate
   - Should see focus ring (blue outline)

5. Test in different browsers:
   - Chrome/Edge (Chromium)
   - Firefox
   - Safari (if on Mac)

**Expected behavior:**
- ✅ Click → Icon changes to green checkmark
- ✅ After 2s → Icon reverts to copy symbol
- ✅ Clipboard contains exact text
- ✅ Hover → Border glows cyan
- ✅ Focus → Blue ring visible
- ✅ Multiple buttons work independently

## Common Issues

### Issue: "navigator.clipboard is not defined"

**Solution:** The Clipboard API requires either HTTPS or localhost.

```typescript
// Check if clipboard is available
if (!navigator.clipboard) {
  console.warn("Clipboard API not available");
  return;
}
```

**Why it happens:** Browser security restricts clipboard access to secure contexts.

**For development:** Always use `localhost` (not `127.0.0.1` or local IP).

### Issue: Copy button doesn't work on mobile

**Solution:** Test on HTTPS (deploy to Vercel for preview).

**Why it happens:** Mobile browsers are stricter about clipboard permissions.

**For testing:** Use Vercel preview URLs (auto HTTPS).

### Issue: Focus ring not visible

**Solution:** Check Tailwind config includes `focus-visible` variant.

```javascript
// tailwind.config.ts
export default {
  // ... other config
  variants: {
    extend: {
      ringColor: ['focus-visible'],
      ringWidth: ['focus-visible'],
    },
  },
}
```

**Why it happens:** Some Tailwind configurations disable certain variants by default.

### Issue: Icons not rendering

**Solution:** Verify `lucide-react` is installed and imported correctly.

```bash
# Check if installed
pnpm list lucide-react

# If not installed
pnpm add lucide-react
```

**Why it happens:** Missing dependency or incorrect import path.

### Issue: Timeout not resetting state

**Solution:** Component is re-rendering and creating new timeouts. Use cleanup:

```typescript
const handleCopy = async () => {
  await navigator.clipboard.writeText(text);
  setCopied(true);

  // Store timeout ID
  const timeoutId = setTimeout(() => {
    setCopied(false);
  }, 2000);

  // Cleanup on unmount (in useEffect)
  return () => clearTimeout(timeoutId);
};
```

**Why it happens:** React may unmount component before timeout completes.

**For this use case:** The simple version works fine; cleanup only needed if component unmounts frequently.

## Testing

### Manual Testing Checklist

Test the component thoroughly before using it elsewhere:

```markdown
- [ ] Click button → Icon changes to checkmark
- [ ] Checkmark is green color
- [ ] After 2 seconds → Icon resets to copy
- [ ] Paste clipboard → Contains correct text
- [ ] Hover button → Border glows cyan
- [ ] Tab to button → Focus ring visible
- [ ] Press Enter → Copies text
- [ ] Press Space → Copies text
- [ ] Multiple buttons → Work independently
- [ ] Different sizes → Render correctly
- [ ] Custom className → Applied properly
- [ ] Mobile (preview) → Works on touch
```

### Automated Testing (Optional)

For production apps, add unit tests:

```typescript
// components/shared/__tests__/copy-button.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CopyButton } from '../copy-button';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

describe('CopyButton', () => {
  it('copies text to clipboard on click', async () => {
    render(<CopyButton text="test text" />);

    const button = screen.getByRole('button', { name: /copy to clipboard/i });
    fireEvent.click(button);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text');
  });

  it('shows success state after copying', async () => {
    render(<CopyButton text="test text" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveAttribute('aria-label', 'Copied to clipboard');
    });
  });

  it('resets state after 2 seconds', async () => {
    jest.useFakeTimers();
    render(<CopyButton text="test text" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Fast-forward 2 seconds
    jest.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(button).toHaveAttribute('aria-label', 'Copy to clipboard');
    });

    jest.useRealTimers();
  });
});
```

**Why test this component:**
- Used throughout the site (many dependencies)
- Involves browser API (can fail in different environments)
- Has timing logic (setTimeout edge cases)

**When to skip tests:**
- Prototyping or early development
- Simple, rarely-changed components
- Time-constrained projects

## Enhancements (Optional)

### Add Success Toast

Show a notification instead of just changing the icon:

```typescript
import { toast } from "sonner"; // or your toast library

const handleCopy = async () => {
  await navigator.clipboard.writeText(text);
  toast.success("Copied to clipboard!");
};
```

### Add Fallback for Old Browsers

Support browsers without Clipboard API:

```typescript
const handleCopy = async () => {
  if (navigator.clipboard) {
    // Modern approach
    await navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }

  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
};
```

### Add Analytics Tracking

Track how often users copy commands:

```typescript
const handleCopy = async () => {
  await navigator.clipboard.writeText(text);

  // Track with analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'copy_command', {
      text: text.substring(0, 50), // First 50 chars only
    });
  }

  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
};
```

### Make Timeout Configurable

Allow custom reset duration:

```typescript
interface CopyButtonProps {
  text: string;
  className?: string;
  size?: "sm" | "default" | "lg";
  resetTimeout?: number; // milliseconds
}

export function CopyButton({
  text,
  className,
  size = "default",
  resetTimeout = 2000,
}: CopyButtonProps) {
  // ... rest of component

  setTimeout(() => {
    setCopied(false);
  }, resetTimeout);
}
```

## Next Steps

Now that you have a working `CopyButton` component:

1. **Continue to Tutorial 02:** [Code Block Component](./02-code-block.md)
   - Use this CopyButton in code blocks
   - Add syntax highlighting
   - Create terminal-styled containers

2. **Explore Lucide Icons:** [lucide.dev](https://lucide.dev)
   - Browse available icons
   - Learn icon prop patterns
   - Try different sizes and colors

3. **Learn More About Clipboard API:** [MDN Docs](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API)
   - Read/write clipboard
   - Handle permissions
   - Security considerations

## References

**Libraries Used:**
- [lucide-react](https://lucide.dev) - Icon library
- [clsx](https://github.com/lukeed/clsx) - Conditional classes
- [tailwind-merge](https://github.com/dcastil/tailwind-merge) - Merge Tailwind classes

**Web APIs:**
- [Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API)
- [Navigator.clipboard](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/clipboard)

**React Patterns:**
- [React useState Hook](https://react.dev/reference/react/useState)
- [React Event Handlers](https://react.dev/learn/responding-to-events)

**Accessibility:**
- [ARIA Labels](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-label)
- [Focus Visible](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible)

---

**Time to complete:** 20-30 minutes

**Difficulty:** Beginner-Intermediate

**Key Takeaways:**
- ✅ Client components use `"use client"` directive
- ✅ Clipboard API requires HTTPS or localhost
- ✅ Visual feedback improves UX (icon + color change)
- ✅ Accessibility includes keyboard support and ARIA labels
- ✅ TypeScript interfaces make components self-documenting

**Continue to:** [02-code-block.md](./02-code-block.md) →
