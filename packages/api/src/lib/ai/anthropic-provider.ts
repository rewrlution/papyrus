import Anthropic from '@anthropic-ai/sdk';

import { env } from '../../env/config.js';

export class AnthropicProvider {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Stream AI response as text chunks.
   * Async Generator (`async function*`) yileds text chunks one at a time.
   *
   * @param prompt - user prompt/instruction
   * @returns AsyncGenerator yielding text chunks
   */
  async *stream(prompt: string): AsyncGenerator<string> {
    try {
      const stream = await this.client.messages.create({
        model: env.AI_MODEL,
        max_tokens: env.AI_MAX_TOKEN,
        temperature: env.AI_TEMPERATURE,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: true,
      });

      // Process stream events
      for await (const event of stream) {
        // Only yield text content deltas
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          yield event.delta.text;
        }

        // log other event types for debugging (optional)
        if (event.type === 'message_start') {
          console.log('[AI] Stream started');
        }

        if (event.type === 'message_stop') {
          console.log('[AI] Stream completed');
        }
      }
    } catch (error) {
      console.error(`[AI] Streaming error:`, error);

      // Re-throw with helpful message
      if (error instanceof Anthropic.APIError) {
        throw new Error(`Anthropic API error: ${error.message}`);
      }
      throw error;
    }
  }
}
