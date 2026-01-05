/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, Text, Newline, useApp, useInput } from 'ink';
import { useState } from 'react';

import { SignupSchema } from '@rewrlution/papyrus-shared';

import { api } from '../lib/api/index.js';

import { ColdStartAwareSpinner } from './ColdStart.js';
import { FormInput } from './FormInput.js';
import { LogoCompact } from './LogoCompact.js';
import { StatusMessage } from './StatusMessage.js';

type FormStep =
  | 'email'
  | 'password'
  | 'confirmPassword'
  | 'validating'
  | 'submitting'
  | 'success'
  | 'error';

export function RegisterForm() {
  const { exit } = useApp();

  // Form state
  const [step, setStep] = useState<FormStep>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [userName, setUserName] = useState('');

  // Handle Enter key to move between fields
  useInput((input, key) => {
    if (key.return) {
      if (step === 'email' && email.trim()) {
        setStep('password');
      } else if (step === 'password' && password.trim()) {
        setStep('confirmPassword');
      } else if (step === 'confirmPassword' && confirmPassword.trim()) {
        handleRegister();
      }
    }
  });

  const handleRegister = async () => {
    // 1. Validate inputs with Zod BEFORE making API call
    setStep('validating');

    const result = SignupSchema.safeParse({ email, password, confirmPassword });

    if (!result.success) {
      // Show all validation errors
      const errors = result.error.issues
        .map((issue) => `${issue.path}: ${issue.message}`)
        .join('\n');
      setErrorMessage(errors);
      setStep('error');

      // Go back to appropriate step after showing error
      setTimeout(() => {
        setStep('email');
        setPassword('');
        setConfirmPassword('');
        setErrorMessage('');
      }, 2000);
      return; // Stop execution here - don't proceed to API call
    }

    // 2. Make API call - validation already passed
    setStep('submitting');

    try {
      const response = await api.register(result.data!);
      setUserName(response.email);
      setStep('success');
    } catch (error: any) {
      setErrorMessage(error.message || 'Registration failed');
      setStep('error');
    }

    // Exit after successful login or showing error
    setTimeout(() => {
      exit(); // Exit with code 0 - error message already displayed
    }, 1000);
  };

  return (
    <Box flexDirection="column" paddingX={2} paddingY={2}>
      {/** Logo */}
      <LogoCompact />
      <Newline />

      {/** Title */}
      <Text color="gray" dimColor>
        Create your Papyrus account
      </Text>
      <Text color="gray" dimColor>
        Press Ctrl+C to cancel
      </Text>
      <Newline />

      {/** Email Input */}
      {step === 'email' && (
        <FormInput
          label="Email"
          value={email}
          onChange={setEmail}
          placeholder="user@example.com"
          focus={true}
        />
      )}

      {/** Password Input with Requirements */}
      {step === 'password' && (
        <Box flexDirection="column">
          {/* Show entered email (read-only) */}
          <Text color="cyan" bold>
            Email:
          </Text>
          <Box marginLeft={2} marginBottom={1}>
            <Text color="gray">{'> '}</Text>
            <Text>{email}</Text>
          </Box>

          {/* Password input with hint */}
          <FormInput
            label="Password (8+ chars, uppercase, lowercase, number, special char)"
            value={password}
            onChange={setPassword}
            mask="*"
            focus={true}
          />
        </Box>
      )}

      {/** Confirm Password Input */}
      {step === 'confirmPassword' && (
        <Box flexDirection="column">
          {/* Show entered email and password masked (read-only) */}
          <Text color="cyan" bold>
            Email:
          </Text>
          <Box marginLeft={2} marginBottom={1}>
            <Text color="gray">{'> '}</Text>
            <Text>{email}</Text>
          </Box>

          <Text color="cyan" bold>
            Password:
          </Text>
          <Box marginLeft={2} marginBottom={1}>
            <Text color="gray">{'> '}</Text>
            <Text>{'*'.repeat(password.length)}</Text>
          </Box>

          {/* Confirm password input */}
          <FormInput
            label="Confirm Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            mask="*"
            focus={true}
          />
        </Box>
      )}

      {/* Validating State */}
      {step === 'validating' && (
        <StatusMessage type="loading" message="Validating..." />
      )}

      {/* Submitting State */}
      {step === 'submitting' && (
        <ColdStartAwareSpinner message="Creating account..." />
      )}

      {/* Success State */}
      {step === 'success' && (
        <StatusMessage
          type="success"
          message={`Registration successful!\nPlease check ${userName} to verify your account. If you don't receive the verification email, contact: rewrlution@gmail.com`}
        />
      )}

      {/* Error State */}
      {step === 'error' && (
        <StatusMessage type="error" message={errorMessage} />
      )}
    </Box>
  );
}
