#!/usr/bin/env node
import { Command } from 'commander';

import {
  registerJournalCommands,
  registerAuthCommands,
} from './commands/index.js';

const program = new Command();

program
  .name('papyrus')
  .description('AI-powered developer journaling')
  .version('1.0.0');

registerAuthCommands(program);
registerJournalCommands(program);

program.parse(process.argv);
