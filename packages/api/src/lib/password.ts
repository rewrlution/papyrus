import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * bcrypt:
 * 1. generates a random SALT
 * 2. combines password with the SALT
 * 3. applies hashing algorithm for (SALT_ROUNDS) rounds
 * The final hash includes both the SALT and the hashed string
 *
 * @param password - plain text
 * @returns hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * bcrypt:
 * 1. extracts the SALT from the hash
 * 2. uses it to hash the provided password
 * 3. compare if the hash results match
 *
 * @param password - plain text
 * @param hash - hased password
 * @returns true if passwords match, else false
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
