import { PublicKey } from '@solana/web3.js';
import { ApiResponse } from '../types';

/**
 * Wraps a response in the standard API response format
 */
export function createApiResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data
  };
}

/**
 * Creates an error API response
 */
export function createErrorResponse(error: string): ApiResponse<never> {
  return {
    success: false,
    error
  };
}

/**
 * Validates a Solana public key string
 */
export function isValidPublicKey(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Formats a number to currency
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

/**
 * Safely parses a JSON string
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    return fallback;
  }
}

/**
 * Creates a wrapper with feature flag checking
 */
export function withFeatureFlag<T, Args extends any[]>(
  featureEnabled: boolean,
  fn: (...args: Args) => Promise<T>,
  fallbackValue?: T
): (...args: Args) => Promise<T> {
  return async (...args: Args): Promise<T> => {
    if (!featureEnabled) {
      if (fallbackValue !== undefined) {
        return fallbackValue;
      }
      throw new Error('Feature is disabled');
    }
    return await fn(...args);
  };
}

/**
 * Executes a function only if the feature flag is enabled
 */
export async function withFeatureCheck<T>(
  featureEnabled: boolean,
  fn: () => Promise<T>
): Promise<T | undefined> {
  if (!featureEnabled) {
    return undefined;
  }
  return await fn();
}

/**
 * Sleep helper function
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
} 