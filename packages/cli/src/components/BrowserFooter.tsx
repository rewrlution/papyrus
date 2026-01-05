import { Text } from 'ink';
import React from 'react';

interface BrowserFooterProps {
  shortcuts: string;
}

export const BrowserFooter: React.FC<BrowserFooterProps> = ({ shortcuts }) => {
  return <Text dimColor>{shortcuts}</Text>;
};
