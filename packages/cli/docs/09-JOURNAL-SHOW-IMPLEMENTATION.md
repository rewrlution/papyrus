# Journal Show Implementation - Interactive Viewer

**Learn how to build an interactive journal viewer with keyboard navigation and virtual scrolling**

## Overview

The journal show command displays journal entries in an interactive terminal viewer with:

- **Vertical scrolling** - Navigate through long journal entries
- **Horizontal panning** - View long lines without wrapping
- **Line numbers** - Easy reference for each line
- **Keyboard navigation** - Multiple navigation methods (arrows, vim keys, page controls)
- **Virtual scrolling** - High performance even with 1000+ line journals
- **Sticky UI** - Header and footer always visible

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Command Layer                         │
│  (src/commands/journal/show.ts)                         │
│                                                          │
│  • Parse date input                                      │
│  • Validate entry exists                                 │
│  • Render JournalViewer component                        │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│                  UI Component Layer                      │
│  (src/components/JournalViewer.tsx)                     │
│                                                          │
│  • useState for scroll position                          │
│  • useInput for keyboard handling                        │
│  • Virtual scrolling (only render visible lines)         │
│  • Sticky header/footer layout                           │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│                   Utility Layer                          │
│  (src/utils/date.ts)                                    │
│                                                          │
│  • formatDateHeader() - Format date for header           │
└─────────────────────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│                   Storage Layer                          │
│  (src/lib/storage/journal-storage.ts)                  │
│                                                          │
│  • Load journal content                                  │
│  • Check if entry exists                                 │
└─────────────────────────────────────────────────────────┘
```

## Example Output

```
┌─────────────────────────────────────────────────────────────┐
│ # January 4, 2026 (Saturday)           Line 20/234 (9%)    │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│   1 │ Today was incredibly productive. I finished...        │
│   2 │ the token management system and wrote a...            │
│   3 │ comprehensive tutorial about it.                      │
│   4 │                                                       │
│   5 │ Key achievements:                                     │
│   6 │ - JWT token utilities (pure functions)               │
│   7 │ - Reusable auth middleware                            │
│   8 │ - Complete tutorial with examples                     │
│   9 │                                                       │
│  10 │ [... more visible lines ...]                          │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ ↑↓/jk Scroll • ←→/hl Pan • 0 Home • PgUp/PgDn Page • q   │
└─────────────────────────────────────────────────────────────┘
```

## Implementation

### Step 1: JournalViewer Component

The core component handles all UI and interaction logic.

**File: `src/components/JournalViewer.tsx`**

```typescript
import { Box, Text, useInput, useApp } from 'ink';
import React, { useState, useMemo } from 'react';

import { formatDateHeader } from '../utils/date.js';

interface JournalViewerProps {
  date: string; // YYYYMMDD format
  content: string;
}

export const JournalViewer = ({ date, content }: JournalViewerProps) => {
  const { exit } = useApp();

  // Split content into lines (memoized for performance)
  const contentLines = useMemo(() => content.split('\n'), [content]);

  // Viewport configuration
  const terminalHeight = process.stdout.rows || 24;
  const terminalWidth = process.stdout.columns || 120;
  const headerHeight = 3;
  const footerHeight = 2;
  const visibleLines = terminalHeight - headerHeight - footerHeight;

  // Calculate content width
  const borderWidth = 2;
  const paddingWidth = 2;
  const lineNumberWidth = 7; // "   1 │ "
  const contentWidth =
    terminalWidth - borderWidth - paddingWidth - lineNumberWidth;

  // Scroll state
  const [scrollOffset, setScrollOffset] = useState(0);
  const [horizontalOffset, setHorizontalOffset] = useState(0);
  const maxScroll = Math.max(0, contentLines.length - visibleLines);

  // Keyboard navigation
  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      exit();
      return;
    }

    // Vertical navigation
    if (key.downArrow || input === 'j') {
      setScrollOffset((prev) => Math.min(prev + 1, maxScroll));
      setHorizontalOffset(0);
    }

    if (key.upArrow || input === 'k') {
      setScrollOffset((prev) => Math.max(prev - 1, 0));
      setHorizontalOffset(0);
    }

    if (key.pageDown || input === ' ') {
      setScrollOffset((prev) => Math.min(prev + visibleLines, maxScroll));
      setHorizontalOffset(0);
    }

    if (key.pageUp) {
      setScrollOffset((prev) => Math.max(prev - visibleLines, 0));
      setHorizontalOffset(0);
    }

    if (key.home || input === 'g') {
      setScrollOffset(0);
      setHorizontalOffset(0);
    }

    if (key.end || input === 'G') {
      setScrollOffset(maxScroll);
      setHorizontalOffset(0);
    }

    // Horizontal navigation
    if (key.leftArrow || input === 'h') {
      setHorizontalOffset((prev) => Math.max(prev - 10, 0));
    }

    if (key.rightArrow || input === 'l') {
      setHorizontalOffset((prev) => prev + 10);
    }

    if (input === '0') {
      setHorizontalOffset(0);
    }
  });

  // Virtual scrolling
  const visibleContent = contentLines.slice(
    scrollOffset,
    scrollOffset + visibleLines
  );

  // Progress calculation
  const lastVisibleLine = Math.min(
    scrollOffset + visibleLines,
    contentLines.length
  );
  const progress = Math.round((lastVisibleLine / contentLines.length) * 100);

  return (
    <Box flexDirection="column" height={terminalHeight}>
      {/* Header */}
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="cyan"
        paddingX={1}
      >
        <Box justifyContent="space-between">
          <Text bold color="cyan">
            # {formatDateHeader(date)}
          </Text>
          <Text dimColor>
            Line {lastVisibleLine}/{contentLines.length} ({progress}%)
          </Text>
        </Box>
      </Box>

      {/* Content */}
      <Box
        flexDirection="column"
        flexGrow={1}
        borderStyle="round"
        borderColor="gray"
        paddingX={1}
      >
        {visibleContent.map((line, idx) => {
          const lineNumber = scrollOffset + idx + 1;
          const lineNumberStr = lineNumber.toString().padStart(4, ' ');
          const visiblePortion = line.substring(
            horizontalOffset,
            horizontalOffset + contentWidth
          );

          return (
            <Box key={lineNumber} flexDirection="row">
              <Text dimColor>{lineNumberStr} │ </Text>
              <Text>{visiblePortion || ' '}</Text>
            </Box>
          );
        })}
      </Box>

      {/* Footer */}
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="cyan"
        paddingX={1}
      >
        <Text dimColor>
          ↑↓/jk Scroll • ←→/hl Pan • 0 Home • PgUp/PgDn Page • g/G Top/Bot •
          q Quit
          {horizontalOffset > 0 && ` • Col ${horizontalOffset + 1}+`}
        </Text>
      </Box>
    </Box>
  );
};
```

### Step 2: Command Integration

**File: `src/commands/journal/show.ts`**

```typescript
import { render } from 'ink';
import React from 'react';

import { JournalViewer } from '../../components/JournalViewer.js';
import { journalStore } from '../../lib/storage/index.js';
import { formatDate, parseDate } from '../../utils/date.js';
import { ShowOptions } from '../types.js';

export async function showEntry(options: ShowOptions): Promise<void> {
  const dateInput = options.date;
  const date = parseDate(dateInput);
  const displayDate = formatDate(date);

  if (!date) {
    console.error(`Error: Invalid date "${dateInput}"`);
    console.error(
      'Use formats like: today, yesterday, tomorrow, or YYYYMMDD (e.g., 20260104)'
    );
    process.exit(1);
  }

  // Check if entry exists
  if (!journalStore.exists(date)) {
    console.error(`No journal entry found for ${displayDate}`);
    console.error(`Run 'papyrus add -d ${date}' to create one`);
    process.exit(1);
  }

  // Load the entry
  const content = journalStore.load(date);
  if (!content) {
    console.error(`Error: Failed to load journal entry for ${date}`);
    process.exit(1);
  }

  // Render interactive viewer
  const { waitUntilExit } = render(
    React.createElement(JournalViewer, { date, content })
  );

  await waitUntilExit();
}
```

## Key Design Decisions

### 1. Virtual Scrolling

**Why:** Performance with large journals (1000+ lines)

**How:** Only render visible lines using array slicing

```typescript
const visibleContent = contentLines.slice(
  scrollOffset,
  scrollOffset + visibleLines
);
```

**Benefit:**

- No performance degradation with large files
- Constant memory usage
- Smooth scrolling

### 2. Horizontal Panning (No Wrapping)

**Why:** Simpler logic, predictable behavior

**How:** Use `substring()` to slice each line horizontally

```typescript
const visiblePortion = line.substring(
  horizontalOffset,
  horizontalOffset + contentWidth
);
```

**Benefits:**

- Each content line = 1 display row (1:1 mapping)
- No line skipping bugs
- Traditional pager UX (like `less`)
- Simple implementation

**Alternative (rejected):** Text wrapping

- Complex wrapping calculations
- Line numbers don't match (wrapped lines create multiple display rows)
- Hard to implement "jump to line N"
- More bugs (off-by-one errors)

### 3. Line Numbers

**Why:** Easy reference and navigation

**Format:** `"   1 │ "` (4 digits, right-aligned, space-padded)

**Implementation:**

```typescript
const lineNumber = scrollOffset + idx + 1;
const lineNumberStr = lineNumber.toString().padStart(4, ' ');
```

**Benefits:**

- Clear visual separation from content
- Support up to 9999 lines
- Easy to reference specific lines

### 4. React Keys (Critical!)

**Problem:** Using `scrollOffset + idx` as React key causes stale content bug

**Why it fails:**

```typescript
// BAD: Keys overlap between renders
// Initial: Line 1 has key 0, Line 2 has key 1
// After scroll: Line 2 has key 1 (same!), Line 3 has key 2 (same!)
// React reuses components and shows old content
<Box key={scrollOffset + idx}>...</Box>
```

**Solution:** Use line number as key (unique, stable identifier)

```typescript
// GOOD: Each line always has the same key
const lineNumber = scrollOffset + idx + 1;
<Box key={lineNumber}>...</Box>
```

**Lesson:** When rendering a window/slice of data, use unique identifiers from the data itself, not array indices.

### 5. Progress Calculation

**Why based on last visible line:**

When viewing lines 1-20 of a 234-line file, you've read up to line 20, not line 1.

```typescript
// Show progress of LAST visible line
const lastVisibleLine = Math.min(
  scrollOffset + visibleLines,
  contentLines.length
);
const progress = Math.round((lastVisibleLine / contentLines.length) * 100);
```

**Result:**

- Viewing lines 1-11 of 11: Shows "Line 11/11 (100%)" ✓
- Viewing lines 1-20 of 234: Shows "Line 20/234 (9%)" ✓

### 6. Auto-Reset Horizontal Position

**Why:** Better UX when moving vertically

```typescript
// Reset to start of line when scrolling vertically
if (key.downArrow || input === 'j') {
  setScrollOffset((prev) => Math.min(prev + 1, maxScroll));
  setHorizontalOffset(0); // Reset!
}
```

**Benefit:** Users start fresh on each line instead of being confused by mid-line positions.

### 7. Multiple Navigation Methods

**Support both casual and power users:**

| Action    | Casual | Power User |
| --------- | ------ | ---------- |
| Down      | ↓      | j          |
| Up        | ↑      | k          |
| Left      | ←      | h          |
| Right     | →      | l          |
| Top       | Home   | g          |
| Bottom    | End    | G          |
| Page Down | PgDn   | Space      |
| Page Up   | PgUp   | PgUp       |

## Usage Examples

### View today's entry

```bash
$ papyrus show

# Interactive viewer opens
# Press ↑/↓ or j/k to scroll
# Press ←/→ or h/l to pan horizontally
# Press q to quit
```

### View specific date

```bash
$ papyrus show -d 20260101
$ papyrus show -d yesterday
$ papyrus show -d "-7"  # 7 days ago
```

### Entry not found

```bash
$ papyrus show -d yesterday

Error: No journal entry found for January 3, 2026 (Friday)
Run 'papyrus add -d 20260103' to create one
```

## Keyboard Reference

| Key           | Action                |
| ------------- | --------------------- |
| ↓ or j        | Scroll down one line  |
| ↑ or k        | Scroll up one line    |
| → or l        | Pan right (10 chars)  |
| ← or h        | Pan left (10 chars)   |
| 0             | Jump to start of line |
| PgDn or Space | Page down             |
| PgUp          | Page up               |
| Home or g     | Jump to top           |
| End or G      | Jump to bottom        |
| q or Esc      | Quit viewer           |

## Common Issues and Solutions

### Issue 1: Lines Showing Stale Content

**Symptom:** After scrolling, some lines show old content or text appears corrupted

**Cause:** React key collision (using `scrollOffset + idx` as key)

**Solution:** Use line number as React key

```typescript
// GOOD
const lineNumber = scrollOffset + idx + 1;
<Box key={lineNumber}>...</Box>

// BAD
<Box key={scrollOffset + idx}>...</Box>
```

### Issue 2: Long Lines Cut Off

**Symptom:** Text disappears after terminal width

**Solution:** Use horizontal navigation

- Press → or l to pan right
- Press ← or h to pan left
- Press 0 to jump to start of line
- Footer shows "Col 51+" when panned

### Issue 3: Slow Performance

**Symptom:** Laggy scrolling with large journals

**Cause:** Rendering all lines instead of virtual scrolling

**Solution:** Only render visible lines

```typescript
// GOOD: Virtual scrolling
const visibleContent = contentLines.slice(
  scrollOffset,
  scrollOffset + visibleLines
);

// BAD: Render everything
{contentLines.map(...)}
```

### Issue 4: Can't Scroll to Bottom

**Symptom:** Last lines not reachable

**Cause:** Incorrect maxScroll calculation

**Solution:** Use Math.max to handle edge cases

```typescript
const maxScroll = Math.max(0, contentLines.length - visibleLines);
```

## Testing

### Manual Testing

```bash
# Test short entry (< 1 screen)
$ papyrus add -d today
[Write: "Short entry"]
$ papyrus show
[Verify: Shows all content, progress at 100%]
[Try: Arrow keys do nothing (already viewing all content)]
[Press: q to quit]

# Test long entry (requires scrolling)
$ papyrus add -d yesterday
[Write: 100+ lines of content]
$ papyrus show -d yesterday
[Verify: Header shows "Line X/100+"]
[Try: ↓ to scroll down, progress increases]
[Try: PgDn to page down]
[Try: End to jump to bottom, progress shows 100%]
[Try: Home to jump back to top]
[Press: q to quit]

# Test horizontal panning
$ papyrus add -d "-1"
[Write: Line with 200+ characters]
$ papyrus show -d "-1"
[Verify: Long line is cut off at terminal width]
[Try: → to pan right, see more text]
[Try: ← to pan left]
[Try: 0 to jump back to start]
[Verify: Footer shows "Col X+" when panned]
[Press: q to quit]
```

### Edge Cases

```bash
# Empty entry
$ papyrus add -d today
[Save without writing anything]
$ papyrus show
[Should show empty content area]

# Single line entry
$ papyrus add -d today
[Write: "One line"]
$ papyrus show
[Should show "Line 1/1 (100%)"]

# Very long journal (1000+ lines)
$ papyrus add -d today
[Write: Generate 1000+ lines]
$ papyrus show
[Should scroll smoothly without lag]
```

## Future Enhancements

### 1. Search Functionality

Add ability to search within entry:

- Press `/` to enter search mode
- Type query and press Enter
- Jump to next match
- Highlight matches

### 2. Syntax Highlighting

Highlight markdown syntax:

- Headers in cyan
- Lists in yellow
- Links in blue
- Code blocks in gray

### 3. Section Navigation

Navigate between markdown headers:

- Press `n` to jump to next header
- Press `p` to jump to previous header
- Show section outline in header

### 4. Export

Add export functionality:

- Press `e` to export to file
- Support formats: txt, md, pdf, html

### 5. Split View

Compare two journal entries side by side:

```bash
$ papyrus show -d today -d yesterday
```

## Summary

The JournalViewer provides a robust, performant, and user-friendly way to view journal entries:

✅ **Virtual scrolling** - Handles 1000+ line journals smoothly
✅ **Horizontal panning** - View long lines without wrapping
✅ **Line numbers** - Easy reference for each line
✅ **Multiple navigation methods** - Arrows, vim keys, page controls
✅ **Sticky UI** - Header and footer always visible
✅ **Progress indicator** - Shows current position
✅ **Auto-reset horizontal** - Better UX when moving vertically

**Key Takeaways:**

1. **Virtual scrolling is essential** for performance with large files
2. **Horizontal panning is simpler** than text wrapping (no line skipping bugs)
3. **React keys must be unique** - use line numbers, not array indices
4. **Progress from last visible line** - more intuitive than first line
5. **Multiple navigation methods** - serve both casual and power users
6. **Auto-reset horizontal position** - better UX when scrolling vertically

Happy journaling! 📖
