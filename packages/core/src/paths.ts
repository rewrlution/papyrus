/**
 * Papyrus path resolution.
 *
 * Single source of truth for where Papyrus stores files on each OS.
 * Both the CLI and the plugin reference this module — no path logic
 * should live anywhere else.
 *
 * Resolved paths by OS (via env-paths):
 *   Linux  : data  → ~/.local/share/papyrus
 *            config→ ~/.config/papyrus
 *   macOS  : data  → ~/Library/Application Support/papyrus
 *            config→ ~/Library/Preferences/papyrus
 *   Windows: data  → %LOCALAPPDATA%\papyrus\Data
 *            config→ %APPDATA%\papyrus\Config
 */

import path from 'path';

import envPaths from 'env-paths';

const p = envPaths('papyrus', { suffix: '' });

export const PATHS = {
  /** OS-appropriate data directory root */
  dataDir: p.data,

  /** OS-appropriate config directory root */
  configDir: p.config,

  /** Where journal .md files live: {dataDir}/journals/YYYYMMDD.md */
  journalDir: path.join(p.data, 'journals'),

  /** Career profile file written by /papyrus-setup */
  profilePath: path.join(p.config, 'profile.md'),
} as const;

export type PapyrusPaths = typeof PATHS;

// ─── CLI entry point ────────────────────────────────────────────────────────
// When called directly (node dist/lib/paths.js), prints paths as JSON.
// Skills use this to discover paths without hardcoding OS-specific strings.
//
// Usage in a SKILL.md:
//   Run: node ../../dist/lib/paths.js
//   Parse the JSON output to get journalDir, profilePath, etc.

if (process.argv[1] === new URL(import.meta.url).pathname) {
  process.stdout.write(JSON.stringify(PATHS, null, 2) + '\n');
}
