# TUI (Text User Interface) - Overview

## Vision

Transform Papyrus CLI from a command-based tool into an interactive, navigable journal browser with calendar visualization. Users should be able to explore, read, edit, and manage their journals through an intuitive keyboard-driven interface.

## Design Principles

1. **Incremental Delivery** - Each milestone delivers working, useful functionality
2. **Essential First** - Prioritize core user needs (navigation, reading, editing)
3. **Progressive Enhancement** - Start simple, add complexity only when needed
4. **Keyboard-Driven** - Everything accessible via intuitive keyboard shortcuts
5. **Visual Clarity** - Clear indicators, minimal clutter, scannable layout

## Command Entry Point

```bash
papyrus browse    # Launch interactive TUI
```

## Development Roadmap

### Milestone 1: Basic Interactive List View (Week 1)

**Goal**: Navigate and read journals interactively

- Arrow key navigation through journal list
- Enter to read selected journal
- Display journals in reverse chronological order
- Basic layout (header, content, footer with keyboard hints)
- Exit with 'q' or Esc

**User Value**: Faster browsing without typing dates repeatedly

---

### Milestone 2: Journal Actions (Week 2)

**Goal**: Full CRUD operations in interactive mode

- Edit journal (e key)
- Create new journal (n key)
- Delete journal with confirmation (d key)
- Basic statistics (total journal count)
- Enhanced navigation (PgUp/PgDn, Home/End)
- Visual state indicators (selected, empty, today)

**User Value**: Complete journal management without leaving TUI

---

### Milestone 3: Calendar View (Week 3-4)

**Goal**: Visual calendar navigation and view switching

- Month calendar grid showing journal indicators
- Toggle between list view and calendar view (Tab key)
- Month navigation (< / > keys)
- Date selection in calendar mode
- Today highlight and date indicators
- Jump to today (Home key)

**User Value**: Visual overview of journaling patterns

---

### Milestone 4: Advanced Features (Week 5+)

**Goal**: Search, filter, and analytics

- Search mode (/ key) - filter by date or content
- Filter by month/year
- Preview pane showing journal excerpt
- Streak counter and statistics
- Year overview (GitHub contribution style)
- Quick date jump (g key)

**User Value**: Power user features for long-term journalers

## Success Criteria

- **Performance**: Handles 1000+ journals smoothly
- **Usability**: New users can navigate without reading docs
- **Reliability**: No crashes, graceful error handling
- **Accessibility**: Works in standard terminal emulators (Windows Terminal, iTerm2, etc.)

## Technical Stack

- **UI Framework**: Ink (React for CLI)
- **Key Libraries**:
  - `ink-select-input` - Selection lists (Milestone 1-2)
  - `date-fns` - Date calculations (Milestone 3)
  - `ink-text-input` - Search input (Milestone 4)
  - Custom calendar component (Milestone 3)

## Non-Goals (Out of Scope)

- Mouse support (keyboard-only for MVP)
- Custom themes/colors (use terminal defaults)
- Real-time sync during TUI session
- Multimedia attachments
- Multi-user/sharing features

## Related Documents

- [Milestone 1: Basic Interactive List View](./milestone-1-basic-navigation.md)
- [Milestone 2: Journal Actions](./milestone-2-journal-actions.md)
- [Milestone 3: Calendar View](./milestone-3-calendar-view.md)
- [Milestone 4: Advanced Features](./milestone-4-advanced-features.md)
- [UI Design Reference](./ui-design-reference.md)
