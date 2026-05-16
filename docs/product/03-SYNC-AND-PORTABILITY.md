# Sync, Backup, and Agent Portability

> How the MCP server solves two problems at once: monetization and cross-agent portability.

---

## The Two Problems

1. **Sync/Backup** — Journal files live on one machine. Laptop dies, journals are gone. Multi-device use is impossible without a cloud layer.
2. **Agent Portability** — Claude Code skills are Claude Code-specific. As more coding agents emerge (Codex CLI, Cursor, Aider, etc.), users shouldn't be locked into one agent to use Papyrus.

Both problems have the same solution: **an MCP server**.

---

## The Architecture

```
[Local markdown files]          ← always free, works with any agent that reads files
          ↓ optional upgrade
[Papyrus MCP Server]            ← paid, adds cloud sync + agent portability
          ↓ consumed by
[Skills / Agent prompts]        ← thin prompt layer, easy to port across agents
```

### Free Tier (Local Files)

Skills read directly from `~/.local/share/papyrus/journals/YYYYMMDD.md`. No server, no subscription, no infrastructure cost. Works today with Claude Code. Works with any agent that can read local files.

### Paid Tier (MCP Server)

User subscribes → journals sync to the cloud → MCP server exposes them as tools → skills use the MCP server instead of local files. The journal content is identical — only where it lives changes.

---

## The MCP Server

MCP (Model Context Protocol) is an open standard for exposing data and tools to AI agents. By wrapping our journal backend in an MCP interface, any MCP-compatible agent can access the user's journals.

### Tools the MCP server exposes

```typescript
// Read journals in a date range
read_journals(from: string, to: string): Journal[]

// Write a journal entry (used by /papyrus:journal skill)
write_journal(date: string, content: string): void

// Get the user's career profile (used by all skills)
get_profile(): UserProfile

// Full-text search across all journals
search_journals(query: string, limit?: number): Journal[]

// Get journal metadata without full content (fast overview)
list_journals(from: string, to: string): JournalMeta[]
```

### What users pay for

| Feature                 | Local (free)           | MCP Server (paid)   |
| ----------------------- | ---------------------- | ------------------- |
| Journal writing         | ✅ CLI or skill        | ✅ CLI or skill     |
| AI coaching skills      | ✅ Reads local files   | ✅ Reads from cloud |
| Cloud backup            | ❌                     | ✅                  |
| Multi-device sync       | ❌                     | ✅                  |
| Cross-agent portability | Limited (file reading) | ✅ Full MCP         |
| Server-side search      | ❌                     | ✅                  |

**Pricing:** ~$3-5/month. Infrastructure value, not AI value.

---

## Why This Is the Right Monetization Model

### Infrastructure vs. AI features

Users resist paying for AI features — they feel like they can get AI elsewhere. They understand and accept paying for backup and sync. This is a well-established SaaS pattern (Obsidian Sync, iCloud, Notion backup). The value proposition is clear: "Your journals are too important to lose."

### We already have most of this built

The existing Express.js API with PostgreSQL already handles journal CRUD and sync. Building the MCP server is primarily an interface layer on top of existing infrastructure — not a rebuild. The hard work (auth, encryption, sync conflict resolution) is already done.

### No conflict with the free tier

The free tier (local files + Claude Code skills) remains genuinely free. There is no AI feature gate. Users who don't need sync or multi-device never need to pay. Users who do pay are getting clear infrastructure value.

---

## Agent Portability

### Why Claude Code skills alone are not portable

Claude Code skills are specific to Claude Code's:

- CLAUDE.md loading mechanism
- Built-in tool names (Read, Write, Bash, Glob, Grep)
- Prompt format and conventions

A Codex CLI user, Cursor user, or Aider user cannot directly use a Claude Code skill file.

### Why the MCP server changes this

MCP is an open standard. As other coding agents adopt it, they can all connect to the same Papyrus MCP server. The skills themselves become thin prompt files — just instructions to the agent about what to ask the MCP server for.

```
Claude Code  ──┐
Cursor        ──┤──▶  Papyrus MCP Server  ──▶  User's journals (cloud)
Codex CLI     ──┤         (your server)
Future agents ──┘
```

Each agent has its own skill/command format, but they all call the same MCP tools. Porting a skill from Claude Code to another agent means rewriting the prompt wrapper — the MCP calls stay identical.

### Even without MCP: local files are inherently portable

The local journal format (`~/.local/share/papyrus/journals/YYYYMMDD.md`) is plain markdown. Any agent with file-reading capability can access it. Even without an MCP server, users can use Papyrus journals with any agent by pointing it at the right directory and providing a prompt. The MCP server just makes this more structured, reliable, and cloud-backed.

---

## Build Order

### Phase 1 (Now): Local files + Claude Code skills

Validate the journaling habit and career output quality. Zero infrastructure cost. Focus on making the skills excellent.

### Phase 2: MCP server

Wrap the existing Express API in an MCP interface. Charge for sync/backup. Unlock portability for early adopters who want multi-device access.

### Phase 3: Port skills to other agents

Once the MCP server exists, adapt skill prompt files for Codex CLI, Cursor, or whichever agents have meaningful user bases. The core logic doesn't change — just the wrapper format.

---

## Key Principle

> The journal file format is the universal interface. The MCP server is the cloud-backed, agent-agnostic version of that interface. Skills are thin wrappers that translate agent-specific formats into MCP calls.

Neither the CLI nor Claude Code nor any specific agent is the product. The **journals** are the product. Everything else is access infrastructure.

---

_Last updated: April 2026_
