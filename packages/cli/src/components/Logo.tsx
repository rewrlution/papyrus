import chalk from 'chalk';
import { Text, Box } from 'ink';

export function Logo() {
  const logo = [
    chalk.cyan('██████╗ ') +
      chalk.blue(' █████╗ ') +
      chalk.green('██████╗ ') +
      chalk.yellow('██╗   ██╗') +
      chalk.rgb(255, 165, 0)('██████╗ ') +
      chalk.magenta('██╗   ██╗') +
      chalk.red('███████╗'),
    chalk.cyan('██╔══██╗') +
      chalk.blue('██╔══██╗') +
      chalk.green('██╔══██╗') +
      chalk.yellow('╚██╗ ██╔╝') +
      chalk.rgb(255, 165, 0)('██╔══██╗') +
      chalk.magenta('██║   ██║') +
      chalk.red('██╔════╝'),
    chalk.cyan('██████╔╝') +
      chalk.blue('███████║') +
      chalk.green('██████╔╝') +
      chalk.yellow(' ╚████╔╝ ') +
      chalk.rgb(255, 165, 0)('██████╔╝') +
      chalk.magenta('██║   ██║') +
      chalk.red('███████╗'),
    chalk.cyan('██╔═══╝ ') +
      chalk.blue('██╔══██║') +
      chalk.green('██╔═══╝ ') +
      chalk.yellow('  ╚██╔╝  ') +
      chalk.rgb(255, 165, 0)('██╔══██╗') +
      chalk.magenta('██║   ██║') +
      chalk.red('╚════██║'),
    chalk.cyan('██║     ') +
      chalk.blue('██║  ██║') +
      chalk.green('██║     ') +
      chalk.yellow('   ██║   ') +
      chalk.rgb(255, 165, 0)('██║  ██║') +
      chalk.magenta('╚██████╔╝') +
      chalk.red('███████║'),
    chalk.cyan('╚═╝     ') +
      chalk.blue('╚═╝  ╚═╝') +
      chalk.green('╚═╝     ') +
      chalk.yellow('   ╚═╝   ') +
      chalk.rgb(255, 165, 0)('╚═╝  ╚═╝') +
      chalk.magenta(' ╚═════╝ ') +
      chalk.red('╚══════╝'),
  ];

  // Tagline suggestions:
  // "From papyrus to terminal: AI-powered developer journaling"
  // "Timeless journaling, powered by tomorrow"
  // "Where ancient scolls meet modern AI"
  // "Jurnal on digital papyrus, empowered by AI wisdom"
  const tagline = chalk.magenta('Write like the ancients, think with AI');

  return (
    <Box
      flexDirection="column"
      padding={1}
      borderStyle="round"
      borderColor="green"
    >
      <Box
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        marginBottom={1}
      >
        {logo.map((line, index) => (
          <Text key={index}>{line}</Text>
        ))}
        <Text>{tagline}</Text>
      </Box>
    </Box>
  );
}
