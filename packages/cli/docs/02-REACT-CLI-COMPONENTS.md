# React Components for CLI Applications

Learn how to build interactive terminal UIs using React and Ink.

## Overview

We're building terminal UI components that:

- Use React for component composition
- Render to terminal instead of browser
- Handle user input (text, selections, confirmations)
- Show loading states and animations
- Display styled, colorful output

## Why React in the Terminal?

**Traditional CLI approach:**

```javascript
console.log('Enter your email:');
const email = await readInput();
console.log('Enter your password:');
const password = await readInput();
```

**React CLI approach:**

```jsx
<Box flexDirection="column">
  <TextInput label="Email" value={email} onChange={setEmail} />
  <TextInput label="Password" value={password} onChange={setPassword} />
</Box>
```

**Benefits:**

- Declarative UI (describe what, not how)
- Component reusability
- State management with hooks
- Rich ecosystem of React patterns

## Architecture

```
┌─────────────────────────┐
│    Command Handler      │ (login.ts)
└───────────┬─────────────┘
            │
            ↓
┌─────────────────────────┐
│   React Component       │ (LoginForm.tsx)
│   (Ink renders this)    │
└───────────┬─────────────┘
            │
            ↓
┌─────────────────────────┐
│   Ink Primitives        │ (Box, Text, etc.)
│   (Terminal output)     │
└─────────────────────────┘
```

## Prerequisites

Ink is already installed. For input components, add:

```bash
cd packages/cli
pnpm add ink-text-input ink-spinner
```

## Key Differences from Web React

### 1. Layout: Flexbox Only

Ink uses flexbox for all layouts (no CSS Grid, no positioning).

```jsx
// Vertical stack
<Box flexDirection="column">
  <Text>Line 1</Text>
  <Text>Line 2</Text>
</Box>

// Horizontal layout
<Box flexDirection="row">
  <Text>Left</Text>
  <Text>Right</Text>
</Box>

// Centering
<Box justifyContent="center" alignItems="center">
  <Text>Centered</Text>
</Box>
```

### 2. Styling: Props, Not CSS

Style via component props, not CSS classes:

```jsx
<Text color="green" bold>Success!</Text>
<Text color="red" italic>Error</Text>
<Text backgroundColor="blue" color="white"> Highlighted </Text>

<Box borderStyle="round" borderColor="cyan" padding={1}>
  <Text>Box with border</Text>
</Box>
```

### 3. Input Handling

Use Ink's input hooks, not DOM events:

```jsx
import { useInput } from 'ink';

export function MyComponent() {
  useInput((input, key) => {
    if (key.return) {
      // User pressed Enter
    }
    if (key.escape) {
      // User pressed Escape
    }
    if (input === 'q') {
      // User pressed 'q'
    }
  });

  return <Text>Press 'q' to quit</Text>;
}
```

### 4. App Lifecycle

Ink apps have explicit exit:

```jsx
import { render } from 'ink';
import { useApp } from 'ink';

function MyApp() {
  const { exit } = useApp();

  // Exit when done
  useEffect(() => {
    doSomething().then(() => exit());
  }, []);

  return <Text>Processing...</Text>;
}

// Render the app
render(<MyApp />);
```

## Core Ink Components

### Box - Layout Container

```jsx
<Box
  flexDirection="row" // or "column"
  justifyContent="center" // flex alignment
  alignItems="center"
  padding={1} // space inside
  margin={1} // space outside
  borderStyle="round" // border style
  borderColor="cyan"
  width={50} // fixed width
  height={10} // fixed height
>
  {children}
</Box>
```

### Text - Styled Text

```jsx
<Text
  color="green"
  backgroundColor="black"
  bold
  italic
  underline
  strikethrough
  dimColor
  wrap="truncate" // or "wrap" or "truncate-start"
>
  Your text here
</Text>
```

### Newline - Line Break

```jsx
<Text>
  Line 1
  <Newline />
  Line 2
</Text>
```

### Spacer - Flexible Space

```jsx
<Box>
  <Text>Left</Text>
  <Spacer /> {/* Takes all available space */}
  <Text>Right</Text>
</Box>
```

## Building Reusable Components

### Example: Header Component

```tsx
// src/components/Header.tsx
import React from 'react';
import { Box, Text } from 'ink';
import chalk from 'chalk';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text bold color="cyan">
        {chalk.cyan('═'.repeat(title.length + 4))}
      </Text>
      <Text bold color="cyan">
        ║ {title} ║
      </Text>
      <Text bold color="cyan">
        {chalk.cyan('═'.repeat(title.length + 4))}
      </Text>
      {subtitle && (
        <Text color="gray" dimColor>
          {subtitle}
        </Text>
      )}
    </Box>
  );
}

// Usage
<Header title="Login" subtitle="Enter your credentials" />;
```

### Example: Status Message Component

```tsx
// src/components/StatusMessage.tsx
import React from 'react';
import { Box, Text } from 'ink';

type MessageType = 'success' | 'error' | 'warning' | 'info';

interface StatusMessageProps {
  type: MessageType;
  message: string;
}

const icons = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

const colors = {
  success: 'green',
  error: 'red',
  warning: 'yellow',
  info: 'blue',
};

export function StatusMessage({ type, message }: StatusMessageProps) {
  return (
    <Box marginY={1}>
      <Text color={colors[type]}>
        {icons[type]} {message}
      </Text>
    </Box>
  );
}

// Usage
<StatusMessage type="success" message="Login successful!" />
<StatusMessage type="error" message="Invalid credentials" />
```

### Example: Loading Spinner

```tsx
// src/components/Loading.tsx
import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

interface LoadingProps {
  message?: string;
}

export function Loading({ message = 'Loading...' }: LoadingProps) {
  return (
    <Box>
      <Text color="cyan">
        <Spinner type="dots" />
      </Text>
      <Text> {message}</Text>
    </Box>
  );
}

// Usage
<Loading message="Logging in..." />;
```

### Example: Text Input Component

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
  mask?: string;  // For password fields
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
    <Box flexDirection="column" marginY={1}>
      <Text bold color="cyan">
        {label}:
      </Text>
      <Box marginLeft={2}>
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

// Usage
<FormInput
  label="Email"
  value={email}
  onChange={setEmail}
  placeholder="you@example.com"
/>
<FormInput
  label="Password"
  value={password}
  onChange={setPassword}
  mask="*"
/>
```

## State Management with Hooks

Use standard React hooks for state:

```tsx
import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

export function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount((c) => c + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return <Text>Count: {count}</Text>;
}
```

## Handling User Flow

### Sequential Steps

```tsx
import React, { useState } from 'react';
import { Box } from 'ink';

type Step = 'email' | 'password' | 'confirm';

export function MultiStepForm() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (step === 'email') {
    return (
      <FormInput
        label="Email"
        value={email}
        onChange={setEmail}
        onSubmit={() => setStep('password')}
      />
    );
  }

  if (step === 'password') {
    return (
      <FormInput
        label="Password"
        value={password}
        onChange={setPassword}
        mask="*"
        onSubmit={() => setStep('confirm')}
      />
    );
  }

  return <Text>Submitting...</Text>;
}
```

### Async Operations

```tsx
import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { useApp } from 'ink';
import { api } from '../lib/api.js';

interface LoginProps {
  email: string;
  password: string;
}

export function LoginFlow({ email, password }: LoginProps) {
  const { exit } = useApp();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [error, setError] = useState<string>('');

  useEffect(() => {
    api
      .login(email, password)
      .then(() => {
        setStatus('success');
        setTimeout(() => exit(), 1000);
      })
      .catch((err) => {
        setStatus('error');
        setError(err.message);
        setTimeout(() => exit(err), 2000);
      });
  }, [email, password, exit]);

  if (status === 'loading') {
    return <Loading message="Logging in..." />;
  }

  if (status === 'success') {
    return <StatusMessage type="success" message="Login successful!" />;
  }

  return <StatusMessage type="error" message={`Login failed: ${error}`} />;
}
```

## Integrating with Commands

Commands can render React components:

```tsx
// src/commands/auth/login.ts
import { render } from 'ink';
import React from 'react';
import { LoginForm } from '../../components/LoginForm.js';

export async function login(): Promise<void> {
  // Render the React component
  const { waitUntilExit } = render(<LoginForm />);

  // Wait for component to exit
  await waitUntilExit();
}
```

## Testing Components

Test Ink components with ink-testing-library:

```bash
pnpm add -D ink-testing-library
```

```typescript
// src/components/__tests__/Header.test.tsx
import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { Header } from '../Header.js';

describe('Header', () => {
  it('should render title', () => {
    const { lastFrame } = render(<Header title="Test" />);
    expect(lastFrame()).toContain('Test');
  });

  it('should render subtitle when provided', () => {
    const { lastFrame } = render(
      <Header title="Test" subtitle="Subtitle" />
    );
    expect(lastFrame()).toContain('Subtitle');
  });
});
```

## Best Practices

### 1. Keep Components Small

```tsx
// Bad: One giant component
function LoginScreen() {
  // 200 lines of logic and UI
}

// Good: Composed components
function LoginScreen() {
  return (
    <Box>
      <Header title="Login" />
      <LoginForm onSubmit={handleSubmit} />
      <Footer />
    </Box>
  );
}
```

### 2. Extract Reusable Pieces

If you use it twice, make it a component:

```tsx
// Reusable
export function ErrorText({ children }: { children: string }) {
  return <Text color="red">❌ {children}</Text>;
}
```

### 3. Use TypeScript

Define prop types for all components:

```tsx
interface Props {
  title: string;
  onSubmit: () => void;
}

export function MyComponent({ title, onSubmit }: Props) {
  // ...
}
```

### 4. Handle Exit Gracefully

Always allow users to exit:

```tsx
import { useInput, useApp } from 'ink';

export function MyComponent() {
  const { exit } = useApp();

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      exit();
    }
  });

  return <Text>Press ESC or 'q' to quit</Text>;
}
```

### 5. Show Clear Feedback

Always indicate what's happening:

```tsx
// Loading state
if (loading) return <Loading />;

// Error state
if (error) return <ErrorMessage error={error} />;

// Success state
if (success) return <SuccessMessage />;

// Normal state
return <Form />;
```

## Common Patterns

### Confirmation Dialog

```tsx
export function ConfirmDialog({ message, onConfirm, onCancel }: Props) {
  useInput((input) => {
    if (input === 'y') onConfirm();
    if (input === 'n') onCancel();
  });

  return (
    <Box flexDirection="column">
      <Text>{message}</Text>
      <Text color="gray">Press 'y' for yes, 'n' for no</Text>
    </Box>
  );
}
```

### Progress Indicator

```tsx
export function Progress({ current, total }: Props) {
  const percentage = Math.round((current / total) * 100);
  const filled = '█'.repeat(percentage / 2);
  const empty = '░'.repeat(50 - percentage / 2);

  return (
    <Box flexDirection="column">
      <Text>
        {filled}
        {empty} {percentage}%
      </Text>
      <Text color="gray">
        {current} / {total}
      </Text>
    </Box>
  );
}
```

### List Selection

```tsx
export function List({ items, onSelect }: Props) {
  const [selected, setSelected] = useState(0);

  useInput((input, key) => {
    if (key.upArrow) setSelected(Math.max(0, selected - 1));
    if (key.downArrow) setSelected(Math.min(items.length - 1, selected + 1));
    if (key.return) onSelect(items[selected]);
  });

  return (
    <Box flexDirection="column">
      {items.map((item, i) => (
        <Text key={i} color={i === selected ? 'cyan' : 'white'}>
          {i === selected ? '▶ ' : '  '}
          {item}
        </Text>
      ))}
    </Box>
  );
}
```

## Common Issues

### Component not rendering

- Ensure you called `render()` from 'ink'
- Check for errors in component render
- Verify all imports are correct

### Input not working

- Only one component can have focus at a time
- Use `focus` prop on TextInput
- Check `useInput` hook is inside rendered component

### Layout issues

- Remember: flexbox only
- Use `<Box>` for all layout
- Check `flexDirection` is set correctly

### Updates not showing

- State must trigger re-render
- Use `useState` or `useReducer`
- Check component is not being unmounted

## Next Steps

1. **Build complex forms** - Multi-step wizards
2. **Add animations** - Smooth transitions
3. **Create interactive lists** - Navigable selections
4. **Build tables** - Formatted data display
5. **Add keyboard shortcuts** - Power user features

## References

- [Ink Documentation](https://github.com/vadimdemedes/ink)
- [Ink Components](https://github.com/vadimdemedes/ink#built-in-components)
- [ink-text-input](https://github.com/vadimdemedes/ink-text-input)
- [ink-spinner](https://github.com/vadimdemedes/ink-spinner)
- [React Hooks](https://react.dev/reference/react)
