import {
  z,
  StandupStreamEventSchema,
  type StandupStreamEvent,
  type StandupRequest,
} from '@rewrlution/papyrus-shared';

import { tokenStore } from '../storage/index.js';

/**
 * SSE Client for streaming endpoints.
 *
 * Handles Server-Sent Events (SSE) connections with authentication.
 * Uses fetch API for streaming support (axios doesn't support SSE well).
 */
export class SseClient {
  constructor(private baseUrl: string) {}

  /**
   * Generate standup report from journals.
   * Streams AI-generated content as SSE events.
   */
  async generateStandup(
    options: StandupRequest,
    onEvent: (event: StandupStreamEvent) => void
  ): Promise<void> {
    return this.stream(
      '/ai/standup',
      options,
      StandupStreamEventSchema,
      onEvent
    );
  }

  // --- Private infrastructure methods ---

  /**
   * Generic SSE streaming method.
   * Handles connection, auth, and event parsing.
   */
  private async stream<T>(
    endpoint: string,
    body: object,
    schema: z.ZodSchema<T>,
    onEvent: (event: T) => void
  ): Promise<void> {
    const response = await this.fetchWithAuth(endpoint, body);
    await this.parseSSEStream(response, schema, onEvent);
  }

  /**
   * Make authenticated fetch request for SSE endpoint.
   */
  private async fetchWithAuth(
    endpoint: string,
    body: object
  ): Promise<Response> {
    const token = tokenStore.get();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    return response;
  }

  /**
   * Parse SSE stream and emit typed events.
   *
   * SSE format:
   *   event: <type>\n
   *   data: <json>\n
   *   \n
   */
  private async parseSSEStream<T>(
    response: Response,
    schema: z.ZodSchema<T>,
    onEvent: (event: T) => void
  ): Promise<void> {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages (split by newlines)
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        let currentEvent = '';
        let currentData = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7);
          } else if (line.startsWith('data: ')) {
            currentData = line.slice(6);
          } else if (line === '' && currentEvent && currentData) {
            // Empty line = end of message, emit event
            this.emitEvent(currentEvent, currentData, schema, onEvent);
            currentEvent = '';
            currentData = '';
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Parse and emit a single SSE event with Zod validation.
   */
  private emitEvent<T>(
    eventType: string,
    jsonData: string,
    schema: z.ZodSchema<T>,
    onEvent: (event: T) => void
  ): void {
    try {
      const data = JSON.parse(jsonData);
      const event = schema.parse({ type: eventType, ...data });
      onEvent(event);
    } catch {
      console.error('Failed to parse SSE event:', eventType, jsonData);
    }
  }
}
