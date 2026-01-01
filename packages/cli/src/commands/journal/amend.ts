import { AmendOptions } from '../types.js';

export async function amendEntry(options: AmendOptions): Promise<void> {
  const date = options.date;
  console.log(`Editing journal entry for ${date}`);
}
