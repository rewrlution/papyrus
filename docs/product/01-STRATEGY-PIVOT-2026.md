# Product Strategy Pivot — April 2026

> A summary of strategic decisions made after resuming the project. This document captures the "why" behind the new direction so future decisions stay coherent.

---

## Context

Papyrus was originally designed as a monetized SaaS product — a CLI journaling tool backed by a managed API with Anthropic-powered AI features and a freemium purchase model. After resuming the project in April 2026, we pivoted the strategy based on three observations:

1. Claude Code already exists as a capable agentic system. Building our own agentic infrastructure would duplicate what Anthropic has already solved.
2. The target audience (developers, especially at companies using Claude) is best reached through fame/community, not revenue extraction.
3. The most defensible moat is not the AI layer — it is the journaling habit + the prompt quality that turns journals into career documents.

---

## Why Journaling Still Matters

> Even as AI becomes more capable, the journal remains the irreplaceable input.

Raw activity data (GitHub PRs, Jira tickets, commits) tells you _what_ happened. It cannot tell you _why_ it mattered, how hard it was, or what the developer was thinking. That context lives exclusively in the developer's own words.

```
What the developer DID  (objective data — GitHub, Jira, etc.)
         +
What the developer FELT / THOUGHT  (journal = subjective context)
         =
Meaningful AI coaching that is grounded, accurate, and personal
```

Data connectors (GitHub integration, etc.) are valuable enrichment _on top of_ the journal — not a replacement for it. AI coaching built purely on activity logs produces generic output. AI coaching built on journals produces output that sounds like the developer actually wrote it.

**This is the product's core promise:** We don't need to track everything you do. We just need you to write a few sentences a day. The rest is AI.

---

## New Strategy: CLI + Claude Code Skills

### What we ship today

| Layer              | Artifact                                      | Responsibility                                                    |
| ------------------ | --------------------------------------------- | ----------------------------------------------------------------- |
| Journal Storage    | `~/.local/share/papyrus/journals/YYYYMMDD.md` | The stable interface. Everything reads from here.                 |
| CLI Tool           | `papyrus add / app / show / sync`             | The journaling habit engine. No AI commands needed here.          |
| Claude Code Skills | `/papyrus:standup`, `/papyrus:resume`, etc.   | The AI coaching layer. Reads journals, uses user's Anthropic key. |
| API (simplified)   | Auth + sync only                              | Multi-device journal backup. Remove AI endpoints.                 |

### What we removed from scope (for now)

- Managed API AI features (standup endpoint, SSE streaming, session management)
- Freemium purchase tiers (AiUsage, AiTrialUsage, AiPurchase tables)
- Rate limiting and usage tracking
- Payment integration

### Why Claude Code Skills?

Claude Code is already a full agentic system. When a user runs `/papyrus:resume`, Claude Code:

1. Loads our skill definition (our prompt)
2. Uses its own file-reading tools to access the user's local journals
3. Calls the Anthropic API with the user's own key (BYOK — Bring Your Own Key)
4. Streams the output back to the terminal

We get sophisticated agentic behavior for free. We focus on what we're uniquely good at: **prompt design** and **user experience around journaling**.

---

## Feature Roadmap (Unchanged in Priority, Changed in Execution)

The original feature priority is still correct. Only the execution layer changes (skills instead of API endpoints).

| Phase  | Feature           | Old execution           | New execution              |
| ------ | ----------------- | ----------------------- | -------------------------- |
| 1      | Standup Notes     | `POST /api/ai/standup`  | `/papyrus:standup` skill   |
| 2      | Promotion Doc     | Chat session via API    | `/papyrus:promote` skill   |
| 3      | Resume Bullets    | Chat session via API    | `/papyrus:resume` skill    |
| 4      | Interview Stories | Chat session via API    | `/papyrus:interview` skill |
| Future | Career Coach      | Ongoing agentic session | `/papyrus:coach` skill     |

---

## Developer Profile Segments (Future Consideration)

When thinking about enterprise growth, different developer profiles have different data access constraints:

| Profile          | Data access                                   | Strategy                                                             |
| ---------------- | --------------------------------------------- | -------------------------------------------------------------------- |
| Big Tech (FAANG) | Internal systems only, strict egress policies | Enterprise SDK: they write the connector, we provide the skill layer |
| Mid-size company | GitHub/GitLab + Slack/Linear via OAuth        | Build self-serve connectors on top of journal                        |
| Small startup    | GitHub easily accessible                      | GitHub connector is highest ROI first integration                    |
| Indie / OSS      | Everything on GitHub, motivated user          | Primary early adopter, source of fame                                |

**Key principle for now:** We are not building data connectors yet. The journal-only approach is the right starting point for a long time. When users have 6+ months of journal history, the AI output is already excellent without needing any external data.

---

## On Fame vs Revenue

The goal is to become the de facto journaling tool for developers who use Claude. This is achieved by:

1. **Indie devs love it** → they post on HN / Twitter → traction
2. **Open-source the skill prompts** → contributors improve them → community
3. **Companies adopt it internally** → case study → credibility

Revenue, if it comes, should come from:

- Hosted sync (the API, which we already have) — a small monthly fee for multi-device sync
- NOT from gating AI features (that would kill adoption)

---

## Architecture Flexibility Principle

The journal file format at `~/.local/share/papyrus/journals/YYYYMMDD.md` is the stable interface. All layers depend on it, not on each other.

This means:

- Skills can be shipped independently of the CLI
- The CLI can be improved without touching skills
- A future standalone agent (like Claude Code but for Papyrus) reads the same files
- An MCP server could expose journals as a tool for any MCP-compatible client
- Enterprise adapters write their data into the same format

**Today's execution is just one point on a flexible design.** We are not locked in.

---

## What Stays the Same

- The core journaling experience (CLI is the write interface)
- The feature priority (standup → promote → resume → interview)
- The target audience (developers)
- The core insight (journal = career currency)
- The XDG-compliant local storage format

## What Changed

- AI execution moves from API to Claude Code skills
- Monetization model removed from AI features
- Managed API stripped down to sync only
- BYOK instead of managed API keys
- Fame as primary success metric, not revenue

---

_Last updated: April 2026_
