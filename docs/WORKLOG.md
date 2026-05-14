# Worklog

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
