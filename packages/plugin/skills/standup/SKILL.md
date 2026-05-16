---
name: standup
description: Generates standup bullets from your most recent journal entry. Run this before your daily standup. Asks one question (today's focus), then produces yesterday / today / blockers.
disable-model-invocation: true
allowed-tools: Bash(node *) Bash(npx *)
---

# /papyrus:standup — Daily Standup Generator

Generate standup bullets from the user's journal. This should feel instant — one question, then done.

## Step 1: Check profile and find the right journal entry

Run both in parallel:

```bash
node ${CLAUDE_PLUGIN_ROOT}/node_modules/@rewrlution/papyrus-core/dist/profile.js exists
```

```bash
node ${CLAUDE_PLUGIN_ROOT}/node_modules/@rewrlution/papyrus-core/dist/journal.js list
```

**If profile doesn't exist:**

> "Run /papyrus:setup first — standup needs your career profile to generate useful output."

Stop here.

The list returns entries sorted newest first. Take the most recent one and read it:

```bash
node ${CLAUDE_PLUGIN_ROOT}/node_modules/@rewrlution/papyrus-core/dist/journal.js read <date>
```

If the most recent entry is from yesterday — use it silently.

If it's older than yesterday — tell the user which date you're pulling from:

> "No entry for yesterday — pulling from [date] instead."

**If no journal entries exist at all:**

> "No journal entries found. Run /papyrus:journal at the end of your workday, then come back here."

Stop here.

## Step 2: Read the profile

```bash
node ${CLAUDE_PLUGIN_ROOT}/node_modules/@rewrlution/papyrus-core/dist/profile.js read
```

Use `level` and `domain` to calibrate bullet depth and technical language. Do not change the output structure based on level — just the depth of each bullet.

## Step 3: Ask one question

> "What's your focus today?"

Wait for the answer. This is the only question. Do not ask about blockers — infer them from the journal.

## Step 4: Generate the standup

Produce three sections. Keep it tight — this is for a standup, not a report.

**Yesterday** — 2–3 bullets synthesized from the journal entry. Each bullet is one sentence. Use specific details from the journal (names, systems, outcomes). Do not pad or generalize.

**Today** — 1–2 bullets from the user's answer to step 3. Rephrase into clean standup language if needed, but don't add things they didn't mention.

**Blockers** — infer from the journal only. If nothing looks blocked, omit this section entirely. Do not ask about blockers and do not add a blank "Blockers: none" line.

**Format:**

```
**Yesterday**
- [bullet]
- [bullet]

**Today**
- [bullet]

**Blockers**
- [bullet — only if something is genuinely blocked]
```

## Step 5: Offer a light edit pass

After showing the output:

> "Want to change anything?"

If yes — adjust and show again. If no, or they don't respond — you're done. Do not re-ask after one round of edits.

## What this skill does not do

- Does not compensate for a thin journal entry. If the entry is sparse, the standup will be sparse. That's a journaling problem, not a standup problem.
- Does not add filler like "Blockers: none" or "No blockers today."
- Does not ask more than one question.
- Does not produce a summary paragraph — bullets only.
