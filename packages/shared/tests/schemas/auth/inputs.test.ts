import { describe, it, expect } from 'vitest';
import {
  SignupSchema,
  SigninSchema,
  VerifyEmailSchema,
  ResendVerificationSchema,
} from '../../../src/schemas/auth/inputs';

describe('SignupSchema', () => {
  it('should accept valid signup data', () => {
    const validData = {
      email: 'user@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    };
    expect(SignupSchema.parse(validData)).toEqual(validData);
  });

  it.each([
    {
      case: 'invalid email',
      email: 'invalid-email',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      expectedError: 'Invalid email address',
    },
    {
      case: 'password without uppercase',
      email: 'user@example.com',
      password: 'password123!',
      confirmPassword: 'password123!',
      expectedError: 'Need uppercase',
    },
    {
      case: 'password without lowercase',
      email: 'user@example.com',
      password: 'PASSWORD123!',
      confirmPassword: 'PASSWORD123!',
      expectedError: 'Need lowercase',
    },
    {
      case: 'password without number',
      email: 'user@example.com',
      password: 'Password!',
      confirmPassword: 'Password!',
      expectedError: 'Need number',
    },
    {
      case: 'password without special char',
      email: 'user@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      expectedError: 'Need special char',
    },
    {
      case: 'mismatched passwords',
      email: 'user@example.com',
      password: 'Password123!',
      confirmPassword: 'DifferentPass123!',
      expectedError: "Passwords don't match",
    },
    {
      case: 'short password',
      email: 'user@example.com',
      password: 'Pass1!',
      confirmPassword: 'Pass1!',
      expectedError: 'Must be at least 8 characters long',
    },
  ])(
    'should reject $case',
    ({ email, password, confirmPassword, expectedError }) => {
      const invalidData = { email, password, confirmPassword };
      expect(() => SignupSchema.parse(invalidData)).toThrow(expectedError);
    }
  );
});

describe('SigninSchema', () => {
  it('should accept valid signin data', () => {
    const validData = {
      email: 'user@example.com',
      password: 'anypassword',
    };
    expect(SigninSchema.parse(validData)).toEqual(validData);
  });

  it('should reject invalid email', () => {
    const invalidData = {
      email: 'not-an-email',
      password: 'password',
    };
    expect(() => SigninSchema.parse(invalidData)).toThrow();
  });

  it('should reject empty password', () => {
    const invalidData = {
      email: 'user@example.com',
      password: '',
    };
    expect(() => SigninSchema.parse(invalidData)).toThrow(
      'Password is required'
    );
  });
});

describe('VerifyEmailSchema', () => {
  it('should accept valid token', () => {
    const validData = { token: 'valid-token-123' };
    expect(VerifyEmailSchema.parse(validData)).toEqual(validData);
  });

  it('should reject empty token', () => {
    const invalidData = { token: '' };
    expect(() => VerifyEmailSchema.parse(invalidData)).toThrow(
      'Verification token is required'
    );
  });
});

describe('ResendVerificationSchema', () => {
  it('should accept valid email', () => {
    const validData = { email: 'user@example.com' };
    expect(ResendVerificationSchema.parse(validData)).toEqual(validData);
  });

  it('should reject invalid email', () => {
    const invalidData = { email: 'invalid-email' };
    expect(() => ResendVerificationSchema.parse(invalidData)).toThrow();
  });
});
