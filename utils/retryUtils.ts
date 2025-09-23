/**
 * Retry utility for handling failed operations
 */

export interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  exponentialBackoff?: boolean;
  maxDelay?: number;
}

/**
 * Retry a function with exponential backoff
 * @param fn The function to retry
 * @param options Retry options
 * @returns Promise that resolves with the result of the function
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    exponentialBackoff = true,
    maxDelay = 30000
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // If this was the last attempt, rethrow the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Calculate delay
      let currentDelay = delay;
      if (exponentialBackoff) {
        currentDelay = Math.min(delay * Math.pow(2, attempt), maxDelay);
      }
      
      console.log(`Attempt ${attempt + 1} failed. Retrying in ${currentDelay}ms...`, error);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, currentDelay));
    }
  }
  
  // This should never be reached due to the throw above, but TypeScript needs it
  throw lastError;
}

/**
 * Retry a function with a simple delay
 * @param fn The function to retry
 * @param maxRetries Maximum number of retries
 * @param delay Delay between retries in milliseconds
 * @returns Promise that resolves with the result of the function
 */
export async function retryWithDelay<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  return retryWithBackoff(fn, { maxRetries, delay, exponentialBackoff: false });
}

/**
 * Check if an error is retryable
 * @param error The error to check
 * @returns Boolean indicating if the error is retryable
 */
export function isRetryableError(error: any): boolean {
  // Network errors are typically retryable
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const retryablePatterns = [
      'network error',
      'timeout',
      'connection refused',
      'econnrefused',
      'econnreset',
      'enetunreach',
      'failed to fetch',
      'load failed'
    ];
    
    return retryablePatterns.some(pattern => message.includes(pattern));
  }
  
  // Supabase errors with certain status codes are retryable
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as any).status;
    // 5xx errors and 408 (timeout) are retryable
    return (status >= 500 && status < 600) || status === 408 || status === 429;
  }
  
  return false;
}