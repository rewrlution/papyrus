/**
 * Encryption Utility
 * Server-side encryption using AES-256-GCM.
 */
import crypto from 'crypto';

import { Journal } from '@prisma/client';

import { env } from '../env/config.js';

import { logger } from './logger.js';

const ALGORITHM = 'aes-256-gcm' as const;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

const ENCRYPTION_KEY = env.ENCRYPTION_KEY;
const KEY_BUFFER = Buffer.from(ENCRYPTION_KEY, 'hex');

export type EncryptedData = {
  ciphertext: string;
  iv: string;
  authTag: string;
};

/**
 * Encrypt data using ASE-256-GCM algo
 *
 * @param plaintext - the text to encrypt
 * @param key - the encryption key
 * @returns encrypted data with iv and auth tag
 */
export function encrypt(plaintext: string): EncryptedData {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY_BUFFER, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf-8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

export function decrypt(encryptedData: EncryptedData): string {
  const { ciphertext, iv, authTag } = encryptedData;
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    KEY_BUFFER,
    Buffer.from(iv, 'base64'),
    {
      authTagLength: AUTH_TAG_LENGTH,
    }
  );

  // set auth tag for verification
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64')),
    decipher.final(),
  ]);

  return decrypted.toString('utf-8');
}

/**
 * Decrypts journal content with error handling.
 *
 * Helper function that wraps decrypt() with error handling,
 * returning a placeholder message if decryption fails.
 *
 * @param entity - Journal entity with encryption fields
 * @returns Decrypted content or error placeholder
 */
export function decryptJournalContent(entity: Journal): string {
  try {
    return decrypt({
      ciphertext: entity.ciphertext,
      iv: entity.iv,
      authTag: entity.authTag,
    });
  } catch (err) {
    logger.error('Failed to decrypt journal', { id: entity.id, err });
    return '[Decryption failed]';
  }
}
