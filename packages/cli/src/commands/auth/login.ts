import { render } from 'ink';
import React from 'react';

import { LoginForm } from '../../components/LoginForm.js';

export async function login(): Promise<void> {
  const { waitUntilExit } = render(React.createElement(LoginForm));

  await waitUntilExit();
}
