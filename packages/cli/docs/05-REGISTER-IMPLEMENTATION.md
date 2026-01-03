# Implementing the Register Component

A complete, step-by-step guide to building an interactive registration form with React and API integration.

## What We're Building

An interactive registration flow that:

1. Shows the Papyrus logo
2. Prompts for email, password, and confirm password
3. **Validates inputs with Zod (client-side)** including password strength rules
4. Calls the API to create account
5. Shows loading state during registration
6. Displays success or error messages
7. Provides clear feedback on password requirements
8. Exits gracefully with instructions

## Final Result

```bash
$ papyrus register

██████╗  █████╗ ██████╗ ██╗   ██╗██████╗ ██╗   ██╗███████╗
██╔══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝██╔══██╗██║   ██║██╔════╝
██████╔╝███████║██████╔╝ ╚████╔╝ ██████╔╝██║   ██║███████╗
██╔═══╝ ██╔══██║██╔═══╝   ╚██╔╝  ██╔══██╗██║   ██║╚════██║
██║     ██║  ██║██║        ██║   ██║  ██║╚██████╔╝███████║
╚═╝     ╚═╝  ╚═╝╚═╝        ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝

Create your Papyrus account
Press Ctrl+C to cancel

Email:
> newuser@example.com

Password (8+ chars, uppercase, lowercase, number, special char):
> ********

Confirm Password:
> ********

📝 Creating account...

✅ Registration successful!
Please check newuser@example.com to verify your account.
```

## Architecture

```
┌──────────────────────────┐
│   register command       │
│   (entry point)          │
└────────────┬─────────────┘
             │
             ↓
┌──────────────────────────┐
│   <RegisterForm />       │
│   (React component)      │
│   - Shows logo           │
│   - Collects inputs      │
│   - Validates with Zod   │ ← Client-side validation with password rules
│   - Manages state        │
│   - Shows password hints │
└────────────┬─────────────┘
             │
             ↓
┌──────────────────────────┐
│   ApiClient              │
│   (HTTP calls)           │
└──────────────────────────┘
```

**Key difference from login**: Registration validates password strength (uppercase, lowercase, number, special character) and confirms password match.

## Prerequisites

Ensure you have completed:

- [01-STORAGE-LAYER.md](./01-STORAGE-LAYER.md) - Storage layer with TokenStore
- [02-API-CLIENT-SETUP.md](./02-API-CLIENT-SETUP.md) - API client with Zod validation
- [03-REACT-CLI-COMPONENTS.md](./03-REACT-CLI-COMPONENTS.md) - Understand Ink basics
- [04-LOGIN-IMPLEMENTATION.md](./04-LOGIN-IMPLEMENTATION.md) - Login form (we'll reuse components)

Components already available:

- `FormInput` - Reusable input component
- `StatusMessage` - Status display component
- `Logo` - ASCII art logo

## Implementation

### Step 1: Understanding the SignupSchema

The `SignupSchema` from `@rewrlution/papyrus-shared` enforces password requirements:

```typescript
// packages/shared/src/schemas/auth/inputs.ts
export const SignupSchema = z
  .object({
    email: z.email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Must be at least 8 characters long')
      .refine((val) => /[A-Z]/.test(val), 'Need uppercase')
      .refine((val) => /[a-z]/.test(val), 'Need lowercase')
      .refine((val) => /\d/.test(val), 'Need number')
      .refine((val) => /[@$!%*?&]/.test(val), 'Need special char'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
```

**Password requirements**:

- At least 8 characters long
- Contains uppercase letter (A-Z)
- Contains lowercase letter (a-z)
- Contains number (0-9)
- Contains special character (@$!%\*?&)
- Passwords must match

**Why this matters**: These rules enforce strong passwords and provide clear error messages when validation fails.

### Step 2: Create Register Form Component

Create the main registration form component with all validation feedback:

```tsx
// src/components/RegisterForm.tsx
import React, { useState } from 'react';
import { Box, Text, Newline, useApp, useInput } from 'ink';
import { SignupSchema } from '@rewrlution/papyrus-shared';
import { Logo } from './Logo.js';
import { FormInput } from './FormInput.js';
import { StatusMessage } from './StatusMessage.js';
import { api } from '../lib/api/index.js';

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

  // Handle registration with Zod validation
  const handleRegister = async () => {
    // 1. Validate inputs with Zod BEFORE making API call
    setStep('validating');

    const result = SignupSchema.safeParse({ email, password, confirmPassword });

    if (!result.success) {
      // Show all validation errors with clear formatting
      const errors = result.error.issues
        .map((issue) => {
          const field = issue.path[0] || 'form';
          return `${field}: ${issue.message}`;
        })
        .join('\n');

      setErrorMessage(errors);
      setStep('error');

      // Go back to first field with error after showing message
      setTimeout(() => {
        const firstError = result.error.issues[0];
        const field = firstError.path[0];

        if (field === 'email') {
          setStep('email');
        } else if (field === 'confirmPassword') {
          setConfirmPassword(''); // Clear the field
          setStep('confirmPassword');
        } else {
          setPassword('');
          setConfirmPassword('');
          setStep('password');
        }

        setErrorMessage('');
      }, 3000); // Longer timeout to read all errors
      return;
    }

    // 2. Make API call - validation already passed
    setStep('submitting');

    try {
      const response = await api.register(result.data);
      setStep('success');

      // Exit after showing success message
      setTimeout(() => {
        exit();
      }, 3000); // Give time to read the verification message
    } catch (error: any) {
      setErrorMessage(error.message || 'Registration failed');
      setStep('error');

      // Exit after showing error
      setTimeout(() => {
        exit();
      }, 2000);
    }
  };

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      {/* Logo */}
      <Logo />
      <Newline />

      {/* Title */}
      <Text color="gray" dimColor>
        Create your Papyrus account
      </Text>
      <Text color="gray" dimColor>
        Press Ctrl+C to cancel
      </Text>
      <Newline />

      {/* Email Input */}
      {step === 'email' && (
        <FormInput
          label="Email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          focus={true}
        />
      )}

      {/* Password Input with Requirements */}
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

      {/* Confirm Password Input */}
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
        <StatusMessage type="loading" message="Creating account..." />
      )}

      {/* Success State */}
      {step === 'success' && (
        <StatusMessage
          type="success"
          message={`Registration successful!\nPlease check ${email} to verify your account.`}
        />
      )}

      {/* Error State */}
      {step === 'error' && (
        <StatusMessage type="error" message={errorMessage} />
      )}
    </Box>
  );
}
```

**Key features of this component**:

1. **Three-step input flow**: Email → Password → Confirm Password
2. **Password requirements shown inline**: The label tells users what's required
3. **Comprehensive validation**: All password rules checked before API call
4. **Clear error messages**: Shows exactly what's wrong (e.g., "Need uppercase")
5. **Progressive disclosure**: Shows previous inputs as you proceed
6. **Smart error recovery**: Returns to the appropriate field after error

### Step 3: Update Register Command

Update the register command to render the React component:

```tsx
// src/commands/auth/register.ts
import { render } from 'ink';
import React from 'react';
import { RegisterForm } from '../../components/RegisterForm.js';

export async function register(): Promise<void> {
  // Render the register form
  const { waitUntilExit } = render(<RegisterForm />);

  // Wait for the form to complete
  await waitUntilExit();
}
```

**Why this approach**: The command is now just a thin wrapper that renders the interactive form. All logic lives in the component.

### Step 4: Update Command Registration

Update the command registration to remove CLI options (no longer needed with interactive form):

```typescript
// src/commands/auth/index.ts
import { Command } from 'commander';
import { login } from './login.js';
import { logout } from './logout.js';
import { register } from './register.js';

export function registerAuthCommands(program: Command) {
  program
    .command('login')
    .description('Log in to your Papyrus account')
    .action(async () => await login());

  program
    .command('logout')
    .description('Log out from your account')
    .action(() => logout());

  program
    .command('register')
    .description('Create a new Papyrus account')
    .action(async () => await register());

  // Note: Removed CLI options (-e, -p, -c) since we now use interactive form
}
```

**Why remove options**: Interactive forms provide better UX with validation feedback, password masking, and visual flow. CLI options are harder to use for complex validation.

## Testing the Registration Flow

### 1. Build and Run

```bash
cd packages/cli
pnpm build
node dist/cli.js register
```

### 2. Test with tsx (faster)

```bash
tsx src/cli.tsx register
```

### 3. Test Different Scenarios

**Valid registration:**

```bash
tsx src/cli.tsx register
# Email: test@example.com
# Password: SecurePass123!
# Confirm: SecurePass123!
# Should show success message
```

**Password too weak:**

```bash
tsx src/cli.tsx register
# Email: test@example.com
# Password: weakpass
# Should show validation errors:
#   password: Must be at least 8 characters long
#   password: Need uppercase
#   password: Need number
#   password: Need special char
```

**Passwords don't match:**

```bash
tsx src/cli.tsx register
# Email: test@example.com
# Password: SecurePass123!
# Confirm: DifferentPass123!
# Should show: confirmPassword: Passwords don't match
```

**Invalid email:**

```bash
tsx src/cli.tsx register
# Email: notanemail
# Password: SecurePass123!
# Should show: email: Invalid email address
```

## How Validation Works

### Client-Side Validation Flow

```
User enters data
      ↓
Press Enter on Confirm Password
      ↓
┌─────────────────────────┐
│ SignupSchema.safeParse  │ ← Runs all validation rules
└────────┬────────────────┘
         │
    ┌────┴────┐
    │ Valid?  │
    └────┬────┘
         │
    ┌────┴──────────┐
    │               │
   YES              NO
    │               │
    ↓               ↓
API Call     Show Errors
Success      Go Back to Field
```

**Benefits of this approach**:

- ✅ **Instant feedback**: No network delay to see errors
- ✅ **Same validation as API**: Uses shared `SignupSchema`
- ✅ **Multiple errors shown**: User sees all issues at once
- ✅ **Type safety**: Validated data is properly typed
- ✅ **Reduced server load**: Invalid requests never sent

### Password Validation Rules Explained

The schema uses Zod's `.refine()` for custom validation:

```typescript
.refine((val) => /[A-Z]/.test(val), 'Need uppercase')
```

Each refinement:

1. Tests the password with a regex
2. Returns `true` if valid, `false` if invalid
3. Shows the error message if invalid

**Why multiple refinements**: Each rule gets its own error message, so users know exactly what's missing.

## Enhancements

### Add Password Strength Indicator

Show real-time feedback as user types:

```tsx
// src/components/PasswordStrength.tsx
import React from 'react';
import { Box, Text } from 'ink';

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const checks = [
    { test: password.length >= 8, label: '8+ characters' },
    { test: /[A-Z]/.test(password), label: 'Uppercase letter' },
    { test: /[a-z]/.test(password), label: 'Lowercase letter' },
    { test: /\d/.test(password), label: 'Number' },
    { test: /[@$!%*?&]/.test(password), label: 'Special character' },
  ];

  return (
    <Box flexDirection="column" marginLeft={2} marginTop={1}>
      <Text color="gray" dimColor>
        Password requirements:
      </Text>
      {checks.map((check, index) => (
        <Text key={index} color={check.test ? 'green' : 'gray'}>
          {check.test ? '✅' : '⬜'} {check.label}
        </Text>
      ))}
    </Box>
  );
}
```

Use it in the password step:

```tsx
{
  step === 'password' && (
    <Box flexDirection="column">
      <FormInput
        label="Password"
        value={password}
        onChange={setPassword}
        mask="*"
      />
      <PasswordStrength password={password} />
    </Box>
  );
}
```

### Add Back Navigation

Allow going back to previous fields:

```tsx
// In useInput handler:
useInput((input, key) => {
  // Allow ESC to go back
  if (key.escape) {
    if (step === 'confirmPassword') {
      setConfirmPassword('');
      setStep('password');
    } else if (step === 'password') {
      setPassword('');
      setStep('email');
    }
    return;
  }

  // ... rest of input handling
});

// Show hint
<Text color="gray" dimColor>
  Press ESC to go back, Ctrl+C to cancel
</Text>;
```

### Remember Email Across Sessions

Pre-fill email from last registration attempt:

```tsx
// Use the same TokenStore pattern
const [email, setEmail] = useState(configStore.get('lastEmail') || '');

// After successful registration:
configStore.set('lastEmail', email);
```

### Add Terms of Service Confirmation

Add a final confirmation step:

```tsx
type FormStep =
  | 'email'
  | 'password'
  | 'confirmPassword'
  | 'terms' // New step
  | 'validating'
  | 'submitting'
  | 'success'
  | 'error';

// In the form flow:
{
  step === 'terms' && (
    <Box flexDirection="column">
      <Text>
        By creating an account, you agree to our{' '}
        <Text color="cyan">Terms of Service</Text> and{' '}
        <Text color="cyan">Privacy Policy</Text>.
      </Text>
      <Newline />
      <Text color="gray" dimColor>
        Press Enter to continue, ESC to go back
      </Text>
    </Box>
  );
}
```

### Email Format Validation

Add early email validation when moving to password:

```tsx
useInput((input, key) => {
  if (key.return) {
    if (step === 'email' && email.trim()) {
      // Validate email early
      const emailResult = SignupSchema.shape.email.safeParse(email);
      if (!emailResult.success) {
        setErrorMessage(emailResult.error.issues[0].message);
        setStep('error');
        setTimeout(() => {
          setStep('email');
          setErrorMessage('');
        }, 2000);
        return;
      }
      setStep('password');
    }
    // ... rest of handlers
  }
});
```

## Testing

### Unit Test the Register Logic

```typescript
// src/components/__tests__/RegisterForm.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import { RegisterForm } from '../RegisterForm.js';

vi.mock('../../lib/api/index.js', () => ({
  api: {
    register: vi.fn(),
  },
}));

describe('RegisterForm', () => {
  it('should render email input first', () => {
    const { lastFrame } = render(<RegisterForm />);
    expect(lastFrame()).toContain('Email:');
  });

  it('should show password requirements', async () => {
    const { stdin, lastFrame } = render(<RegisterForm />);

    // Enter email and move to password
    stdin.write('test@test.com');
    stdin.write('\r'); // Enter key

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(lastFrame()).toContain('Password');
    expect(lastFrame()).toContain('8+ chars');
  });

  it('should validate password strength', async () => {
    const { stdin, lastFrame } = render(<RegisterForm />);

    // Enter email
    stdin.write('test@test.com\r');
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Enter weak password
    stdin.write('weak\r');
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Enter same weak password as confirmation
    stdin.write('weak\r');
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Should show validation errors
    expect(lastFrame()).toContain('Must be at least 8 characters');
  });
});
```

### Integration Test

```typescript
// src/commands/__tests__/auth.test.ts
import { describe, it, expect, vi } from 'vitest';
import { register } from '../auth/register.js';

describe('register command', () => {
  it('should render RegisterForm', async () => {
    const renderSpy = vi.spyOn(require('ink'), 'render');

    await register();

    expect(renderSpy).toHaveBeenCalled();
  });
});
```

## Common Issues

### Password validation not working

- Verify `SignupSchema` is imported from `@rewrlution/papyrus-shared`
- Check that regex patterns are correct
- Ensure `.safeParse()` is called (not `.parse()`)

### Form doesn't proceed to next field

- Check `useInput` handler is inside component
- Verify `key.return` check is correct
- Ensure step transitions are correct
- Check that input values aren't empty

### Confirm password always fails

- Verify both `password` and `confirmPassword` state variables are set
- Check that `.refine()` for password match is working
- Log values to debug: `console.log({ password, confirmPassword })`

### Error messages not showing

- Ensure `StatusMessage` component handles multiline messages
- Check timeout duration is long enough to read
- Verify error state is set before timeout

### API call fails

- Verify API server is running
- Check `API_BASE_URL` is correct
- Ensure `/auth/signup` endpoint exists
- Check network connectivity

## Next Steps

1. **Add email verification flow** - Handle verification token
2. **Implement password reset** - Forgot password flow
3. **Add OAuth registration** - Register with GitHub/Google
4. **Profile completion** - Collect additional info after registration
5. **Onboarding flow** - Guide new users through features

## Key Takeaways

**Zod Validation for Complex Rules**:

1. **Shared schema ensures consistency**:

   ```tsx
   import { SignupSchema } from '@rewrlution/papyrus-shared';
   // Same validation rules as API
   ```

2. **Multiple refinements for detailed errors**:

   ```tsx
   .refine((val) => /[A-Z]/.test(val), 'Need uppercase')
   .refine((val) => /[a-z]/.test(val), 'Need lowercase')
   // Each rule gets own error message
   ```

3. **Cross-field validation**:
   ```tsx
   .refine((data) => data.password === data.confirmPassword, {
     message: "Passwords don't match",
     path: ['confirmPassword'],
   })
   // Validate relationships between fields
   ```

**Benefits**:

- ✅ **Immediate feedback**: Users see errors instantly
- ✅ **Clear requirements**: Password rules shown upfront
- ✅ **Type safety**: Validated data properly typed
- ✅ **Consistent**: Same rules as backend
- ✅ **Better UX**: No surprise errors after submission

**Progressive Form Flow**:

- Start simple (just email)
- Add complexity gradually (password rules)
- Show context (previous entries as you proceed)
- Provide escape routes (ESC to go back)

## Complete File Reference

All files created/modified in this tutorial:

```
src/
├── components/
│   ├── RegisterForm.tsx       # Main registration form (NEW)
│   ├── FormInput.tsx          # Reusable input component (existing)
│   ├── StatusMessage.tsx      # Status display component (existing)
│   └── Logo.tsx               # ASCII art logo (existing)
├── commands/
│   └── auth/
│       ├── register.ts        # Register command handler (UPDATED)
│       └── index.ts           # Auth command registration (UPDATED)
└── lib/
    └── api/
        └── api-client.ts      # API client with register method (existing)
```

## References

- [Ink Documentation](https://github.com/vadimdemedes/ink)
- [Zod Documentation](https://zod.dev/) - Advanced validation
- [Zod Refinements](https://zod.dev/?id=refine) - Custom validation rules
- [Regular Expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions) - For password validation
- [04-LOGIN-IMPLEMENTATION.md](./04-LOGIN-IMPLEMENTATION.md) - Login form reference
- [02-API-CLIENT-SETUP.md](./02-API-CLIENT-SETUP.md) - API client setup
