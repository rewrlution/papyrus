/* eslint-disable @typescript-eslint/no-empty-object-type */
export interface DateOption {
  date?: string; // Optional date like "20260101" or "yesterday"
}

export interface AddOptions extends DateOption {}

export interface AmendOptions extends DateOption {}

export interface ShowOptions extends DateOption {}
