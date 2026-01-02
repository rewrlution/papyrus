/* eslint-disable @typescript-eslint/no-explicit-any */
import { SigninSchema } from '@rewrlution/papyrus-shared';

import { api } from '../../lib/api/index.js';

export async function login(email: string, password: string): Promise<void> {
  const result = SigninSchema.safeParse({ email, password });

  if (!result.success) {
    console.error('❌ Validation failed:');
    result.error.issues.forEach((issue) => {
      console.error(`  • ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }

  // 2. Make API call - validation already passed
  try {
    console.log('🔐 Logging in...');

    const userData = await api.login(result.data);

    console.log(`✅ Welcome back, ${userData.email}!`);
    console.log(`User ID: ${userData.id}`);
  } catch (error: any) {
    // API errors already have descriptive messages
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }
}
