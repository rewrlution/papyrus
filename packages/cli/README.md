# Papyrus CLI

> AI-powered journaling for developers, right in your terminal.

[![npm version](https://img.shields.io/npm/v/@rewrlution/papyrus-cli.svg)](https://www.npmjs.com/package/@rewrlution/papyrus-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is Papyrus?

Papyrus is a command-line journaling tool designed for developers who want to capture their thoughts, progress, and insights without leaving the terminal. It combines the simplicity of markdown files with the power of cloud sync and AI assistance.

**Key Features:**

- 📝 **Quick Journaling** - Write journal entries in your favorite editor (vim, nano, VS Code)
- 📅 **Date-based Organization** - Entries organized by date (YYYYMMDD format)
- 🔍 **Interactive Browser** - Browse and read journals with vim-style navigation
- ☁️ **Cloud Sync** - Sync journals across devices
- 🔐 **Secure** - JWT authentication with local token storage
- 💾 **Local-First** - All journals stored locally in markdown format
- 🎨 **Terminal UI** - Beautiful React-based interface rendered in your terminal

## Installation

### From npm (Recommended)

```bash
# Install globally
npm install -g @rewrlution/papyrus-cli

# Or with pnpm
pnpm add -g @rewrlution/papyrus-cli

# Or with yarn
yarn global add @rewrlution/papyrus-cli
```

### From Source (Development)

```bash
# Clone the monorepo
git clone https://github.com/your-username/papyrus.git
cd papyrus

# Install dependencies
pnpm install

# Build packages
pnpm build

# Link CLI globally
cd packages/cli
pnpm link --global

# Now you can use papyrus anywhere
papyrus --version
```

## Quick Start

### 1. Register an Account

```bash
papyrus register
```

Follow the interactive prompts to create an account.

### 2. Log In

```bash
papyrus login
```

Enter your email and password.

### 3. Create Your First Journal Entry

```bash
papyrus add
```

This opens your default editor. Write your thoughts, save, and close.

### 4. Browse Your Journals

```bash
papyrus list
# Or use the short alias
papyrus ls
```

Use arrow keys or `j/k` to navigate, press `Enter` to read an entry.

### 5. Sync to Cloud

```bash
papyrus sync
```

Your journals are now backed up and available on other devices!

## Commands

### Journal Commands

#### `papyrus add [-d <date>]`

Create a new journal entry.

```bash
# Create entry for today
papyrus add

# Create entry for specific date
papyrus add -d 20260104
papyrus add -d yesterday
papyrus add -d tomorrow
```

**What it does:**

- Opens your default editor ($EDITOR, $VISUAL, or fallback)
- Creates a new markdown file in `~/.local/share/papyrus/journals/`
- Filename format: `YYYYMMDD.md`

#### `papyrus amend [-d <date>]`

Modify an existing journal entry.

```bash
# Amend today's entry
papyrus amend

# Amend specific date
papyrus amend -d 20260103
```

**What it does:**

- Opens existing journal in your editor
- Fails if entry doesn't exist (use `add` to create)

#### `papyrus show [-d <date>]`

Display a journal entry in the terminal.

```bash
# Show today's entry
papyrus show

# Show specific date
papyrus show -d 20260101
papyrus show -d yesterday
```

**Features:**

- Scrollable viewer with line numbers
- Vim-style navigation (`j/k`, `g/G`, `h/l`)
- Horizontal panning for long lines
- Progress indicator

**Keyboard Shortcuts:**

- `↑`/`↓` or `j`/`k` - Scroll up/down
- `←`/`→` or `h`/`l` - Pan left/right
- `PgUp`/`PgDn` or `Space` - Page up/down
- `g` or `Home` - Jump to top
- `G` or `End` - Jump to bottom
- `0` - Jump to start of line
- `q` or `Esc` - Quit

#### `papyrus list` or `papyrus ls`

Browse all journal entries interactively.

```bash
papyrus list
# Or
papyrus ls
```

**Features:**

- Virtual scrolling (handles 1000+ entries smoothly)
- Circular navigation (wraps at top/bottom)
- Today marker (blue dot)
- Selection indicator

**Keyboard Shortcuts:**

- `↑`/`↓` or `j`/`k` - Navigate list
- `Enter` or `Space` - Open entry in reader
- `q` or `Esc` - Quit (in list view) or return to list (in reader)

#### `papyrus sync`

Sync journals with the cloud.

```bash
papyrus sync
```

**What it does:**

- Compares local and remote journals using content hashes
- Uploads new/modified entries
- Downloads remote changes
- Resolves conflicts automatically (merges both versions)
- Shows progress with real-time updates

**Requires:** Authentication (run `papyrus login` first)

### Authentication Commands

#### `papyrus register`

Create a new account.

```bash
papyrus register
```

**Interactive prompts:**

1. Email address
2. Password (min 8 chars, uppercase, lowercase, number, special char)
3. Confirm password

#### `papyrus login`

Log in to your account.

```bash
papyrus login
```

**Interactive prompts:**

1. Email address
2. Password

**What it does:**

- Authenticates with the server
- Stores JWT token locally in `~/.config/papyrus/token`
- Token expires after 7 days (configurable)

#### `papyrus logout`

Log out and clear stored token.

```bash
papyrus logout
```

## Configuration

### Storage Locations

Papyrus follows the XDG Base Directory specification:

**On Linux/macOS:**

- Journals: `~/.local/share/papyrus/journals/`
- Config: `~/.config/papyrus/`
- Token: `~/.config/papyrus/token`
- Sync metadata: `~/.local/share/papyrus/sync-meta.json`

**On Windows:**

- Journals: `%LOCALAPPDATA%\papyrus\journals\`
- Config: `%APPDATA%\papyrus\`
- Token: `%APPDATA%\papyrus\token`
- Sync metadata: `%LOCALAPPDATA%\papyrus\sync-meta.json`

### Editor Configuration

Papyrus uses your system's default editor. Priority order:

1. `$EDITOR` environment variable
2. `$VISUAL` environment variable
3. Detected editors: `vim`, `vi`, `nano`, `code` (VS Code), `notepad` (Windows)

**Set your preferred editor:**

```bash
# Bash/Zsh
export EDITOR=vim

# Or add to ~/.bashrc or ~/.zshrc
echo 'export EDITOR=vim' >> ~/.bashrc

# Windows (PowerShell)
$env:EDITOR = "code --wait"
```

**VS Code users:** Add `--wait` flag so Papyrus waits for you to close the file:

```bash
export EDITOR="code --wait"
```

### Date Formats

Papyrus accepts flexible date input:

- `today` - Current date
- `yesterday` - One day ago
- `tomorrow` - One day ahead
- `YYYYMMDD` - Specific date (e.g., `20260104`)
- `YYYY-MM-DD` - ISO format (e.g., `2026-01-04`)
- `+N` or `-N` - Days from today (e.g., `+7`, `-3`)

## Development

### Prerequisites

- Node.js 18 or higher
- pnpm 10 or higher
- Git

### Setup Development Environment

```bash
# Clone monorepo
git clone https://github.com/your-username/papyrus.git
cd papyrus

# Install dependencies
pnpm install

# Build shared package (required dependency)
cd packages/shared
pnpm build

# Return to CLI package
cd ../cli
```

### Development Workflow

```bash
# Watch mode (auto-reloads on changes)
pnpm dev

# Build
pnpm build

# Run tests
pnpm test

# Run built CLI
pnpm start

# Or run directly with tsx
tsx src/cli.tsx add --date today
```

### Project Structure

```
packages/cli/
├── src/
│   ├── cli.tsx              # Entry point
│   ├── commands/            # Command handlers
│   │   ├── auth/            # Auth commands (login, register, logout)
│   │   └── journal/         # Journal commands (add, show, list, sync)
│   ├── components/          # React/Ink UI components
│   ├── lib/                 # Business logic
│   │   ├── api/             # API client
│   │   ├── auth/            # Auth middleware
│   │   ├── storage/         # Local storage
│   │   └── sync/            # Sync engine
│   └── utils/               # Utilities (date, editor, token)
├── docs/                    # Documentation
├── tests/                   # Tests
├── dist/                    # Build output
└── package.json
```

### Running Tests

```bash
# Run tests once
pnpm test

# Watch mode
pnpm test --watch

# With UI
pnpm test --ui

# From monorepo root
pnpm test --filter=@rewrlution/papyrus-cli
```

### Local Testing

Test the CLI as if installed globally:

```bash
# Build and link
pnpm build
pnpm link --global

# Test commands
papyrus --version
papyrus add

# Unlink when done
pnpm unlink --global
```

### Building for Production

```bash
# Clean build
rm -rf dist
pnpm build

# Test tarball (simulates npm publish)
npm pack

# Install from tarball
npm install -g ./rewrlution-papyrus-cli-*.tgz
```

## Deployment

### Versioning

Papyrus follows [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes (e.g., command renamed)
- **MINOR**: New features (e.g., new command added)
- **PATCH**: Bug fixes (e.g., error handling fixed)

### Release Process

```bash
# 1. Update version in package.json
vim packages/cli/package.json
# Change "version": "0.0.1" to "0.0.2"

# 2. Update CHANGELOG.md
vim packages/cli/CHANGELOG.md
# Document changes

# 3. Commit changes
git add packages/cli/package.json packages/cli/CHANGELOG.md
git commit -m "chore(cli): bump version to 0.0.2"

# 4. Create tag
git tag cli-v0.0.2 -m "Release CLI v0.0.2"

# 5. Push
git push origin main
git push origin cli-v0.0.2

# 6. GitHub Actions will automatically:
#    - Run tests
#    - Build package
#    - Publish to npm
```

**For detailed deployment instructions, see [Deployment Guide](./docs/10-DEPLOYMENT-GUIDE.md).**

## Architecture

### Technology Stack

- **TypeScript** - Type-safe development
- **Commander.js** - CLI framework (git-like commands)
- **Ink** - React for terminal UIs
- **React** - UI component library
- **Axios** - HTTP client for API calls
- **date-fns** - Date manipulation
- **env-paths** - XDG-compliant path resolution
- **Zod** - Runtime type validation (from shared package)

### Key Design Decisions

**Why Ink (React)?**

- Declarative UI (easier than imperative terminal APIs)
- Component reusability
- State management with hooks
- Familiar for React developers

**Why Local-First?**

- Fast (no network latency)
- Works offline
- User owns their data (markdown files)
- Sync is optional enhancement

**Why XDG Base Directory?**

- Standard on Linux/Unix
- Predictable locations
- Respects user preferences
- Clean home directory

**Why Hash-Based Sync?**

- Efficient (compare hashes, not full content)
- Detects changes reliably
- Enables three-way merge
- No server-side state required

## Troubleshooting

### "Command not found: papyrus"

**Cause:** CLI not installed or not in PATH.

**Solution:**

```bash
# Check if installed
npm list -g @rewrlution/papyrus-cli

# Reinstall
npm install -g @rewrlution/papyrus-cli

# Check PATH
echo $PATH  # Should include npm global bin directory
```

### "No text editor found"

**Cause:** No supported editor detected.

**Solution:**

```bash
# Set EDITOR environment variable
export EDITOR=vim

# Or install a supported editor
sudo apt-get install vim  # Linux
brew install vim          # macOS
```

### "Not authenticated"

**Cause:** Not logged in or token expired.

**Solution:**

```bash
# Log in again
papyrus login

# Check token status
ls ~/.config/papyrus/token  # Should exist
```

### "Sync failed"

**Cause:** Network issues or server down.

**Solution:**

```bash
# Check internet connection
ping api.papyrus.com

# Try again later
papyrus sync

# Check server status
# https://status.papyrus.com (if available)
```

### "Cannot find module '@rewrlution/papyrus-shared'"

**Cause:** Development environment not set up correctly.

**Solution:**

```bash
# Build shared package first
cd packages/shared
pnpm build

# Then build CLI
cd ../cli
pnpm build
```

## Contributing

We welcome contributions! Here's how you can help:

### Reporting Bugs

1. Check existing issues: https://github.com/your-username/papyrus/issues
2. Create new issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment (OS, Node version)
   - Error messages/screenshots

### Suggesting Features

1. Open a discussion: https://github.com/your-username/papyrus/discussions
2. Describe the feature and use case
3. Consider implementation approach
4. Be open to feedback

### Contributing Code

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes following code style
4. Add tests
5. Update documentation
6. Run tests: `pnpm test`
7. Run linter: `pnpm lint`
8. Commit: `git commit -m "feat(cli): add search command"`
9. Push: `git push origin feature/my-feature`
10. Open Pull Request

**Code Style:**

- Use TypeScript
- Follow existing patterns
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Write tests for new features

**Commit Messages:**

- Follow [Conventional Commits](https://www.conventionalcommits.org/)
- Format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `chore`, `test`, `refactor`
- Examples:
  - `feat(cli): add search command`
  - `fix(sync): handle conflict resolution`
  - `docs: update README with examples`

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Complete development guide
- **[Deployment Guide](./docs/10-DEPLOYMENT-GUIDE.md)** - CI/CD and npm publishing
- **[Tutorials](./docs/)** - Step-by-step implementation guides
- **[Architecture Decisions](./docs/)** - Design rationale

## License

MIT License - see [LICENSE](../../LICENSE) file for details.

## Support

- **GitHub Issues**: https://github.com/your-username/papyrus/issues
- **Discussions**: https://github.com/your-username/papyrus/discussions
- **Email**: support@papyrus.com (if available)

## Acknowledgments

Built with:

- [Commander.js](https://github.com/tj/commander.js) - CLI framework
- [Ink](https://github.com/vadimdemedes/ink) - Terminal UI
- [React](https://react.dev) - UI library
- [Zod](https://zod.dev) - Validation

---

**Made with ❤️ by developers, for developers.**

Happy journaling! 📝
