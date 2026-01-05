import { Box, Text, useInput, useApp, useStdout } from 'ink';
import React, { useState } from 'react';

import { type JournalFileInfo } from '../lib/storage/journal-storage.js';
import { getTodayDate } from '../utils/date.js';

import { Divider } from './Divider.js';
import { JournalListViewSimple } from './JournalListViewSimple.js';
import { LogoCompact } from './LogoCompact.js';

interface AppLayoutProps {
  journals: JournalFileInfo[];
}

/**
 * Modern app layout with sticky header and footer.
 *
 * Layout Structure:
 * ┌────────────────────────────────┐
 * │  Header (flexShrink={0})       │ ← Sticky at top
 * │  - Logo                        │
 * │  - Title & stats               │
 * ├────────────────────────────────┤
 * │                                │
 * │  Content (flexGrow={1})        │ ← Expands to fill
 * │  - Main content area           │
 * │                                │
 * ├────────────────────────────────┤
 * │  Footer (flexShrink={0})       │ ← Sticky at bottom
 * │  - Keyboard shortcuts          │
 * └────────────────────────────────┘
 *
 * Benefits:
 * - True sticky header/footer behavior
 * - Automatic height management (no manual calculations)
 * - Responsive to terminal size changes
 * - Clean separation of concerns
 */
export const AppLayout: React.FC<AppLayoutProps> = ({ journals }) => {
  const { exit } = useApp();
  const { stdout } = useStdout();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const today = getTodayDate();
  const terminalHeight = stdout?.rows || 24;

  // Calculate available height for journal list
  // Terminal height - header (logo 1 + divider 1 + title 1 + divider 1 = 4)
  //                 - footer (divider 1 + shortcuts 1 = 2)
  //                 - borders (2)
  //                 - content margins (2)
  const availableHeight = Math.max(5, terminalHeight - 10);

  // Navigation handlers
  const handleNavigateUp = () => {
    setSelectedIndex((current) => {
      const next = current - 1;
      // Circular navigation: wrap to bottom if at top
      return next < 0 ? journals.length - 1 : next;
    });
  };

  const handleNavigateDown = () => {
    setSelectedIndex((current) => {
      const next = current + 1;
      // Circular navigation: wrap to top if at bottom
      return next >= journals.length ? 0 : next;
    });
  };

  // Keyboard input handlers
  useInput((input, key) => {
    // Navigate up (↑ or k)
    if (key.upArrow || input === 'k') {
      handleNavigateUp();
      return;
    }

    // Navigate down (↓ or j)
    if (key.downArrow || input === 'j') {
      handleNavigateDown();
      return;
    }

    // Quit (q or Escape)
    if (input === 'q' || key.escape) {
      exit();
      return;
    }
  });

  return (
    <Box
      flexDirection="column"
      height={terminalHeight - 2}
      borderStyle="round"
      borderColor="blue"
      paddingX={1}
    >
      {/* HEADER - Sticky at top, natural height */}
      <Box flexDirection="column" flexShrink={0}>
        <LogoCompact />
        <Divider />
        <Box>
          <Text bold color="cyan">
            Browse Your Journals
          </Text>
          <Text dimColor> ({journals.length} entries)</Text>
        </Box>
        <Divider />
      </Box>

      {/* CONTENT - Expands to fill remaining space */}
      <Box flexDirection="column" flexGrow={1} flexShrink={1}>
        <JournalListViewSimple
          journals={journals}
          selectedIndex={selectedIndex}
          todayDate={today}
          availableHeight={availableHeight}
        />
      </Box>

      {/* FOOTER - Sticky at bottom, natural height */}
      <Box flexDirection="column" flexShrink={0}>
        <Divider />
        <Text dimColor>↑↓/jk Navigate • Enter Read • q Quit</Text>
      </Box>
    </Box>
  );
};
