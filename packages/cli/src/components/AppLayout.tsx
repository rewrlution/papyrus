import { Box, Text, useInput, useApp, useStdout } from 'ink';
import React from 'react';

import { Divider } from './Divider.js';
import { LogoCompact } from './LogoCompact.js';

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
export const AppLayout: React.FC = () => {
  const { exit } = useApp();
  const { stdout } = useStdout();

  const terminalHeight = stdout?.rows || 24;

  // Keyboard input handlers
  useInput((input, key) => {
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
          <Text dimColor> (42 entries)</Text>
        </Box>
        <Divider />
      </Box>

      {/* CONTENT - Expands to fill remaining space */}
      <Box flexDirection="column" flexGrow={1} flexShrink={1} marginY={1}>
        {/* Mock content - simulating a scrollable list */}
        {Array.from({ length: 100 }, (_, i) => (
          <Text key={i} dimColor={i !== 2}>
            {i === 2 ? '› ' : '  '}
            2026-01-{String(i + 1).padStart(2, '0')} - Mock Journal Entry #
            {i + 1}
          </Text>
        ))}
      </Box>

      {/* FOOTER - Sticky at bottom, natural height */}
      <Box flexDirection="column" flexShrink={0}>
        <Divider />
        <Text dimColor>↑↓/jk Navigate • Enter Read • q Quit</Text>
      </Box>
    </Box>
  );
};
