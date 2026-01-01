import { Text, Box } from 'ink';

import { formatMessage } from '@rewrlution/papyrus-shared';

import { Logo } from './Logo.js';

export function App() {
  return (
    <Box
      flexDirection="column"
      padding={1}
      borderStyle="round"
      borderColor="green"
    >
      <Logo />
      <Text bold color="green">
        {formatMessage('Papyrus CLI')}
      </Text>
    </Box>
  );
}
