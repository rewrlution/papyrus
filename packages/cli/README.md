# Papyrus CLI

> Terminal-first journaling for developers. Pairs with the Papyrus Claude Code plugin.

[![npm version](https://img.shields.io/npm/v/@rewrlution/papyrus-cli.svg)](https://www.npmjs.com/package/@rewrlution/papyrus-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is Papyrus?

Papyrus is a markdown-based journaling system for developers. The CLI handles writing, browsing, and cloud sync — the journaling habit itself. AI-powered career skills (resume bullets, promotion docs, standup notes, interview stories) live in the [Papyrus Claude Code plugin](https://github.com/rewrlution/papyrus/tree/main/packages/plugin) and read the same journal files this CLI writes.

**Key Features:**

- 📝 **Quick Journaling** - Write journal entries in your favorite editor (vim, nano, VS Code)
- 📅 **Date-based Organization** - Entries organized by date (YYYYMMDD format)
- 🔍 **Interactive Browser** - Browse and read journals with vim-style navigation
- ☁️ **Cloud Sync** - Sync journals across devices
- 🔐 **Secure** - JWT authentication with local token storage
- 💾 **Local-First** - All journals stored locally in markdown format
- 🎨 **Terminal UI** - React-based interface rendered in your terminal

## Installation

```bash
# Install globally
npm install -g @rewrlution/papyrus-cli

# Or with pnpm
pnpm add -g @rewrlution/papyrus-cli

# Or with yarn
yarn global add @rewrlution/papyrus-cli
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
papyrus app
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

#### `papyrus app`

Launch the Papyrus TUI to browse and read journal entries interactively.

```bash
papyrus app
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

## License

MIT License - see [LICENSE](../../LICENSE) file for details.

## Support

- **Email**: rewrlution@gmail.com

---

**Made with ❤️ by developers, for developers.**

Happy journaling! 📝
