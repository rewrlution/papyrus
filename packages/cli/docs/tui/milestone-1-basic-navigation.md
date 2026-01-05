# Milestone 1: Basic Interactive List View

**Timeline**: Week 1
**Status**: Not Started
**Goal**: Enable users to navigate and read journals interactively

## Overview

Build a minimal interactive list view that allows users to browse their journals using arrow keys and open them for reading. This establishes the foundation for all future TUI features.

## Functional Requirements

### FR1.1: Launch Interactive Browser

- **Command**: `papyrus browse`
- **Behavior**:
  - Load all journal entries from local storage
  - Sort in reverse chronological order (newest first)
  - Render interactive TUI interface
  - If no journals exist, show empty state with helpful message

### FR1.2: Display Journal List

- **Layout**: Vertical list of journal entries
- **Each Entry Shows**:
  - Formatted date (e.g., "December 20, 2025")
  - Filename (e.g., "20251220.md")
  - Selection indicator ("> " for selected, " " for others)
- **Visual States**:
  - Selected entry: Highlighted/inverse colors
  - Today's entry: Special marker (e.g., "● " prefix)
  - Other entries: Normal text

### FR1.3: Keyboard Navigation

| Key | Action    | Description                        |
| --- | --------- | ---------------------------------- |
| ↑   | Move Up   | Select previous entry (newer date) |
| ↓   | Move Down | Select next entry (older date)     |
| k   | Move Up   | Vim-style alternative              |
| j   | Move Down | Vim-style alternative              |
| q   | Quit      | Exit TUI and return to terminal    |
| Esc | Quit      | Alternative exit key               |

**Behavior**:

- Cursor wraps: pressing ↑ on first item goes to last item (circular navigation)
- Smooth highlight movement without flicker
- Keyboard input is immediate (no Enter required for navigation)

### FR1.4: Read Journal Action

| Key   | Action       | Description                              |
| ----- | ------------ | ---------------------------------------- |
| Enter | Open Journal | Display full content of selected journal |
| Space | Open Journal | Alternative key for same action          |

**Behavior**:

- Opens selected journal in read-only view
- Display content with same formatting as `papyrus read` command
- Show "Press any key to return" prompt
- Return to list view after user presses any key

### FR1.5: Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  📔 Browse Your Journals                                │  ← Header
├─────────────────────────────────────────────────────────┤
│                                                         │
│ > December 20, 2025 (20251220.md)                      │  ← Selected
│   December 18, 2025 (20251218.md)                      │
│ ● December 19, 2025 (20251219.md)                      │  ← Today
│   December 15, 2025 (20251215.md)                      │
│   December 10, 2025 (20251210.md)                      │
│   December 05, 2025 (20251205.md)                      │
│   December 01, 2025 (20251201.md)                      │
│   November 30, 2025 (20251130.md)                      │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ ↑/↓: Navigate | Enter: Read | q: Quit                  │  ← Footer
└─────────────────────────────────────────────────────────┘
```

**Layout Requirements**:

- **Header**: Title with emoji/icon + total count
- **Content Area**: Scrollable list (show 8-10 items at once)
- **Footer**: Keyboard shortcuts reminder (1 line)
- **Width**: Adapt to terminal width (min 60 chars, max 100 chars)
- **Height**: Adapt to terminal height (min 15 lines)

### FR1.6: Scrolling Behavior

- **Visible Items**: Show 8-10 journals at once
- **Scrolling**: List scrolls when selection moves beyond visible range
- **Indicators**: Show "↑ More above" / "↓ More below" when applicable
- **Performance**: Render only visible items (virtual scrolling for 100+ journals)

### FR1.7: Empty State

When no journals exist:

```
┌─────────────────────────────────────────────────────────┐
│  📔 Browse Your Journals                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│              No journal entries yet.                    │
│                                                         │
│         Run 'papyrus new' to create your first one.    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ q: Quit                                                 │
└─────────────────────────────────────────────────────────┘
```

## Technical Implementation

### Component Structure

```
src/
├── commands/
│   └── browse.ts              # Register 'browse' command
└── components/
    ├── Browser.tsx             # Main TUI container
    ├── BrowserHeader.tsx       # Header with title
    ├── JournalListView.tsx     # List view component
    └── JournalReader.tsx       # Full journal display (reuse existing)
```

### Key State Management

```typescript
interface BrowserState {
  journals: JournalFile[]; // All journals
  selectedIndex: number; // Currently selected index
  view: 'list' | 'reader'; // Current view mode
  selectedJournal?: JournalFile; // Journal being read
}
```

### Libraries to Use

- `ink` - Core React CLI framework
- `ink-select-input` - Styled selection list (optional, might build custom)
- Reuse existing: `listJournals()`, `readJournal()`, `getTodayDate()`

## User Stories

### US1.1: Browse Recent Journals

```
As a user with 50+ journals,
I want to see my recent entries in a list,
So that I can quickly find and read yesterday's or last week's journal
```

**Acceptance Criteria**:

- List shows most recent entries first
- I can navigate with arrow keys
- Today's entry is visually distinct

### US1.2: Read Journal Without Typing Dates

```
As a user,
I want to select a journal and press Enter to read it,
So that I don't need to remember or type date codes
```

**Acceptance Criteria**:

- Enter key opens the selected journal
- Content displays in readable format
- I can easily return to the list

### US1.3: Quick Exit

```
As a user,
I want to press 'q' to exit the browser,
So that I can quickly return to my terminal workflow
```

**Acceptance Criteria**:

- 'q' immediately exits without confirmation
- Terminal state is restored properly
- No hanging processes

## Testing Checklist

- [ ] Browser launches successfully with `papyrus browse`
- [ ] Empty state displays when no journals exist
- [ ] Journals display in reverse chronological order
- [ ] Arrow keys move selection smoothly
- [ ] Selection wraps from top to bottom (circular)
- [ ] Today's entry has distinct visual marker
- [ ] Enter key opens selected journal
- [ ] Journal content displays correctly
- [ ] Can return to list from reader view
- [ ] 'q' and Esc both exit cleanly
- [ ] Works with 1, 10, 100, and 1000+ journals
- [ ] Terminal resizing doesn't break layout
- [ ] No flickering or performance issues

## Definition of Done

- [ ] All functional requirements implemented
- [ ] All acceptance criteria met
- [ ] Manual testing checklist passed
- [ ] Code reviewed and merged
- [ ] Command works on Windows, macOS, Linux
- [ ] Documentation updated in README
- [ ] User can complete all 3 user stories successfully

## Future Enhancements (Deferred to Milestone 2)

- Edit/delete actions
- Statistics display
- Page Up/Down navigation
- Better visual styling
- Group by month/year
