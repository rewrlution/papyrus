# Papyrus API

## Overview

```bash
# development
pnpm dev

# production
pnpm build
pnpm start
```

## Architecture

This API follows a clean, layered architecture:

```
┌─────────────────────────────────────────────┐
│           HTTP Layer (Express)              │
│  ┌─────────────────────────────────────┐   │
│  │         Middleware                  │   │
│  │  (CORS, Auth, Validation, Logger)   │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│              Routes                         │
│   (Define endpoints & wire middleware)      │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│            Controllers                      │
│   (Handle HTTP requests/responses)          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│             Services                        │
│   (Business logic & orchestration)          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         Domain Layer                        │
│  ┌──────────────┐  ┌──────────────┐        │
│  │ Repositories │  │   Mappers    │        │
│  │ (Data access)│  │ (Transforms) │        │
│  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         Database (PostgreSQL)               │
│            via Prisma ORM                   │
└─────────────────────────────────────────────┘
```
