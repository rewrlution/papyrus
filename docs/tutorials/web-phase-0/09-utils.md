# Phase 0.9: Utility Functions

Create the `cn()` utility function for class name merging and prepare the utils library.

## What We're Building

**Goal:** Create a utility function that intelligently merges Tailwind CSS class names, handling conflicts and conditional classes. This is essential for shadcn/ui components.

**Why:** Tailwind classes can conflict (e.g., `bg-red-500 bg-blue-500` - which wins?). The `cn()` function merges classes intelligently, resolves conflicts, and makes component APIs cleaner.

**What you'll learn:**
- Why class name merging is necessary
- How `clsx` and `tailwind-merge` work together
- How to create type-safe utilities
- Best practices for utility organization

---

## Prerequisites

- Completed [08-first-page.md](./08-first-page.md)
- Home page displays correctly
- Basic understanding of TypeScript

---

## Understanding Class Name Merging

### The Problem

**Scenario:** You have a Button component with default styles:

```typescript
function Button({ className }: { className?: string }) {
  return (
    <button className={`bg-blue-500 text-white px-4 py-2 ${className}`}>
      Click me
    </button>
  );
}
```

**Usage:**
```typescript
<Button className="bg-red-500" />
```

**Result:**
```html
<button class="bg-blue-500 text-white px-4 py-2 bg-red-500">
  Click me
</button>
```

**What color is it?**
- Both `bg-blue-500` and `bg-red-500` are in the class list
- CSS specificity is the same
- **Last one in the CSS wins** (depends on Tailwind's generation order)
- **This is unpredictable!**

### The Solution: tailwind-merge

`tailwind-merge` intelligently merges Tailwind classes:

```typescript
import { twMerge } from 'tailwind-merge';

const merged = twMerge('bg-blue-500 text-white', 'bg-red-500');
// Result: 'text-white bg-red-500'
//           └─ blue background removed, red wins
```

**How it works:**
1. Parses Tailwind class names
2. Identifies conflicts (same property)
3. Keeps the last value (rightmost wins)
4. Removes duplicates

**Examples:**
```typescript
twMerge('px-2 py-1', 'p-4')
// → 'p-4'  (p-4 overrides px-2 py-1)

twMerge('text-sm', 'text-lg')
// → 'text-lg'  (text-lg overrides text-sm)

twMerge('hover:bg-blue-500', 'hover:bg-red-500')
// → 'hover:bg-red-500'  (works with modifiers too)
```

### Adding Conditional Classes: clsx

`clsx` handles conditional class names:

```typescript
import clsx from 'clsx';

clsx('base', condition && 'conditional', { active: isActive })
```

**Examples:**
```typescript
clsx('btn', isLoading && 'opacity-50')
// When isLoading=true → 'btn opacity-50'
// When isLoading=false → 'btn'

clsx('card', {
  'border-red-500': hasError,
  'border-green-500': isSuccess,
})
// Adds border-red-500 if hasError is true
// Adds border-green-500 if isSuccess is true
```

### Combining Both: cn()

The `cn()` function combines `clsx` (conditionals) + `twMerge` (conflict resolution):

```typescript
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**How it works:**
```typescript
cn('bg-blue-500', condition && 'bg-red-500', { 'text-lg': large })
  ↓
clsx(...) // Process conditionals
  ↓
'bg-blue-500 bg-red-500 text-lg'  (if condition=true, large=true)
  ↓
twMerge(...) // Resolve conflicts
  ↓
'bg-red-500 text-lg'  (blue background removed)
```

---

## Implementation

### Step 1: Install Dependencies

Navigate to the web package:

```bash
cd packages/web
```

Install required packages:

```bash
pnpm add clsx tailwind-merge
pnpm add -D @types/node
```

**Packages:**
- `clsx` - Conditional class names (tiny: 1KB)
- `tailwind-merge` - Merge Tailwind classes (small: 8KB)
- `@types/node` - TypeScript types for Node.js (used by clsx types)

---

### Step 2: Create Utils Directory

Create the lib directory:

```bash
mkdir -p lib
cd lib
```

---

### Step 3: Create the cn() Utility

Create `utils.ts`:

```bash
touch utils.ts
```

Add the following code:

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names intelligently
 *
 * Combines clsx (conditional classes) with tailwind-merge (conflict resolution)
 *
 * @param inputs - Class names, objects, arrays, or conditionals
 * @returns Merged class name string
 *
 * @example
 * ```typescript
 * cn('text-sm', 'text-lg')
 * // → 'text-lg'  (text-lg overrides text-sm)
 *
 * cn('bg-red-500', isActive && 'bg-blue-500')
 * // → 'bg-blue-500'  (if isActive is true)
 * // → 'bg-red-500'   (if isActive is false)
 *
 * cn('px-4 py-2', { 'opacity-50': isLoading })
 * // → 'px-4 py-2 opacity-50'  (if isLoading is true)
 * // → 'px-4 py-2'             (if isLoading is false)
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

**File location:** `/home/user/papyrus/packages/web/lib/utils.ts`

---

## Understanding the cn() Function

### Type Signature

```typescript
function cn(...inputs: ClassValue[]): string
```

**`...inputs`:**
- Rest parameter (accepts any number of arguments)
- Each argument is a `ClassValue` type

**`ClassValue` type:**
From `clsx` package:
```typescript
type ClassValue =
  | string
  | number
  | null
  | undefined
  | ClassDictionary
  | ClassArray;
```

**Accepts:**
- Strings: `'bg-red-500'`
- Numbers: `123` (converted to string)
- Null/undefined: Ignored
- Objects: `{ 'active': isActive }`
- Arrays: `['base', condition && 'conditional']`
- Nested: `['base', { active: true }, ['more']]`

**Returns:**
String with merged class names.

### Function Flow

```typescript
cn('bg-blue-500', isActive && 'bg-red-500', { 'text-lg': large })
```

**Step 1: clsx processes inputs**
```
Input:  ['bg-blue-500', true && 'bg-red-500', { 'text-lg': true }]
        ↓
clsx:   Evaluates conditionals
        ↓
Output: 'bg-blue-500 bg-red-500 text-lg'
```

**Step 2: twMerge resolves conflicts**
```
Input:  'bg-blue-500 bg-red-500 text-lg'
        ↓
twMerge: Identifies 'bg-*' conflict
        ↓
Output: 'bg-red-500 text-lg'  (last bg-* wins)
```

### JSDoc Documentation

```typescript
/**
 * Merge class names intelligently
 *
 * @param inputs - Class names, objects, arrays, or conditionals
 * @returns Merged class name string
 *
 * @example
 * ```typescript
 * cn('text-sm', 'text-lg')
 * // → 'text-lg'
 * ```
 */
```

**Why JSDoc:**
- ✅ Shows in IDE tooltips (hover over `cn()` to see docs)
- ✅ Better autocomplete
- ✅ Documents examples inline
- ✅ No extra docs needed

**Result in VS Code:**
```
cn(inputs: ClassValue[]): string

Merge class names intelligently

Examples:
  cn('text-sm', 'text-lg')
  → 'text-lg'
```

---

## Usage Examples

### Basic Merging

```typescript
import { cn } from '@/lib/utils';

// Override default styles
const className = cn('bg-blue-500 text-white', 'bg-red-500');
// → 'text-white bg-red-500'

// Combine multiple classes
const className = cn('flex items-center', 'gap-4 px-4');
// → 'flex items-center gap-4 px-4'
```

### Conditional Classes

```typescript
// Boolean conditions
const buttonClass = cn(
  'px-4 py-2 rounded',
  isLoading && 'opacity-50 cursor-not-allowed'
);

// Object syntax
const cardClass = cn('card', {
  'border-red-500': hasError,
  'border-green-500': isSuccess,
  'opacity-50': isLoading,
});

// Ternary operators
const textClass = cn(
  'text-base',
  large ? 'text-lg' : 'text-sm'
);
```

### Component Props

```typescript
interface ButtonProps {
  className?: string;
  variant?: 'primary' | 'secondary';
}

function Button({ className, variant = 'primary' }: ButtonProps) {
  return (
    <button
      className={cn(
        // Base styles (always applied)
        'px-4 py-2 rounded font-medium transition-colors',

        // Variant styles (conditional)
        variant === 'primary' && 'bg-brand-primary text-primary-foreground',
        variant === 'secondary' && 'bg-brand-secondary text-secondary-foreground',

        // Custom overrides (from props)
        className
      )}
    >
      Click me
    </button>
  );
}

// Usage
<Button className="text-lg" />
// Classes: px-4 py-2 rounded font-medium transition-colors bg-brand-primary text-primary-foreground text-lg

<Button variant="secondary" className="bg-red-500" />
// Classes: px-4 py-2 rounded font-medium transition-colors bg-red-500 text-secondary-foreground
//          └─ bg-red-500 overrides bg-brand-secondary
```

### Array Syntax

```typescript
const classes = cn([
  'base-class',
  condition && 'conditional-class',
  {
    active: isActive,
    disabled: isDisabled,
  },
]);
```

### Nested Usage

```typescript
const containerClass = cn(
  'container',
  cn('flex items-center', 'gap-4'),  // Can nest cn() calls
  className
);
```

---

## Testing the Utility

### Step 1: Create a Test Component

Create a test page to verify `cn()` works:

```bash
cd ../app
mkdir test
touch test/page.tsx
```

Add test code:

```typescript
import { cn } from '@/lib/utils';

export default function TestPage() {
  const isActive = true;
  const hasError = false;

  return (
    <div className="p-8 bg-background text-foreground">
      <h1 className="text-2xl font-bold mb-8">cn() Utility Tests</h1>

      {/* Test 1: Basic merge */}
      <div className={cn('bg-blue-500', 'bg-red-500', 'p-4', 'text-white')}>
        Test 1: Should be red background (not blue)
      </div>

      {/* Test 2: Conditional */}
      <div
        className={cn(
          'mt-4 p-4',
          isActive && 'bg-green-500',
          hasError && 'bg-red-500'
        )}
      >
        Test 2: Should be green (isActive=true, hasError=false)
      </div>

      {/* Test 3: Object syntax */}
      <div
        className={cn('mt-4 p-4', {
          'bg-yellow-500': !hasError,
          'text-black': true,
        })}
      >
        Test 3: Should be yellow with black text
      </div>

      {/* Test 4: Override */}
      <div
        className={cn(
          'mt-4 p-4 text-sm bg-gray-500',
          'text-lg bg-purple-500'  // Should override text-sm and bg-gray-500
        )}
      >
        Test 4: Should be large text on purple background
      </div>
    </div>
  );
}
```

### Step 2: Test in Browser

Navigate to:
```
http://localhost:3000/test
```

**Expected results:**
1. ✅ Red background (not blue)
2. ✅ Green background (conditional works)
3. ✅ Yellow background with black text (object syntax works)
4. ✅ Large text on purple background (override works)

**If any test fails:** Check console for errors, verify imports.

### Step 3: Clean Up

Remove test page:
```bash
rm -rf app/test
```

---

## Common Issues

### Issue 1: "Cannot find module '@/lib/utils'"

**Cause:** Path alias not configured or TypeScript cache.

**Solution:**
1. Verify `tsconfig.json` has path aliases:
```json
{
  "compilerOptions": {
    "paths": {
      "@/lib/*": ["./lib/*"]
    }
  }
}
```

2. Restart dev server
3. Restart TypeScript server in editor

### Issue 2: "Module 'clsx' has no exported member 'ClassValue'"

**Cause:** Wrong import or missing types.

**Solution:**
```typescript
// Correct
import { type ClassValue, clsx } from 'clsx';

// Wrong
import { ClassValue } from 'clsx';  // Missing 'type' keyword
```

### Issue 3: Classes not merging correctly

**Cause:** Not using Tailwind classes or custom CSS classes.

**Solution:**
`tailwind-merge` only works with Tailwind classes:

```typescript
// Works (Tailwind classes)
cn('bg-red-500', 'bg-blue-500')  // → 'bg-blue-500'

// Doesn't work (custom classes)
cn('my-red-bg', 'my-blue-bg')    // → 'my-red-bg my-blue-bg' (both kept)
```

### Issue 4: TypeScript error on ClassValue

**Cause:** Missing `@types/node`.

**Solution:**
```bash
pnpm add -D @types/node
```

---

## Best Practices

### 1. Always Use cn() for Component Class Props

```typescript
// Good
function Card({ className }: { className?: string }) {
  return <div className={cn('card', className)} />;
}

// Bad (classes can conflict)
function Card({ className }: { className?: string }) {
  return <div className={`card ${className}`} />;
}
```

### 2. Order Classes by Specificity

```typescript
cn(
  'base classes',              // 1. Base styles
  variant === 'x' && 'variant',  // 2. Variants
  state && 'state',            // 3. State
  className                    // 4. Overrides (last)
)
```

**Why:** Later classes override earlier ones.

### 3. Use Consistent Naming

```typescript
// Good - clear, semantic
const buttonClass = cn(...)
const containerClass = cn(...)

// Avoid - vague
const classes = cn(...)
const styles = cn(...)
```

### 4. Extract Complex Logic

```typescript
// Good - separate function
function getButtonClasses(variant: string, size: string) {
  return cn(
    'base-button',
    variant === 'primary' && 'btn-primary',
    variant === 'secondary' && 'btn-secondary',
    size === 'sm' && 'btn-sm',
    size === 'lg' && 'btn-lg'
  );
}

function Button({ variant, size, className }) {
  return <button className={cn(getButtonClasses(variant, size), className)} />;
}
```

### 5. Document Complex Conditionals

```typescript
const className = cn(
  'base',
  // Show loading state only when not disabled
  isLoading && !isDisabled && 'opacity-50',
  // Error state overrides success
  hasError ? 'border-red-500' : isSuccess && 'border-green-500'
);
```

---

## Next Steps

The `cn()` utility is ready! Next tutorial:

**→ [10-shadcn-init.md](./10-shadcn-init.md)** - Initialize shadcn/ui components

**What's next:**
- Install shadcn/ui CLI
- Configure component defaults
- Install first components (Button, Card)

---

## Summary

**What we built:**
- `cn()` utility function for class merging
- Type-safe implementation with JSDoc
- Test page to verify functionality

**Key concepts:**
- `clsx` handles conditional classes
- `tailwind-merge` resolves Tailwind conflicts
- `cn()` combines both for maximum flexibility

**Function signature:**
```typescript
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

**Usage patterns:**
```typescript
// Basic
cn('class1', 'class2')

// Conditional
cn('base', condition && 'conditional')

// Object
cn('base', { active: isActive })

// Component
<div className={cn('defaults', className)} />
```

**Remember:**
- Always use `cn()` for component className props
- Order matters (last class wins)
- Only works with Tailwind classes
- Import with `@/lib/utils`

---

## References

- [clsx Documentation](https://github.com/lukeed/clsx)
- [tailwind-merge Documentation](https://github.com/dcastil/tailwind-merge)
- [Tailwind CSS Class Conflicts](https://tailwindcss.com/docs/adding-custom-styles#handling-class-name-conflicts)
- [shadcn/ui Utils](https://ui.shadcn.com/docs/installation/manual#add-a-cn-helper)
