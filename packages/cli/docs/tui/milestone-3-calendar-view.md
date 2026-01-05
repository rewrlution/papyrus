# Milestone 3: Calendar View & View Switching

**Timeline**: Week 3-4
**Status**: Not Started
**Dependencies**: Milestone 2 complete
**Goal**: Add visual calendar navigation and dual-view mode

## Overview

Introduce a month calendar view that visualizes journaling patterns. Users can toggle between list view and calendar view, navigate months, and select dates directly from the calendar grid. This milestone significantly enhances the browsing experience for users who think in terms of dates and patterns.

## Functional Requirements

### FR3.1: Calendar View Mode

Add a new view mode alongside the existing list view:

```
┌─────────────────────────────────────────────────────────┐
│  📅 December 2025                     Total: 12 entries │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   Mo   Tu   We   Th   Fr   Sa   Su                    │
│    1    2    3    4    5    6    7                     │
│    ✓    ○    ✓    ○    ✓    ○    ○                     │
│                                                         │
│    8    9   10   11   12   13   14                     │
│    ○    ✓    ○    ○    ✓    ✓    ○                     │
│                                                         │
│   15   16   17   18  [19]  20   21                     │
│    ✓    ○    ○    ✓    ⦿    ✓    ○                     │
│                                                         │
│   22   23   24   25   26   27   28                     │
│    ○    ○    ○    ○    ○    ○    ○                     │
│                                                         │
│   29   30   31                                          │
│    ○    ○    ○                                          │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ ←/→: Month | ↑/↓: Week | Enter: Open | Tab: List View │
└─────────────────────────────────────────────────────────┘
```

**Calendar Elements**:

- Month/year header
- 7-column grid (Mon-Sun)
- Each date shows:
  - Day number (1-31)
  - Journal indicator below number
- Visual indicators:
  - `✓` - Journal exists for this day
  - `○` - No journal for this day
  - `⦿` - Today (filled circle, highlighted)
  - `[19]` - Selected date (brackets around number)

### FR3.2: View Toggle

| Key       | Action      | Description                           |
| --------- | ----------- | ------------------------------------- |
| Tab       | Toggle View | Switch between List and Calendar view |
| Shift+Tab | Toggle View | Alternative (same as Tab)             |

**Behavior**:

- Pressing Tab switches between views
- **List → Calendar**: Calendar shows month of currently selected journal
- **Calendar → List**: List selects the date that was selected in calendar
- View preference persists during session (not across restarts)
- Footer updates to show context-appropriate shortcuts

### FR3.3: Calendar Navigation

#### Date Navigation

| Key | Action        | Description                |
| --- | ------------- | -------------------------- |
| ↑   | Previous Week | Move selection up 7 days   |
| ↓   | Next Week     | Move selection down 7 days |
| ←   | Previous Day  | Move selection left 1 day  |
| →   | Next Day      | Move selection right 1 day |
| h   | Previous Day  | Vim-style alternative      |
| j   | Next Week     | Vim-style alternative      |
| k   | Previous Week | Vim-style alternative      |
| l   | Next Day      | Vim-style alternative      |

**Behavior**:

- Arrow keys navigate within the calendar grid
- Navigation wraps to previous/next month when moving beyond boundaries
- Example: Left arrow on Dec 1 → Nov 30
- Selected date always visible and highlighted

#### Month Navigation

| Key    | Action         | Description            |
| ------ | -------------- | ---------------------- |
| < or , | Previous Month | Go back one month      |
| > or . | Next Month     | Go forward one month   |
| [      | Previous Year  | Jump back 12 months    |
| ]      | Next Year      | Jump forward 12 months |

**Behavior**:

- Month change keeps selected day when possible
- Example: Dec 20 → Jan 20 → Feb 20
- If day doesn't exist in new month (e.g., Feb 31), use last day of month
- Calendar redraws with new month

#### Quick Jump

| Key  | Action        | Description          |
| ---- | ------------- | -------------------- |
| Home | Jump to Today | Select today's date  |
| t    | Jump to Today | Alternative shortcut |

**Behavior**:

- Instantly moves to current month and selects today
- Works from any month/year in calendar

### FR3.4: Calendar Actions

#### Open/Create Journal from Calendar

| Key   | Action       | Description                              |
| ----- | ------------ | ---------------------------------------- |
| Enter | Open Journal | Read if exists, create if not            |
| Space | Read Only    | Read if exists, show error if not        |
| e     | Edit Journal | Edit if exists, create if not            |
| n     | New Journal  | Create for selected date (if not exists) |

**Behavior - Enter Key**:

1. If journal exists for selected date: Open in read view
2. If journal doesn't exist: Open editor to create new journal
3. After action, return to calendar with same date selected

**Behavior - Space Key**:

1. If journal exists: Open in read view
2. If journal doesn't exist: Show error "No journal for this date"
3. Stay in calendar view

### FR3.5: Calendar Statistics

Show monthly statistics in the header:

```
┌─────────────────────────────────────────────────────────┐
│  📅 December 2025        12 entries | 39% filled       │
├─────────────────────────────────────────────────────────┤
```

**Statistics to Show**:

- **Entries this month**: Count of journals in displayed month
- **Fill percentage**: (entries / days in month) × 100
- **Total entries**: Overall count (same as list view)

### FR3.6: Visual Design Details

#### Date Cell Layout

```
Each cell is 6 characters wide:

┌────┐
│ 15 │  ← Day number (2 chars, right-aligned)
│ ✓  │  ← Indicator (1 char, centered)
└────┘
```

#### Selection Styles

- **Selected date**: Inverse/highlighted cell
- **Today**: Different color (blue/cyan) + ⦿ indicator
- **Selected + Today**: Combined (inverse + blue)

#### Grid Alignment

- Dates right-aligned within cell
- Indicators centered below date
- Consistent spacing between columns
- Clear visual separation between weeks

### FR3.7: Responsive Layout

**Minimum Terminal Width**: 60 characters

```
┌──────────────────────────────────────────────────────┐
│ 📅 Dec 2025              12 entries              │
├──────────────────────────────────────────────────────┤
│  Mo  Tu  We  Th  Fr  Sa  Su                       │
│   1   2   3   4   5   6   7                       │
│   ✓   ○   ✓   ○   ✓   ○   ○                       │
```

**Wide Terminal** (80+ characters):

```
┌─────────────────────────────────────────────────────────────────────┐
│  📅 December 2025                      12 entries | 39% filled     │
├─────────────────────────────────────────────────────────────────────┤
│    Mon    Tue    Wed    Thu    Fri    Sat    Sun                  │
│     1      2      3      4      5      6      7                    │
```

## Technical Implementation

### Component Structure

```
src/components/
├── Browser.tsx                    # Add view state and toggle
├── CalendarView.tsx               # NEW: Main calendar component
├── CalendarHeader.tsx             # NEW: Month/year + stats
├── CalendarGrid.tsx               # NEW: Date grid rendering
├── CalendarCell.tsx               # NEW: Individual date cell
├── CalendarFooter.tsx             # NEW: Keyboard hints for calendar
└── BrowserFooter.tsx              # Update for view context
```

### State Management

```typescript
interface BrowserState {
  // Existing state
  journals: JournalFile[];
  selectedIndex: number;
  selectedJournal?: JournalFile;
  deleteMode: boolean;
  statusMessage?: StatusMessage;

  // NEW: View management
  view: 'list' | 'calendar' | 'reader';

  // NEW: Calendar state
  calendarDate: Date; // Currently displayed month
  selectedCalendarDate: Date; // Selected date in calendar
}
```

### Calendar Data Structure

```typescript
interface CalendarDay {
  date: Date; // Actual date
  dayOfMonth: number; // 1-31
  hasJournal: boolean; // Journal exists
  isToday: boolean; // Is current day
  isSelected: boolean; // Currently selected
  inCurrentMonth: boolean; // Vs. overflow from prev/next month
}

interface CalendarMonth {
  year: number;
  month: number; // 0-11
  weeks: CalendarDay[][]; // 2D array of weeks
  totalDays: number;
  daysWithJournals: number;
  fillPercentage: number;
}
```

### Key Functions

```typescript
// Generate calendar data for a given month
function generateCalendarMonth(
  year: number,
  month: number,
  journals: JournalFile[]
): CalendarMonth;

// Check if date has journal
function hasJournalForDate(date: Date, journals: JournalFile[]): boolean;

// Convert between calendar date and journal filename
function dateToJournalName(date: Date): string; // "20251220"
function journalNameToDate(name: string): Date;

// Navigation helpers
function moveToNextMonth(date: Date): Date;
function moveToPreviousMonth(date: Date): Date;
function moveToDate(
  current: Date,
  direction: 'up' | 'down' | 'left' | 'right'
): Date;
```

### Libraries

- `date-fns` - Date manipulation and formatting
  - `getDaysInMonth()`, `startOfMonth()`, `endOfMonth()`
  - `addMonths()`, `subMonths()`, `addDays()`, `subDays()`
  - `format()`, `isSameDay()`, `isToday()`

## User Stories

### US3.1: Visual Journal Pattern Overview

```
As a long-term journaler,
I want to see a calendar showing which days I wrote entries,
So that I can visualize my journaling consistency and patterns
```

**Acceptance Criteria**:

- Calendar shows all days of current month
- Days with journals are clearly marked (✓)
- Empty days are clearly marked (○)
- Today is highlighted

### US3.2: Navigate by Date

```
As a user,
I want to use arrow keys to move between dates in the calendar,
So that I can quickly find and open a specific date's journal
```

**Acceptance Criteria**:

- Arrow keys move selection through dates
- Can navigate to previous/next months
- Can jump to today with Home key
- Enter key opens selected date

### US3.3: Switch Between Views

```
As a user,
I want to press Tab to switch between list and calendar views,
So that I can use whichever view suits my current task
```

**Acceptance Criteria**:

- Tab toggles between views
- Context is preserved (selected date/journal)
- Both views remain functional
- Keyboard shortcuts update appropriately

### US3.4: Quick Date Entry Creation

```
As a user reviewing my past journals,
I want to select an empty date and press Enter to create an entry,
So that I can fill in missed days retrospectively
```

**Acceptance Criteria**:

- Can select any date in calendar
- Enter on empty date opens editor
- New journal appears in calendar (✓)
- Can do this for dates in the past

## Testing Checklist

### Calendar Rendering

- [ ] Calendar displays correct month/year
- [ ] All dates in month are shown
- [ ] Week starts on Monday (or configurable)
- [ ] Today is highlighted correctly
- [ ] Journal indicators (✓/○) are correct
- [ ] Selected date is clearly visible
- [ ] Layout is aligned and readable

### Calendar Navigation

- [ ] Arrow keys move selection correctly
- [ ] Week navigation (up/down) works
- [ ] Day navigation (left/right) works
- [ ] Navigation wraps to prev/next month
- [ ] < / > keys change months
- [ ] [ / ] keys change years
- [ ] Home key jumps to today

### View Switching

- [ ] Tab toggles between list and calendar
- [ ] Context preserved when switching
- [ ] Footer updates with correct shortcuts
- [ ] Both views remain functional
- [ ] No visual glitches during switch

### Calendar Actions

- [ ] Enter opens journal (read if exists)
- [ ] Enter creates journal (if doesn't exist)
- [ ] Space reads journal (error if not exists)
- [ ] 'e' edits/creates journal
- [ ] 'n' creates new journal
- [ ] Actions work for past, present, future dates

### Statistics

- [ ] Monthly entry count is correct
- [ ] Fill percentage calculated correctly
- [ ] Stats update after create/delete
- [ ] Total count matches list view

### Edge Cases

- [ ] February (28/29 days) renders correctly
- [ ] Month with 31 days renders correctly
- [ ] Calendar works in years 2020-2030
- [ ] Handles leap years correctly
- [ ] Terminal resize doesn't break calendar
- [ ] Works with 0 journals
- [ ] Works with 1000+ journals

## Definition of Done

- [ ] All functional requirements implemented
- [ ] Calendar renders correctly for all months
- [ ] Navigation works smoothly
- [ ] View switching works bidirectionally
- [ ] All actions work from calendar
- [ ] Statistics display correctly
- [ ] All user stories completed
- [ ] Testing checklist passed
- [ ] No visual glitches or bugs
- [ ] Code reviewed and merged
- [ ] Performance acceptable with large journal sets

## Future Enhancements (Deferred to Milestone 4)

- Year overview visualization
- Preview pane next to calendar
- Multi-month view (3 months at once)
- Color coding by journal length/content
- Streak counter and gamification
- Export calendar as image
