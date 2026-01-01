import { AddOptions } from '../types.js';

export async function addEntry(options: AddOptions): Promise<void> {
  const date = options.date;
  console.log(`Creating journal entry for ${date}`);
}
