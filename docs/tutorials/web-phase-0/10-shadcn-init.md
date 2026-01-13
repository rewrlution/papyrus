# Phase 0.10: shadcn/ui Setup

Initialize shadcn/ui and install foundational components for the marketing site.

## What We're Building

**Goal:** Set up shadcn/ui component library and install essential components (Button, Card) that we'll use throughout the marketing site.

**Why:** shadcn/ui provides beautifully designed, accessible components that you copy into your project (not an npm package). This gives you full control while maintaining consistency and best practices.

**What you'll learn:**
- How shadcn/ui differs from traditional component libraries
- How to configure shadcn/ui for your design system
- How to add and customize components
- Why "copy-paste" components are powerful

---

## Prerequisites

- Completed [09-utils.md](./09-utils.md)
- `lib/utils.ts` exists with `cn()` function
- Understanding of React components

---

## Understanding shadcn/ui

### What is shadcn/ui?

**shadcn/ui is NOT a package you install via npm.**

Instead, it's a **collection of reusable components** you copy into your project.

**Traditional approach (npm package):**
```bash
npm install @company/ui-library

# Components live in node_modules
import { Button } from '@company/ui-library';
```

**Pros:** Easy updates (npm update)
**Cons:** Limited customization, bundle bloat, dependency on maintainer

**shadcn/ui approach:**
```bash
npx shadcn@latest add button

# Components copied to your project
import { Button } from '@/components/ui/button';
```

**Pros:** Full control, easy customization, no runtime dependency
**Cons:** Manual updates (but you own the code)

### Why Copy-Paste Components?

**Traditional component library problems:**
1. **Customization limits:** Can't change internals without hacks
2. **Bundle size:** Include entire library even if using one component
3. **Breaking changes:** Library updates can break your app
4. **Dependency risk:** Library maintenance ends, you're stuck

**shadcn/ui solves this:**
1. ✅ **Full control:** It's your code, modify however you want
2. ✅ **No bloat:** Only includes components you actually use
3. ✅ **No breaking changes:** You control updates
4. ✅ **Future-proof:** Code lives in your repo, not external dependency

**Philosophy:**
> "Copy the code, make it yours"

### How shadcn/ui Works

**Architecture:**
```
shadcn/ui Registry (GitHub)
        ↓
   CLI downloads
        ↓
components/ui/button.tsx  (in YOUR project)
        ↓
   You customize
        ↓
   Commit to git
```

**Example workflow:**
```bash
# 1. Add button component
npx shadcn@latest add button

# 2. File created: components/ui/button.tsx
# 3. Customize it however you want
# 4. Commit to your repo
git add components/ui/button.tsx
git commit -m "Add button component"
```

### What Makes shadcn/ui Special

**Built on:**
- **Radix UI** - Unstyled, accessible primitives
- **Tailwind CSS** - Utility-first styling
- **Class Variance Authority (CVA)** - Variant management

**Example Button component structure:**
```typescript
// Uses Radix for accessibility
import * as ButtonPrimitive from '@radix-ui/react-button';

// Uses CVA for variants
const buttonVariants = cva('base-styles', {
  variants: {
    variant: { primary: '...', secondary: '...' },
    size: { sm: '...', lg: '...' },
  },
});

// Combines with cn() for customization
export function Button({ variant, size, className }) {
  return (
    <ButtonPrimitive.Root
      className={cn(buttonVariants({ variant, size }), className)}
    />
  );
}
```

**Result:**
- ✅ Accessible (keyboard nav, ARIA labels, focus management)
- ✅ Customizable (Tailwind classes)
- ✅ Type-safe (TypeScript)
- ✅ Variants (different styles)
- ✅ Flexible (override with className)

---

## Implementation

### Step 1: Install shadcn/ui CLI

The CLI helps initialize and add components.

**No installation needed!** Use `npx` to run it:

```bash
cd packages/web
npx shadcn@latest init
```

**What this does:**
- Detects Next.js configuration
- Asks setup questions
- Creates `components.json` config
- Sets up component directory

---

### Step 2: Answer Configuration Prompts

The CLI will ask several questions. Here are the recommended answers:

**Prompt 1: TypeScript**
```
Would you like to use TypeScript? (recommended)
❯ yes
  no
```

**Answer:** `yes`

**Why:** TypeScript provides type safety and better autocomplete.

---

**Prompt 2: Style**
```
Which style would you like to use?
❯ New York
  Default
```

**Answer:** `New York`

**Why:** New York style is more modern and refined (better for marketing sites).

**Differences:**
- **Default:** Slightly rounded, softer shadows
- **New York:** Sharp corners, bold contrast (matches our terminal aesthetic)

---

**Prompt 3: Base Color**
```
Which color would you like to use as base color?
  Slate
  Gray
  Zinc
❯ Neutral
  Stone
```

**Answer:** `Neutral`

**Why:** Neutral works well with our custom terminal colors. We'll override it anyway.

---

**Prompt 4: CSS Variables**
```
Would you like to use CSS variables for colors?
❯ yes
  no
```

**Answer:** `yes`

**Why:** We're already using CSS variables in `globals.css`. This keeps everything consistent.

---

**Prompt 5: Tailwind Config Location**
```
Where is your tailwind.config.ts located?
❯ tailwind.config.ts
```

**Answer:** Press Enter (accept default)

**Why:** Our config is at the default location.

---

**Prompt 6: CSS File Location**
```
Where is your global CSS file?
❯ app/globals.css
```

**Answer:** Press Enter (accept default)

**Why:** Our global styles are in `app/globals.css`.

---

**Prompt 7: Import Alias**
```
Configure the import alias for components?
❯ @/components
```

**Answer:** Press Enter (accept default)

**Why:** Matches our TypeScript path aliases.

---

**Prompt 8: React Server Components**
```
Are you using React Server Components?
❯ yes
  no
```

**Answer:** `yes`

**Why:** Next.js 15 uses Server Components by default.

---

**CLI Output:**
```
✓ Writing components.json
✓ Checking registry
✓ Updating tailwind.config.ts
✓ Updating app/globals.css

Success! Project configured.
```

---

### Step 3: Verify Configuration

Check that `components.json` was created:

```bash
cat components.json
```

**Expected content:**
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

**What this file does:**
- Tells shadcn CLI where to put components
- Configures import aliases
- Sets style preferences
- Used when running `shadcn add <component>`

**File location:** `/home/user/papyrus/packages/web/components.json`

---

### Step 4: Install Core Components

Add the Button component:

```bash
npx shadcn@latest add button
```

**CLI Output:**
```
✓ Checking registry
✓ Installing dependencies
✓ Writing components/ui/button.tsx

Component installed successfully!
```

**What was installed:**
1. **Dependency:** `@radix-ui/react-slot` (if needed)
2. **Component:** `components/ui/button.tsx`
3. **Updated:** Package dependencies

---

Add the Card component:

```bash
npx shadcn@latest add card
```

**CLI Output:**
```
✓ Checking registry
✓ Writing components/ui/card.tsx

Component installed successfully!
```

---

### Step 5: Install Additional Components

Add a few more components we'll use later:

```bash
# Badge for tags/labels
npx shadcn@latest add badge

# Separator for dividing sections
npx shadcn@latest add separator
```

**Installed components:**
```
components/ui/
├── button.tsx      # Buttons with variants
├── card.tsx        # Cards with header/content/footer
├── badge.tsx       # Small labels/tags
└── separator.tsx   # Horizontal/vertical lines
```

---

## Understanding the Components

### Button Component

**File:** `components/ui/button.tsx`

**Key features:**
```typescript
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">🔍</Button>
```

**Customization:**
```typescript
<Button className="bg-terminal-cyan hover:bg-terminal-cyan/90">
  Custom Color
</Button>
```

### Card Component

**File:** `components/ui/card.tsx`

**Structure:**
```typescript
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Main content goes here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

**Customization:**
```typescript
<Card className="border-terminal-cyan">
  Custom border color
</Card>
```

---

## Testing the Components

### Step 1: Create a Test Page

Create `app/components-test/page.tsx`:

```bash
mkdir -p app/components-test
touch app/components-test/page.tsx
```

Add test code:

```typescript
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function ComponentsTestPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-foreground">
          Component Tests
        </h1>

        <Separator />

        {/* Button Variants */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
        </section>

        <Separator />

        {/* Button Sizes */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Button Sizes</h2>
          <div className="flex items-center gap-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
          </div>
        </section>

        <Separator />

        {/* Cards */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>
                  This is a description of the card content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Card content goes here. You can put any content.</p>
              </CardContent>
              <CardFooter>
                <Button>Action</Button>
              </CardFooter>
            </Card>

            <Card className="border-terminal-cyan">
              <CardHeader>
                <CardTitle className="text-terminal-cyan">
                  Custom Styled Card
                </CardTitle>
                <CardDescription>
                  This card has custom colors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-terminal-green">
                  Content with custom colors
                </p>
              </CardContent>
              <CardFooter>
                <Button className="bg-terminal-cyan hover:bg-terminal-cyan/90">
                  Custom Button
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        <Separator />

        {/* Badges */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Badges</h2>
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge className="bg-terminal-green text-terminal-black">
              Custom
            </Badge>
          </div>
        </section>
      </div>
    </div>
  );
}
```

### Step 2: Test in Browser

Navigate to:
```
http://localhost:3000/components-test
```

**What you should see:**
1. ✅ All button variants render correctly
2. ✅ Different button sizes work
3. ✅ Cards display with proper structure
4. ✅ Custom styled card has cyan border
5. ✅ Badges render in different variants
6. ✅ Separators divide sections
7. ✅ No console errors

**Interaction tests:**
- Hover over buttons (color changes)
- Click buttons (ripple effect on some)
- Responsive layout (resize window)

### Step 3: Clean Up

Remove test page:
```bash
rm -rf app/components-test
```

---

## Customizing Components

### Updating Button Variants

Edit `components/ui/button.tsx`:

```typescript
// Add custom variant
const buttonVariants = cva(
  // ... base classes
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        // ... other variants
        terminal: "bg-terminal-cyan text-terminal-black hover:bg-terminal-cyan/90",
      },
      // ... size variants
    },
  }
);

// Use it
<Button variant="terminal">Terminal Style</Button>
```

### Updating Default Colors

Edit `components/ui/card.tsx`:

```typescript
// Change default border color
<div
  className={cn(
    "rounded-lg border border-terminal-gray bg-card text-card-foreground shadow-sm",
    className
  )}
  {...props}
/>
```

**Why customize:**
- Match your brand
- Add new variants
- Change defaults
- Remove unused variants

**Best practice:** Keep customizations minimal at first. Add as needed.

---

## Common Issues

### Issue 1: "Cannot find module '@/components/ui/button'"

**Cause:** Component not installed or import path wrong.

**Solution:**
```bash
# Install the component
npx shadcn@latest add button

# Verify file exists
ls components/ui/button.tsx
```

### Issue 2: "Slot is not a valid React component"

**Cause:** Missing `@radix-ui/react-slot` dependency.

**Solution:**
```bash
pnpm add @radix-ui/react-slot
```

**Why:** Some components use Radix Slot for composition.

### Issue 3: Components look unstyled

**Cause:** CSS variables not defined or globals.css not updated.

**Solution:**
1. Check that `shadcn init` updated `globals.css`
2. Restart dev server
3. Clear browser cache

### Issue 4: TypeScript errors in components

**Cause:** Missing type definitions.

**Solution:**
```bash
pnpm add -D @types/react @types/react-dom
```

### Issue 5: "Failed to fetch registry"

**Cause:** Network issue or shadcn registry down.

**Solution:**
1. Check internet connection
2. Try again later
3. Use VPN if blocked in your region

---

## shadcn/ui Best Practices

### 1. Install Components as Needed

```bash
# Good - install when you need it
npx shadcn@latest add dialog

# Avoid - installing everything upfront
npx shadcn@latest add dialog alert sheet tabs ...
```

**Why:** Keeps codebase lean. Only add what you use.

### 2. Customize After Installation

```typescript
// Good - customize the component file
// components/ui/button.tsx
const buttonVariants = cva(/* custom variants */);

// Avoid - wrapping in another component
// components/custom-button.tsx
export function CustomButton(props) {
  return <Button {...props} />;
}
```

**Why:** Direct customization is simpler and more maintainable.

### 3. Use Composition

```typescript
// Good - compose components
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>

// Avoid - props for everything
<Card title="Title" content="Content" />
```

**Why:** More flexible, easier to customize specific parts.

### 4. Keep Components folder organized

```
components/
├── ui/              # shadcn components (don't modify structure)
│   ├── button.tsx
│   ├── card.tsx
│   └── ...
├── sections/        # Your custom sections
│   ├── hero.tsx
│   └── features.tsx
└── shared/          # Your shared components
    └── logo.tsx
```

---

## Next Steps

shadcn/ui is configured! Next tutorial:

**→ [11-deployment.md](./11-deployment.md)** - Build and deploy to Vercel

**What's next:**
- Build for production
- Test static export
- Deploy to Vercel
- Set up auto-deployment

---

## Summary

**What we built:**
- shadcn/ui configuration
- Button component with variants
- Card component with composition
- Badge and Separator components

**Key concepts:**
- shadcn/ui copies components to your project (not an npm package)
- Full control over component code
- Built on Radix UI (accessibility) + Tailwind (styling)
- Use `cn()` for customization

**CLI commands:**
```bash
# Initialize
npx shadcn@latest init

# Add components
npx shadcn@latest add button
npx shadcn@latest add card
```

**Component usage:**
```typescript
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

<Button variant="default" size="lg">Click me</Button>

<Card>
  <CardContent>Content</CardContent>
</Card>
```

**Remember:**
- Components live in your repo (full control)
- Customize by editing the component files
- Use composition over props
- Add components as needed (not all at once)

---

## References

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [shadcn/ui Components](https://ui.shadcn.com/docs/components/button)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Class Variance Authority](https://cva.style/docs)
