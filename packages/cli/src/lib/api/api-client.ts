import axios, { AxiosInstance } from 'axios';

import type {
  SigninInput,
  SigninResponse,
  SignupInput,
  SignupResponse,
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
