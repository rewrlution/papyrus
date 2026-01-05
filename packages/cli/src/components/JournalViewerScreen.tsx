import { Box, Text, useInput, useApp, useStdout } from 'ink';
import React, { useState, useMemo } from 'react';

import { formatDateHeader } from '../utils/date.js';

import { AppLayoutGeneric } from './AppLayoutGeneric.js';

// Special characters
const NBSP = '\u00A0'; // Non-breaking space
const VBAR = '│'; // Vertical bar for line number separator

// Line number formatting
const LINE_NUMBER_WIDTH = 4; // Width for padded line numbers
const LINE_NUMBER_SEPARATOR = ` ${VBAR} `; // " │ " with spaces

interface JournalViewerScreenProps {
  date: string; // YYYYMMDD format
  content: string;
  onExit?: () => void; // Optional callback when user presses 'q' or Escape
}

/**
 * Journal viewer screen - displays full journal content with scrolling.
 *
 * Uses AppLayoutGeneric for consistent layout structure.
 * Handles viewer-specific navigation and scrolling.
 */
export const JournalViewerScreen: React.FC<JournalViewerScreenProps> = ({
  date,
  content,
  onExit,
}) => {
  const { exit } = useApp();
  const { stdout } = useStdout();

  // Split content into lines (memoized to avoid re-splitting on every render)
  // Remove trailing empty line if file ends with newline (which is standard)
  const contentLines = useMemo(() => {
    const lines = content.split('\n');
    // If file ends with newline, split creates an empty last element - remove it
    if (lines.length > 0 && lines[lines.length - 1] === '') {
      return lines.slice(0, -1);
    }
    return lines;
  }, [content]);

  // Viewport configuration - use same stdout as AppLayoutGeneric
  const terminalHeight = stdout?.rows || 24;
  const terminalWidth = stdout?.columns || 120;

  // Reserve space for UI elements:
  // - Outer box border: 2 (top + bottom, handled by AppLayoutGeneric's height={terminalHeight-2})
  // - Logo: 1
  // - Divider: 1
  // - Header: 1
  // - Divider: 1
  // - [Content area - what we calculate here]
  // - Divider: 1
  // - Footer: 1
  // - Flex layout overhead: 2 (accounting for flexbox rendering and potential shrinkage)
  // Total reserved: 2 + 1 + 1 + 1 + 1 + 1 + 1 + 2 = 10
  const reservedHeight = 10;
  const visibleLines = Math.max(5, terminalHeight - reservedHeight);

  // Calculate available width for content
  const borderWidth = 2;
  const paddingWidth = 2;
  const lineNumberWidth = LINE_NUMBER_WIDTH + LINE_NUMBER_SEPARATOR.length; // e.g., "   1 │ " = 4 + 3 = 7
  const contentWidth =
    terminalWidth - borderWidth - paddingWidth - lineNumberWidth;

  // Scroll state
  const [scrollOffset, setScrollOffset] = useState(0);
  const [horizontalOffset, setHorizontalOffset] = useState(0);

  // Calculate maximum scroll position
  const maxScroll = Math.max(0, contentLines.length - visibleLines);

  // Keyboard navigation
  useInput((input, key) => {
    // Quit (q or Escape)
    if (input === 'q' || key.escape) {
      if (onExit) {
        onExit();
      } else {
        exit();
      }
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

  // Virtual scrolling: only render visible lines
  const visibleContent = contentLines.slice(
    scrollOffset,
    scrollOffset + visibleLines
  );

  // Pad with empty lines to fill the terminal height
  const paddingNeeded = Math.max(0, visibleLines - visibleContent.length);
  const emptyLines = Array(paddingNeeded).fill('');

  // Calculate position info
  const lastVisibleLine = Math.min(
    scrollOffset + visibleLines,
    contentLines.length
  );
  const progress = calculateProgress(lastVisibleLine, contentLines.length);

  // Header content: date and position
  const headerContent = (
    <Box justifyContent="space-between">
      <Text bold color="cyan">
        {formatDateHeader(date)}
      </Text>
      <Text dimColor>
        Line {lastVisibleLine}/{contentLines.length} ({progress}%)
      </Text>
    </Box>
  );

  // Footer content: keyboard shortcuts
  const footerContent = (
    <Text dimColor>
      ↑↓/jk Scroll • ←→/hl Pan • 0 Home • PgUp/PgDn Page • g/G Top/Bot • q Quit
      {horizontalOffset > 0 && ` • Col ${horizontalOffset + 1}+`}
    </Text>
  );

  // Format empty line number column (matches width of actual line numbers)
  const emptyLineNumberColumn =
    ''.padStart(LINE_NUMBER_WIDTH, ' ') + LINE_NUMBER_SEPARATOR;

  // Content area: scrollable journal lines
  const contentArea = (
    <Box flexDirection="column" flexGrow={1}>
      {visibleContent.map((line, idx) => {
        const lineNumber = scrollOffset + idx + 1;
        const lineNumberStr = lineNumber
          .toString()
          .padStart(LINE_NUMBER_WIDTH, ' ');
        const visiblePortion = line.substring(
          horizontalOffset,
          horizontalOffset + contentWidth
        );
        const displayContent = visiblePortion || NBSP;

        return (
          <Box key={lineNumber} flexDirection="row" minHeight={1}>
            <Text dimColor>{lineNumberStr + LINE_NUMBER_SEPARATOR}</Text>
            <Text>{displayContent}</Text>
          </Box>
        );
      })}
      {/* Fill remaining space with empty lines */}
      {emptyLines.map((_, idx) => (
        <Box key={`empty-${idx}`} flexDirection="row" minHeight={1}>
          <Text dimColor>{emptyLineNumberColumn}</Text>
          <Text>{NBSP}</Text>
        </Box>
      ))}
    </Box>
  );

  return (
    <AppLayoutGeneric
      headerContent={headerContent}
      footerContent={footerContent}
    >
      {contentArea}
    </AppLayoutGeneric>
  );
};

/**
 * Calculate percentage through content.
 */
function calculateProgress(currentLine: number, totalLines: number): number {
  if (totalLines === 0) return 0;
  return Math.round((currentLine / totalLines) * 100);
}
