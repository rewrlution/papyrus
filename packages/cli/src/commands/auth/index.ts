import { Command } from 'commander';

import { login } from './login.js';
import { logout } from './logout.js';
import { register } from './register.js';

export function registerAuthCommands(program: Command) {
  program
    .command('login')
    .description('Login to your Papyrus account')
    .action(async () => await login());

  program
    .command('logout')
    .description('Log out from your account')
    .action(() => logout());

  program
    .command('register')
    .description('Create a new Papyrus account')
    .option('-e, --email <email>', 'email address')
    .option('-p, --password <password>', 'password')
    .option('-c, --confirmPassword <password>', 'confirm password')
    .action(
      async (options) =>
        await register(options.email, options.password, options.confirmPassword)
    );
}
