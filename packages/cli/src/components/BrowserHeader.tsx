import { Box, Text } from 'ink';
import React from 'react';

interface BrowserHeaderProps {
  totalJournals: number;
}

export const BrowserHeader: React.FC<BrowserHeaderProps> = ({
  totalJournals,
}) => {
  return (
    <Box justifyContent="space-between">
      <Text bold color="blue">
        Browse Your Journals
      </Text>
      <Text dimColor>Total: {totalJournals} entries</Text>
    </Box>
  );
};
