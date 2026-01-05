import chalk from 'chalk';
import { Text, Box } from 'ink';

/**
 * Compact logo for interactive commands (login, register, list)
 * Takes up minimal space while maintaining branding
 */
export function LogoCompact() {
  return (
    <Box flexDirection="column">
      <Text>
        {chalk.cyan('P')}
        {chalk.blue('A')}
        {chalk.green('P')}
        {chalk.yellow('Y')}
        {chalk.rgb(255, 165, 0)('R')}
        {chalk.magenta('U')}
        {chalk.red('S')} {chalk.gray('│')}{' '}
        {chalk.dim('AI-powered developer journaling')}
      </Text>
    </Box>
  );
}
