import fs from 'fs';
import path from 'path';

import { beforeEach, describe, expect, it } from 'vitest';

import { BaseStorage } from '../../../src/lib/storage/base-storage';

class TestStorage extends BaseStorage {
  // Expose protected methods for testing
  public testGetConfigDir() {
    return this.getConfigDir();
  }
  public testGetDataDir() {
    return this.getDataDir();
  }
  public testReadFile(filePath: string) {
    return this.readFile(filePath);
  }
  public testWriteFile(filePath: string, content: string) {
    return this.writeFile(filePath, content);
  }
  public testDeleteFile(filePath: string) {
    return this.deleteFile(filePath);
  }
}

describe('BaseStorage', () => {
  let storage: TestStorage;

  beforeEach(() => {
    storage = new TestStorage();
  });

  it('should get config directory', () => {
    const dir = storage.testGetConfigDir();
    expect(dir).toContain('papyrus');
  });

  it('should get data directory', () => {
    const dir = storage.testGetDataDir();
    expect(dir).toContain('papyrus');
  });

  it('should write and read file', () => {
    const testDir = path.join(process.cwd(), 'test-storage');
    const testFile = path.join(testDir, 'test.txt');

    storage.testWriteFile(testFile, 'hello');
    const content = storage.testReadFile(testFile);

    expect(content).toBe('hello');

    // Cleanup
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('should return null for non-existent file', () => {
    const content = storage.testReadFile('/non/existent/file.txt');
    expect(content).toBeNull();
  });

  it('should delete file', () => {
    const testDir = path.join(process.cwd(), 'test-storage');
    const testFile = path.join(testDir, 'test.txt');

    storage.testWriteFile(testFile, 'hello');
    storage.testDeleteFile(testFile);

    const content = storage.testReadFile(testFile);
    expect(content).toBeNull();

    // Cleanup
    fs.rmSync(testDir, { recursive: true, force: true });
  });
});
