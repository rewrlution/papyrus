---
name: setup
description: Onboard a new Papyrus user by collecting their career profile. Run this first — all other Papyrus skills depend on it. Also use this when the user wants to update their profile.
disable-model-invocation: true
allowed-tools: Bash(node *) Bash(npx *)
---

# /papyrus:setup — Career Profile Setup

You are setting up (or updating) the user's Papyrus career profile. This profile personalizes every other Papyrus skill: journal follow-up depth, resume framing, coaching tone, and promotion coaching emphasis.

## Step 1: Check for an existing profile

Run this first:

```bash
node ${CLAUDE_PLUGIN_ROOT}/node_modules/@rewrlution/papyrus-core/dist/profile.js exists
```

- If `{"exists": true}` — read the current profile and tell the user their current settings before asking if they want to update.
- If `{"exists": false}` — greet them and explain what you're about to do:

> "I'll ask you 5 quick questions to set up your Papyrus profile. This takes about 2 minutes and personalizes everything else — your daily journal, standup generator, and career coaching."

## Step 2: Ask the 6 profile questions

Ask these one at a time, conversationally. Do not present all 6 at once. Wait for each answer before asking the next.

### Question 1: Level

> "What's your current level? (junior / mid / senior / staff)"

Valid values: `junior`, `mid`, `senior`, `staff`

If the user is unsure, give a rough anchor:

- junior = 0–2 years, learning fundamentals
- mid = 2–5 years, works independently on well-scoped problems
- senior = 5+ years, owns technical decisions, some cross-team influence
- staff = beyond senior, multiplies others, sets technical direction

### Question 2: Goal

> "What's your main focus right now?"
>
> - `promotion` — I'm working toward a promotion
> - `job_search` — I'm preparing to interview or switch jobs
> - `growth` — I want to grow and get better at my craft
> - `unsure` — I'm not sure yet

Valid values: `promotion`, `job_search`, `growth`, `unsure`

### Question 3: Time at current level

> "How long have you been at your current level?"
>
> - under_1 — Less than a year
> - one_to_two — 1–2 years
> - over_2 — More than 2 years

Valid values: `under_1`, `one_to_two`, `over_2`

### Question 4: Company type

> "What kind of company are you at?"
>
> - big_tech — Large tech company (FAANG, major tech corp)
> - mid_size — Mid-size company (Series B–D, 200–2000 people)
> - startup — Early-stage startup (under 200 people)
> - freelance — Freelance or independent contractor

Valid values: `big_tech`, `mid_size`, `startup`, `freelance`

### Question 5: Domain

> "What's your primary domain?"
>
> - backend
> - frontend
> - infra (infrastructure, platform, DevOps, SRE)
> - ml (machine learning, data science, AI)
> - fullstack

Valid values: `backend`, `frontend`, `infra`, `ml`, `fullstack`

### Question 6: Staff archetype (only if level is "staff")

Only ask this if the user said `staff` for question 1. Skip it otherwise (save as `null`).

> "Staff engineers tend to fall into a few archetypes. Which fits you best?"
>
> - tech_lead — Accountable for a team's technical execution and delivery
> - architect — Sets technical direction across systems or org-wide
> - solver — Parachutes into hard problems no one else can crack
> - right_hand — Amplifies a senior leader's impact (CTO/VP close partner)

Valid values: `tech_lead`, `architect`, `solver`, `right_hand`

If the user is unsure or doesn't fit neatly, pick the closest one with them.

## Step 3: Save the profile

Once you have all answers, confirm them before saving:

> "Here's what I have:
>
> - Level: senior
> - Goal: promotion
> - Time at level: over 2 years
> - Company: big_tech
> - Domain: backend
>
> Does that look right? I'll save it now."

When confirmed, run:

```bash
node ${CLAUDE_PLUGIN_ROOT}/node_modules/@rewrlution/papyrus-core/dist/profile.js write '<JSON>'
```

Where `<JSON>` is a single-quoted JSON object with these fields:

```json
{
  "level": "senior",
  "goal": "promotion",
  "years_at_level": "over_2",
  "company_type": "big_tech",
  "domain": "backend",
  "staff_archetype": null
}
```

`staff_archetype` is `null` for non-staff levels.

## Step 4: Confirm and point to next step

After saving:

> "✓ Profile saved."

Then give one targeted nudge based on their goal:

- `promotion` → "Your journal entries are your evidence for promotion. Run `/papyrus:journal` at the end of each day — ownership and multiplier signals are what promotion committees look for most."
- `job_search` → "The fastest way to build strong resume bullets is consistent journaling. Run `/papyrus:journal` after meaningful work days — even 2 entries a week gives the AI enough to generate strong STAR stories."
- `growth` → "Journaling what you learned and who you helped builds a picture of your growth over time. Try `/papyrus:journal` after any day where you learned something new or helped a teammate."
- `unsure` → "You're set up. Run `/papyrus:journal` at the end of any day worth remembering. After a few weeks, `/papyrus:coach` can help you figure out what to focus on."

## Handling edge cases

**User already has a profile:**
Show their current values. Ask: "Want to update any of these?" Only ask about the fields they want to change, not all 6 again.

**User skips a question:**
Ask once more. If they still skip, use a sensible default:

- level → `mid`
- goal → `unsure`
- years_at_level → `one_to_two`
- company_type → `mid_size`
- domain → `fullstack`
- staff_archetype → `null`

**User gives an invalid answer:**
Gently correct and re-ask: "I need one of these options: [list]. Which fits best?"
