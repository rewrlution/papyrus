# `@rewrlution/papyrus-web` — Dev Guide

Marketing site for Papyrus. Next.js + Tailwind, deployed to Vercel. Not a published package — exists only as a deployed artifact.

> Per the [strategy pivot](../../docs/product/01-STRATEGY-PIVOT-2026.md), the plugin (not the web) is the primary entry point. This site is brand + discovery, not a product surface. Don't add user-account features or AI features here.

## Stack

- Next.js 15 (App Router, static export)
- Tailwind CSS v4
- shadcn/ui components
- Geist Sans + JetBrains Mono
- Deployed: Vercel

## Develop

```bash
pnpm dev --filter=@rewrlution/papyrus-web
```

## Deploy

Pushes to `main` deploy automatically via Vercel. Custom domain setup is documented in [`docs/CUSTOM-DOMAIN-SETUP.md`](./docs/CUSTOM-DOMAIN-SETUP.md); deployment specifics in [`docs/deployment.md`](./docs/deployment.md).

## What's in scope

- Hero / features / pricing / FAQ — straightforward marketing surface
- Primary CTA: install the Claude Code plugin (`/plugin marketplace add rewrlution/papyrus`)
- Secondary CTA: install the CLI (`npm i -g @rewrlution/papyrus-cli`)

## What's out of scope

- User auth, journal editing, AI features — those live in the plugin / CLI, not the web
- Per-user dashboards — there's no Papyrus account today; sync is a future feature
- Pricing tied to AI features (e.g. "$29 promotion doc") — explicitly killed in the pivot
