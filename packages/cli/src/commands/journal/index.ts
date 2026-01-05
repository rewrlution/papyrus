import { Command } from 'commander';

import { addEntry } from './add.js';
import { amendEntry } from './amend.js';
import { launchApp } from './app.js';
import { showEntry } from './show.js';
import { syncEntries } from './sync.js';

export function registerJournalCommands(program: Command) {
  program
    .command('app')
    .description('Launch the Papyrus TUI to browse and manage journal entries')
    .action(async () => await launchApp());

  program
    .command('sync')
    .description('Sync journals with server (requires authentication)')
    .action(async () => await syncEntries());

  program
    .command('add')
    .description('Create a new journal entry')
    .option('-d, --date <date>', 'Date for the entry (default: today)', 'today')
    .action(async (options) => await addEntry(options));

  program
    .command('amend')
    .description('Modify an existing journal entry')
    .option(
      '-d, --date <date>',
      'Date of the entry to amend (default: today)',
      'today'
    )
    .action(async (options) => await amendEntry(options));

  program
    .command('show')
    .description('Display a journal entry')
    .option(
      '-d, --date <date>',
      'Date of the entry to show (default: today)',
      'today'
    )
    .action(async (options) => await showEntry(options));
}
