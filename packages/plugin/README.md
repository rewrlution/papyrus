# Papyrus — Claude Code plugin

> Turn the journal you already write into resume bullets, promotion docs, standup notes, and interview stories.

## Install

In any Claude Code session:

```
/plugin marketplace add rewrlution/papyrus
/plugin install papyrus@rewrlution
```

Then run setup once:

```
/papyrus:setup
```

Setup collects a short career profile (level, goal, domain, company type). This shapes every other skill — junior vs. staff get different follow-up questions; promotion-targeted users get pressed harder on ownership; etc.

> **Status (May 2026):** `/papyrus:hello` works end-to-end via the marketplace today. `setup`, `journal`, and `standup` depend on `@rewrlution/papyrus-core`, which isn't on npm yet, so those skills will fail at first invocation until that publish lands. Watch the repo for the release.

## What you get

| Skill              | What it does                                      | When to run                           |
| ------------------ | ------------------------------------------------- | ------------------------------------- |
| `/papyrus:setup`   | Collects/updates your career profile              | Once, then whenever your role changes |
| `/papyrus:journal` | Guided daily journal entry (5 anchored questions) | End of workday                        |
| `/papyrus:standup` | Generates standup bullets from your latest entry  | Before daily standup                  |
| `/papyrus:hello`   | Verifies the plugin is installed                  | Anytime                               |

More skills (`resume`, `promote`, `interview`, `coach`) are on the roadmap.

## Where your data lives

```
~/.local/share/papyrus/journals/YYYYMMDD.md     # journal entries (one per day)
~/.config/papyrus/profile.md                    # career profile (set by /papyrus:setup)
```

Paths follow the XDG Base Directory spec on Linux and the OS conventions on macOS / Windows.

Everything is plain markdown on disk. You can read it with `cat`, edit it in your editor, back it up however you like, or use the optional `@rewrlution/papyrus-cli` for a TUI browser. The plugin and the CLI write to the same files.

## Privacy and keys

Skills run in **your** Claude Code session and use **your** Anthropic key. No Papyrus server is in the loop. Journals never leave your machine unless you separately opt into the (forthcoming) sync service.

## Source and feedback

The plugin source — including the skill prompts — is at [github.com/rewrlution/papyrus](https://github.com/rewrlution/papyrus) (this monorepo, `packages/plugin/`). Issues and PRs welcome.

## License

MIT.
