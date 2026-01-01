import { Box } from 'ink';

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
    </Box>
  );
}
