import { Box, Text, useInput, useApp } from 'ink';
import React, { useState, useMemo } from 'react';

import { formatDateHeader } from '../utils/date.js';

import { AppLayoutGeneric } from './AppLayoutGeneric.js';

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

  // Split content into lines (memoized to avoid re-splitting on every render)
  const contentLines = useMemo(() => content.split('\n'), [content]);

  // Viewport configuration
  const terminalHeight = process.stdout.rows || 24;
  const terminalWidth = process.stdout.columns || 120;

  // Reserve space for UI elements: logo(1) + divider(1) + header(1) + divider(1) + divider(1) + footer(1) + borders(2) = 8
  const reservedHeight = 8;
  const visibleLines = Math.max(5, terminalHeight - reservedHeight);

  // Calculate available width for content
  const borderWidth = 2;
  const paddingWidth = 2;
  const lineNumberWidth = 7; // "   1 │ " format
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
        # {formatDateHeader(date)}
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

  // Content area: scrollable journal lines
  const contentArea = (
    <Box flexDirection="column" flexGrow={1}>
      {visibleContent.map((line, idx) => {
        const lineNumber = scrollOffset + idx + 1;
        const lineNumberStr = lineNumber.toString().padStart(4, ' ');
        const visiblePortion = line.substring(
          horizontalOffset,
          horizontalOffset + contentWidth
        );
        const displayContent = visiblePortion || '\u00A0'; // Non-breaking space

        return (
          <Box key={lineNumber} flexDirection="row" minHeight={1}>
            <Text dimColor>{lineNumberStr} │ </Text>
            <Text>{displayContent}</Text>
          </Box>
        );
      })}
      {/* Fill remaining space with empty lines */}
      {emptyLines.map((_, idx) => (
        <Box key={`empty-${idx}`} flexDirection="row" minHeight={1}>
          <Text dimColor> │ </Text>
          <Text>{'\u00A0'}</Text>
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
