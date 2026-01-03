import { render } from 'ink';
import React from 'react';

import { RegisterForm } from '../../components/RegisterForm.js';

export async function register(): Promise<void> {
  const { waitUntilExit } = render(React.createElement(RegisterForm));
  await waitUntilExit();
}
