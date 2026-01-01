# IDE Setup Guide

This guide helps you configure your development environment for the Papyrus project.

## Visual Studio Code (Recommended)

We use VS Code as our primary IDE and have committed shared settings to ensure consistency across the team.

### Required Extensions

When you open this project in VS Code, you'll be prompted to install recommended extensions. You can also install them manually:

1. **ESLint** (`dbaeumer.vscode-eslint`)
   - Provides real-time linting feedback
   - Auto-fixes issues on save

2. **Prettier** (`esbenp.prettier-vscode`)
   - Code formatting
   - Works alongside ESLint

3. **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`)
   - Autocomplete for Tailwind classes
   - Color previews and hover information

4. **Prisma** (`prisma.prisma`)
   - Syntax highlighting for Prisma schema files
   - Auto-formatting and IntelliSense

### Auto-Fix on Save

The project includes `.vscode/settings.json` which automatically:

- Fixes ESLint errors when you save a file
- Formats code according to our style guide
- Validates TypeScript and JavaScript files

No additional configuration needed!

### Manual Installation

If the extensions don't auto-install, run:

```bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
code --install-extension prisma.prisma
```

## Other IDEs

While we recommend VS Code, you can use other IDEs. Make sure to:

1. **Install ESLint plugin** for your IDE
2. **Enable auto-fix on save** to maintain code style consistency
3. **Configure Prettier** if your IDE supports it
4. **Use the project's ESLint config** (it will be auto-detected from the monorepo root)

### WebStorm / IntelliJ IDEA

1. Go to **Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint**
2. Enable "Automatic ESLint configuration"
3. Check "Run eslint --fix on save"

### Neovim / Vim

Install and configure:

- [nvim-lspconfig](https://github.com/neovim/nvim-lspconfig) for ESLint LSP
- [null-ls.nvim](https://github.com/jose-elias-alvarez/null-ls.nvim) for formatting on save
- [prisma-vim](https://github.com/prisma/vim-prisma) for Prisma syntax

## Project Structure

This is a monorepo managed with Turborepo and pnpm. Key packages:

- `packages/cli` - Command-line interface for Papyrus
- `packages/api` - API server
- Other packages as the project grows

## Code Style

- **TypeScript** everywhere
- **ESLint** for linting with auto-fix
- **Prettier** for formatting
- **Import order** is enforced automatically

Your IDE will handle most of this automatically if configured correctly!

## Getting Help

If you encounter issues with IDE setup:

1. Check that all recommended extensions are installed
2. Reload VS Code window (Cmd/Ctrl + Shift + P → "Reload Window")
3. Check the ESLint output panel for errors
4. Ask the team in your communication channel

## Why Commit .vscode/?

We commit `.vscode/settings.json` and `.vscode/extensions.json` to:

- Ensure consistent code quality across the team
- Reduce "works on my machine" problems
- Help new developers get started faster
- Enforce the same linting rules everyone uses

Personal VS Code settings and workspace files are excluded via `.gitignore`.
