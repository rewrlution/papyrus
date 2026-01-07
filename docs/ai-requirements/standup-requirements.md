# Standup Notes - Functional Requirements

> Generate daily or weekly standup notes from journal entries

## Feature Overview

**Command:** `papyrus ai standup [options]`
**Pattern:** One-shot generation (no chat)
**Frequency:** Daily/Weekly
**Priority:** Phase 1 (build first)

---

## User Stories

### As a daily journaler...

- I want to generate standup notes from yesterday's journal
- So that I don't have to remember what I did before standup meetings

### As a weekly team lead...

- I want to generate a weekly summary for team updates
- So that I can quickly share progress with stakeholders

### As a forgetful developer...

- I want to see what I worked on last week
- So that I can resume context after the weekend

---

## Functional Requirements

### FR-1: Default Behavior (Yesterday's Standup)

**Command:** `papyrus ai standup`

**Input:**

- Implicit: Yesterday's journal entry
- Auth token from config

**Process:**

1. Load yesterday's journal from local storage
2. Send journal content to API with auth token
3. API validates user, checks usage limit (10/month for free tier)
4. API generates standup notes via AI provider
5. API increments usage counter
6. Return formatted standup notes to CLI
7. Display in terminal

**Output Format:**

```
Yesterday:
- Fixed authentication bug in user service
- Reviewed 3 PRs from team members
- Paired with Alice on database migration

Today:
- Deploy hotfix to production
- Attend team planning meeting
- Start work on new feature X

Blockers:
- Waiting on design approval for feature X
```

**Success Criteria:**

- Takes <5 seconds end-to-end
- Output is concise (3-5 items per section)
- Uses past tense for "Yesterday", future/present for "Today"
- Identifies blockers from journal context

---

### FR-2: Date Range Selection

**Command:** `papyrus ai standup --from YYYY-MM-DD [--to YYYY-MM-DD]`

**Input:**

- `--from`: Start date (required)
- `--to`: End date (optional, defaults to today)

**Examples:**

```bash
# Last 3 days
papyrus ai standup --from 2025-01-03 --to 2025-01-05

# Custom range
papyrus ai standup --from 2025-01-01 --to 2025-01-07
```

**Output:** Same format as FR-1, but aggregates multiple days

**Success Criteria:**

- Aggregates work across date range
- Deduplicates similar tasks
- Prioritizes most important/impactful items

---

### FR-3: Weekly Summary

**Command:** `papyrus ai standup --last-week`

**Input:**

- Implicit: Last 7 days of journals

**Output Format:**

```
Week of Jan 1-7, 2025

Accomplishments:
- Shipped feature X to production
- Fixed 12 bugs across 3 services
- Mentored 2 junior engineers
- Completed design review for feature Y

Key Metrics:
- 23 commits, 15 PRs merged
- 3 features shipped, 12 bugs fixed

Next Week Focus:
- Start feature Z implementation
- Complete database migration
- Team offsite planning
```

**Success Criteria:**

- Provides weekly overview
- Includes metrics if available
- Suggests focus for next week

---

### FR-4: Usage Limit Enforcement

**Behavior:** Check usage before generation

**Free Tier:** 10 standups per month
**Paid Tier:** Unlimited (with Standup Pro purchase)

**When limit reached:**

```
You've used 10/10 standup notes this month.

Upgrade to Standup Pro for unlimited standup notes:
  papyrus purchase standup-pro

Or wait until Feb 1, 2025 for monthly reset.
```

**Success Criteria:**

- Clear message when limit reached
- Shows usage count (X/10)
- Provides upgrade path
- Shows reset date

---

### FR-5: No Journal Entry Handling

**Scenario:** User has no journal for requested date

**Output:**

```
No journal entry found for 2025-01-05.

Create one first:
  papyrus add --date 2025-01-05
```

**Success Criteria:**

- Helpful error message
- Suggests next action
- Doesn't consume usage quota

---

### FR-6: Output Options

**Flags:**

- `--output <file>` - Save to file instead of displaying
- `--copy` - Copy to clipboard
- `--format <format>` - Output format (text, markdown, json)

**Examples:**

```bash
# Save to file
papyrus ai standup --output standup-2025-01-06.md

# Copy to clipboard
papyrus ai standup --copy

# JSON format (for scripting)
papyrus ai standup --format json
```

**Success Criteria:**

- File saved successfully
- Clipboard contains formatted text
- JSON is valid and parseable

---

## API Contract

### Endpoint: `POST /ai/standup`

**Request:**

```json
{
  "from": "2025-01-05",
  "to": "2025-01-05",
  "journals": [
    {
      "date": "2025-01-05",
      "content": "Fixed auth bug. Reviewed PRs. Paired with Alice."
    }
  ]
}
```

**Headers:**

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Response (Success):**

```json
{
  "content": "Yesterday:\n- Fixed authentication bug...",
  "usage": {
    "used": 3,
    "limit": 10,
    "resets_at": "2025-02-01T00:00:00Z"
  }
}
```

**Response (Limit Reached):**

```json
{
  "error": "Usage limit reached",
  "message": "You've used 10/10 standup notes this month.",
  "usage": {
    "used": 10,
    "limit": 10,
    "resets_at": "2025-02-01T00:00:00Z"
  },
  "upgrade_url": "/purchase/standup-pro"
}
```

**Response (Unauthorized):**

```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired auth token"
}
```

---

## CLI Flow

```
User runs: papyrus ai standup
  ↓
CLI checks: Is user logged in?
  ├─ No → Show "papyrus login" message
  └─ Yes → Continue
  ↓
CLI loads yesterday's journal from local storage
  ↓
CLI checks: Does journal exist?
  ├─ No → Show "No journal found" message
  └─ Yes → Continue
  ↓
CLI sends POST to /ai/standup with journal + auth token
  ↓
API validates auth token
  ↓
API checks usage limit
  ├─ Exceeded → Return 429 with upgrade message
  └─ OK → Continue
  ↓
API generates standup via AI provider
  ↓
API increments usage counter
  ↓
API returns standup content + usage info
  ↓
CLI displays formatted output
  ↓
CLI shows usage count: "Used 3/10 this month"
```

---

## Edge Cases

### EC-1: Multiple Journals in One Day

**Scenario:** User wrote 2+ journals on same day

**Behavior:** Combine all entries for that day

---

### EC-2: Empty Journal

**Scenario:** Journal exists but has no content

**Behavior:** Return message "Journal is empty, nothing to generate"

---

### EC-3: Very Long Journal

**Scenario:** Journal is 50K+ characters (exceeds token limit)

**Behavior:** Truncate to last 10K characters, show warning

---

### EC-4: AI Provider Error

**Scenario:** OpenAI/Anthropic returns error

**Behavior:** Show user-friendly error, don't consume quota

**Message:**

```
AI service temporarily unavailable. Please try again.

If this persists, contact support@papyrus.dev
```

---

### EC-5: Network Error

**Scenario:** No internet connection

**Behavior:** Retry 3 times with exponential backoff, then fail

**Message:**

```
Network error. Please check your connection and try again.
```

---

## Non-Functional Requirements

### Performance

- P1: End-to-end latency < 5 seconds (p95)
- P2: API response time < 3 seconds (p95)
- P3: CLI startup time < 500ms

### Reliability

- R1: 99.5% success rate for AI generation
- R2: Graceful degradation when AI provider is down
- R3: No data loss on network failures

### Usability

- U1: Output is readable and well-formatted
- U2: Error messages are clear and actionable
- U3: Usage limits are transparent

### Security

- S1: Auth token never logged or exposed
- S2: Journal content sent over HTTPS only
- S3: API validates token on every request

---

## Success Metrics

### Usage Metrics

- % of daily active users who generate standup
- Average standups generated per user per week
- Free → Paid conversion rate for standup feature

### Quality Metrics

- User satisfaction rating (1-5 stars)
- % of users who regenerate (quality issue indicator)
- Average length of generated standup (should be concise)

### Performance Metrics

- p50, p95, p99 latency
- Error rate %
- API availability %

---

## Testing Checklist

### Unit Tests

- [ ] Prompt building with single journal
- [ ] Prompt building with multiple journals
- [ ] Date range handling
- [ ] Empty journal handling
- [ ] Token limit truncation

### Integration Tests

- [ ] API endpoint with valid auth
- [ ] API endpoint with invalid auth
- [ ] API endpoint with usage limit reached
- [ ] API endpoint with no journals
- [ ] Mocked AI provider responses

### E2E Tests

- [ ] Generate standup from yesterday
- [ ] Generate standup from date range
- [ ] Generate weekly summary
- [ ] Hit usage limit and see upgrade message
- [ ] Save to file
- [ ] Copy to clipboard

### Manual Testing

- [ ] Run command and verify output format
- [ ] Test with real journals (various lengths)
- [ ] Test error messages
- [ ] Test upgrade flow
- [ ] Test on slow network

---

## Documentation

### CLI Help Text

```
papyrus ai standup [options]

Generate standup notes from your journal entries

OPTIONS:
  --from <date>       Start date (YYYY-MM-DD)
  --to <date>         End date (YYYY-MM-DD)
  --last-week         Generate weekly summary
  --output <file>     Save to file
  --copy              Copy to clipboard
  --format <format>   Output format (text, markdown, json)
  -h, --help          Show help

EXAMPLES:
  papyrus ai standup
    Generate standup notes from yesterday

  papyrus ai standup --last-week
    Generate weekly summary

  papyrus ai standup --from 2025-01-01 --to 2025-01-07
    Generate standup for specific date range

USAGE LIMITS:
  Free tier: 10 standups per month
  Standup Pro: Unlimited ($9 for 90 days)

MORE INFO:
  https://papyrus.dev/docs/ai/standup
```

---

## Open Questions

Refer to [AI-ARCHITECTURE-SUMMARY.md](../AI-ARCHITECTURE-SUMMARY.md) for implementation details:

- Database schema for usage tracking
- Rate limiting strategy
- Error retry logic
- Prompt template management
