import { UserMapper } from '../domain/mappers/user.mapper.js';
import { userRepository } from '../domain/repositories/user.repository.js';
import { ConflictError, UnauthorizedError } from '../lib/errors.js';
import {
  createEmailProvider,
  generateVerificationToken,
  getVerificationTokenExpiry,
  sendVerificationEmail,
} from '../email/index.js';
import { logger } from '../lib/logger.js';
import { comparePassword, hashPassword } from '../lib/password.js';
import { generateJwtToken } from '../lib/jwt.js';

export const AuthService = {
  /**
   * User signup
   * Business logic: check if user exists, create user, send email
   *
   * @param email - unique email
   * @param password - password
   */
  async signup(email: string, password: string) {
    logger.info('Start user signup', { email });

    // business rule: email must be unique
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      logger.warn('Signup failed: email already registered', { email });
      throw new ConflictError('Email already registered registered');
    }

    // business logic: hash password, generate token
    logger.info('Creating user', { email });
    const passwordHash = await hashPassword(password);
    const verificationToken = generateVerificationToken();
    const verificationExpiry = getVerificationTokenExpiry();

    // create usr via repository
    const userEntity = await userRepository.create({
      email,
      passwordHash,
      verified: false,
      verificationToken,
      verificationExpiry,
    });

    // business logic: send verification email
    logger.info('Sending verification email', { email });
    const provider = createEmailProvider('resend');
    await sendVerificationEmail(provider, email, verificationToken);

    const user = UserMapper.toUserData(userEntity);
    logger.info('Signup completed successfully', { userId: user.id, email });

    return {
      message: `Signup successfully! Please check ${email} to verify your account.`,
      data: user,
    };
  },

  async signin(email: string, password: string) {
    logger.info('Start user signin', { email });

    logger.debug('Looking up user', { email });
    const userEntity = await userRepository.findByEmail(email);
    if (!userEntity) {
      logger.warn('Signin failed: User not found', { email });
      throw new UnauthorizedError('Invalid email address or password');
    }

    logger.debug('Validating password', { userId: userEntity.id });
    const isValidPassword = await comparePassword(
      password,
      userEntity.passwordHash
    );
    if (!isValidPassword) {
      logger.warn('Signin failed: Invalid password', {
        userId: userEntity.id,
        email,
      });
      throw new UnauthorizedError('Invalid email address or password');
    }

    if (!userEntity.verified) {
      logger.warn('Signin failed: Email not verified', {
        userId: userEntity.id,
        email,
      });
      throw new UnauthorizedError('Please verify your email before signing in');
    }

    logger.debug('Generating JWT token', { userId: userEntity.id });
    const token = generateJwtToken({ userId: userEntity.id, email });

    logger.info('Signin completed successfully', {
      userId: userEntity.id,
      email,
    });

    const user = UserMapper.toUserData(userEntity);

    return {
      message: `Signin successfully!`,
      data: { ...user, token },
    };
  },
};
