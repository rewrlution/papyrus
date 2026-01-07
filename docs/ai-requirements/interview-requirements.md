# Interview Story Generator - Functional Requirements

> Generate STAR-format interview stories from journal experiences

## Feature Overview

**Command:** `papyrus ai interview [options]`
**Pattern:** Interactive chat (multi-turn conversation)
**Frequency:** As needed (interview prep)
**Priority:** Phase 4

---

## User Stories

### As a candidate preparing for interviews...

- I want to generate STAR stories from my journal history
- So that I have compelling answers for behavioral questions

### As someone who freezes during interviews...

- I want pre-prepared stories for common questions
- So that I can confidently answer "Tell me about a time..."

### As a developer with many experiences...

- I want AI to match my experiences to specific question types
- So that I can find the best story for each interview scenario

---

## Functional Requirements

### FR-1: Generate Interview Story

**Command:** `papyrus ai interview --situation <type> [--from DATE] [--to DATE]`

**Situation Types:**

- `technical-challenge` - Difficult technical problem
- `team-conflict` - Disagreement or conflict resolution
- `leadership` - Leading a project or team
- `failure` - Learning from failure
- `tight-deadline` - Working under pressure
- `innovation` - Creative solution or new approach
- `mentorship` - Helping others grow
- `cross-functional` - Working across teams
- `ambiguity` - Navigating unclear requirements
- `scale` - Solving scalability challenges

**Example:**

```bash
papyrus ai interview --situation technical-challenge
```

**Process:**

1. Search journals for experiences matching situation type
2. Present top 3-5 candidate experiences
3. User selects which experience to develop
4. AI asks clarifying questions (STAR details)
5. AI generates full STAR story
6. User refines story
7. Save story for interview prep

**Success Criteria:**

- Story follows STAR format strictly
- Story is 2-3 minutes when spoken
- Includes specific details and metrics
- Demonstrates desired competency

---

### FR-2: Experience Selection

**Flow:**

```
$ papyrus ai interview --situation technical-challenge

Searching your journals for technical challenges...
Found 12 potential stories.

Top candidates:

1. Production API Bug (March 2024)
   "Diagnosed critical payment service issue affecting 30% of transactions"
   Impact: High | Complexity: High | Recency: 9 months ago

2. Database Performance Crisis (June 2024)
   "Resolved database deadlock causing 50% slowdown"
   Impact: High | Complexity: Medium | Recency: 6 months ago

3. Microservices Migration Blocker (Sept 2024)
   "Overcame service discovery issues during migration"
   Impact: Medium | Complexity: High | Recency: 3 months ago

Which story would you like to develop? (1-3, or 'more' for more options)
> 1

Great choice! Let me ask a few questions to build a compelling story...
```

**Success Criteria:**

- AI surfaces most relevant experiences
- Ranks by impact, complexity, recency
- User can explore more options
- Quick preview helps user decide

---

### FR-3: STAR Framework Questions

**After user selects experience, AI asks:**

```
Q1: SITUATION - Set the scene. What was the context?
> Our payment service started throwing 30% error rate during peak hours.
  This was affecting real customer transactions and revenue.

Q2: TASK - What was your specific responsibility?
> I was on-call and needed to diagnose and fix the issue within 2 hours
  to minimize revenue loss.

Q3: ACTION - What steps did you take? (Be specific)
> 1. First, I checked metrics and logs to isolate the issue
  2. Identified a connection pool leak in the database client
  3. Implemented a hotfix with proper connection lifecycle
  4. Deployed to production and monitored for recurrence
  5. Wrote postmortem and added monitoring to prevent future issues

Q4: RESULT - What was the outcome? (Quantify if possible)
> Fixed the issue in 90 minutes. Error rate dropped to 0%. Prevented
  estimated $50K revenue loss. No recurrence in the 9 months since.

💭 Generating your STAR interview story...
```

**Success Criteria:**

- Questions prompt for specific details
- User provides concrete actions and results
- AI guides toward complete STAR structure

---

### FR-4: STAR Story Format

**Output:**

```markdown
# Interview Story: Production API Bug Fix

**Situation Type:** Technical Challenge
**Duration:** ~2.5 minutes
**Key Competencies:** Problem-solving, Debugging, Incident Response, Ownership

---

## The Story

**Situation:**
In March 2024, our payment service suddenly started experiencing a 30% error rate during peak hours. This was a critical issue because it directly affected customer transactions and revenue. I was on-call that day and received alerts showing the spike in errors.

**Task:**
As the on-call engineer, my responsibility was to diagnose the root cause and implement a fix within 2 hours to minimize revenue impact. The pressure was high because every minute of downtime was costing the company money, and customers were unable to complete purchases.

**Action:**
I took a systematic approach to diagnose and resolve the issue:

First, I analyzed our monitoring dashboards and narrowed the problem to the payment service's database connections. The metrics showed an unusual pattern of connection exhaustion.

Next, I dove into the application logs and identified a connection pool leak in our database client code. The connections weren't being properly closed after queries, causing the pool to exhaust during high traffic.

I quickly implemented a hotfix that ensured proper connection lifecycle management using try-finally blocks. I also added connection pool monitoring to catch this issue earlier in the future.

After thorough local testing, I deployed the fix to production and monitored closely for the next hour to ensure no recurrence.

Finally, I wrote a detailed postmortem documenting the root cause, our response, and preventive measures. I also added alerts for connection pool exhaustion to catch similar issues proactively.

**Result:**
I resolved the issue in 90 minutes, well within the 2-hour SLA. The error rate immediately dropped to 0%, and we prevented an estimated $50,000 in lost revenue. More importantly, we haven't seen this issue recur in the 9 months since, thanks to the monitoring and preventive measures I put in place.

This experience taught me the importance of systematic debugging under pressure and the value of postmortems in preventing future incidents.

---

## Key Points to Emphasize

- Systematic approach to debugging under pressure
- Quantifiable impact ($50K revenue saved)
- Follow-through with postmortem and preventive measures
- No recurrence demonstrates thoroughness

## Variations for Different Questions

**"Tell me about a time you solved a difficult technical problem"**
→ Use full story, emphasize systematic debugging approach

**"Tell me about a time you worked under pressure"**
→ Emphasize the 2-hour deadline and calm, methodical approach

**"Tell me about a time you went above and beyond"**
→ Emphasize the postmortem and preventive monitoring you added

---

Generated with Papyrus AI • [Date]
```

**Success Criteria:**

- Story is 2-3 minutes when spoken
- Follows STAR format strictly
- Includes specific details (dates, numbers, actions)
- Demonstrates multiple competencies
- Includes coaching notes for variations

---

### FR-5: Multiple Stories per Session

**Use Case:** User wants 5-7 stories for comprehensive interview prep

**Command:**

```bash
# Generate stories for common interview themes
papyrus ai interview --batch

# Or generate multiple specific types
papyrus ai interview --situation technical-challenge leadership failure
```

**Batch Mode Flow:**

```
Interview Prep: Batch Story Generation

I'll help you prepare 5-7 stories covering common interview themes.

Recommended story types:
  1. Technical challenge (required)
  2. Team conflict (required)
  3. Leadership (recommended)
  4. Failure/learning (recommended)
  5. Tight deadline (recommended)
  6. Innovation (optional)
  7. Mentorship (optional)

How many stories would you like to prepare? (5-7 recommended)
> 6

Let's start with technical challenge...
[Proceeds through each type]
```

**Success Criteria:**

- Can generate multiple stories in one session
- Stories don't overlap (different experiences)
- Batch mode is efficient (doesn't restart each time)

---

### FR-6: Story Variations

**Feature:** Generate multiple variations of same story for different questions

**Example:**

```
[After generating base story]

This story can be adapted for multiple interview questions:

1. "Tell me about a time you solved a difficult technical problem"
2. "Tell me about a time you worked under pressure"
3. "Tell me about a time you went above and beyond"

Generate variations? (y/n)
> y

💭 Generating 3 variations...

[Shows story tailored to each question type]
```

**Success Criteria:**

- Same core story, different emphasis
- Each variation highlights relevant aspects
- User has ready answers for multiple questions

---

### FR-7: Practice Mode

**Feature:** Interactive practice with feedback

**Command:**

```bash
papyrus ai interview --practice
```

**Flow:**

```
Interview Practice Mode

I'll ask you common behavioral questions. Try answering with your stories.

Ready? (y/n)
> y

Q: "Tell me about a time you faced a difficult technical challenge."

[30 second timer]

Your answer:
> [User speaks their story]

💭 Analyzing your response...

Feedback:
✅ Good use of STAR structure
✅ Included quantifiable results
⚠️  Could add more detail about your specific actions
⚠️  A bit long (3.5 minutes) - aim for 2-3 minutes

Want to try again? (y/n)
```

**Note:** This is a nice-to-have feature, may be Phase 5+

---

### FR-8: Purchase Validation

**Free Tier:** 1 free trial (generates one story)

**Paid:** $19 for Interview Prep Pack

- 20 interview story generations
- Valid for 30 days
- Perfect for active interview prep

**When limit reached:**

```
You've used 20/20 interview stories this month.

Purchase Interview Prep Pack to continue:
  $19 - 20 interview stories, valid 30 days

  papyrus purchase interview-prep

Good luck with your interviews! 🚀
```

**Success Criteria:**

- 20 stories is enough for 3-5 interview loops
- 30-day validity matches typical interview timeline

---

## API Contract

### Endpoint: `POST /ai/interview/search`

**Request:**

```json
{
  "situation": "technical-challenge",
  "from": "2024-01-01",
  "to": "2024-12-31"
}
```

**Response:**

```json
{
  "candidates": [
    {
      "id": "story-1",
      "title": "Production API Bug",
      "summary": "Diagnosed critical payment service issue...",
      "date": "2024-03-15",
      "impact": "high",
      "complexity": "high"
    }
  ]
}
```

---

### Endpoint: `POST /ai/interview/generate/:storyId`

**Request:**

```json
{
  "story_id": "story-1",
  "situation_context": "...",
  "task_context": "...",
  "actions": ["...", "..."],
  "results": "..."
}
```

**Response:** SSE stream with STAR story

---

## CLI Flow

```
User runs: papyrus ai interview --situation technical-challenge
  ↓
CLI sends POST /ai/interview/search
  ↓
API searches journals, returns candidates
  ↓
CLI displays top 3-5 candidates
  ↓
User selects one
  ↓
CLI sends POST /ai/interview/generate/:storyId
  ↓
[Interactive Q&A via SSE for STAR details]
  ↓
API generates full STAR story
  ↓
CLI displays story
  ↓
[Optional: Generate variations]
  ↓
CLI saves to file
  ↓
Done!
```

---

## Edge Cases

### EC-1: No Matching Experiences

**Scenario:** Journals don't contain requested situation type

**Behavior:**

```
No experiences found matching "team-conflict".

Try:
  1. Expand date range (--from earlier date)
  2. Choose different situation type
  3. Add more journals with this type of experience

Available situation types:
  papyrus ai interview --list-situations
```

---

### EC-2: Story Too Short

**Scenario:** Generated story is <1 minute

**Behavior:** AI asks for more details to flesh out the story

---

### EC-3: Story Too Long

**Scenario:** Generated story is >4 minutes

**Behavior:** AI automatically condenses, offers "detailed version" option

---

## Non-Functional Requirements

### Performance

- Search journals: <5 seconds
- Generate story: <20 seconds
- Generate variations: <10 seconds

### Quality

- Story follows STAR format
- 2-3 minutes when spoken
- Factually accurate
- Demonstrates competency clearly

### Usability

- Easy to find relevant experiences
- Quick to generate multiple stories
- Saves time compared to manual writing

---

## Success Metrics

- % of users preparing for interviews who use this feature
- Average stories generated per user
- Conversion rate (free → paid)
- User reports: "Used this story in interview" feedback

---

## Open Questions

See [AI-ARCHITECTURE-SUMMARY.md](../AI-ARCHITECTURE-SUMMARY.md) for implementation details.
