import { UserMapper } from '../domain/mappers/user.mapper.js';
import { userRepository } from '../domain/repositories/user.repository.js';
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
} from '../lib/errors.js';
import {
  createEmailProvider,
  generateVerificationToken,
  getVerificationTokenExpiry,
  sendVerificationEmail,
} from '../email/index.js';
import { logger } from '../lib/logger.js';
import { comparePassword, hashPassword } from '../lib/password.js';
import { generateJwtToken } from '../lib/jwt.js';
import {
  ApiMessageResponse,
  SigninResponse,
  SignupResponse,
} from '@rewrlution/papyrus-shared';

export const AuthService = {
  /**
   * User signup
   * Business logic: check if user exists, create user, send email
   *
   * @param email - unique email
   * @param password - password
   */
  async signup(email: string, password: string): Promise<SignupResponse> {
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
      success: true,
      message: `Signup successfully! Please check ${email} to verify your account.`,
      data: user,
    };
  },

  /**
   * User signin
   * Business logic: check if user exists and verified.
   */
  async signin(email: string, password: string): Promise<SigninResponse> {
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
      success: true,
      message: `Signin successfully!`,
      data: { ...user, token },
    };
  },

  async verifyEmail(token: string): Promise<ApiMessageResponse> {
    logger.info('Starting email verification', { tokenLen: token.length });

    logger.debug('Looking up user by verification token');
    const userEntity = await userRepository.findByVerificationToken(token);
    if (!userEntity) {
      logger.warn('Verification failed: Invalid token', {
        tokenPrefix: token.substring(0, 8) + '...',
      });
      throw new BadRequestError('Invalid verification token');
    }

    logger.debug('User found', { userId: userEntity.id });

    if (
      !userEntity.verificationExpiry ||
      userEntity.verificationExpiry < new Date()
    ) {
      logger.warn('Verification failed: token expired', {
        userId: userEntity.id,
        email: userEntity.email,
        expirty: userEntity.verificationExpiry,
      });
      throw new BadRequestError('Verification token has expired.');
    }

    if (userEntity.verified) {
      logger.warn('Verification failed: Already verified', {
        userId: userEntity.id,
        email: userEntity.email,
      });
      throw new BadRequestError('Email already verified');
    }

    logger.debug('Updating user verification status', {
      userId: userEntity.id,
    });
    await userRepository.update(userEntity.id, {
      verified: true,
      verificationToken: null,
      verificationExpiry: null,
    });

    logger.info('Email verified successfully', {
      userId: userEntity.id,
      email: userEntity.email,
    });

    return {
      success: true,
      message:
        'Email verified successfully! You may now login with your email and password.',
    };
  },
};
