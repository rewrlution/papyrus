import fs from 'fs';
import path from 'path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { BaseStorage } from '../../../src/lib/storage/base-storage';

describe('BaseStorage', () => {
  let storage: BaseStorage;
  let testDir: string;

  beforeEach(() => {
    storage = new BaseStorage();
    testDir = path.join(process.cwd(), 'test-temp');
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should return config and data directory paths', () => {
    const configDir = storage.getConfigDir();
    const dataDir = storage.getDataDir();

    expect(configDir).toContain('papyrus');
    expect(dataDir).toContain('papyrus');
  });

  it('should create directory if it does not exist', () => {
    const testPath = path.join(testDir, 'new-dir');

    storage.ensureDir(testPath);

    expect(fs.existsSync(testPath)).toBe(true);
  });

  it('should write and read file', () => {
    const testPath = path.join(testDir, 'test.txt');
    const content = 'Hello';

    storage.writeFile(testPath, content);
    const result = storage.readFile(testPath);

    expect(result).toBe(content);
  });

  it('should return null when reading non-existent file', () => {
    const result = storage.readFile(path.join(testDir, 'missing.txt'));

    expect(result).toBeNull();
  });

  it('should delete existing file', () => {
    const testPath = path.join(testDir, 'delete.txt');
    fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(testPath, 'test', 'utf-8');

    storage.deleteFile(testPath);

    expect(fs.existsSync(testPath)).toBe(false);
  });

  it('should check if file exists', () => {
    const testPath = path.join(testDir, 'exists.txt');
    fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(testPath, 'test', 'utf-8');

    expect(storage.fileExists(testPath)).toBe(true);
    expect(storage.fileExists(path.join(testDir, 'missing.txt'))).toBe(false);
  });
});
