# Tutorial: Interactive Journal Viewer with Ink

**Learn how to build an interactive journal viewer with keyboard navigation and virtual scrolling**

## What We're Building

An interactive terminal viewer for displaying journal entries with:

- **Sticky header** always showing date and position indicator
- **Sticky footer** always showing keyboard shortcuts
- **Line numbers** for easy reference and navigation
- **Virtual scrolling** for long content (handles 1000+ lines smoothly)
- **Keyboard navigation** (↑↓, j/k, PgUp/PgDn, Home/End)
- **Consistent UI** regardless of content length
- **Consistent interaction** (always requires 'q' to quit)
- **Cross-platform** (works identically on Windows, Mac, Linux)

### Example Output

**For long content (requires scrolling):**

```
┌─────────────────────────────────────────────────────────────┐
│ # January 4, 2026 (Saturday)           Line 20/234 (8%)    │
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
│ ↑↓/jk Scroll • PgUp/PgDn Page • Home/End Jump • q Quit    │
└─────────────────────────────────────────────────────────────┘
```

**For short content (fits on one screen):**

```
┌─────────────────────────────────────────────────────────────┐
│ # January 4, 2026 (Saturday)          Line 3/3 (100%)      │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│   1 │                                                       │
│   2 │ Quick note for today.                                 │
│   3 │                                                       │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ ↑↓/jk Scroll • PgUp/PgDn Page • Home/End Jump • q Quit    │
└─────────────────────────────────────────────────────────────┘
```

Note: Shows "Line 3/3 (100%)" because you're viewing all 3 lines. Each line is prefixed with its line number for easy reference. The UI looks identical to long content, but scroll keys simply don't move since you're already viewing everything.

## Why Ink for This Feature?

We're using Ink (React for terminals) instead of external pagers (like `less`) because:

### Advantages of Ink Approach

1. **Cross-platform consistency**
   - `less` doesn't exist on Windows by default
   - `more` has limited features and different behavior
   - Ink works identically everywhere

2. **Custom UI control**
   - Sticky header/footer (not possible with `less`)
   - Custom keyboard shortcuts
   - Progress indicators
   - Themed colors matching our app

3. **Better integration**
   - Part of our app, not external process
   - No temp files needed
   - Access to app state (theme, config, etc.)

4. **Consistent dependencies**
   - Already using Ink for login/register
   - No new tech stack
   - React patterns familiar to team

### Trade-offs

**Ink Approach:**

- ✅ Cross-platform
- ✅ Custom UI
- ✅ Integrated experience
- ❌ More code to write
- ❌ Takes over terminal (blocks)

**External Pager (`less`):**

- ✅ Powerful features (search, marks, etc.)
- ✅ Users already know it
- ❌ Not on Windows by default
- ❌ Can't customize UI
- ❌ Inconsistent behavior

**Simple Console Output:**

- ✅ Simplest implementation
- ✅ Works with pipes (`papyrus show | grep`)
- ❌ No navigation for long content
- ❌ Can't see position while reading

### Our Decision

Use **Ink with TTY detection**:

- Interactive terminal: Always show viewer (requires 'q' to quit)
- Piped output: Detect and use simple text output

This provides a consistent, predictable user experience.

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
│  (src/utils/)                                           │
│                                                          │
│  • date.ts - Parse date strings                          │
│  • format.ts - Format headers, calculate progress      │
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

## Prerequisites

**Required:**

- Complete [03 - React CLI Components](./03-REACT-CLI-COMPONENTS.md) - Understanding Ink basics
- Complete [01 - Storage Layer](./01-STORAGE-LAYER.md) - Understanding journal storage

**Assumed knowledge:**

- Basic React (useState, useEffect)
- Keyboard event handling
- Array slicing for virtual scrolling

**Dependencies already installed:**

- `ink` - React for terminals
- `react` - UI framework

## Implementation

### Step 1: Formatting Utilities

First, create utilities for formatting dates and calculating position progress.

```typescript
// src/utils/format.ts

/**
 * Format date string as "Month DD, YYYY (Day)"
 * Example: "20260104" → "January 4, 2026 (Saturday)"
 */
export function formatDateHeader(dateStr: string): string {
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);

  const date = new Date(`${year}-${month}-${day}`);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  };

  return date.toLocaleDateString('en-US', options);
}

/**
 * Calculate percentage through content
 */
export function calculateProgress(
  currentLine: number,
  totalLines: number
): number {
  if (totalLines === 0) return 0;
  return Math.round(((currentLine + 1) / totalLines) * 100);
}
```

**Why separate utilities:**

- **Pure functions** - Easy to test
- **Reusable** - Can use in other commands (list, search, etc.)
- **Single responsibility** - Each function does one thing

### Step 2: Basic Journal Viewer Component

Create the Ink component with virtual scrolling and keyboard navigation.

```typescript
// src/components/JournalViewer.tsx
import { Box, Text, useInput, useApp } from 'ink';
import React, { useState, useMemo } from 'react';

import {
  formatDateHeader,
  calculateProgress,
} from '../utils/format.js';

interface JournalViewerProps {
  date: string; // YYYYMMDD format
  content: string;
}

export const JournalViewer = ({ date, content }: JournalViewerProps) => {
  const { exit } = useApp();

  // Split content into lines
  const contentLines = useMemo(() => content.split('\n'), [content]);

  // Viewport configuration
  const terminalHeight = process.stdout.rows || 24;
  const headerHeight = 3; // Header takes 3 lines
  const footerHeight = 2; // Footer takes 2 lines
  const visibleLines = terminalHeight - headerHeight - footerHeight;

  // Scroll state
  const [scrollOffset, setScrollOffset] = useState(0);
  const maxScroll = Math.max(0, contentLines.length - visibleLines);

  // Keyboard navigation
  useInput((input, key) => {
    // Quit
    if (input === 'q' || key.escape) {
      exit();
      return;
    }

    // Scroll down (↓, j)
    if (key.downArrow || input === 'j') {
      setScrollOffset((prev) => Math.min(prev + 1, maxScroll));
    }

    // Scroll up (↑, k)
    if (key.upArrow || input === 'k') {
      setScrollOffset((prev) => Math.max(prev - 1, 0));
    }

    // Page down (PgDn, Space)
    if (key.pageDown || input === ' ') {
      setScrollOffset((prev) => Math.min(prev + visibleLines, maxScroll));
    }

    // Page up (PgUp)
    if (key.pageUp) {
      setScrollOffset((prev) => Math.max(prev - visibleLines, 0));
    }

    // Jump to top (Home, g)
    if (key.home || input === 'g') {
      setScrollOffset(0);
    }

    // Jump to bottom (End, G)
    if (key.end || input === 'G') {
      setScrollOffset(maxScroll);
    }
  });

  // Virtual scrolling: only render visible lines
  const visibleContent = contentLines.slice(
    scrollOffset,
    scrollOffset + visibleLines
  );

  // Calculate current position info based on LAST visible line
  // This ensures progress shows 100% when all content is visible
  const lastVisibleLine = Math.min(
    scrollOffset + visibleLines,
    contentLines.length
  );
  const progress = calculateProgress(lastVisibleLine - 1, contentLines.length);

  return (
    <Box flexDirection="column" height={terminalHeight}>
      {/* Sticky Header */}
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

      {/* Content Area (scrollable) */}
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
          return (
            <Box key={scrollOffset + idx} flexDirection="row">
              <Text dimColor>{lineNumberStr} │ </Text>
              <Text wrap="wrap">{line || ' '}</Text>
            </Box>
          );
        })}
      </Box>

      {/* Sticky Footer */}
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="cyan"
        paddingX={1}
      >
        {/* Keyboard shortcuts - always show full navigation */}
        <Text dimColor>
          ↑↓/jk Scroll • PgUp/PgDn Page • Home/End Jump • q Quit
        </Text>
      </Box>
    </Box>
  );
};
```

**Key design decisions:**

1. **Virtual scrolling**
   - Only renders visible lines (`contentLines.slice(scrollOffset, ...)`)
   - Handles 10,000+ line journals smoothly
   - No performance issues

2. **Consistent UI**
   - Always show the same header (with position indicator)
   - Always show the same footer (with full navigation shortcuts)
   - UI looks identical regardless of content length
   - Scroll keys simply don't move when viewing all content

3. **Progress calculation based on last visible line**
   - Shows 100% when all content is visible
   - Calculates progress from the **last** visible line, not the first
   - Example: Viewing lines 1-11 of 11 shows "Line 11/11 (100%)"
   - This is more intuitive than showing "Line 1/11 (9%)" when viewing all content

4. **Line numbers for reference**
   - Each line prefixed with its line number (e.g., " 1 │ ")
   - 4-character wide field, right-aligned, space-padded
   - Dimmed color to differentiate from content
   - Separator "│" between line number and content
   - Makes it easy to reference specific lines
   - Line numbers correspond to actual content lines (not wrapped display lines)

5. **Text wrapping enabled**
   - Uses `wrap="wrap"` to wrap long lines within terminal width
   - Prevents text from being cut off in narrow terminals
   - Each content line can wrap to multiple display lines
   - Virtual scrolling still works by content lines, not display lines
   - Line number shows the content line number, even if it wraps

6. **Consistent interaction model**
   - Always requires 'q' to quit (no auto-quit)
   - Predictable behavior for all content lengths
   - User explicitly controls when to exit

7. **Flexible viewport**
   - Calculates visible lines based on terminal height
   - Adapts to resized terminals
   - Reserves space for header/footer

8. **Multiple navigation methods**
   - Arrow keys (intuitive for everyone)
   - vim keys (j/k/g/G for vim users)
   - Page up/down (fast navigation)
   - Home/End (jump to top/bottom)

### Step 3: Command Integration

Now integrate the viewer component into the `show` command.

```typescript
// src/commands/journal/show.ts
import { render } from 'ink';
import React from 'react';

import { ShowOptions } from '../types.js';
import { parseDate } from '../../utils/date.js';
import { journalStore } from '../../lib/storage/index.js';
import { JournalViewer } from '../../components/JournalViewer.js';
import { formatDateHeader } from '../../utils/format.js';

export async function showEntry(options: ShowOptions): Promise<void> {
  const dateInput = options.date || 'today';

  // Parse the date
  const date = parseDate(dateInput);
  if (!date) {
    console.error(`Error: Invalid date "${dateInput}"`);
    console.error(
      'Use formats like: today, yesterday, tomorrow, or YYYYMMDD (e.g., 20260104)'
    );
    process.exit(1);
  }

  // Check if entry exists
  if (!journalStore.exists(date)) {
    console.error(`No journal entry found for ${formatDateHeader(date)}`);
    console.error(`Run 'papyrus add -d ${date}' to create one`);
    process.exit(1);
  }

  // Load the entry
  const content = journalStore.load(date);
  if (!content) {
    console.error(`Error: Failed to load journal entry for ${date}`);
    process.exit(1);
  }

  // Detect if output is piped/redirected (not interactive)
  if (!process.stdout.isTTY) {
    // Simple output for piped/redirected output
    console.log(`\n# ${formatDateHeader(date)}\n`);
    console.log(content);
    console.log(); // Empty line
    return;
  }

  // Render interactive viewer
  const { waitUntilExit } = render(
    React.createElement(JournalViewer, { date, content })
  );

  // Wait for user to quit
  await waitUntilExit();
}
```

**Key features:**

1. **Piped output detection**
   - Checks `process.stdout.isTTY`
   - If piped (`papyrus show | grep`), uses simple output
   - If interactive, uses Ink viewer

2. **Error handling**
   - Validates date format
   - Checks entry exists
   - Provides helpful error messages
   - Suggests next action (`papyrus add -d ...`)

3. **Async handling**
   - Waits for `waitUntilExit()` before returning
   - Ensures Ink component has full control
   - Clean exit after user quits

### Step 4: Export and Type Definitions

Make sure types are properly defined:

```typescript
// src/commands/types.ts (no changes needed)
export interface DateOption {
  date: string;
}

export interface ShowOptions extends DateOption {}
```

### Step 5: Command Registration

The command should already be registered, but here's the complete registration:

```typescript
// src/commands/journal/index.ts
import { Command } from 'commander';

import { showEntry } from './show.js';
// ... other imports

export function registerJournalCommands(program: Command) {
  // ... other commands

  program
    .command('show')
    .description('Display a journal entry')
    .option(
      '-d, --date <date>',
      'Date of the entry to show (default: today)',
      'today'
    )
    .action(async (options) => await showEntry(options));

  // ... other commands
}
```

## User Experience Examples

### Short Entry (< 1 screen)

```bash
$ papyrus show

┌─────────────────────────────────────────────────────┐
│ # January 4, 2026 (Saturday)         Line 5/5 (100%)│
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│   1 │                                                │
│   2 │ Quick note for today.                          │
│   3 │                                                │
│   4 │ Finished the show command implementation.      │
│   5 │                                                │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│ ↑↓/jk Scroll • PgUp/PgDn Page • Home/End Jump • q │
└─────────────────────────────────────────────────────┘

[Shows 100% since all content is visible. Scroll keys do nothing. Press 'q' to quit]
```

### Long Entry (Requires scrolling)

```bash
$ papyrus show -d 20260101

┌─────────────────────────────────────────────────────┐
│ # January 1, 2026 (Thursday)       Line 20/234 (8%)│
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│   1 │ New Year's Day reflections...                  │
│   2 │                                                │
│   3 │ Looking back on 2025, it was an incredible...  │
│   4 │ [... more visible lines with line numbers ...] │
│  20 │                                                │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│ ↑↓/jk Scroll • PgUp/PgDn Page • Home/End Jump • q │
└─────────────────────────────────────────────────────┘

[User can scroll through content, then press 'q' to quit]
```

### Piped Output (Non-interactive)

```bash
$ papyrus show | grep TODO

# January 4, 2026 (Saturday)

Today I worked on several items:
- TODO: Implement search feature
- TODO: Add export functionality

$ papyrus show > journal.txt
[Saves simple text output to file]
```

### Entry Not Found

```bash
$ papyrus show -d yesterday

Error: No journal entry found for January 3, 2026 (Friday)
Run 'papyrus add -d 20260103' to create one
```

## Testing

### Unit Tests for Utilities

```typescript
// tests/utils/format.test.ts
import { describe, it, expect } from 'vitest';
import { formatDateHeader, calculateProgress } from '../../src/utils/format.js';

describe('formatDateHeader', () => {
  it('should format date correctly', () => {
    expect(formatDateHeader('20260104')).toMatch(/January 4, 2026/);
  });

  it('should include day of week', () => {
    expect(formatDateHeader('20260104')).toMatch(/Saturday/);
  });
});

describe('calculateProgress', () => {
  it('should calculate percentage correctly', () => {
    expect(calculateProgress(0, 100)).toBe(1); // Line 1 of 100 = 1%
    expect(calculateProgress(49, 100)).toBe(50); // Line 50 of 100 = 50%
    expect(calculateProgress(99, 100)).toBe(100); // Line 100 of 100 = 100%
  });

  it('should handle zero lines', () => {
    expect(calculateProgress(0, 0)).toBe(0);
  });
});
```

### Integration Tests

```typescript
// tests/commands/show.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { showEntry } from '../../src/commands/journal/show.js';
import { journalStore } from '../../src/lib/storage/index.js';

describe('show command', () => {
  beforeEach(() => {
    // Mock journal storage
    vi.spyOn(journalStore, 'exists').mockReturnValue(true);
    vi.spyOn(journalStore, 'load').mockReturnValue('Test content');
  });

  it('should load journal for today by default', async () => {
    await showEntry({ date: 'today' });
    expect(journalStore.load).toHaveBeenCalled();
  });

  it('should handle non-existent entry', async () => {
    vi.spyOn(journalStore, 'exists').mockReturnValue(false);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });

    await expect(showEntry({ date: 'today' })).rejects.toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should handle invalid date', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });

    await expect(showEntry({ date: 'invalid' })).rejects.toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
```

### Manual Testing

```bash
# Test short entry (UI should look same as long entry)
$ papyrus add -d today
[Write: "Short entry"]
$ papyrus show
[Should display viewer with position indicator and full navigation]
[Scroll keys do nothing since content fits on screen]
[Press: q to quit]

# Test long entry (should allow scrolling)
$ papyrus add -d yesterday
[Write: 100+ lines of content]
$ papyrus show -d yesterday
[Should show identical UI to short entry]
[Press: ↓, j, PgDn, etc. to test navigation - should scroll]
[Position indicator should update as you scroll]
[Press: q to quit]

# Test piped output
$ papyrus show | head -5
[Should show simple text output]

# Test non-existent entry
$ papyrus show -d 20250101
[Should show error with helpful message]
```

## Common Issues

### Issue 1: Component Doesn't Render

**Symptom:**

```bash
$ papyrus show
[Nothing appears, or command hangs]
```

**Cause:** Ink component has error in render method

**Solution:**

1. Check for syntax errors in JSX
2. Verify all imports are correct
3. Check console for React error messages
4. Ensure `process.stdout.isTTY` is true (not piped)

**Debug:**

```typescript
// Add before render
console.log('Is TTY:', process.stdout.isTTY);
console.log('Content length:', content.length);
```

### Issue 2: Keyboard Input Not Working

**Symptom:**

```bash
[Viewer shows but arrow keys don't scroll]
```

**Cause:** `useInput` hook not properly configured

**Solution:**

1. Verify `useInput` is called at component top level
2. Check stdin is in raw mode (Ink handles this)
3. Ensure not running in non-interactive mode

**Debug:**

```typescript
useInput((input, key) => {
  console.log('Input:', input, 'Key:', key); // Debug what's received
  // ... rest of handler
});
```

### Issue 3: Content Doesn't Scroll to Bottom

**Symptom:**

```bash
[Can't reach last lines of content]
```

**Cause:** `maxScroll` calculation incorrect

**Solution:**

```typescript
// Correct calculation
const maxScroll = Math.max(0, contentLines.length - visibleLines);

// NOT this (off by one):
const maxScroll = contentLines.length - visibleLines;
```

### Issue 4: Border Characters Don't Render

**Symptom:**

```bash
[Boxes show as ASCII instead of nice lines]
```

**Cause:** Terminal doesn't support box-drawing characters

**Solution:**

1. Use `borderStyle="single"` instead of `"round"`
2. Or remove borders entirely for minimal terminals
3. Check terminal encoding (should be UTF-8)

### Issue 5: Progress Shows Wrong Percentage for Short Content

**Symptom:**

```bash
[Viewing all 11 lines of a short entry, but header shows "Line 1/11 (9%)"]
[Expected: "Line 11/11 (100%)" since all content is visible]
```

**Cause:** Progress calculated from **first** visible line (scrollOffset), not last

**Why it's wrong:**

- `scrollOffset = 0` means you're at the TOP of the content
- But you're viewing lines 1-11, so you've reached the BOTTOM (100%)
- Using `scrollOffset` only shows position of the TOP line, not what's actually visible

**Solution:**

```typescript
// GOOD: Calculate based on LAST visible line
const lastVisibleLine = Math.min(
  scrollOffset + visibleLines,
  contentLines.length
);
const progress = calculateProgress(lastVisibleLine - 1, contentLines.length);

// BAD: Calculate based on FIRST visible line
const currentLineNumber = scrollOffset + 1;
const progress = calculateProgress(scrollOffset, contentLines.length);
```

**Result:**

- Viewing lines 1-11 of 11: `lastVisibleLine = 11` → 100% ✓
- Viewing lines 1-20 of 234: `lastVisibleLine = 20` → 8%
- Viewing lines 215-234 of 234: `lastVisibleLine = 234` → 100% ✓

### Issue 6: Text Disappears in Narrow Terminal

**Symptom:**

```bash
[Terminal width is 80 characters]
[Journal line is 150 characters long]
[Only first 80 characters show, rest is cut off]
```

**Cause:** Ink's `<Text>` doesn't wrap by default - it clips overflow

**Solution:**

```typescript
// GOOD: Enable wrapping
<Text wrap="wrap">{line || ' '}</Text>

// BAD: No wrapping (default behavior)
<Text>{line || ' '}</Text>
```

**Important notes:**

- With wrapping, one content line can become multiple display lines
- Virtual scrolling still works by content lines (not display lines)
- If line 5 wraps to 3 display lines, it's still counted as 1 content line
- This means line count in header reflects content lines, not wrapped display lines

### Issue 7: Slow Performance with Long Entries

**Symptom:**

```bash
[Scrolling is laggy with 5000+ line entries]
```

**Cause:** Rendering all lines instead of virtual scrolling

**Solution:**

```typescript
// GOOD: Virtual scrolling (only visible lines)
const visibleContent = contentLines.slice(
  scrollOffset,
  scrollOffset + visibleLines
);

// BAD: Rendering everything
{contentLines.map((line, idx) => <Text>{line}</Text>)}
```

## Enhancements

### Enhancement 1: Search Functionality

Add ability to search within entry:

```typescript
const [searchQuery, setSearchQuery] = useState('');
const [searchMode, setSearchMode] = useState(false);

useInput((input, key) => {
  if (input === '/') {
    setSearchMode(true);
    return;
  }

  if (searchMode) {
    if (key.return) {
      // Find next match
      const matchIndex = contentLines.findIndex(
        (line, idx) => idx > scrollOffset && line.includes(searchQuery)
      );
      if (matchIndex !== -1) {
        setScrollOffset(matchIndex);
      }
      setSearchMode(false);
    } else {
      setSearchQuery((prev) => prev + input);
    }
  }
  // ... rest of navigation
});
```

### Enhancement 2: Syntax Highlighting for Markdown

Highlight markdown syntax in content:

```typescript
function highlightMarkdown(line: string): React.ReactNode {
  // Headers
  if (line.startsWith('# ')) {
    return <Text bold color="cyan">{line}</Text>;
  }
  // Lists
  if (line.startsWith('- ') || line.startsWith('* ')) {
    return <Text color="yellow">{line}</Text>;
  }
  // Links
  if (line.includes('[') && line.includes('](')) {
    return <Text color="blue">{line}</Text>;
  }
  // Default
  return <Text>{line}</Text>;
}

// Use in render:
{visibleContent.map((line, idx) => (
  <Box key={scrollOffset + idx}>{highlightMarkdown(line)}</Box>
))}
```

### Enhancement 3: Export to File

Add option to export entry:

```typescript
useInput((input, key) => {
  if (input === 'e') {
    // Export to file
    const filename = `journal-${date}.txt`;
    writeFileSync(filename, content, 'utf-8');
    exit(); // Exit after export
  }
  // ... rest of navigation
});

// Update footer to show new shortcut:
<Text dimColor>
  ↑↓/jk Scroll • e Export • q Quit
</Text>
```

### Enhancement 4: Jump to Section (Markdown Headers)

Navigate between markdown headers:

```typescript
const headerIndices = useMemo(() => {
  return contentLines
    .map((line, idx) => (line.startsWith('#') ? idx : -1))
    .filter((idx) => idx !== -1);
}, [contentLines]);

const [currentHeaderIndex, setCurrentHeaderIndex] = useState(0);

useInput((input, key) => {
  if (input === 'n') {
    // Next header
    const nextIndex = currentHeaderIndex + 1;
    if (nextIndex < headerIndices.length) {
      setScrollOffset(headerIndices[nextIndex]);
      setCurrentHeaderIndex(nextIndex);
    }
  }
  if (input === 'p') {
    // Previous header
    const prevIndex = currentHeaderIndex - 1;
    if (prevIndex >= 0) {
      setScrollOffset(headerIndices[prevIndex]);
      setCurrentHeaderIndex(prevIndex);
    }
  }
  // ... rest of navigation
});
```

### Enhancement 5: Theme Support

Support different color themes:

```typescript
interface Theme {
  headerColor: string;
  borderColor: string;
  textColor: string;
}

const themes = {
  default: {
    headerColor: 'cyan',
    borderColor: 'gray',
    textColor: 'white',
  },
  dark: {
    headerColor: 'blue',
    borderColor: 'dim',
    textColor: 'white',
  },
};

// Use theme in component:
<Box borderColor={theme.borderColor}>
  <Text color={theme.headerColor}># {formatDateHeader(date)}</Text>
</Box>
```

## Next Steps

### Immediate Next Steps

1. **Implement the show command**
   - Copy code from this tutorial
   - Test with short and long entries
   - Verify keyboard navigation works

2. **Add tests**
   - Test formatters
   - Test component logic
   - Test command integration

3. **Try it out**
   ```bash
   $ papyrus add -d today
   [Write a long entry with 100+ lines]
   $ papyrus show
   [Test the interactive viewer]
   ```

### Future Enhancements

Consider building:

- **Search feature** - Find text within entry
- **Export feature** - Save to different formats
- **Markdown highlighting** - Syntax colors
- **Section navigation** - Jump between headers
- **Theme support** - Custom colors

### Related Tutorials

- **[03 - React CLI Components](./03-REACT-CLI-COMPONENTS.md)** - Learn more about Ink
- **[06 - Journal Commands](./06-JOURNAL-ADD-IMPLEMENTATION.md)** - Related journal commands
- **Next: Search Command** - Full-text search across journals

---

## Summary

You've learned how to build an interactive journal viewer with:

✅ **Ink component** with React hooks
✅ **Line numbers** for easy reference
✅ **Virtual scrolling** for performance
✅ **Keyboard navigation** (multiple styles)
✅ **Text wrapping** for long lines
✅ **Consistent UI** (same header/footer regardless of content length)
✅ **Consistent interaction** (always press 'q' to quit)
✅ **Piped output** detection
✅ **Cross-platform** consistency

The viewer provides a smooth, intuitive experience for reading journal entries of any length. Each line is numbered for easy reference, and the UI always looks the same - for short entries, navigation keys simply don't move since you're already viewing all content.

**Key Takeaways:**

1. **Ink is ideal for custom interactive UIs** - Full control over layout and behavior
2. **Virtual scrolling is essential** - Don't render 1000s of lines
3. **Consistent UI is better than conditional** - Always show same header/footer regardless of content length
4. **Detect TTY for piped output** - Support Unix philosophy
5. **Multiple navigation methods** - Serve both casual and power users
6. **Predictable interaction model** - Always press 'q' to quit, scroll keys just don't move for short content

Happy reading! 📖
