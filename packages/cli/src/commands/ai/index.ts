import { Command } from 'commander';

import { generateStandup } from './standup.js';

export function registerAiCommands(program: Command) {
  program
    .command('standup')
    .description('Generate AI standup notes from journal entries')
    .option('-d, --date <date>', 'Use journal from specific date (YYYYMMDD)')
    .option(
      '-f, --from <date>',
      'Use journals from this date onwards (YYYYMMDD)'
    )
    .option(
      '-t, --to <date>',
      'Use journals up to this date (YYYYMMDD, requires --from)'
    )
    .action(async (options) => {
      await generateStandup(options);
    });
}
