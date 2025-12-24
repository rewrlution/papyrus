import { z } from 'zod';

/**
 * User entity response.
 * Excludes sensitive fields like passwordHash and verificationToken.
 */
export const UserDataSchema = z.object({
  id: z.string(),
  email: z.email(),
  verifified: z.boolean(),
});

export type UserData = z.infer<typeof UserDataSchema>;
