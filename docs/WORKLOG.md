# Worklog

## 2026-05-16 — Documentation restructure

**Decision:** Reorganize docs around the Diátaxis split (reference / explanation / decisions) and the post-pivot package layout. Cut everything that contradicted the April 2026 strategy, was a generic learning tutorial, or duplicated CLAUDE.md.

**Major changes:**

- **Deleted as pre-pivot:** `docs/MARKETING-POSITIONING.md` (sold $29 Promotion Builder etc.), all `packages/api/docs/ai/` (API-hosted AI features and monetization), `packages/cli/docs/tutorials/adding-standup-command.md`.
- **Deleted as generic tutorials, not facts about Papyrus:** `docs/monorepo/01–05` (used fake `@myapp/...` names), `docs/DEVELOPER_GUIDE.md`, `packages/api/docs/architecture.md` (started with "Tutorial 05"), `packages/cli/docs/01–10` numbered walkthroughs, `packages/api/docs/e2e-testing/`, `packages/api/docs/cors.md`, `middleware.md`, `tech_stack.md`, `ts.md`, `swagger.md`.
- **Deleted as meta-author guides:** `docs/TUTOR-PRINCIPLES.md`, `docs/DISCUSSION-PRINCIPLE.md`, `packages/web/docs/WEB-TUTOR-PRINCIPLES.md`.
- **Deleted as completed implementation milestones:** `packages/cli/docs/tui/` folder.
- **Moved:** `docs/monorepo/06,07` → `docs/architecture/{monorepo-structure,plugin-distribution}.md`; `docs/IDE_SETUP.md` → `docs/development/ide-setup.md`.
- **Created (missing CLAUDE.md):** `packages/core/`, `packages/plugin/`, `packages/web/`.
- **Created (missing READMEs):** root (was just ASCII art), `packages/core/`, `packages/plugin/`.
- **Trimmed:** `packages/cli/CLAUDE.md` (909 → ~140 lines), `packages/shared/CLAUDE.md` (560 → ~70 lines), `packages/api/CLAUDE.md` (marked AI scope as legacy throughout).

**Why:** Total markdown shrank from ~42k lines to ~6k; everything left should now be either (1) load-bearing for current development, (2) an explicit decision record, or (3) user-facing. The root CLAUDE.md was already accurate after the pivot — most of this work was bringing the rest of the docs in line with it.

**Trade-off:** Lost a lot of historical context (early discussion docs, monetization sketches, monorepo learning tutorials). Acceptable because: (1) git history retains them, (2) they were actively misleading for current work, (3) the strategy + architecture decisions docs capture the durable parts.

## 2026-05-13 — Dropped dual-repo plugin distribution strategy

**Decision:** Consolidate to a single public monorepo. All plugin development and distribution happens directly from `packages/plugin/` in `github.com/rewrlution/papyrus`.

**Previous approach:** Keep the monorepo private, mirror `packages/plugin/` to a separate public `papyrus-plugin` repo via CI, users install from the mirror.

**New approach:** Monorepo is public. Plugin installs directly from `packages/plugin/` using `git-subdir` in `.claude-plugin/marketplace.json`. No mirror repo needed. This eliminates the CI mirror workflow and simplifies the distribution story.

**Trade-off:** The entire monorepo is now public, including `api/` and `web/` source code (previously closed-source in the mirrored approach). Deemed acceptable because (1) deployment-only packages don't need source privacy, (2) eliminating a mirror repo reduces operational complexity.

**Implementation:**

- Monorepo made public on GitHub
- Added `.claude-plugin/marketplace.json` at repo root with `git-subdir` source pointing to `packages/plugin`
- Added `papyrus-hello` skill (zero dependencies, validates plugin works)
- Updated documentation to reflect single-repo distribution model
- Removed all references to `papyrus-plugin` mirror repo except this historical note
