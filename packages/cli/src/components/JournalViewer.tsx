import { Box, Text, useInput, useApp } from 'ink';
import React, { useState, useMemo } from 'react';

import { formatDateHeader } from '../utils/date.js';

interface JournalViewerProps {
  date: string; // YYYYMMDD format
  content: string;
  onExit?: () => void; // Optional callback when user presses 'q' or Escape
}

/**
 * Interactive journal viewer with keyboard navigation and scrolling.
 *
 * Features:
 * - Virtual scrolling (only renders visible lines for performance)
 * - Horizontal panning for long lines (no text wrapping)
 * - Line numbers for easy reference
 * - Sticky header with date and position indicator
 * - Sticky footer with keyboard shortcuts
 * - Multiple navigation methods (arrows, vim keys, page up/down)
 *
 * Architecture:
 * 1. Split content into lines (memoized for performance)
 * 2. Calculate viewport dimensions based on terminal size
 * 3. Track scroll position (vertical and horizontal)
 * 4. Only render visible slice of content (virtual scrolling)
 * 5. Update scroll position on keyboard input
 *
 * Key Design Decisions:
 * - Each content line = 1 display row (no wrapping, use horizontal panning instead)
 * - Line numbers always correspond to content lines (1:1 mapping)
 * - Progress calculated from last visible line (shows 100% when viewing all content)
 * - Auto-reset horizontal position when moving vertically (better UX)
 * - React keys use line numbers (unique, stable identifiers)
 */
export const JournalViewer = ({
  date,
  content,
  onExit,
}: JournalViewerProps) => {
  const { exit } = useApp();

  // Split content into lines (memoized to avoid re-splitting on every render)
  const contentLines = useMemo(() => content.split('\n'), [content]);

  // Viewport configuration - calculate available space
  const terminalHeight = process.stdout.rows || 24;
  const terminalWidth = process.stdout.columns || 120;

  // Reserve space for UI elements
  // Note: These are estimates. Ink's flexbox will determine actual layout.
  const headerHeight = 3; // Header box takes ~3 lines
  const footerHeight = 2; // Footer box takes ~2 lines
  const reservedHeight = headerHeight + footerHeight;

  // Ensure we have at least 5 visible lines even in small terminals
  const visibleLines = Math.max(5, terminalHeight - reservedHeight);

  // Calculate available width for content (account for borders, padding, line numbers)
  const borderWidth = 2; // Left + right border (1 char each)
  const paddingWidth = 2; // paddingX={1} means 1 space on each side
  const lineNumberWidth = 7; // "   1 │ " format (4 digits + space + │ + space)
  const contentWidth =
    terminalWidth - borderWidth - paddingWidth - lineNumberWidth;

  // Scroll state
  const [scrollOffset, setScrollOffset] = useState(0); // Vertical scroll (which line is at top)
  const [horizontalOffset, setHorizontalOffset] = useState(0); // Horizontal scroll (which column to start from)

  // Calculate maximum scroll position (can't scroll past end of content)
  const maxScroll = Math.max(0, contentLines.length - visibleLines);

  // Keyboard navigation
  useInput((input, key) => {
    // Quit (q or Escape)
    if (input === 'q' || key.escape) {
      if (onExit) {
        onExit(); // Call callback if provided (for returning to list view)
      } else {
        exit(); // Exit app if no callback (standalone viewer)
      }
      return;
    }

    // Vertical navigation
    // Down (↓ or j)
    if (key.downArrow || input === 'j') {
      setScrollOffset((prev) => Math.min(prev + 1, maxScroll));
      setHorizontalOffset(0); // Reset to start of line
    }

    // Up (↑ or k)
    if (key.upArrow || input === 'k') {
      setScrollOffset((prev) => Math.max(prev - 1, 0));
      setHorizontalOffset(0); // Reset to start of line
    }

    // Page down (PgDn or Space)
    if (key.pageDown || input === ' ') {
      setScrollOffset((prev) => Math.min(prev + visibleLines, maxScroll));
      setHorizontalOffset(0); // Reset to start of line
    }

    // Page up (PgUp)
    if (key.pageUp) {
      setScrollOffset((prev) => Math.max(prev - visibleLines, 0));
      setHorizontalOffset(0); // Reset to start of line
    }

    // Jump to top (Home or g)
    if (key.home || input === 'g') {
      setScrollOffset(0);
      setHorizontalOffset(0); // Reset to start of line
    }

    // Jump to bottom (End or G)
    if (key.end || input === 'G') {
      setScrollOffset(maxScroll);
      setHorizontalOffset(0); // Reset to start of line
    }

    // Horizontal navigation
    // Left (← or h)
    if (key.leftArrow || input === 'h') {
      setHorizontalOffset((prev) => Math.max(prev - 10, 0));
    }

    // Right (→ or l)
    if (key.rightArrow || input === 'l') {
      setHorizontalOffset((prev) => prev + 10);
    }

    // Jump to start of line (0)
    if (input === '0') {
      setHorizontalOffset(0);
    }
  });

  // Virtual scrolling: only render visible lines
  // This is critical for performance with large journals (1000+ lines)
  const visibleContent = contentLines.slice(
    scrollOffset,
    scrollOffset + visibleLines
  );

  // Calculate position info based on LAST visible line
  // This ensures progress shows 100% when all content is visible
  // Example: Viewing lines 1-11 of 11 shows "Line 11/11 (100%)"
  const lastVisibleLine = Math.min(
    scrollOffset + visibleLines,
    contentLines.length
  );
  const progress = calculateProgress(lastVisibleLine, contentLines.length);

  return (
    <Box flexDirection="column">
      {/* Sticky Header - always visible at top */}
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

      {/* Content Area - scrollable viewport */}
      <Box
        flexDirection="column"
        flexGrow={1}
        borderStyle="round"
        borderColor="gray"
        paddingX={1}
      >
        {visibleContent.map((line, idx) => {
          // Calculate actual line number in the full content
          const lineNumber = scrollOffset + idx + 1;
          const lineNumberStr = lineNumber.toString().padStart(4, ' ');

          // Slice line horizontally based on horizontal offset
          // This implements horizontal panning (no text wrapping)
          const visiblePortion = line.substring(
            horizontalOffset,
            horizontalOffset + contentWidth
          );

          // CRITICAL: Use lineNumber as React key (unique, stable identifier)
          // DO NOT use idx or scrollOffset + idx (causes stale content bug)
          // Note: We use a non-breaking space (U+00A0) for empty lines to prevent Ink
          // from collapsing the line entirely. Regular space might get optimized away.
          const displayContent = visiblePortion || '\u00A0'; // Non-breaking space

          return (
            <Box key={lineNumber} flexDirection="row" minHeight={1}>
              <Text dimColor>{lineNumberStr} │ </Text>
              <Text>{displayContent}</Text>
            </Box>
          );
        })}
      </Box>

      {/* Sticky Footer - always visible at bottom */}
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="cyan"
        paddingX={1}
      >
        <Text dimColor>
          ↑↓/jk Scroll • ←→/hl Pan • 0 Home • PgUp/PgDn Page • g/G Top/Bot • q
          Quit
          {horizontalOffset > 0 && ` • Col ${horizontalOffset + 1}+`}
        </Text>
      </Box>
    </Box>
  );
};

/**
 * Calculate percentage through content.
 *
 * @param currentLine - Current line number (1-indexed)
 * @param totalLines - Total number of lines
 * @returns Percentage (0-100)
 */
function calculateProgress(currentLine: number, totalLines: number): number {
  if (totalLines === 0) return 0;
  return Math.round((currentLine / totalLines) * 100);
}
