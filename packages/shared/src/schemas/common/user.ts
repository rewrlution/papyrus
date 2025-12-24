import { z } from 'zod';

/**
 * User entity response.
 * Excludes sensitive fields like passwordHash and verificationToken.
 */
export const UserResponseSchema = z.object({
  id: z.string(),
  email: z.email(),
  verifified: z.boolean(),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;
