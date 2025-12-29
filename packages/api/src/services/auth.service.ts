import { UserMapper } from '../domain/mappers/user.mapper.js';
import { userRepository } from '../domain/repositories/user.repository.js';
import { ConflictError } from '../lib/errors.js';

export const AuthService = {
  /**
   * User signup
   * Business logic: check if user exists, create user, send email
   *
   * @param email - unique email
   * @param password - password
   */
  async signup(email: string, password: string) {
    // business rule: email must be unique
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    // business logic: hash password, generate token
    const passwordHash = 'hashed_' + password; // TODO: use bcyrpt
    const verificationToken = 'token_' + Math.random(); // TODO: use crypto
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // create usr via repository
    const userEntity = await userRepository.create({
      email,
      passwordHash,
      verified: false,
      verificationToken,
      verificationExpiry,
    });

    // business logic: TODO: send verification email

    const user = UserMapper.toUserData(userEntity);

    return {
      message: `Signup successfully! Please check ${email} to verify your account.`,
      user,
    };
  },
};
