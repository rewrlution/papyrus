# Discussion Principle for Claude + User Collaboration

> A framework for having structured, documented, and natural discussions about complex decisions

## The Problem

When making complex decisions (like "What AI features should we build?" or "How should we architect this?"), we need a process that:

- **Captures our thinking** - Discussions shouldn't be lost in chat history
- **Stays organized** - Break complex topics into digestible chunks
- **Iterates naturally** - Easily refine ideas based on feedback
- **Produces artifacts** - End with concrete documentation, not just a conversation

## The Solution: Documented Discussion Mode

A lightweight process for collaborative decision-making that balances structure with natural conversation.

---

## The Process

### Phase 1: Seed the Discussion

**Claude's Role:**

1. Create comprehensive seed documents in `docs/`
2. Cover all aspects of the topic thoroughly
3. Provide structure, examples, and recommendations

**Example:**

```
docs/
├── AI-FEATURES-BRAINSTORM.md      # All feature ideas
└── AI-ARCHITECTURE-DESIGN.md      # All architecture options
```

**Why this works:**

- Gets all ideas out of Claude's head into written form
- Gives user something concrete to react to
- Serves as reference during and after discussion

---

### Phase 2: Interactive Discussion

**Claude's Role:**

1. **Bring topics to console one by one** - Don't overwhelm
2. **Follow logical flow** - Start broad, then narrow
3. **Ask focused questions** - Guide the conversation
4. **Summarize decisions** - Confirm understanding

**User's Role:**

1. React to ideas (like/dislike/modify)
2. Share preferences and constraints
3. Ask questions
4. Make decisions

**Example Flow:**

```
Claude: "Let's start with feature priorities. I suggested 6 categories.
        Which category excites you most: Career, Productivity, or Mental Health?"

User: "Definitely career features - that's the monetization angle"

Claude: "Great! Within career features, I listed 4 ideas:
        1. Resume generator
        2. Brag documents
        3. Promotion builder
        4. Career gap analysis

        Which would provide the most immediate value?"

User: "Resume generator - everyone needs that"

Claude: "Perfect. Let me update the docs to reflect that as Phase 1 priority..."
```

**Why this works:**

- Bite-sized discussions are easier to process
- Logical flow helps make connected decisions
- Natural conversation, not rigid Q&A

---

### Phase 3: Update Documentation

**Claude's Role:**

1. **Capture decisions** in the seed documents
2. **Update recommendations** based on user feedback
3. **Add rationale** - Why we decided what we decided
4. **Show what changed** - Be transparent about edits

**Example Update:**

```markdown
## Implementation Priority (UPDATED after discussion)

### Phase 1: Resume Generator (DECIDED)

**Why first:**

- Most universal need (everyone updates resumes)
- Clear monetization value
- Manageable scope for MVP

[Original brainstorm preserved below...]
```

**Why this works:**

- Decisions don't get lost
- Rationale captured for future reference
- Documents evolve as understanding deepens

---

### Phase 4: Iterate Until Done

**Repeat Phase 2-3 until:**

- ✅ All major decisions made
- ✅ User feels confident about direction
- ✅ Documentation reflects final state
- ✅ Ready to move to implementation

**User signals completion:**

- "Looks good, let's move forward"
- "I'm happy with this"
- "Let's start building"

---

## How This Differs from Plan Mode

| Aspect          | Discussion Mode                      | Plan Mode                        |
| --------------- | ------------------------------------ | -------------------------------- |
| **Purpose**     | Make decisions about _what_ to build | Plan _how_ to implement          |
| **Output**      | Decision docs, requirements          | Implementation plan, file list   |
| **User Role**   | Decision maker, provides preferences | Reviewer, approves plan          |
| **Claude Role** | Advisor, presents options            | Architect, designs solution      |
| **When to Use** | Before knowing what to build         | After deciding what to build     |
| **Artifact**    | Requirements, architecture docs      | Step-by-step implementation plan |

**Example:**

- **Discussion Mode**: "Should we build AI features server-side or client-side?"
- **Plan Mode**: "Given we decided on BYOM, here's how to implement it..."

**They work together:**

1. Discussion Mode → Decide on AI features + architecture
2. Plan Mode → Design implementation plan
3. Implementation → Actually build it

---

## Best Practices

### For Claude

**DO:**

- ✅ Create comprehensive seed docs first
- ✅ Break discussion into logical chunks
- ✅ Ask one question at a time (or a few related ones)
- ✅ Summarize decisions before moving on
- ✅ Update docs after each major decision
- ✅ Show enthusiasm for user's ideas
- ✅ Provide recommendations, but respect user's final call

**DON'T:**

- ❌ Dump everything in console at once
- ❌ Jump between unrelated topics randomly
- ❌ Make decisions for the user
- ❌ Forget to update documentation
- ❌ Be overly formal or robotic

### For User

**DO:**

- ✅ React honestly to ideas (what excites you?)
- ✅ Share constraints (budget, time, skills)
- ✅ Ask questions when unclear
- ✅ Push back on recommendations if they don't feel right
- ✅ Say "I don't know yet" if you need more info

**DON'T:**

- ❌ Feel obligated to follow Claude's recommendations
- ❌ Rush decisions - take time to think
- ❌ Worry about "wrong" answers - we can always iterate

---

## Discussion Templates

### Template 1: Feature Prioritization

```
1. Present all feature categories
2. User picks favorite category
3. Deep dive into that category
4. User ranks top 3 features
5. Discuss scope/effort for #1 feature
6. Confirm as Phase 1 priority
7. Update docs
```

### Template 2: Architecture Decision

```
1. Present 2-3 architectural approaches
2. Explain pros/cons of each
3. Ask about user's priorities (speed vs flexibility vs cost)
4. Recommend best fit based on priorities
5. User decides or asks follow-up questions
6. Confirm decision
7. Update docs with chosen approach + rationale
```

### Template 3: Trade-off Discussion

```
1. Present the trade-off (e.g., simplicity vs flexibility)
2. Show concrete examples of each option
3. Ask about user's context/preferences
4. Help user weigh options
5. User makes call
6. Document decision + reasoning
```

---

## Example Discussion Flow

**Topic: AI Features for Papyrus**

**Round 1: Broad Direction**

```
Claude: "I've outlined 6 feature categories in AI-FEATURES-BRAINSTORM.md.
        Let's start broad: What's your primary goal for AI features?
        A) Help users with career growth (monetization angle)
        B) Improve daily productivity (habit-forming)
        C) Support mental health (differentiation)"

User: "Definitely A - career growth"

Claude: "Great! That focuses us on:
        - Resume generator
        - Brag documents
        - Promotion builder
        - Career advice

        Which of these would you personally use most often?"
```

**Round 2: Narrow to Top Feature**

```
Claude: "You picked resume generator. Smart choice - here's why I agree:
        [shows reasoning]

        But let me push back: Resume updates are infrequent (maybe 2x/year).
        Standup notes are daily. Would daily use build more habit/engagement?"

User: "Good point, but I think resume is more 'wow' factor for initial launch"

Claude: "💯 Agreed. Resume as hero feature, standup notes as habit driver.
        Let me update the priority order..."
```

**Round 3: Architecture Decision**

```
Claude: "Now let's talk implementation. I outlined 3 approaches:
        1. Managed API (you host the AI)
        2. BYOM (users bring own API keys)
        3. Hybrid (support both)

        Before I recommend, tell me: How important is monetization vs
        getting users quickly?"

User: "I want users quickly to validate demand first"

Claude: "Then I strongly recommend BYOM to start. You can ship in 2 weeks,
        no server costs, and add managed API later if demand is proven.
        Sound good?"

User: "Makes sense, let's do BYOM"

Claude: "Perfect! Updating AI-ARCHITECTURE-DESIGN.md with decision..."
```

**Round 4: Confirmation**

```
Claude: "Let me summarize what we decided:

        ✅ Primary goal: Career growth features
        ✅ Phase 1 feature: Resume generator
        ✅ Architecture: BYOM (client-side)
        ✅ Next step: Design resume generator prompts

        Does this feel right? Anything to change?"

User: "Looks good!"

Claude: "Excellent! I've updated both docs. Ready to move to implementation
        planning, or want to discuss anything else?"
```

---

## When to Use This Process

**Use Documented Discussion Mode when:**

- Making architectural decisions
- Prioritizing features
- Evaluating trade-offs
- Planning large projects
- Decision has long-term impact

**Skip it when:**

- Implementing something already decided
- Fixing a simple bug
- User knows exactly what they want
- Decision is easily reversible

---

## Success Metrics

You'll know this process is working when:

1. **Decisions feel natural** - Not like filling out a form
2. **Documentation is useful** - You reference it later
3. **Rationale is captured** - You remember why you decided things
4. **Iteration is easy** - Changing your mind doesn't feel painful
5. **You feel heard** - Claude adapts to your preferences

---

## Meta: Improving This Process

This principle itself should evolve! After using it, let's discuss:

- What worked well?
- What felt clunky?
- What's missing?
- How can we make it better?

---

## Ready to Use This Process?

When you're ready to start a documented discussion:

1. **User states the topic**: "Let's discuss AI features"
2. **Claude creates seed docs**: Initial comprehensive documents
3. **Claude starts discussion**: Brings topics to console one by one
4. **Iterate**: Discuss → Update docs → Discuss → Update docs
5. **Conclude**: Confirm final decisions, ensure docs are updated

Let's try it! 🚀
