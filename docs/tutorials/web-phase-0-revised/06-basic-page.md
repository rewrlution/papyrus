# 06: Basic Page

Create a simple home page to verify setup works.

## Goal

Build minimal home page with plain HTML - no styling.

## Create app/page.tsx

Create `packages/web/app/page.tsx`:

```typescript
export default function Home() {
  return (
    <main>
      <h1>PAPYRUS</h1>
      <p>AI-Powered Journaling for Developers</p>
      <p>Journal like you code. Right in your terminal.</p>
      <code>npm install -g @rewrlution/papyrus-cli</code>
    </main>
  );
}
```

## Code Explanation

### Default Export
```typescript
export default function Home()
```
Next.js App Router requires default export for page components.

**File name matters:**
- `page.tsx` = becomes a route
- In `app/` directory = `/` route (home page)

### Plain HTML
```typescript
<main>
  <h1>PAPYRUS</h1>
  ...
</main>
```
Just semantic HTML. No className, no styling.

**Why so simple:**
- Verifies Next.js setup works
- Proves TypeScript compiles
- Shows content without distractions
- Style it in Phase 1

## What We're NOT Including

### ❌ Tailwind Classes
```typescript
<main className="flex min-h-screen items-center justify-center">
```
**Why skip:** No Tailwind installed yet.

### ❌ Complex Components
**Why skip:** No components built yet. Keep it simple.

### ❌ Images/Icons
**Why skip:** No assets yet. Just text.

## Verify Syntax

```bash
# Check TypeScript accepts the file
npx tsc --noEmit
```

Should compile without errors.

## What We Have Now

```
packages/web/
├── app/
│   ├── layout.tsx  ✅ Root layout with metadata
│   └── page.tsx    ✅ Home page with content
├── package.json    ✅ Dependencies defined
├── tsconfig.json   ✅ TypeScript configured
└── next.config.js  ✅ Next.js configured
```

**Ready to test!**

## Next

→ [07: Test Locally](./07-test-locally.md) - Install dependencies and run dev server
