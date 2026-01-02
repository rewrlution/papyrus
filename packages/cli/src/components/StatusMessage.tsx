import { Box, Text } from 'ink';
import React from 'react';

type MessageType = 'success' | 'error' | 'info' | 'loading';

interface StatusMessageProps {
  type: MessageType;
  message: string;
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

export function StatusMessage({ type, message }: StatusMessageProps) {
  const lines = message.split('\n');

  return (
    <Box marginTop={1} flexDirection="column">
      {lines.map((line, index) => (
        <Text key={index} color={colors[type]}>
          {index === 0 ? `${icons[type]} ${line}` : `   ${line}`}
        </Text>
      ))}
    </Box>
  );
}
