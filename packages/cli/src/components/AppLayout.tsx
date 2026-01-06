import { Box, useStdout } from 'ink';
import React from 'react';

import { Divider } from './Divider.js';
import { LogoCompact } from './LogoCompact.js';

interface AppLayoutProps {
  headerContent: React.ReactNode; // Custom header (title, stats, etc.)
  footerContent: React.ReactNode; // Custom footer (shortcuts, info, etc.)
  children: React.ReactNode; // Main content area
}

/**
 * App layout with sticky header and footer.
 *
 * Provides a consistent frame for all screens:
 * ┌────────────────────────────────┐
 * │  Logo                          │
 * │  ────────────────────────────  │
 * │  [Custom Header Content]       │ ← Passed as headerContent prop
 * │  ────────────────────────────  │
 * ├────────────────────────────────┤
 * │                                │
 * │  [Children Content]            │ ← Passed as children
 * │                                │
 * ├────────────────────────────────┤
 * │  ────────────────────────────  │
 * │  [Custom Footer Content]       │ ← Passed as footerContent prop
 * └────────────────────────────────┘
 *
 * Benefits:
 * - Reusable across all screens (list, viewer, etc.)
 * - Consistent layout structure
 * - Sticky header/footer with flexbox
 * - No duplicate layout code
 */
export const AppLayout: React.FC<AppLayoutProps> = ({
  headerContent,
  footerContent,
  children,
}) => {
  const { stdout } = useStdout();
  const terminalHeight = stdout?.rows || 24;

  return (
    <Box
      flexDirection="column"
      height={terminalHeight - 2}
      borderStyle="round"
      borderColor="blue"
      paddingX={1}
    >
      {/* HEADER - Sticky at top */}
      <Box flexDirection="column" flexShrink={0}>
        <LogoCompact />
        <Divider />
        {headerContent}
        <Divider />
      </Box>

      {/* CONTENT - Expands to fill remaining space */}
      <Box flexDirection="column" flexGrow={1} flexShrink={1}>
        {children}
      </Box>

      {/* FOOTER - Sticky at bottom */}
      <Box flexDirection="column" flexShrink={0}>
        <Divider />
        {footerContent}
      </Box>
    </Box>
  );
};
