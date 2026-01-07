# Resume Bullet Generator - Functional Requirements

> Generate polished resume bullets from journal entries via interactive chat

## Feature Overview

**Command:** `papyrus ai resume [options]`
**Pattern:** Interactive chat (multi-turn conversation)
**Frequency:** 2-3x per year (job search)
**Priority:** Phase 3

---

## User Stories

### As a job seeker...

- I want to generate resume bullets from my journal history
- So that I can quickly update my resume with recent achievements

### As someone bad at self-promotion...

- I want AI to identify impactful work and write compelling bullets
- So that my resume stands out without bragging

### As a developer with scattered notes...

- I want AI to find patterns and quantify impact across journals
- So that I have concrete numbers for my resume

---

## Functional Requirements

### FR-1: Generate Resume Bullets

**Command:** `papyrus ai resume --from YYYY-MM-DD [--to YYYY-MM-DD] [--focus <area>]`

**Input:**

- `--from`: Start date (required)
- `--to`: End date (optional, defaults to today)
- `--focus`: Focus area (optional, e.g., "backend", "leadership", "frontend")

**Process:**

1. Load journals from date range
2. Create AI session
3. AI analyzes journals and identifies achievements
4. AI asks for missing metrics/context
5. User provides clarifications
6. AI generates 5-10 resume bullets
7. User reviews and refines
8. Save bullets to file

**Output:** 5-10 polished resume bullets

**Success Criteria:**

- Bullets follow resume best practices (action verb, metric, impact)
- Each bullet is 1-2 lines
- Quantified impact where possible
- Ready to copy-paste into resume

---

### FR-2: Interactive Clarification

**Flow:**

```
$ papyrus ai resume --from 2024-01-01 --focus backend

Analyzing your backend work from Jan 1 - Dec 31, 2024...
Found 156 relevant journal entries.

Key achievements detected:
1. API performance optimization (40% improvement)
2. Microservices migration (12 services)
3. Database query optimization
4. CI/CD pipeline improvements
5. On-call incident response

I need a few details to write compelling resume bullets:

Q1: The 40% API latency improvement - what was the user-facing impact?
> Reduced page load time from 2s to 1.2s, improved user retention by 15%

Q2: How many engineers did you lead during the microservices migration?
> Led team of 5 engineers

Q3: What was the business value of the CI/CD improvements?
> Reduced deployment time from 2 hours to 15 minutes, enabled 4x faster shipping

💭 Generating resume bullets...

[Bullets stream here]
```

**Success Criteria:**

- Questions are specific and contextual
- User can skip questions (AI makes assumptions)
- Questions focus on metrics and impact

---

### FR-3: Resume Bullet Format

**Output Format:**

```markdown
# Resume Bullets - Backend Engineer (2024)

Generated from journals: Jan 1 - Dec 31, 2024

---

• Architected and led migration of 12 services from monolith to microservices, managing team of 5 engineers through 6-month project with zero downtime

• Optimized API performance reducing latency by 40%, improving page load time from 2s to 1.2s and increasing user retention by 15%

• Redesigned CI/CD pipeline reducing deployment time from 2 hours to 15 minutes, enabling team to ship features 4x faster

• Implemented database query optimizations saving $50K annually in infrastructure costs while improving query performance by 60%

• Led incident response for 12 production issues achieving 99.9% uptime, documented postmortems and implemented preventive measures reducing future incidents by 40%

• Mentored 2 junior engineers through code reviews and pair programming, improving team code quality metrics by 30%

• Collaborated cross-functionally with Product, Design, and Data teams to ship 8 major features impacting 2M+ users

---

Generated with Papyrus AI • [Date]
```

**Best Practices Applied:**

- ✅ Starts with strong action verb
- ✅ Includes quantifiable metrics
- ✅ Shows business/user impact
- ✅ Demonstrates scope (team size, timeline)
- ✅ 1-2 lines per bullet
- ✅ Tailored to focus area

---

### FR-4: Focus Area Filtering

**Supported Focus Areas:**

- `backend` - Backend development, APIs, databases
- `frontend` - Frontend development, UI/UX
- `fullstack` - Full-stack work
- `leadership` - Team leadership, mentorship
- `architecture` - System design, architecture decisions
- `devops` - Infrastructure, CI/CD, deployment
- `data` - Data engineering, analytics

**Example:**

```bash
# Backend-focused resume
papyrus ai resume --from 2024-01-01 --focus backend

# Leadership-focused resume (for management roles)
papyrus ai resume --from 2024-01-01 --focus leadership
```

**Behavior:** AI prioritizes achievements matching focus area

**Success Criteria:**

- Bullets reflect chosen focus area
- Irrelevant work is filtered out
- Still includes cross-functional collaboration if significant

---

### FR-5: Refinement Options

**After bullets are generated:**

```
[Bullets displayed]

What would you like to do?
  1. Regenerate with different focus
  2. Add more bullets
  3. Edit a specific bullet
  4. Remove a bullet
  5. Change tone (more/less technical)
  6. Save and exit

>
```

**If user selects "Edit a specific bullet":**

```
Which bullet?
  1. Architected and led migration...
  2. Optimized API performance...
  [etc.]

> 2

Current:
  • Optimized API performance reducing latency by 40%, improving page
    load time from 2s to 1.2s and increasing user retention by 15%

What changes would you like? (describe in natural language)
> Make it more concise, focus on the retention impact

💭 Updating bullet...

Updated:
  • Reduced API latency by 40% improving user retention by 15% and
    page load time to 1.2s

Satisfied? (y/n)
> y
```

**Success Criteria:**

- Easy to refine individual bullets
- Changes applied quickly (<5 seconds)
- User maintains control over content

---

### FR-6: Purchase Validation

**Free Tier:** 1 free trial (generates one set of bullets)

**Paid:** $19 for Resume Refresh

- 10 resume bullet generations
- Valid for 30 days
- Can regenerate/refine within session unlimited

**When limit reached:**

```
You've used 10/10 resume generations this month.

Purchase Resume Refresh to continue:
  $19 - 10 resume bullet sets, valid 30 days

  papyrus purchase resume-refresh

Perfect for job search season!
```

**Success Criteria:**

- Free trial allows full experience
- 10 generations enough for active job search (1-2 months)
- Clear value proposition

---

### FR-7: Multiple Versions for Different Roles

**Use Case:** User applying to different types of roles

**Example:**

```bash
# Backend-focused for backend roles
papyrus ai resume --from 2024-01-01 --focus backend --output resume-backend.md

# Leadership-focused for tech lead roles
papyrus ai resume --from 2024-01-01 --focus leadership --output resume-leadership.md

# Full-stack for startup roles
papyrus ai resume --from 2024-01-01 --focus fullstack --output resume-fullstack.md
```

**Success Criteria:**

- Easy to generate multiple versions
- Each version tailored to different job types
- Doesn't consume multiple generation credits within session

---

### FR-8: Copy-Paste Optimization

**Feature:** One-click copy to clipboard

**Command:**

```bash
papyrus ai resume --from 2024-01-01 --copy
```

**Behavior:** After generation, bullets are automatically copied to clipboard

**Also:**

```
[After generation]

Bullets saved to resume-2024.md
Copied to clipboard! ✨

Paste directly into your resume.
```

**Success Criteria:**

- Bullets formatted for easy pasting
- Works across platforms (macOS, Linux, Windows)
- No extra whitespace or formatting issues

---

## API Contract

### Endpoint: `POST /ai/resume/start`

**Request:**

```json
{
  "from": "2024-01-01",
  "to": "2024-12-31",
  "focus": "backend"
}
```

**Response:**

```json
{
  "session_id": "resume-xyz789",
  "journals_count": 156,
  "relevant_entries": 98,
  "focus": "backend"
}
```

---

### Endpoint: `POST /ai/resume/chat/:sessionId`

**Request:**

```json
{
  "message": "Reduced page load time from 2s to 1.2s, improved retention by 15%"
}
```

**Response:** SSE stream

```
event: thinking
data: {"message":"Generating resume bullets..."}

event: content
data: {"text":"• Architected and led..."}

event: done
data: {"session_id":"resume-xyz789","bullets_count":7}
```

---

## CLI Flow

```
User runs: papyrus ai resume --from 2024-01-01 --focus backend
  ↓
CLI checks auth
  ↓
CLI sends POST /ai/resume/start
  ↓
API creates session, analyzes journals
  ↓
API asks clarifying questions via SSE
  ↓
[Interactive Q&A loop]
  ↓
API generates resume bullets via SSE
  ↓
CLI displays bullets
  ↓
[Refinement loop]
  ↓
CLI saves to file (default: resume-YYYY.md)
  ↓
CLI copies to clipboard
  ↓
Done!
```

---

## Edge Cases

### EC-1: Too Few Achievements

**Scenario:** <5 significant achievements found

**Behavior:**

```
Warning: Only 3 achievements found.

Resume bullets work best with 6+ months of work history.

Options:
  1. Expand date range
  2. Continue with 3 bullets
  3. Cancel

>
```

---

### EC-2: Missing Metrics

**Scenario:** Journals lack quantifiable metrics

**Behavior:** AI asks for estimates, or generates bullets emphasizing scope/impact without numbers

**Example:**

```
Q: I couldn't find metrics for the API optimization. Do you have any numbers?
> Not sure, it felt significantly faster

AI generates:
• Optimized API performance through query improvements and caching,
  significantly reducing latency and improving user experience
```

---

### EC-3: Overly Technical Language

**Scenario:** Bullets are too technical for non-technical recruiters

**Behavior:** User can request "less technical" tone

```
> 5 (Change tone)

Make bullets:
  1. More technical (for engineers)
  2. Less technical (for recruiters)
  3. More action-oriented
  4. More impact-focused

> 2

💭 Rewriting bullets for broader audience...
```

---

## Non-Functional Requirements

### Performance

- Initial analysis: <10 seconds
- Bullet generation: <15 seconds
- Refinement: <5 seconds per bullet

### Quality

- 95%+ factual accuracy
- Follows resume best practices
- Quantified metrics where possible
- ATS-friendly (no fancy formatting)

### Usability

- Output ready to copy-paste
- Easy to refine
- Multiple versions for different roles

---

## Success Metrics

- % of users who use resume feature during job search
- % who purchase after free trial
- Average bullets generated per session
- User satisfaction ratings

---

## Open Questions

See [AI-ARCHITECTURE-SUMMARY.md](../AI-ARCHITECTURE-SUMMARY.md) for implementation details.
