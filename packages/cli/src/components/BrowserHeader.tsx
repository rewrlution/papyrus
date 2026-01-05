import { Box, Text } from 'ink';
import React from 'react';

interface BrowserHeaderProps {
  totalJournals: number;
}

export const BrowserHeader: React.FC<BrowserHeaderProps> = ({
  totalJournals,
}) => {
  return (
    <Box borderStyle="round" borderColor="blue" paddingX={1}>
      <Text bold color="blue">
        Browse Your Journals
      </Text>
      <Box marginLeft={2}>
        <Text dimColor>Total: {totalJournals} entries</Text>
      </Box>
    </Box>
  );
};
