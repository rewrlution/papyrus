# @rewrlution/papyrus-core

Filesystem logic for the Papyrus journaling system: path resolution, journal read/write, and career profile read/write. Shared by the Claude Code plugin (`@rewrlution/papyrus-plugin`) and the CLI (`@rewrlution/papyrus-cli`).

The journal file format at `~/.local/share/papyrus/journals/YYYYMMDD.md` is the stable interface across all Papyrus surfaces. This package is the single source of truth for that format.

## Install

```bash
npm install @rewrlution/papyrus-core
```

## Use as a library

```ts
import {
  PATHS,
  readJournal,
  writeJournal,
  readProfile,
} from '@rewrlution/papyrus-core';

console.log(PATHS.journalDir); // OS-appropriate journal directory
const today = await readJournal('20260516');
await writeJournal('20260516', '# Today\n...');
```

Submodule entry points are also exported:

```ts
import { PATHS } from '@rewrlution/papyrus-core/paths';
import { readJournal } from '@rewrlution/papyrus-core/journal';
import { readProfile } from '@rewrlution/papyrus-core/profile';
```

## Use as CLI scripts

Each module is also runnable directly — this is how Claude Code skills invoke it:

```bash
node node_modules/@rewrlution/papyrus-core/dist/paths.js          # print resolved paths as JSON
node node_modules/@rewrlution/papyrus-core/dist/journal.js list
node node_modules/@rewrlution/papyrus-core/dist/journal.js read 20260516
node node_modules/@rewrlution/papyrus-core/dist/journal.js write 20260516 '<content>'
node node_modules/@rewrlution/papyrus-core/dist/profile.js exists
node node_modules/@rewrlution/papyrus-core/dist/profile.js read
node node_modules/@rewrlution/papyrus-core/dist/profile.js write '<json>'
```

## Paths

`PATHS` resolves OS-specific locations via [`env-paths`](https://github.com/sindresorhus/env-paths):

| OS      | Data                                    | Config                          |
| ------- | --------------------------------------- | ------------------------------- |
| Linux   | `~/.local/share/papyrus`                | `~/.config/papyrus`             |
| macOS   | `~/Library/Application Support/papyrus` | `~/Library/Preferences/papyrus` |
| Windows | `%LOCALAPPDATA%\papyrus\Data`           | `%APPDATA%\papyrus\Config`      |

Journals live at `{dataDir}/journals/YYYYMMDD.md`; profile lives at `{configDir}/profile.md`.

## License

MIT. Part of the [Papyrus monorepo](https://github.com/rewrlution/papyrus).
