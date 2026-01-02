/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, Text, Newline, useApp, useInput } from 'ink';
import React, { useState } from 'react';

import { SigninSchema } from '@rewrlution/papyrus-shared';

import { api } from '../lib/api/index.js';

import { FormInput } from './FormInput.js';
import { Logo } from './Logo.js';
import { StatusMessage } from './StatusMessage.js';

type FormStep =
  | 'email'
  | 'password'
  | 'validating'
  | 'submitting'
  | 'success'
  | 'error';

export function LoginForm() {
  const { exit } = useApp();

  // Form state
  const [step, setStep] = useState<FormStep>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [userName, setUserName] = useState('');

  useInput((input, key) => {
    if (key.return) {
      if (step === 'email' && email.trim()) {
        setStep('password');
      } else if (step === 'password' && password.trim()) {
        handleLogin();
      }
    }
  });

  const handleLogin = async () => {
    if (!password.trim()) return; // Don't proceed if empty

    // 1. Validate inputs with Zod BEFORE making api call
    setStep('validating');

    const result = SigninSchema.safeParse({ email, password });

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
        setErrorMessage('');
      }, 2000);
      return; // Stop execution here - don't proceed to API call
    }

    // 2. Make api call - vliadation already passed
    setStep('submitting');

    try {
      const response = await api.login(result.data!);
      setUserName(response.email);
      setStep('success');
    } catch (error: any) {
      setErrorMessage(error.message || 'Login failed');
      setStep('error');
    }

    // Exit after successful login or showing error
    setTimeout(() => {
      exit(); // Exit with code 0 - error message already displayed
    }, 1000);
  };

  return (
    <Box flexDirection="column" paddingX={2} paddingY={2}>
      <Logo />
      <Newline />

      {/** Title */}
      <Text color="gray" dimColor>
        Login to your account
      </Text>
      <Text color="gray" dimColor>
        Press Ctrl+C to cancel
      </Text>
      <Newline />

      {/** Email */}
      {step === 'email' && (
        <FormInput
          label="Email"
          value={email}
          onChange={setEmail}
          placeholder="user@example.com"
          focus={true}
        />
      )}

      {/** Password Input */}
      {step === 'password' && (
        <Box flexDirection="column">
          <Text color="cyan" bold>
            Email:
          </Text>
          <Box marginLeft={2} marginBottom={1}>
            <Text color="gray">{'> '}</Text>
            <Text>{email}</Text>
          </Box>

          <FormInput
            label="Password"
            value={password}
            onChange={setPassword}
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
        <StatusMessage type="loading" message="Logging in..." />
      )}

      {/* Success State */}
      {step === 'success' && (
        <StatusMessage type="success" message={`Welcome back, ${userName}!`} />
      )}

      {/* Error State */}
      {step === 'error' && (
        <StatusMessage type="error" message={errorMessage} />
      )}
    </Box>
  );
}
