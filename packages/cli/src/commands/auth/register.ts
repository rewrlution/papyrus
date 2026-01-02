/* eslint-disable @typescript-eslint/no-explicit-any */
import { SignupSchema } from '@rewrlution/papyrus-shared';

import { api } from '../../lib/api/index.js';

export async function register(
  email: string,
  password: string,
  confirmPassword: string
): Promise<void> {
  // 1. Validate inputs with Zod BEFORE making API call
  const result = SignupSchema.safeParse({ email, password, confirmPassword });

  if (!result.success) {
    console.error('❌ Validation failed:');
    result.error.issues.forEach((issue) => {
      console.error(`  • ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }

  // 2. Make API call - validation already passed
  try {
    console.log('📝 Registering new account...');

    const userData = await api.register(result.data);

    console.log('✅ Registration successful!');
    console.log(`Please check ${userData.email} to verify your account.`);
  } catch (error: any) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }
}
