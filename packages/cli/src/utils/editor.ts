import { spawnSync } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

/**
 * Supported editors in order of preference.
 * Windows: vi -> vim -> code -> notepad (default)
 * Unix/MacOS: vi -> vim -> code -> nano (default)
 */
const EDITORS = ['vi', 'vim', 'nano', 'code', 'notepad'];

/**
 * Determines if an editor needs shell wrapper to execute.
 * - vi/vim/nano: Better without shell (direct TTY access)
 * - code: Needs shell on Windows (code.cmd is a batch file)
 * - notepad: Works either way
 */
function needsShell(editor: string): boolean {
  return editor === 'code' || editor === 'notepad';
}

function isAvailable(editor: string): boolean {
  // Notepad is always available on Windows and doesn't support --version
  if (editor === 'notepad' && process.platform === 'win32') {
    return true;
  }

  // Test if the command is actually executable, not just if it exists
  // shell: true is required to execute batch files (.cmd/.bat) on Windows (e.g., code.cmd)
  // and works correctly on Linux/macOS as well (uses /bin/sh)
  const result = spawnSync(editor, ['--version'], {
    stdio: 'ignore',
    shell: needsShell(editor),
    timeout: 1000,
  });
  return !result.error;
}

export function detectEditor(): string {
  for (const editor of EDITORS) {
    if (isAvailable(editor)) {
      return editor;
    }
  }

  throw new Error(
    'No text editor found. Please install one of: vi, vim, nano, VS Code, Notepad'
  );
}

export function openInEditor(
  content: string,
  baseFilename: string = 'papyrus.md'
): string {
  // Create temp file
  const ext = path.extname(baseFilename);
  const base = path.basename(baseFilename, ext);
  const randomSuffix = crypto.randomBytes(6).toString('hex');
  const uniqueFilename = `${base}-${randomSuffix}${ext}`;
  const tempFile = path.join(os.tmpdir(), uniqueFilename);

  // Write initial content
  fs.writeFileSync(tempFile, content, 'utf-8');

  try {
    const editor = detectEditor();

    // Determine args based on editor
    const args = editor === 'code' ? ['--wait', tempFile] : [tempFile];
    const result = spawnSync(editor, args, {
      stdio: 'inherit',
      shell: needsShell(editor), // Required for batch files on Windows
    });

    if (result.error) {
      throw new Error(`Failed to open editor: ${result.error.message}`);
    }

    if (result.status !== 0 && result.status !== null) {
      throw new Error(`Editor exited with code ${result.status}`);
    }

    const editedContent = fs.readFileSync(tempFile, 'utf-8');

    // Clean up tem file
    fs.unlinkSync(tempFile);

    return editedContent;
  } catch (error) {
    // Clean up temp file on error
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    throw error;
  }
}
