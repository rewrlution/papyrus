import axios, { AxiosInstance } from 'axios';

import type { SigninInput, SigninResponse } from '@rewrlution/papyrus-shared';

import { tokenStore } from './storage/index.js';

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

  async login(credentials: SigninInput): Promise<SigninResponse> {
    try {
      const response = await this.http.post<SigninResponse>(
        '/auth/signin',
        credentials
      );

      // Save token to storage layer
      if (response.data.data.token) {
        tokenStore.save(response.data.data.token);
      }

      return response.data;
    } catch (error) {
      console.error(error);
      throw new Error('Sign in error');
    }
  }
}
