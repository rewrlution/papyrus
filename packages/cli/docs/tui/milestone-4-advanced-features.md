# Milestone 4: Advanced Features (Search, Filter, Analytics)

**Timeline**: Week 5+
**Status**: Not Started
**Dependencies**: Milestone 3 complete
**Goal**: Add power user features for searching, filtering, and analyzing journals

## Overview

Enhance the TUI with advanced capabilities for users with large journal collections. Add search/filter functionality, preview panes, year-level visualizations, and journaling analytics. These features make Papyrus CLI suitable for long-term daily journalers with hundreds or thousands of entries.

## Functional Requirements

### FR4.1: Search Mode

| Key | Action      | Description           |
| --- | ----------- | --------------------- |
| /   | Search      | Enter search mode     |
| Esc | Exit Search | Return to normal mode |

**Search Interface**:

```
┌─────────────────────────────────────────────────────────┐
│  🔍 Search: therapy session_                           │  ← Input
├─────────────────────────────────────────────────────────┤
│                                                         │
│ > December 20, 2025 (20251220.md)                      │
│   "...talked to my therapist about work stress..."     │  ← Snippet
│                                                         │
│   December 15, 2025 (20251215.md)                      │
│   "...therapy session was helpful today..."            │
│                                                         │
│   December 10, 2025 (20251210.md)                      │
│   "...scheduled next therapy appointment..."           │
│                                                         │
│                                   3 results             │
├─────────────────────────────────────────────────────────┤
│ Type to search | ↑/↓: Navigate | Enter: Open | Esc: Exit│
└─────────────────────────────────────────────────────────┘
```

**Behavior**:

1. Press `/` from list or calendar view
2. Search input field appears at top
3. As user types, results filter in real-time
4. Search matches in:
   - Journal content (full-text search)
   - Date (formatted date strings)
5. Show matching snippet below each result
6. Navigate filtered results with ↑/↓
7. Press Enter to open selected result
8. Press Esc to exit search and return to full list

**Search Features**:

- **Case-insensitive** by default
- **Partial matches** (substring search)
- **Highlight** matching terms in snippets
- **Real-time** filtering (no Enter required)
- **Empty state**: "No journals found matching 'query'"

### FR4.2: Date Range Filter

| Key | Action | Description      |
| --- | ------ | ---------------- |
| f   | Filter | Open filter menu |

**Filter Menu**:

```
┌─────────────────────────────────────────────────────────┐
│  Filter Journals                                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  > This Week                                            │
│    This Month                                           │
│    Last 30 Days                                         │
│    This Year                                            │
│    Custom Range...                                      │
│    Clear Filter (Show All)                              │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ ↑/↓: Select | Enter: Apply | Esc: Cancel               │
└─────────────────────────────────────────────────────────┘
```

**Filter Options**:

- **This Week**: Last 7 days
- **This Month**: Current calendar month
- **Last 30 Days**: Rolling 30-day window
- **This Year**: Current calendar year
- **Custom Range**: Prompt for start/end dates
- **Clear Filter**: Show all journals

**Custom Range Input**:

```
┌─────────────────────────────────────────────────────────┐
│  Custom Date Range                                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Start Date (YYYY-MM-DD): 2025-01-01_                  │
│  End Date (YYYY-MM-DD):   2025-03-31_                  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ Enter: Apply | Esc: Cancel                              │
└─────────────────────────────────────────────────────────┘
```

**Active Filter Indicator**:

```
┌─────────────────────────────────────────────────────────┐
│  📔 Browse Your Journals      [Filter: This Month] × │  ← Badge
├─────────────────────────────────────────────────────────┤
```

- Show filter badge in header
- Click × or press 'f' then 'Clear' to remove

### FR4.3: Preview Pane

Toggle a preview pane showing content of selected journal:

| Key | Action         | Description            |
| --- | -------------- | ---------------------- |
| p   | Toggle Preview | Show/hide preview pane |

**Layout with Preview**:

```
┌──────────────────────────┬──────────────────────────────┐
│  📔 Your Journals        │  📄 December 20, 2025       │
├──────────────────────────┼──────────────────────────────┤
│                          │                              │
│ > Dec 20, 2025          │  # Thursday Thoughts         │
│   Dec 18, 2025          │                              │
│   Dec 15, 2025          │  Today was productive. I     │
│   Dec 10, 2025          │  finished the TUI design     │
│   Dec 05, 2025          │  docs and started thinking   │
│   Dec 01, 2025          │  about the implementation.   │
│   Nov 30, 2025          │                              │
│   Nov 25, 2025          │  ## Work                     │
│                          │  - Completed project spec    │
│                          │  - Reviewed PRs              │
│                          │                              │
│                          │  [156 words, 892 chars]     │
│                          │                              │
├──────────────────────────┴──────────────────────────────┤
│ ↑/↓: Navigate | p: Toggle Preview | Enter: Open        │
└─────────────────────────────────────────────────────────┘
```

**Preview Features**:

- **Split pane**: 40/60 layout (list/preview)
- **Real-time update**: Preview changes as selection moves
- **Scrollable**: Preview can scroll for long entries
- **Stats**: Show word/character count
- **Markdown rendering**: Basic formatting (headers, bullets)

### FR4.4: Year Overview

Press 'y' to show GitHub-style contribution graph for a year:

```
┌─────────────────────────────────────────────────────────────────────┐
│  📊 2025 Journal Activity                                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Jan  ▓░░░░░░░▓▓░░░░░░░▓░░░░░▓▓░░░░                                │
│  Feb  ░▓░░░░░░▓░░▓░░░░░░░░▓░░░                                     │
│  Mar  ▓▓░░░▓░░░░░▓▓░░░░░▓░░░░▓░░                                   │
│  Apr  ░░░▓░░░░░░░░░▓░░░▓░░░░░░░▓                                   │
│  May  ░░░░░░░░░░░░░░░░░░░░░░░░░░░                                  │
│  Jun  ░░░░░░░░░░░░░░░░░░░░░░░░░░░                                  │
│  Jul  ░░░░░░░░░░░░░░░░░░░░░░░░░░░                                  │
│  Aug  ░░░░░░░░░░░░░░░░░░░░░░░░░░░                                  │
│  Sep  ░░░░░░░░░░░░░░░░░░░░░░░░░░░                                  │
│  Oct  ░░░░░░░░░░░░░░░░░░░░░░░░░░░                                  │
│  Nov  ░░░░░░░░░░░░░░░░░░░░░░░░░░░                                  │
│  Dec  ░░░░░░░░░░░░░░░░▓▓░▓░                                         │
│                                                                     │
│  Legend: ░ No entry  ▓ Has entry                                   │
│                                                                     │
│  📈 Statistics                                                      │
│  ├─ Total Entries: 145                                             │
│  ├─ Most Active Month: March (28 entries)                          │
│  ├─ Least Active Month: July (2 entries)                           │
│  ├─ Current Streak: 🔥 7 days                                      │
│  ├─ Longest Streak: 🏆 23 days (Feb 1 - Feb 23)                   │
│  └─ Average: 12 entries/month                                      │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ ←/→: Change Year | Click Month: Filter | q: Back to Browse         │
└─────────────────────────────────────────────────────────────────────┘
```

**Features**:

- One character per day (░ empty, ▓ has entry)
- Navigate between years with ←/→
- Click month name to filter by that month
- Comprehensive statistics sidebar
- Visual density map

### FR4.5: Streak Counter

Add streak tracking to encourage daily journaling:

**Display in Header** (all views):

```
┌─────────────────────────────────────────────────────────┐
│  📔 Browse Your Journals    🔥 Streak: 7 days | 145 total│
├─────────────────────────────────────────────────────────┤
```

**Detailed Streak Stats** (press 's'):

```
┌─────────────────────────────────────────────────────────┐
│  📊 Journaling Statistics                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Current Streak        🔥 7 days                        │
│  Longest Streak        🏆 23 days                       │
│  Total Entries         📝 145                           │
│                                                         │
│  This Week             6 entries (86%)                  │
│  This Month            18 entries (58%)                 │
│  This Year             145 entries (40%)                │
│                                                         │
│  Average per Week      3.2 entries                      │
│  Average per Month     12.1 entries                     │
│                                                         │
│  First Entry           January 5, 2025                  │
│  Latest Entry          December 20, 2025                │
│  Days Since First      349 days                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ Press any key to close                                  │
└─────────────────────────────────────────────────────────┘
```

**Streak Calculation**:

- **Current Streak**: Consecutive days with entries (working backward from today)
- Include today if journal exists
- Reset to 0 if yesterday has no entry
- **Longest Streak**: Historical maximum

### FR4.6: Quick Date Jump

| Key | Action     | Description      |
| --- | ---------- | ---------------- |
| g   | Go to Date | Open date picker |

**Date Picker**:

```
┌─────────────────────────────────────────────────────────┐
│  📅 Jump to Date                                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Enter date (YYYY-MM-DD): 2025-03-15_                  │
│                                                         │
│  Or try:                                                │
│    - "today" / "yesterday"                              │
│    - "+7" (7 days from now)                             │
│    - "-30" (30 days ago)                                │
│    - "2025-06" (first day of June 2025)                │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ Enter: Jump | Esc: Cancel                               │
└─────────────────────────────────────────────────────────┘
```

**Behavior**:

- Parse various date formats
- Reuse existing `date.ts` parsing logic
- Jump to date in current view (list or calendar)
- Show error for invalid dates

### FR4.7: Multi-Select & Bulk Actions

Enable selecting multiple journals for bulk operations:

| Key    | Action        | Description                 |
| ------ | ------------- | --------------------------- |
| Space  | Toggle Select | Mark/unmark current journal |
| a      | Select All    | Select all visible journals |
| Ctrl+d | Deselect All  | Clear all selections        |

**Visual Indicator**:

```
┌─────────────────────────────────────────────────────────┐
│  📔 Browse Your Journals              3 selected        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ☑ December 20, 2025 (20251220.md)                      │  ← Selected
│ ☐ December 18, 2025 (20251218.md)                      │
│ ☑ December 15, 2025 (20251215.md)                      │  ← Selected
│ ☑ December 10, 2025 (20251210.md)                      │  ← Selected
│                                                         │
├─────────────────────────────────────────────────────────┤
│ Space: Toggle | D: Delete Selected | Esc: Clear        │
└─────────────────────────────────────────────────────────┘
```

**Bulk Actions**:

- **D** (capital): Delete all selected journals (with confirmation)
- **E** (capital): Export selected journals to single file
- Show count of selected journals in header

### FR4.8: Export Feature

Export journals in various formats:

| Key | Action | Description      |
| --- | ------ | ---------------- |
| x   | Export | Open export menu |

**Export Menu**:

```
┌─────────────────────────────────────────────────────────┐
│  Export Journals                                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  What to export?                                        │
│  > Current selection (3 journals)                       │
│    All journals (145 journals)                          │
│    Filtered journals (12 journals)                      │
│    Current month (18 journals)                          │
│                                                         │
│  Format:                                                │
│  > Single Markdown file                                 │
│    Separate files (ZIP)                                 │
│    PDF                                                  │
│    Plain text                                           │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ ↑/↓: Select | Enter: Export | Esc: Cancel              │
└─────────────────────────────────────────────────────────┘
```

## Technical Implementation

### New Components

```
src/components/
├── SearchBar.tsx              # Search input with live filtering
├── FilterMenu.tsx             # Date range filter UI
├── PreviewPane.tsx            # Split pane journal preview
├── YearOverview.tsx           # GitHub-style heatmap
├── StatsPanel.tsx             # Detailed statistics
├── DatePicker.tsx             # Quick date jump
├── MultiSelect.tsx            # Checkbox selection mode
└── ExportMenu.tsx             # Export options
```

### New Services

```
src/services/
├── search.ts                  # Full-text search logic
├── analytics.ts               # Streak and statistics calculations
└── export.ts                  # Export to various formats
```

### Search Implementation

```typescript
interface SearchResult {
  journal: JournalFile;
  snippet: string; // Matching context
  matchIndex: number; // Position of match
  score: number; // Relevance score
}

function searchJournals(query: string, journals: JournalFile[]): SearchResult[];
```

### Analytics Implementation

```typescript
interface JournalStats {
  totalEntries: number;
  currentStreak: number;
  longestStreak: number;
  averagePerWeek: number;
  averagePerMonth: number;
  thisWeek: { count: number; percentage: number };
  thisMonth: { count: number; percentage: number };
  thisYear: { count: number; percentage: number };
  firstEntry?: Date;
  latestEntry?: Date;
  mostActiveMonth: { month: string; count: number };
  leastActiveMonth: { month: string; count: number };
}

function calculateStats(journals: JournalFile[]): JournalStats;
function calculateStreak(journals: JournalFile[]): {
  current: number;
  longest: number;
};
```

## User Stories

### US4.1: Find Old Entries by Content

```
As a user with years of journals,
I want to search for entries containing specific words or phrases,
So that I can find relevant entries without browsing chronologically
```

**Acceptance Criteria**:

- / key opens search mode
- Results filter as I type
- Matching snippets are shown
- Can open results directly

### US4.2: Track Journaling Habit

```
As a user trying to build a daily journaling habit,
I want to see my current streak and statistics,
So that I stay motivated to write daily
```

**Acceptance Criteria**:

- Streak counter visible in header
- Detailed stats available via 's' key
- Streaks calculate correctly
- Year overview shows patterns

### US4.3: Focus on Recent Entries

```
As a user,
I want to filter journals by date range (this week, this month, etc.),
So that I can focus on recent entries without scrolling
```

**Acceptance Criteria**:

- 'f' opens filter menu
- Preset ranges available
- Custom range supported
- Filter indicator shows active filter

### US4.4: Preview Before Opening

```
As a user browsing many journals,
I want to see a preview of the journal as I navigate,
So that I can find the right entry without opening each one
```

**Acceptance Criteria**:

- 'p' toggles preview pane
- Preview updates in real-time
- Preview is scrollable
- Word count shown

## Testing Checklist

### Search

- [ ] Search mode opens with '/'
- [ ] Results filter in real-time
- [ ] Search is case-insensitive
- [ ] Matching snippets displayed
- [ ] Can navigate and open results
- [ ] Empty state for no matches
- [ ] Handles special characters
- [ ] Performance good with 1000+ journals

### Filter

- [ ] Filter menu opens with 'f'
- [ ] All preset ranges work correctly
- [ ] Custom range input works
- [ ] Filter badge shows in header
- [ ] Can clear filter
- [ ] Filter persists across views

### Preview Pane

- [ ] Preview toggles with 'p'
- [ ] Layout adjusts correctly
- [ ] Preview updates as selection moves
- [ ] Long content scrollable
- [ ] Word/character count accurate
- [ ] Markdown renders correctly

### Analytics

- [ ] Streak counter displays correctly
- [ ] Current streak calculates correctly
- [ ] Longest streak is accurate
- [ ] Stats panel shows all metrics
- [ ] Year overview renders correctly
- [ ] Statistics update after changes

### Other Features

- [ ] Date picker works with 'g'
- [ ] Multi-select mode works
- [ ] Bulk delete requires confirmation
- [ ] Export menu functions
- [ ] All exports generate correctly

## Definition of Done

- [ ] All functional requirements implemented
- [ ] Search and filter work correctly
- [ ] Preview pane functional
- [ ] Analytics and streaks accurate
- [ ] Export feature works
- [ ] All user stories completed
- [ ] Testing checklist passed
- [ ] Performance acceptable with large datasets
- [ ] Code reviewed and merged
- [ ] Documentation updated

## Future Enhancements (Beyond Milestone 4)

- Tags and categories
- Full markdown preview (with syntax highlighting)
- Cloud sync integration
- Journal templates
- AI-powered insights
- Mood tracking
- Attachment support
