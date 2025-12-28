import type { User } from '@prisma/client';
import type { UserData } from '@rewrlution/papyrus-shared';

/**
 * User Mapper
 * Transforms between database entities and DTOs
 */
export class UserMapper {
  /**
   * Convert db user to user data.
   * Hides sensitive information such as passwordHash & verificationToken
   *
   * @param user - database user
   * @returns UserData object
   */
  static toUserData(user: User): UserData {
    return {
      id: user.id,
      email: user.email,
      verifified: user.verified,
    };
  }
}
