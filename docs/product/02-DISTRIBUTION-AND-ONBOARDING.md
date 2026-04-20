# Distribution and Onboarding

> How users discover, install, and get started with Papyrus. The entry point is a Claude Code plugin, not the CLI.

---

## The Core Insight

The original Papyrus assumed the CLI was the entry point. Users would install it via npm, run `papyrus add`, and separately configure AI features. This creates too much friction.

The new entry point is a **Claude Code plugin**. Installation is a single command. The first meaningful experience happens within a Claude Code conversation. The CLI becomes optional.

---

## Distribution

### How It Works

Skills are bundled inside a **plugin** — a single GitHub repo that users install with one command:

```bash
/plugin install papyrus
```

Or, if distributed via GitHub before marketplace listing:

```bash
/plugin marketplace add your-username/papyrus-plugin
/plugin install papyrus@your-username/papyrus-plugin
```

No npm install. No account creation. No configuration file to hand-edit.

### Plugin Structure

```
papyrus-plugin/
├── skills/
│   ├── papyrus-setup/
│   │   └── SKILL.md        ← run once, collects career profile
│   ├── papyrus-journal/
│   │   └── SKILL.md        ← daily guided journal entry
│   ├── papyrus-standup/
│   │   └── SKILL.md        ← generates standup from yesterday's journal
│   ├── papyrus-resume/
│   │   └── SKILL.md        ← generates resume bullets from date range
│   ├── papyrus-promote/
│   │   └── SKILL.md        ← generates promotion document
│   ├── papyrus-interview/
│   │   └── SKILL.md        ← generates STAR interview stories
│   └── papyrus-coach/
│       └── SKILL.md        ← open-ended career Q&A
└── marketplace.json
```

### Distribution Scopes

| Scope              | How                                  | Use case                                               |
| ------------------ | ------------------------------------ | ------------------------------------------------------ |
| Public marketplace | `/plugin install papyrus`            | Individual developers who find it on HN, Twitter, etc. |
| GitHub direct      | `/plugin marketplace add owner/repo` | Early adopters before marketplace listing              |
| Project-level      | Commit `.claude/skills/` to repo     | Team or company sharing via version control            |
| Enterprise         | Managed Claude Code settings         | DevEx team deploys company-wide, zero individual setup |

The **enterprise path** is the highest-leverage distribution channel. One DevEx team adoption = hundreds of users with no individual friction.

---

## Onboarding Flow

### Step 1: Install the plugin

```bash
/plugin install papyrus
```

### Step 2: Run setup (once)

```
User: /papyrus-setup

Claude: Welcome to Papyrus — a journaling system that turns your daily
        notes into career documents (resume bullets, promotion docs,
        interview stories).

        Let me ask you a few questions to personalize your experience.
        This takes about 2 minutes and only happens once.

        What's your current role?
        > Senior Software Engineer

        What level / band are you at? (e.g. L5, Senior, IC4 — or skip)
        > L5

        What are you working toward right now?
        1. Getting promoted
        2. Finding a new job
        3. Growing my skills
        4. Something else

        > 1

        What's your target level?
        > Staff Engineer / L6

        What kind of company do you work at?
        1. Big tech (FAANG / large enterprise)
        2. Mid-size tech company
        3. Startup
        4. I'm a freelancer / indie dev

        > 1

        What's your primary technical focus?
        > Backend / distributed systems

        ✓ Profile saved to ~/.local/share/papyrus/profile.md

        You're all set. Run /papyrus-journal to write your first entry.
        After a few weeks of entries, /papyrus-standup and the career
        features will be available.
```

The profile file shapes every subsequent skill. Standup notes for a junior and a staff engineer targeting L7 look completely different. Promotion doc structure changes by company type. Resume tone changes by career goal.

### Step 3: Write the first journal entry

```
User: /papyrus-journal

Claude: Let's capture today. What did you work on?
        > Fixed a gnarly auth bug and started the API redesign discussion

        What was the auth bug? Any interesting root cause?
        > Tokens weren't being invalidated on logout — missing Redis DEL call in the signout handler

        How did the API redesign discussion go?
        > Good progress but the PM keeps changing scope mid-sprint. Bit frustrated.

        Any wins or things you're proud of today?
        > Got the fix deployed to prod with zero downtime. Pair programmed with Alice on the redesign.

        Anything blocking you or weighing on you?
        > Need to get alignment on the scope before we start building

        ✓ Saved to ~/.local/share/papyrus/journals/2026-04-09.md

        Great start. After 7 days of entries you can run /papyrus-standup.
        After 30 days the career features unlock their full potential.
```

This guided interview format is dramatically better than a blank editor. It makes journaling feel like a conversation, not a task. Users who struggle with "what do I write?" suddenly have no problem.

### Step 4: Daily use

```bash
# Every morning
/papyrus-standup       # "What did I do yesterday?"

# Every evening (or whenever)
/papyrus-journal       # Capture today
```

### Step 5: Career events (months later)

```bash
# Job search
/papyrus-resume --from 2025-10-01

# Performance review
/papyrus-promote --from 2026-01-01

# Interview prep
/papyrus-interview --situation "technical leadership"
```

---

## Why the CLI Is Still Useful (But Optional)

The CLI (`papyrus` npm package) is not the entry point, but it adds real value for users who want it:

| CLI feature        | Value                                                               |
| ------------------ | ------------------------------------------------------------------- |
| `papyrus app`      | TUI browser — scroll through past entries with vim-style navigation |
| `papyrus show`     | Read a specific entry in a pager                                    |
| `papyrus sync`     | Sync to cloud (if subscribed to MCP server tier)                    |
| Offline journaling | Write journal entries without Claude Code open                      |

The CLI and skills write to the same files. A user can mix both freely. But the CLI is never required — the plugin alone is a complete product.

---

## The Journal File as the Stable Interface

Both the plugin skills and the CLI write to the same location:

```
~/.local/share/papyrus/
├── profile.md                    ← written by /papyrus-setup
├── journals/
│   ├── 2026-04-09.md             ← written by /papyrus-journal OR papyrus add
│   ├── 2026-04-08.md
│   └── ...
└── outputs/
    ├── resume-2026-04.md         ← generated by /papyrus-resume
    └── promotion-2026-Q1.md      ← generated by /papyrus-promote
```

This format is the contract. Skills, CLI, and future agents (Codex, Cursor, etc.) all depend on this format — not on each other.

---

## Discovery Path by User Type

### Individual developer (most common)

```
HN / Twitter post → GitHub repo → README → /plugin install papyrus → /papyrus-setup
```

### Team adoption

```
One developer uses it → shares with team → team lead adds to .claude/skills/ in repo → whole team has it
```

### Company-wide (enterprise)

```
DevEx team discovers it → adds to managed Claude Code config → all engineers get it automatically
```

### Power user

```
Any of the above → also installs CLI for TUI browser + offline journaling
```

---

## Progress Messaging

Users need to understand that the career features get better over time. Skills should show progress nudges:

```
# After /papyrus-journal on day 1
✓ Entry 1 saved. Career features unlock progressively as your history grows.

# After /papyrus-standup with 1 week of entries
✓ Standup generated from 6 entries.
  Tip: /papyrus-resume works best with 3+ months of history.

# After 3 months
✓ You have 87 journal entries. All career features are fully available.
```

This sets expectations and gives users a reason to keep journaling even before career features are relevant.

---

_Last updated: April 2026_
