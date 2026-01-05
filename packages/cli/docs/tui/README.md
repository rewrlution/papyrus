# Papyrus CLI - Text User Interface (TUI) Documentation

> Interactive browser for navigating, reading, editing, and managing journal entries

## Quick Start

This folder contains complete functional requirements and UI/UX specifications for building an interactive TUI for Papyrus CLI.

### Entry Command

```bash
papyrus browse    # Launch interactive TUI
```

## Documentation Structure

### 📋 [Overview](./00-overview.md)

High-level vision, design principles, roadmap, and success criteria. **Start here** for project context.

### 🎯 Milestone Documents

Development is organized into 4 incremental milestones:

#### [Milestone 1: Basic Interactive List View](./milestone-1-basic-navigation.md) ⭐ **Start Here**

- **Timeline**: Week 1
- **Goal**: Navigate and read journals interactively
- **Core Features**:
  - Arrow key navigation
  - Journal list (reverse chronological)
  - Read journal action (Enter)
  - Exit (q/Esc)
- **User Value**: Browse journals without typing dates
- **Estimated Effort**: 2-3 days

#### [Milestone 2: Journal Actions](./milestone-2-journal-actions.md)

- **Timeline**: Week 2
- **Goal**: Full CRUD operations in TUI
- **Core Features**:
  - Edit journal (e key)
  - Create new journal (n key)
  - Delete with confirmation (d key)
  - Enhanced navigation (PgUp/PgDn, Home/End)
  - Basic statistics display
- **User Value**: Complete journal management without leaving TUI
- **Estimated Effort**: 3-4 days

#### [Milestone 3: Calendar View](./milestone-3-calendar-view.md)

- **Timeline**: Week 3-4
- **Goal**: Visual calendar navigation
- **Core Features**:
  - Month calendar grid
  - Toggle between list/calendar views (Tab)
  - Month navigation (< / >)
  - Visual journal indicators (✓/○)
  - Today highlight
- **User Value**: Visual overview of journaling patterns
- **Estimated Effort**: 5-7 days

#### [Milestone 4: Advanced Features](./milestone-4-advanced-features.md)

- **Timeline**: Week 5+
- **Goal**: Power user features
- **Core Features**:
  - Search mode (/)
  - Filter by date range
  - Preview pane
  - Streak counter & analytics
  - Year overview
  - Export functionality
- **User Value**: Advanced tools for long-term journalers
- **Estimated Effort**: 7-10 days

### 🎨 [UI Design Reference](./ui-design-reference.md)

Visual design system, layout patterns, color usage, typography, and component specifications.

## Development Guidelines

### Incremental Delivery Strategy

Each milestone:

1. ✅ **Delivers Working Software** - Fully functional, usable features
2. 🎯 **Focuses on Essentials** - Core needs first, nice-to-haves later
3. 🔄 **Builds on Previous** - Each milestone extends, not replaces
4. 📏 **Has Clear Scope** - Well-defined boundaries and acceptance criteria
5. ✨ **Adds User Value** - Tangible benefit for end users

### Recommended Implementation Order

```
Milestone 1 → Milestone 2 → Milestone 3 → Milestone 4
    ↓             ↓             ↓             ↓
 Release        Release       Release       Release
 v0.1.0         v0.2.0        v0.3.0        v1.0.0
```

**Each milestone can be released independently**, providing immediate value to users.

### Quality Gates

Before moving to next milestone:

- [ ] All functional requirements implemented
- [ ] All acceptance criteria met
- [ ] Manual testing checklist passed
- [ ] No critical bugs
- [ ] Code reviewed and approved
- [ ] Documentation updated

## Tech Stack

### Core Libraries

- **Ink** (`ink`) - React for CLI
- **React** (`react`) - UI components
- **date-fns** (`date-fns`) - Date manipulation

### Additional Dependencies

- `ink-select-input` - Selection lists (Milestone 1-2)
- `ink-text-input` - Search input (Milestone 4)
- `ink-spinner` - Loading indicators
- `chalk` - Terminal colors (if needed)

### Reusable Services

```typescript
// From existing codebase
import {
  listJournals,
  readJournal,
  writeJournal,
  deleteJournal,
} from './services/storage.js';
import { getTodayDate, formatDate, isValidDate } from './lib/date.js';
import { openInEditor } from './services/storage.js';
```

## Key Design Decisions

### ✅ Why These Choices Were Made

1. **Incremental Milestones**
   - Reduces risk, enables early feedback
   - Each milestone delivers user value
   - Easier to adjust course between milestones

2. **List View First, Calendar Second**
   - List view is simpler to implement
   - Establishes navigation patterns
   - Calendar builds on list foundation

3. **Keyboard-Only (No Mouse)**
   - Faster for power users
   - More reliable across terminals
   - Simpler implementation
   - (Mouse support could be added later)

4. **Terminal Colors with Fallbacks**
   - Works with user's color scheme
   - Degrades gracefully in monochrome
   - Maximum compatibility

5. **Read-Only View Separate from Editor**
   - Reuses existing editor integration
   - Clear separation of concerns
   - Familiar vim/editor workflow

## Common Patterns

### View Structure Template

```typescript
interface ViewProps {
  journals: JournalFile[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onAction: (action: Action) => void;
}

export const MyView: React.FC<ViewProps> = ({ journals, selectedIndex, onSelect, onAction }) => {
  useInput((input, key) => {
    // Handle keyboard input
    if (key.upArrow) onSelect(selectedIndex - 1);
    if (key.downArrow) onSelect(selectedIndex + 1);
    if (input === 'q') onAction({ type: 'quit' });
  });

  return (
    <Box flexDirection="column">
      <ViewHeader />
      <ViewContent journals={journals} selectedIndex={selectedIndex} />
      <ViewFooter />
    </Box>
  );
};
```

### State Management Pattern

```typescript
type BrowserAction =
  | { type: 'SELECT'; index: number }
  | { type: 'NAVIGATE'; direction: 'up' | 'down' }
  | { type: 'SWITCH_VIEW'; view: 'list' | 'calendar' }
  | { type: 'EDIT'; date: string }
  | { type: 'DELETE'; date: string }
  | { type: 'QUIT' };

const [state, dispatch] = useReducer(browserReducer, initialState);
```

## File Structure

```
src/
├── commands/
│   └── browse.ts                  # Command registration
├── components/
│   ├── Browser.tsx                # Main container (state management)
│   ├── BrowserHeader.tsx          # Header with title & stats
│   ├── BrowserFooter.tsx          # Footer with shortcuts
│   │
│   ├── ListView.tsx               # List view component
│   ├── CalendarView.tsx           # Calendar view component
│   ├── JournalReader.tsx          # Full journal display
│   │
│   ├── SearchBar.tsx              # Search input (M4)
│   ├── FilterMenu.tsx             # Filter UI (M4)
│   ├── PreviewPane.tsx            # Preview pane (M4)
│   └── StatsPanel.tsx             # Statistics panel (M4)
│
├── services/
│   ├── storage.ts                 # Existing (reuse)
│   ├── search.ts                  # Full-text search (M4)
│   ├── analytics.ts               # Streaks & stats (M4)
│   └── export.ts                  # Export feature (M4)
│
└── lib/
    └── date.ts                    # Existing (reuse)
```

## FAQ

### Q: Can users still use regular commands while TUI is developed?

**A:** Yes! All existing commands (`papyrus read`, `papyrus edit`, etc.) continue to work. The TUI is an additional interface, not a replacement.

### Q: What if a user's terminal doesn't support colors?

**A:** All UI works in monochrome. Color is used to enhance, not to convey critical information. Icons and text labels provide alternatives.

### Q: Can we skip to Milestone 3 (calendar) first?

**A:** Not recommended. Milestone 1 establishes navigation patterns and state management that Milestone 3 depends on. Following the order reduces technical debt.

### Q: How do we handle very long journal lists (1000+ entries)?

**A:** Virtual scrolling (render only visible items) is built into Milestone 1 requirements. Tested to work with 1000+ journals.

### Q: Will this work on Windows?

**A:** Yes. Ink works cross-platform. All features are designed to work on Windows Terminal, Command Prompt, macOS Terminal, and Linux terminal emulators.

### Q: What about syncing during TUI session?

**A:** Milestone 1-3 focus on local operations. Sync integration could be added later (press 's' to trigger sync, refresh list).

## Getting Help

### Resources

- **Ink Documentation**: https://github.com/vadimdemedes/ink
- **Ink Examples**: https://github.com/vadimdemedes/ink/tree/master/examples
- **Date-fns Docs**: https://date-fns.org/docs/
- **Unicode Characters**: https://unicode-table.com/

### Example Projects for Inspiration

- **lazygit**: https://github.com/jesseduffield/lazygit (Git TUI)
- **k9s**: https://github.com/derailed/k9s (Kubernetes TUI)
- **gh**: https://github.com/cli/cli (GitHub CLI)

## Next Steps

### For Developers

1. **Read the Overview** - Understand vision and goals
2. **Start with Milestone 1** - Implement basic navigation
3. **Follow the Testing Checklist** - Ensure quality at each step
4. **Refer to UI Design Reference** - Maintain consistent design
5. **Complete each milestone fully** before moving to next

### For Product/Design

1. Review milestone documents for scope accuracy
2. Validate user stories match real user needs
3. Provide feedback on UI mockups
4. Test each milestone with real users
5. Gather feedback for future iterations

### For QA

1. Use testing checklists in each milestone
2. Test across different terminal emulators
3. Test with various terminal sizes
4. Test edge cases (0 journals, 1000+ journals)
5. Validate keyboard shortcuts work consistently

---

**Questions?** Open an issue or reach out to the development team.

**Ready to start?** Begin with [Milestone 1: Basic Interactive List View](./milestone-1-basic-navigation.md) 🚀
