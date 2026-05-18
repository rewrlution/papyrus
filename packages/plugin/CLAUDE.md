# `@rewrlution/papyrus-plugin` — Dev Guide

This package **is the shipped product**. Unlike the CLI / API / web which compile and deploy, the contents of this folder are what Claude Code clones from the marketplace and runs verbatim. There's no build step, no `dist/`, no transformation. What's here is what users get.

> Strategy and distribution context: [`docs/product/02-DISTRIBUTION-AND-ONBOARDING.md`](../../docs/product/02-DISTRIBUTION-AND-ONBOARDING.md) and [`docs/architecture/plugin-distribution.md`](../../docs/architecture/plugin-distribution.md).

## Shape

```
packages/plugin/
├── .claude-plugin/plugin.json    # plugin manifest (name, version, description)
├── package.json                  # depends on @rewrlution/papyrus-core
└── skills/
    ├── hello/SKILL.md            # install verification
    ├── setup/SKILL.md            # career profile setup
    ├── journal/SKILL.md          # guided daily journal
    └── standup/SKILL.md          # standup bullets from latest journal
```

The marketplace catalog (`.claude-plugin/marketplace.json`) lives at the **repo root**, not here — it uses `git-subdir` to point Claude Code at this folder.

Skill commands are auto-discovered as `/papyrus:<dir-name>` from `skills/<dir-name>/SKILL.md`.

## SKILL.md conventions

Every skill follows this shape. Match it when adding a new one.

**Frontmatter:**

```yaml
---
name: <skill-name>
description: <one-line description used by Claude Code for discovery>
disable-model-invocation: true # so it only fires on explicit /papyrus:<name>
allowed-tools: Bash(node *) Bash(npx *)
---
```

`disable-model-invocation: true` matters — without it, the model may autonomously invoke the skill mid-conversation, which is the wrong UX for a journaling tool. **Exception:** `hello` intentionally omits this so the model can discover and run it during install verification.

**Body structure** (numbered Steps work well):

1. Check prerequisites (does a profile exist? is there a journal entry today?).
2. Read relevant state via core CLI scripts.
3. Have the conversation.
4. Write via core CLI scripts.
5. Confirm and nudge.

## Calling core from skills

Always go through core CLI scripts — never use the `Read` / `Write` tools directly on journal files. Core normalizes paths, frontmatter, hashes, and timestamps.

```bash
# Read paths (rarely needed — core resolves OS paths itself)
node ${CLAUDE_PLUGIN_ROOT}/node_modules/@rewrlution/papyrus-core/dist/paths.js

# Journal
node ${CLAUDE_PLUGIN_ROOT}/node_modules/@rewrlution/papyrus-core/dist/journal.js list
node ${CLAUDE_PLUGIN_ROOT}/node_modules/@rewrlution/papyrus-core/dist/journal.js read 20260516
node ${CLAUDE_PLUGIN_ROOT}/node_modules/@rewrlution/papyrus-core/dist/journal.js write 20260516 '<content>'

# Profile
node ${CLAUDE_PLUGIN_ROOT}/node_modules/@rewrlution/papyrus-core/dist/profile.js exists
node ${CLAUDE_PLUGIN_ROOT}/node_modules/@rewrlution/papyrus-core/dist/profile.js read
node ${CLAUDE_PLUGIN_ROOT}/node_modules/@rewrlution/papyrus-core/dist/profile.js write '<json>'
```

`${CLAUDE_PLUGIN_ROOT}` is set by Claude Code when the skill runs. In dev (`claude --plugin-dir packages/plugin`) it points to this folder; in production it points to the installed plugin under `~/.claude/plugins/`.

## Local development

```bash
pnpm build --filter=@rewrlution/papyrus-core   # build core (workspace dependency)
claude --plugin-dir packages/plugin            # launch Claude Code with this plugin loaded
```

Then in the session: `/papyrus:hello` to verify, `/papyrus:setup` to create a profile, etc.

If a skill change isn't taking effect, kill and restart the Claude Code session — skills are loaded at startup.

## Adding a new skill

1. Create `skills/<name>/SKILL.md` with the frontmatter + body conventions above.
2. If it needs new filesystem operations, add them to `@rewrlution/papyrus-core` first (skills should not invent their own file handling).
3. Test with `claude --plugin-dir packages/plugin`.
4. Bump the plugin `version` in `.claude-plugin/plugin.json` and `package.json` if the change is user-visible.

## What this package does NOT do

- No TypeScript, no `tsconfig.json`, no build tools, no `src/`. SKILL.md files are the source.
- No tests in this package — skills are exercised through the live `claude` session and core has its own tests.
- No raw `fs` calls in skills — always go through core.
- No npm-side dependencies beyond `@rewrlution/papyrus-core`. Skills are prompts, not programs.

## Tone for skill prompts

Skills are read by Claude Code at runtime. Treat the SKILL.md body as a prompt aimed at another model, not as documentation aimed at a human. Conventions that have worked:

- Address the model in second person ("You are running a guided journal session…").
- Spell out **what to ask** and **what to skip** — don't trust defaults.
- Give level/goal-aware follow-up tables; let the model pick the row.
- Be explicit about output structure (e.g., "do not write empty headings; omit a section if there's no content").
- Show explicit examples of _good_ and _bad_ nudges/output. Models calibrate well from contrastive examples.
