import { Text, Box } from "ink";
import { formatMessage } from "@rewrlution/papyrus-shared";

export function App() {
  return (
    <Box
      flexDirection="column"
      padding={1}
      borderStyle="round"
      borderColor="green"
    >
      <Text bold color="green">
        Papyrus CLI
      </Text>
    </Box>
  );
}
