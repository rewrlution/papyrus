import { Command } from 'commander';

export function registerAuthCommands(program: Command) {
  program
    .command('login')
    .description('Login to your Papyrus account')
    .action(() => {});

  program
    .command('logout')
    .description('Log out from your account')
    .action(() => {});

  program
    .command('register')
    .description('Create a new Papyrus account')
    .action(() => {});
}
