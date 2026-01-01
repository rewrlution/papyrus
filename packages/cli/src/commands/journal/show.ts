import { ShowOptions } from '../types.js';

export async function showEntry(options: ShowOptions): Promise<void> {
  const date = options.date;
  console.log(`Showing journal entry for ${date}`);
}
