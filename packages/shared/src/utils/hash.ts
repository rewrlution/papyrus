import crypto from 'crypto';

/**
 * Generate SHA-256 hash of content for sync conflict detection.
 *
 * @param content - file content
 * @returns sha256 hash
 */
export function generateContentHash(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf-8').digest('hex');
}
