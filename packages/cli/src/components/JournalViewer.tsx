import { Box, Text, useInput, useApp } from 'ink';
import { useState, useMemo } from 'react';

import { formatDateHeader } from '../utils/date.js';

interface JournalViewerProps {
  date: string;
  content: string;
}

/**
 * Calculate percentage through content
 */
function calculateProgress(currentLine: number, totalLines: number): number {
  if (totalLines === 0) return 0;
  return Math.round(((currentLine + 1) / totalLines) * 100);
}

export const JournalViewer = ({ date, content }: JournalViewerProps) => {
  const { exit } = useApp();

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
