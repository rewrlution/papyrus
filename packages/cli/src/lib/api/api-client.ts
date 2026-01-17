import axios, { AxiosInstance } from 'axios';

import {
  StandupStreamEventSchema,
  type SigninInput,
  type SigninResponse,
  type SignupInput,
  type SignupResponse,
  type JournalData,
  type JournalMetaData,
  type JournalMetadataListResponse,
  type JournalResponse,
  type StandupStreamEvent,
} from '@rewrlution/papyrus-shared';

import { tokenStore } from '../storage/index.js';

/**
 * API Client for Papyrus server
 * Uses shared types and storage layer for tokens
 *
 * Error handling strategy:
 * - Validation errors: Caught by Zod client-side (before API call)
 * - API errors: Descriptive messages from ApiErrorResponse
 * - Network errors: Wrapped with descriptive message
 */
export class ApiClient {
  private http: AxiosInstance;

  constructor(baseUrl: string) {
    this.http = axios.create({
      baseURL: baseUrl,
      timeout: 90000, // set api timeout to 90 sec. serverless app warm-up may take up to a minute.
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests automatically from storage layer
    this.http.interceptors.request.use((config) => {
      const token = tokenStore.get();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async register(credentials: SignupInput): Promise<SignupResponse['data']> {
    try {
      const response = await this.http.post<SignupResponse>(
        '/auth/signup',
        credentials
      );
      return response.data.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async login(credentials: SigninInput): Promise<SigninResponse['data']> {
    try {
      const response = await this.http.post<SigninResponse>(
        '/auth/signin',
        credentials
      );

      // Save token to storage layer
      if (response.data.data.token) {
        tokenStore.save(response.data.data.token);
      }

      return response.data.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  logout(): void {
    tokenStore.clear();
  }

  isAuthenticated(): boolean {
    return tokenStore.exists();
  }

  async listJournalsMetadata(): Promise<JournalMetaData[]> {
    try {
      const response =
        await this.http.get<JournalMetadataListResponse>('/journals/metadata');
      return response.data.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getJournal(date: string): Promise<JournalData> {
    try {
      const response = await this.http.get<JournalResponse>(
        `/journals/${date}`
      );
      return response.data.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createJournal(date: string, content: string): Promise<JournalData> {
    try {
      const response = await this.http.post<JournalResponse>('/journals', {
        date,
        content,
      });
      return response.data.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateJournal(date: string, content: string): Promise<JournalData> {
    try {
      const response = await this.http.put<JournalResponse>(
        `/journals/${date}`,
        { content }
      );
      return response.data.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async generateStandup(
    options: { date?: string; from?: string; to?: string },
    onEvent: (event: StandupStreamEvent) => void
  ): Promise<void> {
    const token = tokenStore.get();
    if (!token) throw new Error('Not authenticated');

    const url = `${this.http.defaults.baseURL}/api/ai/standup`;

    // Use fetch for SSE support (axios doesn't support streaming responses well)
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    // Parse SSE stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages
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
            // Complete message - parse with Zod for type safety
            try {
              const data = JSON.parse(currentData);
              const event = StandupStreamEventSchema.parse({
                type: currentEvent,
                ...data,
              });
              onEvent(event);
            } catch {
              console.error('Failed to parse SSE data: ', currentData);
            }
            currentEvent = '';
            currentData = '';
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      // API returned an error response with message
      if (error.response?.data.message) {
        throw new Error(error.response.data.message);
      }

      // Network error (connection refused, timeout, DNS failure)
      throw new Error(`Network error: ${error.message}`);
    }

    // Unknown error
    throw new Error(error instanceof Error ? error.message : 'unknown error');
  }
}
