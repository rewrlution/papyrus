import { Text } from 'ink';
import React, { useMemo } from 'react';

/**
 * Horizontal divider for separating sections within a unified box
 * Uses box-drawing characters for clean visual separation
 * Automatically adjusts to terminal width
 */
export const Divider: React.FC = () => {
  const dividerLine = useMemo(() => {
    const terminalWidth = process.stdout.columns || 120;
    // Account for box border (2 chars) and padding (2 chars)
    const availableWidth = terminalWidth - 4;
    // Create divider line that fits exactly
    return '─'.repeat(Math.max(0, availableWidth));
  }, []);

  return <Text dimColor>{dividerLine}</Text>;
};
