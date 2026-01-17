# Promotion Document Builder - Functional Requirements

> Generate comprehensive promotion packet from journal history via interactive chat

## Feature Overview

**Command:** `papyrus ai promote [options]`
**Pattern:** Interactive chat (multi-turn conversation)
**Frequency:** 1-2x per year
**Priority:** Phase 2

---

## User Stories

### As a mid-level engineer preparing for promotion...

- I want to generate a promotion packet from my journal history
- So that I can clearly articulate my impact and readiness for the next level

### As someone who forgets their achievements...

- I want AI to find and highlight my biggest wins from journals
- So that I don't undersell myself in my self-review

### As a developer with incomplete data...

- I want to be prompted for missing metrics and context
- So that my promotion doc has concrete impact numbers

---

## Functional Requirements

### FR-1: Start Promotion Session

**Command:** `papyrus ai promote --from YYYY-MM-DD [--to YYYY-MM-DD]`

**Input:**

- `--from`: Start date (required)
- `--to`: End date (optional, defaults to today)
- Auth token from config

**Process:**

1. Load journals from date range
2. Create AI session in database
3. Send initial analysis request to API
4. API analyzes journals and identifies key achievements
5. API asks clarifying questions
6. User answers questions interactively
7. AI generates draft document
8. User reviews and refines
9. Save final document

**Output:** Multi-section promotion document (see FR-7)

**Success Criteria:**

- Session completed in <15 minutes
- User feels document accurately represents their work
- Document is ready to submit with minimal edits

---

### FR-2: Initial Analysis & Question Phase

**Flow:**

```
$ papyrus ai promote --from 2024-01-01

Analyzing your journals from Jan 1 - Dec 31, 2024...
Found 234 journal entries covering 12 months.

Key achievements detected:
1. Led microservices migration (mentioned 23 times)
2. Mentored 2 junior engineers (Alice, Bob)
3. Reduced API latency by 40% (mentioned 8 times)
4. Incident response during Black Friday (3 incidents)
5. Led design reviews (estimated 50+ reviews)

Before I generate your promotion document, I need to clarify a few details:

Q1: How large was your team during the microservices migration?
>
```

**User provides answers interactively via terminal input**

**Success Criteria:**

- AI identifies 5-10 key achievements
- Questions focus on missing metrics, team size, business impact
- Questions are specific and contextual
- User can skip questions (AI makes reasonable assumptions)

---

### FR-3: Streaming AI Response

**Behavior:** Real-time streaming of AI responses via SSE

**Visual Feedback:**

```
💭 Analyzing 234 journal entries...

Key achievements detected:
...

Q1: How large was your team during the microservices migration?
> 5 engineers

💭 Generating promotion document...

═══════════════════════════════════════════
EXECUTIVE SUMMARY
═══════════════════════════════════════════
[Text streams here in real-time as AI generates...]

═══════════════════════════════════════════
KEY ACHIEVEMENTS
═══════════════════════════════════════════
[Text streams here...]
```

**Success Criteria:**

- User sees progress in real-time
- Streaming feels responsive (<200ms between chunks)
- Sections clearly delineated

---

### FR-4: Draft Review & Refinement

**After draft is generated:**

```
[Draft displayed]

What would you like to do?
  1. Edit a specific section
  2. Add more details to a section
  3. Regenerate with different tone
  4. Save and exit

>
```

**If user selects "Edit a specific section":**

```
Which section?
  1. Executive Summary
  2. Key Achievements
  3. Technical Contributions
  4. Leadership & Mentorship
  5. Business Impact
  6. Growth Areas

> 2

Current content:
─────────────────────────────────────────
[Shows current Key Achievements section]
─────────────────────────────────────────

What changes would you like? (describe in natural language)
> Add more detail about the cost savings from latency reduction

💭 Regenerating Key Achievements section...

[Updated section streams here]

Satisfied with changes? (y/n)
> y

What would you like to do?
  1. Edit another section
  2. Add more details to a section
  3. Regenerate with different tone
  4. Save and exit

> 4

Saving promotion document...
Saved to: ~/Documents/papyrus-promotion-2024.md

Done! 🎉
```

**Success Criteria:**

- User can iteratively refine any section
- Changes are applied quickly (<5 seconds)
- User can save at any point

---

### FR-5: Document Structure

**Output Format:** Markdown document with these sections

```markdown
# Promotion Packet: [Name] - [Current Level] → [Target Level]

**Period:** Jan 1, 2024 - Dec 31, 2024

---

## Executive Summary

[2-3 paragraph overview of readiness for promotion]

---

## Key Achievements

### 1. Led Microservices Migration

- Led team of 5 engineers through 6-month migration
- Migrated 12 services from monolith to microservices
- Zero downtime during migration
- Reduced deployment time from 2 hours to 15 minutes

### 2. Performance Optimization

- Reduced API latency by 40% through query optimization
- Improved user retention by 15%
- Saved $50K/year in infrastructure costs

[3-5 more achievements...]

---

## Technical Contributions

### Architecture & Design

- Designed microservices architecture for 12 services
- Led 50+ design reviews for Q3-Q4 projects
- Introduced API gateway pattern, adopted team-wide

### Code Quality & Impact

- Contributed 234 commits, 123 PRs merged
- Reviewed 200+ PRs, mentored team on best practices
- Refactored critical path reducing tech debt by 30%

---

## Leadership & Mentorship

### Team Leadership

- Mentored 2 junior engineers (Alice, Bob)
- Led incident response for Black Friday (3 incidents, zero downtime)
- Facilitated weekly team retrospectives

### Cross-Team Collaboration

- Collaborated with Design, Product, and Data teams
- Led cross-functional initiative for new feature launch
- Presented architecture decisions to senior leadership

---

## Business Impact

### Quantifiable Results

- $50K annual cost savings from performance improvements
- 15% improvement in user retention
- 40% reduction in API latency
- Zero downtime during major migration

### Strategic Contributions

- Enabled team to ship features 4x faster post-migration
- Improved developer productivity (deployment time 2hrs → 15min)
- Set foundation for future scalability

---

## Growth & Development

### Skills Acquired

- Microservices architecture at scale
- Team leadership and mentorship
- Cross-functional collaboration
- Incident management and on-call leadership

### Areas for Continued Growth

- System design at larger scale (100M+ users)
- Engineering management fundamentals
- Public speaking and external presence

---

## Conclusion

[Summary of why ready for promotion to next level]

---

Generated with Papyrus AI • [Date]
```

**Success Criteria:**

- Document is 3-5 pages
- Includes quantifiable metrics where available
- Balances technical depth with business impact
- Honest about growth areas

---

### FR-6: Purchase Validation

**Free Tier:** 1 free trial (first time user runs command)

**Paid:** $29 for Promotion Builder

- 3 full document generations
- Valid for 90 days
- Can refine/regenerate within session unlimited

**When limit reached:**

```
You've used your free trial of Promotion Builder.

Purchase Promotion Builder to continue:
  $29 - 3 promotion documents, valid 90 days

  papyrus purchase promotion-builder

Or continue with manual editing.
```

**Success Criteria:**

- Free trial allows full experience
- Clear pricing and purchase path
- Purchase tracked and validated

---

### FR-7: Session Persistence

**Behavior:** Sessions saved to database, can resume

**Resume Command:**

```bash
# List active sessions
papyrus ai promote --list

Active promotion sessions:
  1. 2024 Promotion (Jan 1 - Dec 31, 2024) - Draft complete
  2. 2023 Promotion (Jan 1 - Dec 31, 2023) - In progress

# Resume session
papyrus ai promote --resume 1
```

**Success Criteria:**

- Sessions persist across CLI restarts
- User can resume from any point
- Sessions expire after 30 days

---

### FR-8: Output Options

**Flags:**

- `--output <file>` - Custom save location
- `--format <format>` - Output format (markdown, pdf, docx)
- `--tone <tone>` - Writing tone (formal, conversational, technical)

**Examples:**

```bash
# Custom output location
papyrus ai promote --from 2024-01-01 --output ~/Desktop/promotion.md

# Formal tone
papyrus ai promote --from 2024-01-01 --tone formal

# PDF output (requires pandoc)
papyrus ai promote --from 2024-01-01 --format pdf
```

---

## API Contract

### Endpoint: `POST /ai/promote/start`

**Request:**

```json
{
  "from": "2024-01-01",
  "to": "2024-12-31"
}
```

**Response:**

```json
{
  "session_id": "promo-abc123",
  "journals_count": 234,
  "date_range": {
    "from": "2024-01-01",
    "to": "2024-12-31"
  }
}
```

---

### Endpoint: `POST /ai/promote/chat/:sessionId`

**Request:**

```json
{
  "message": "5 engineers"
}
```

**Response:** SSE stream with events:

```
event: thinking
data: {"message":"Analyzing your response..."}

event: question
data: {"question":"What was the business impact of the 40% latency reduction?"}

event: content
data: {"text":"Led team of 5..."}

event: draft
data: {"section":"executive_summary","content":"..."}

event: done
data: {"session_id":"promo-abc123"}
```

---

## CLI Flow

```
User runs: papyrus ai promote --from 2024-01-01
  ↓
CLI checks: Is user logged in?
  ├─ No → Show login prompt
  └─ Yes → Continue
  ↓
CLI sends POST /ai/promote/start
  ↓
API creates session, loads journals
  ↓
API analyzes journals, identifies achievements
  ↓
API returns session_id + initial questions
  ↓
CLI displays achievements and first question
  ↓
[Interactive Q&A loop via SSE]
  User enters answer
    ↓
  CLI sends POST /ai/promote/chat/:sessionId
    ↓
  API streams response (question or draft)
    ↓
  CLI displays streamed content
    ↓
  Repeat until draft complete
  ↓
CLI shows draft + refinement menu
  ↓
[Refinement loop]
  User selects action (edit/add/regenerate/save)
    ↓
  CLI sends follow-up message
    ↓
  API regenerates section
    ↓
  CLI displays updated section
    ↓
  Repeat until user saves
  ↓
CLI saves document to file
  ↓
Done!
```

---

## Edge Cases

### EC-1: Insufficient Journal Data

**Scenario:** User has <30 days of journals

**Behavior:** Show warning, ask if they want to continue

```
Warning: Only 15 journal entries found (recommended: 90+).

Promotion documents work best with 3+ months of journals.

Continue anyway? (y/n)
```

---

### EC-2: Session Timeout

**Scenario:** User abandons session mid-way

**Behavior:** Auto-save progress, allow resume for 30 days

---

### EC-3: AI Generates Hallucinations

**Scenario:** AI invents achievements not in journals

**Behavior:** User can edit/delete any section

---

### EC-4: User Skips All Questions

**Scenario:** User doesn't answer any clarifying questions

**Behavior:** AI generates document with best-effort assumptions, marks uncertain sections

---

## Non-Functional Requirements

### Performance

- Initial analysis: <10 seconds
- Question response: <3 seconds
- Draft generation: <30 seconds
- Section regeneration: <10 seconds

### Quality

- 90%+ of generated content is factually accurate
- Tone is professional and confident
- Metrics are pulled directly from journals (no hallucinations)

### Usability

- Clear progress indicators
- Easy to correct AI mistakes
- Intuitive refinement flow

---

## Success Metrics

- % of users who complete full document
- Average session time
- % of users who purchase after free trial
- User satisfaction rating

---

## Open Questions

See [AI-ARCHITECTURE-SUMMARY.md](../AI-ARCHITECTURE-SUMMARY.md) for:

- Session state management details
- Multi-turn conversation context strategy
- Output storage (local vs cloud)
