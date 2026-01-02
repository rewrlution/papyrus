# Implementing the Login Component

A complete, step-by-step guide to building an interactive login form with React and API integration.

## What We're Building

An interactive login flow that:

1. Shows the Papyrus logo
2. Prompts for email and password
3. Calls the API to authenticate
4. Shows loading state during authentication
5. Displays success or error messages
6. Stores the auth token
7. Exits gracefully

## Final Result

```bash
$ papyrus login

██████╗  █████╗ ██████╗ ██╗   ██╗██████╗ ██╗   ██╗███████╗
██╔══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝██╔══██╗██║   ██║██╔════╝
██████╔╝███████║██████╔╝ ╚████╔╝ ██████╔╝██║   ██║███████╗
██╔═══╝ ██╔══██║██╔═══╝   ╚██╔╝  ██╔══██╗██║   ██║╚════██║
██║     ██║  ██║██║        ██║   ██║  ██║╚██████╔╝███████║
╚═╝     ╚═╝  ╚═╝╚═╝        ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝

Login to your account
Press Ctrl+C to cancel

Email:
> user@example.com

Password:
> ********

🔐 Logging in...

✅ Welcome back, John!
```

## Architecture

```
┌──────────────────────────┐
│   login command          │
│   (entry point)          │
└────────────┬─────────────┘
             │
             ↓
┌──────────────────────────┐
│   <LoginForm />          │
│   (React component)      │
│   - Shows logo           │
│   - Collects input       │
│   - Manages state        │
└────────────┬─────────────┘
             │
             ↓
┌──────────────────────────┐
│   ApiClient              │
│   (HTTP calls)           │
└────────────┬─────────────┘
             │
             ↓
┌──────────────────────────┐
│   TokenStore             │
│   (Persistence)          │
└──────────────────────────┘
```

## Prerequisites

Ensure you have completed:

- [01-API-CLIENT-SETUP.md](./01-API-CLIENT-SETUP.md) - API client is set up
- [02-REACT-CLI-COMPONENTS.md](./02-REACT-CLI-COMPONENTS.md) - Understand Ink basics

Install input component:

```bash
cd packages/cli
pnpm add ink-text-input
```

## Implementation

### Step 1: Create Reusable Components

First, create the building blocks we'll use.

#### FormInput Component

```tsx
// src/components/FormInput.tsx
import React from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mask?: string;
  focus?: boolean;
}

export function FormInput({
  label,
  value,
  onChange,
  placeholder,
  mask,
  focus = true,
}: FormInputProps) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color="cyan" bold>
        {label}:
      </Text>
      <Box marginLeft={2}>
        <Text color="gray">{'> '}</Text>
        <TextInput
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          mask={mask}
          focus={focus}
        />
      </Box>
    </Box>
  );
}
```

#### StatusMessage Component

```tsx
// src/components/StatusMessage.tsx
import React from 'react';
import { Box, Text } from 'ink';

type MessageType = 'success' | 'error' | 'info' | 'loading';

interface StatusMessageProps {
  type: MessageType;
  message: string;
}

const icons = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  loading: '🔐',
};

const colors = {
  success: 'green',
  error: 'red',
  info: 'blue',
  loading: 'cyan',
};

export function StatusMessage({ type, message }: StatusMessageProps) {
  return (
    <Box marginTop={1}>
      <Text color={colors[type]}>
        {icons[type]} {message}
      </Text>
    </Box>
  );
}
```

### Step 2: Create Login Form Component

Now build the main login form component.

```tsx
// src/components/LoginForm.tsx
import React, { useState } from 'react';
import { Box, Text, Newline } from 'ink';
import { useApp } from 'ink';
import { Logo } from './Logo.js';
import { FormInput } from './FormInput.js';
import { StatusMessage } from './StatusMessage.js';
import { api } from '../lib/api.js';

type FormStep = 'email' | 'password' | 'submitting' | 'success' | 'error';

export function LoginForm() {
  const { exit } = useApp();

  // Form state
  const [step, setStep] = useState<FormStep>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [userName, setUserName] = useState('');

  // Handle email submission
  const handleEmailSubmit = () => {
    if (!email.trim()) {
      return; // Don't proceed if empty
    }
    setStep('password');
  };

  // Handle password submission (final submission)
  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      return; // Don't proceed if empty
    }

    setStep('submitting');

    try {
      const response = await api.login(email, password);
      setUserName(response.user.name);
      setStep('success');

      // Exit after showing success message
      setTimeout(() => {
        exit();
      }, 1500);
    } catch (error: any) {
      setErrorMessage(error.message || 'Login failed');
      setStep('error');

      // Exit after showing error
      setTimeout(() => {
        exit(error);
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
        Login to your account
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

      {/* Password Input */}
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
        <StatusMessage type="error" message={`Login failed: ${errorMessage}`} />
      )}
    </Box>
  );
}
```

**Wait, the form submission doesn't work yet!** We need to handle Enter key presses. Let's fix that:

```tsx
// src/components/LoginForm.tsx (updated)
import React, { useState } from 'react';
import { Box, Text, Newline } from 'ink';
import { useApp, useInput } from 'ink';
import { Logo } from './Logo.js';
import { FormInput } from './FormInput.js';
import { StatusMessage } from './StatusMessage.js';
import { api } from '../lib/api.js';

type FormStep = 'email' | 'password' | 'submitting' | 'success' | 'error';

export function LoginForm() {
  const { exit } = useApp();

  // Form state
  const [step, setStep] = useState<FormStep>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [userName, setUserName] = useState('');

  // Handle Enter key
  useInput((input, key) => {
    if (key.return) {
      if (step === 'email' && email.trim()) {
        setStep('password');
      } else if (step === 'password' && password.trim()) {
        handleLogin();
      }
    }
  });

  // Handle login API call
  const handleLogin = async () => {
    setStep('submitting');

    try {
      const response = await api.login(email, password);
      setUserName(response.user.name);
      setStep('success');

      // Exit after showing success message
      setTimeout(() => {
        exit();
      }, 1500);
    } catch (error: any) {
      setErrorMessage(error.message || 'Login failed');
      setStep('error');

      // Exit after showing error
      setTimeout(() => {
        exit(error);
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
        Login to your account
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
        />
      )}

      {/* Password Input */}
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

          {/* Password input */}
          <FormInput
            label="Password"
            value={password}
            onChange={setPassword}
            mask="*"
          />
        </Box>
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
        <StatusMessage type="error" message={`Login failed: ${errorMessage}`} />
      )}
    </Box>
  );
}
```

### Step 3: Update Login Command

Update the login command to render the React component:

```tsx
// src/commands/auth/login.ts
import { render } from 'ink';
import React from 'react';
import { LoginForm } from '../../components/LoginForm.js';

export async function login(): Promise<void> {
  // Render the login form
  const { waitUntilExit } = render(<LoginForm />);

  // Wait for the form to complete
  await waitUntilExit();
}
```

### Step 4: Update Command Registration

Make sure login command is properly registered:

```typescript
// src/commands/auth/index.ts
import { Command } from 'commander';
import { login } from './login.js';

export function registerAuthCommands(program: Command) {
  program
    .command('login')
    .description('Log in to your Papyrus account')
    .action(async () => {
      await login();
    });

  // ... other auth commands
}
```

## Testing the Login Flow

### 1. Build and Run

```bash
cd packages/cli
pnpm build
node dist/cli.js login
```

### 2. Test with tsx (faster)

```bash
tsx src/cli.tsx login
```

### 3. Test Different Scenarios

**Valid credentials:**

```bash
# Should show success and save token
tsx src/cli.tsx login
# Enter valid email/password
```

**Invalid credentials:**

```bash
# Should show error
tsx src/cli.tsx login
# Enter invalid email/password
```

**Check token was saved:**

```bash
# On Unix/Mac
cat ~/.papyrus/token

# On Windows
type %USERPROFILE%\.papyrus\token
```

## Enhancements

### Add Email Validation

```tsx
// src/components/LoginForm.tsx

const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// In useInput handler:
if (key.return) {
  if (step === 'email') {
    if (!email.trim()) {
      return; // Empty
    }
    if (!isValidEmail(email)) {
      setErrorMessage('Please enter a valid email');
      setStep('error');
      setTimeout(() => setStep('email'), 2000);
      return;
    }
    setStep('password');
  }
  // ...
}
```

### Add Loading Spinner

```bash
pnpm add ink-spinner
```

```tsx
// src/components/LoginForm.tsx
import Spinner from 'ink-spinner';

// In submitting state:
{
  step === 'submitting' && (
    <Box>
      <Text color="cyan">
        <Spinner type="dots" />
      </Text>
      <Text> Logging in...</Text>
    </Box>
  );
}
```

### Add Back Navigation

Allow going back from password to email:

```tsx
// In useInput handler:
useInput((input, key) => {
  if (key.escape && step === 'password') {
    setPassword('');
    setStep('email');
  }
  // ... rest of input handling
});

// Show hint
{
  step === 'password' && (
    <Text color="gray" dimColor>
      Press ESC to go back
    </Text>
  );
}
```

### Remember Email

Store last used email:

```typescript
// src/lib/token-store.ts

export class TokenStore {
  // ... existing methods

  saveEmail(email: string): void {
    const emailPath = path.join(path.dirname(this.tokenPath), 'email');
    fs.writeFileSync(emailPath, email, 'utf-8');
  }

  getEmail(): string | null {
    try {
      const emailPath = path.join(path.dirname(this.tokenPath), 'email');
      if (fs.existsSync(emailPath)) {
        return fs.readFileSync(emailPath, 'utf-8').trim();
      }
      return null;
    } catch {
      return null;
    }
  }
}
```

```tsx
// In LoginForm, pre-fill email:
const tokenStore = new TokenStore();
const [email, setEmail] = useState(tokenStore.getEmail() || '');

// After successful login:
tokenStore.saveEmail(email);
```

## Testing

### Unit Test the Login Logic

```typescript
// src/components/__tests__/LoginForm.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import React from 'react';
import { LoginForm } from '../LoginForm.js';

vi.mock('../../lib/api.js', () => ({
  api: {
    login: vi.fn(),
  },
}));

describe('LoginForm', () => {
  it('should render email input first', () => {
    const { lastFrame } = render(<LoginForm />);
    expect(lastFrame()).toContain('Email:');
  });

  it('should show password after email entered', async () => {
    const { stdin, lastFrame } = render(<LoginForm />);

    stdin.write('test@test.com');
    stdin.write('\r'); // Enter key

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(lastFrame()).toContain('Password:');
  });
});
```

### Integration Test

```typescript
// src/commands/__tests__/auth.test.ts
import { describe, it, expect, vi } from 'vitest';
import { login } from '../auth/login.js';

describe('login command', () => {
  it('should render LoginForm', async () => {
    const renderSpy = vi.spyOn(require('ink'), 'render');

    await login();

    expect(renderSpy).toHaveBeenCalled();
  });
});
```

## Common Issues

### Input not working

- Ensure `useInput` is inside the component
- Check that component is rendered with `render()` from ink
- Only one component can have focus at a time

### Form doesn't submit

- Verify `useInput` handler checks `key.return`
- Make sure input values aren't empty
- Check that step transitions are correct

### API call fails

- Verify API server is running
- Check API_BASE_URL is correct
- Ensure network connectivity
- Check API endpoint URLs match server

### Token not saved

- Check `~/.papyrus/` directory exists
- Verify write permissions
- Check TokenStore.save() is called after successful login

## Next Steps

1. **Implement Register** - Similar flow for account creation
2. **Implement Logout** - Clear token and show confirmation
3. **Add "Forgot Password"** - Password reset flow
4. **Add OAuth** - Login with GitHub/Google
5. **Add Session Info** - Show who's logged in

## Complete File Reference

All files created in this tutorial:

```
src/
├── components/
│   ├── FormInput.tsx          # Reusable input component
│   ├── StatusMessage.tsx      # Status display component
│   ├── LoginForm.tsx          # Main login form
│   └── Logo.tsx               # Existing logo component
├── commands/
│   └── auth/
│       ├── login.ts           # Login command handler
│       └── index.ts           # Auth command registration
└── lib/
    ├── api.ts                 # API singleton
    ├── api-client.ts          # API client class
    ├── api-types.ts           # API type definitions
    └── token-store.ts         # Token storage
```

## References

- [Ink Documentation](https://github.com/vadimdemedes/ink)
- [ink-text-input](https://github.com/vadimdemedes/ink-text-input)
- [React Hooks](https://react.dev/reference/react)
- [Axios Documentation](https://axios-http.com/)
