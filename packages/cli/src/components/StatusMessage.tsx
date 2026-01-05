import { Box, Text } from 'ink';
import React from 'react';

type MessageType = 'success' | 'error' | 'info' | 'loading';

interface StatusMessageProps {
  type: MessageType;
  message: string;
  hint?: string; // Optional hint message (e.g., "Run 'papyrus list' to see all entries")
}

const icons = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  loading: '🔄️',
};

const colors = {
  success: 'green',
  error: 'red',
  info: 'blue',
  loading: 'cyan',
};

export function StatusMessage({ type, message, hint }: StatusMessageProps) {
  const lines = message.split('\n');

  return (
    <Box flexDirection="column">
      {lines.map((line, index) => (
        <Text key={index} color={colors[type]}>
          {index === 0 ? `${icons[type]} ${line}` : `   ${line}`}
        </Text>
      ))}
      {hint && <Text color="gray">💡 {hint}</Text>}
    </Box>
  );
}
