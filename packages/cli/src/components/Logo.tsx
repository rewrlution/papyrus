import chalk from 'chalk';
import { Text, Box } from 'ink';

export function Logo() {
  const logo = [
    chalk.cyan('  ██████  ') +
      chalk.blue(' ██████  ') +
      chalk.yellow(' ██████  ') +
      chalk.rgb(255, 165, 0)(' ██    ██ ') +
      chalk.magenta(' ██████  ') +
      chalk.rgb(255, 20, 147)(' ██    ██ ') +
      chalk.red(' ███████'),
    chalk.cyan(' ██   ██ ') +
      chalk.blue(' ██   ██ ') +
      chalk.yellow(' ██   ██ ') +
      chalk.rgb(255, 165, 0)('  ██  ██  ') +
      chalk.magenta(' ██   ██ ') +
      chalk.rgb(255, 20, 147)(' ██    ██ ') +
      chalk.red(' ██     '),
    chalk.cyan(' ██████  ') +
      chalk.blue(' ████████ ') +
      chalk.yellow(' ██████  ') +
      chalk.rgb(255, 165, 0)('   ████   ') +
      chalk.magenta(' ██████  ') +
      chalk.rgb(255, 20, 147)(' ██    ██ ') +
      chalk.red(' ███████'),
    chalk.cyan(' ██      ') +
      chalk.blue(' ██    ██ ') +
      chalk.yellow(' ██      ') +
      chalk.rgb(255, 165, 0)('    ██    ') +
      chalk.magenta(' ██   ██ ') +
      chalk.rgb(255, 20, 147)(' ██    ██ ') +
      chalk.red('      ██'),
    chalk.cyan(' ██      ') +
      chalk.blue(' ██    ██ ') +
      chalk.yellow(' ██      ') +
      chalk.rgb(255, 165, 0)('    ██    ') +
      chalk.magenta(' ██   ██ ') +
      chalk.rgb(255, 20, 147)('  ██████  ') +
      chalk.red(' ███████'),
  ];

  const tagline = chalk.magenta('ai powered journaling tool for developers');

  return (
    <Box flexDirection="column" marginBottom={1}>
      {logo.map((line, index) => (
        <Text key={index}>{line}</Text>
      ))}
      <Text>{tagline}</Text>
    </Box>
  );
}
