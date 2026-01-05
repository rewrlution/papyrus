# Milestone 2: Journal Actions & Enhanced Navigation

**Timeline**: Week 2
**Status**: Not Started
**Dependencies**: Milestone 1 complete
**Goal**: Enable full journal management (CRUD) within the TUI

## Overview

Extend the basic browser with editing, creation, and deletion capabilities. Add enhanced navigation features and basic statistics. Users should be able to manage their entire journaling workflow without leaving the TUI.

## Functional Requirements

### FR2.1: Edit Journal Action

| Key | Action | Description                     |
| --- | ------ | ------------------------------- |
| e   | Edit   | Open selected journal in editor |

**Behavior**:

1. Press 'e' on selected journal
2. TUI pauses and opens system editor (vim/vi/nano)
3. User edits journal content
4. On editor close, return to TUI
5. List refreshes to show updated content
6. Selection remains on edited journal

**Technical Notes**:

- Reuse existing `openInEditor()` function
- Suspend Ink rendering during editor session
- Restore terminal state after editor closes

### FR2.2: Create New Journal Action

| Key | Action | Description                  |
| --- | ------ | ---------------------------- |
| n   | New    | Create new journal for today |

**Behavior**:

1. Press 'n' from anywhere in list
2. Check if today's journal already exists:
   - **If exists**: Show error message "Journal for today already exists. Press 'e' to edit."
   - **If not exists**: Open editor with today's date
3. After editor closes, return to TUI
4. New journal appears in list at top (most recent)
5. Selection moves to newly created journal

**Visual Feedback**:

```
┌─────────────────────────────────────────────────────────┐
│  ⚠ Journal for December 20, 2025 already exists.       │
│     Press 'e' to edit, or select another date.         │
│                                                         │
│     Press any key to dismiss...                        │
└─────────────────────────────────────────────────────────┘
```

### FR2.3: Delete Journal Action

| Key | Action | Description                               |
| --- | ------ | ----------------------------------------- |
| d   | Delete | Delete selected journal with confirmation |

**Behavior - Two-Step Confirmation**:

**Step 1: First 'd' press**

```
┌─────────────────────────────────────────────────────────┐
│  📔 Browse Your Journals                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ > December 20, 2025 (20251220.md)  [PRESS D TO CONFIRM]│  ← Warning
│   December 18, 2025 (20251218.md)                      │
│   December 15, 2025 (20251215.md)                      │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ ⚠ Press 'd' again to delete | Any other key cancels    │
└─────────────────────────────────────────────────────────┘
```

**Step 2: Second 'd' press within 3 seconds**

- Journal is deleted
- List updates (removed entry disappears)
- Selection moves to next journal (or previous if last)
- Show success message briefly: "✓ Deleted December 20, 2025"

**Cancellation**:

- If any other key pressed, cancel delete mode
- If 3 seconds elapse, cancel delete mode
- Return to normal navigation mode

### FR2.4: Enhanced Navigation

| Key   | Action         | Description                                 |
| ----- | -------------- | ------------------------------------------- |
| PgUp  | Page Up        | Jump up 10 entries                          |
| PgDn  | Page Down      | Jump down 10 entries                        |
| Home  | Jump to Top    | Select newest journal                       |
| End   | Jump to Bottom | Select oldest journal                       |
| g + g | Go to Date     | Jump to specific date (future: Milestone 4) |

**Behavior**:

- **Page Up/Down**: Move 10 entries at a time (configurable)
- **Home**: Instant jump to first entry (newest)
- **End**: Instant jump to last entry (oldest)
- Visual scroll animation (smooth, not instant)

### FR2.5: Basic Statistics Display

Update header to show key stats:

```
┌─────────────────────────────────────────────────────────┐
│  📔 Browse Your Journals              Total: 45 entries │  ← Stats
├─────────────────────────────────────────────────────────┤
│                                                         │
│ > December 20, 2025 (20251220.md)                      │
│   December 18, 2025 (20251218.md)                      │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ ↑/↓: Navigate | Enter: Read | e: Edit | n: New | q: Quit│
└─────────────────────────────────────────────────────────┘
```

**Statistics to Display**:

- **Total entries**: Count of all journals
- **Position indicator**: "Entry 5 of 45" (optional, if space allows)

### FR2.6: Visual State Indicators

Enhance visual design with clear state indicators:

**Selection States**:

```
> December 20, 2025 (20251220.md)      ← Selected (highlighted)
● December 19, 2025 (20251219.md)      ← Today's entry (● marker)
  December 18, 2025 (20251218.md)      ← Regular entry
  December 17, 2025 (20251217.md)      ← Regular entry
```

**Color Coding** (use terminal colors):

- Selected: Inverse/highlighted (terminal default)
- Today: Blue or cyan text
- Regular: Default terminal text
- Delete mode: Red warning text

### FR2.7: Status Messages

Show temporary status messages at bottom:

```
┌─────────────────────────────────────────────────────────┐
│  📔 Browse Your Journals              Total: 45 entries │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ > December 20, 2025 (20251220.md)                      │
│   December 18, 2025 (20251218.md)                      │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ ✓ Journal edited successfully                          │  ← Status
├─────────────────────────────────────────────────────────┤
│ ↑/↓: Navigate | Enter: Read | e: Edit | n: New | q: Quit│
└─────────────────────────────────────────────────────────┘
```

**Message Types**:

- ✓ Success (green): "Edited", "Created", "Deleted"
- ⚠ Warning (yellow): "Already exists", "Cancelled"
- ✗ Error (red): "Failed to save", "File not found"

**Behavior**:

- Auto-dismiss after 2 seconds
- User can dismiss by pressing any key
- Don't block interaction

### FR2.8: Updated Keyboard Reference

Footer should show all available actions:

```
↑/↓: Navigate | Enter: Read | e: Edit | n: New | d: Delete | q: Quit
```

If space is limited, use shorter form:

```
↑/↓ Enter: Read | e: Edit | n: New | d: Del | q: Quit
```

## Technical Implementation

### Component Updates

```
src/components/
├── Browser.tsx                 # Add action handlers (e, n, d)
├── BrowserHeader.tsx           # Add statistics display
├── BrowserFooter.tsx           # Update keyboard hints
├── StatusMessage.tsx           # NEW: Temporary status messages
└── DeleteConfirmation.tsx      # NEW: Delete warning state
```

### State Management Updates

```typescript
interface BrowserState {
  journals: JournalFile[];
  selectedIndex: number;
  view: 'list' | 'reader';
  selectedJournal?: JournalFile;

  // NEW in Milestone 2
  deleteMode: boolean; // True when first 'd' pressed
  deleteTimer?: NodeJS.Timeout; // 3-second countdown
  statusMessage?: StatusMessage; // Current status/error
}

interface StatusMessage {
  type: 'success' | 'warning' | 'error';
  text: string;
  timestamp: number;
}
```

### Key Functions to Implement

- `handleEdit()` - Suspend TUI, open editor, resume
- `handleCreate()` - Check existence, open editor
- `handleDelete()` - Two-step confirmation logic
- `showStatus()` - Display temp message with auto-dismiss
- `refreshJournalList()` - Reload after changes

## User Stories

### US2.1: Edit Yesterday's Journal

```
As a user,
I want to press 'e' to quickly edit the selected journal,
So that I can fix typos or add forgotten details
```

**Acceptance Criteria**:

- 'e' key opens journal in my preferred editor
- TUI resumes after I close the editor
- Changes are visible immediately

### US2.2: Quick Daily Journal Creation

```
As a user starting my day,
I want to press 'n' to create today's journal,
So that I can start writing without typing the date
```

**Acceptance Criteria**:

- 'n' creates new journal for today
- Editor opens with template
- New entry appears at top of list

### US2.3: Safe Journal Deletion

```
As a user,
I want to delete an old journal with confirmation,
So that I don't accidentally lose important entries
```

**Acceptance Criteria**:

- First 'd' shows warning, requires second press
- If I press any other key, deletion is cancelled
- After deletion, next entry is selected

### US2.4: Navigate Large Journal Collections

```
As a user with 200+ journals,
I want to use PgUp/PgDn to jump through my list quickly,
So that I can find journals from months ago efficiently
```

**Acceptance Criteria**:

- PgUp/PgDn jumps 10 entries at a time
- Home/End jumps to first/last entry
- Navigation is smooth and responsive

## Testing Checklist

### Create/Edit Actions

- [ ] 'n' creates new journal for today
- [ ] Cannot create duplicate journal for same date
- [ ] 'e' opens selected journal in editor
- [ ] TUI resumes correctly after editor closes
- [ ] Changes are visible in list
- [ ] Works with vim, vi, and nano
- [ ] Handles editor errors gracefully

### Delete Actions

- [ ] First 'd' shows confirmation prompt
- [ ] Second 'd' within 3 seconds deletes journal
- [ ] Any other key cancels deletion
- [ ] Timeout after 3 seconds cancels deletion
- [ ] Deleted journal removed from list
- [ ] Selection moves to appropriate next entry
- [ ] Status message confirms deletion

### Enhanced Navigation

- [ ] PgUp/PgDn jumps 10 entries
- [ ] Home jumps to newest entry
- [ ] End jumps to oldest entry
- [ ] Navigation doesn't go out of bounds
- [ ] Works with small lists (< 10 entries)

### Statistics & UI

- [ ] Header shows total journal count
- [ ] Count updates after create/delete
- [ ] Today's entry has distinct marker
- [ ] Status messages display correctly
- [ ] Status messages auto-dismiss
- [ ] Footer shows all keyboard shortcuts

### Edge Cases

- [ ] Create when today's journal exists
- [ ] Edit non-existent journal
- [ ] Delete last journal in list
- [ ] Delete only journal in list
- [ ] Navigate with only 1 journal
- [ ] All actions work with 1000+ journals

## Definition of Done

- [ ] All functional requirements implemented
- [ ] All user stories completed
- [ ] Manual testing checklist passed
- [ ] Create, edit, delete all work correctly
- [ ] Enhanced navigation implemented
- [ ] Statistics display working
- [ ] Status messages appear and dismiss
- [ ] No bugs or crashes during normal use
- [ ] Code reviewed and merged

## Future Enhancements (Deferred to Milestone 3+)

- Calendar view toggle
- Group by month/year in list
- Preview pane
- Search and filter
- Undo delete action
