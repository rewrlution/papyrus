import { spawnSync, execSync } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { JOURNAL_TEMPATE, stripTemplateComments } from './template.js';

/**
 * Supported editors in order of preference.
 * Windows: vi -> vim -> code -> notepad (default)
 * Unix/MacOS: vi -> vim -> code -> nano (default)
 */
const EDITORS = ['vi', 'vim', 'nano', 'code', 'notepad'];

function isAvailable(editor: string): boolean {
  try {
    const command = process.platform === 'win32' ? 'where' : 'which';
    execSync(`${command} ${editor}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
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

  const contentWithTemplate = content
    ? `${content}\n${JOURNAL_TEMPATE}`
    : `${JOURNAL_TEMPATE}`;

  try {
    const editor = detectEditor();
    console.log(`Opening in ${editor}...`);

    // Determine args based on editor
    const args =
      editor === 'code'
        ? ['--wait', contentWithTemplate]
        : [contentWithTemplate];
    const result = spawnSync(editor, args, { stdio: 'inherit' });

    if (result.error) {
      throw new Error(`Failed to open editor: ${result.error.message}`);
    }

    if (result.status !== 0 && result.status !== null) {
      throw new Error(`Editor exited with code ${result.status}`);
    }

    const editedContent = fs.readFileSync(tempFile, 'utf-8');
    const cleaned = stripTemplateComments(editedContent);

    // Clean up tem file
    fs.unlinkSync(tempFile);

    return cleaned;
  } catch (error) {
    // Clean up temp file on error
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    throw error;
  }
}
