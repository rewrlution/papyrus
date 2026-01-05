import { Box, Text } from 'ink';
import React from 'react';

interface BrowserFooterProps {
  shortcuts: string;
}

export const BrowserFooter: React.FC<BrowserFooterProps> = ({ shortcuts }) => {
  return (
    <Box marginTop={1} borderStyle="round" borderColor="gray" paddingX={1}>
      <Text dimColor>{shortcuts}</Text>
    </Box>
  );
};
