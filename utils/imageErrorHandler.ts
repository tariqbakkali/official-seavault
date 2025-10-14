/**
 * Image Error Handler Utility
 * Centralized error handling for image operations
 */

import { imageLogger, LogCategory } from './imageLogger';

export type ImageErrorType = 
  | 'PERMISSION_DENIED'
  | 'NETWORK_ERROR'
  | 'FILE_ERROR'
  | 'VALIDATION_ERROR'
  | 'STORAGE_ERROR'
  | 'SYNC_ERROR'
  | 'UNKNOWN_ERROR';

export interface ImageError extends Error {
  type: ImageErrorType;
  code?: string;
  context?: any;
  retryable?: boolean;
}

/**
 * Create a standardized image error
 */
export const createImageError = (
  type: ImageErrorType,
  message: string,
  options: {
    code?: string;
    context?: any;
    retryable?: boolean;
    originalError?: Error;
  } = {}
): ImageError => {
  const error = new Error(message) as ImageError;
  error.type = type;
  error.code = options.code;
  error.context = options.context;
  error.retryable = options.retryable ?? isRetryableError(type);
  
  if (options.originalError) {
    error.stack = options.originalError.stack;
  }
  
  return error;
};

/**
 * Determine if an error type is retryable
 */
export const isRetryableError = (type: ImageErrorType): boolean => {
  return [
    'NETWORK_ERROR',
    'STORAGE_ERROR',
    'SYNC_ERROR'
  ].includes(type);
};

/**
 * Handle image errors with appropriate logging and user feedback
 */
export const handleImageError = (
  category: LogCategory,
  operation: string,
  error: any,
  context?: any
): ImageError => {
  // Create standardized error if not already one
  let imageError: ImageError;
  
  if (isImageError(error)) {
    imageError = error;
  } else {
    // Determine error type based on error content
    const type = determineErrorType(error);
    const message = error instanceof Error ? error.message : String(error);
    
    imageError = createImageError(type, message, {
      context,
      originalError: error instanceof Error ? error : undefined
    });
  }
  
  // Log the error
  imageLogger.logError(category, operation, imageError, context);
  
  return imageError;
};

/**
 * Check if an error is an ImageError
 */
export const isImageError = (error: any): error is ImageError => {
  return error && typeof error === 'object' && 'type' in error;
};

/**
 * Determine error type from error object
 */
const determineErrorType = (error: any): ImageErrorType => {
  if (!error) return 'UNKNOWN_ERROR';
  
  // Check for specific error codes or messages
  if (error.code) {
    switch (error.code) {
      case 'EACCES':
      case 'EPERM':
        return 'PERMISSION_DENIED';
      case 'ENOSPC':
        return 'STORAGE_ERROR';
      case 'ENETDOWN':
      case 'ENETUNREACH':
      case 'ECONNABORTED':
      case 'ECONNRESET':
      case 'ETIMEDOUT':
        return 'NETWORK_ERROR';
    }
  }
  
  // Check error message
  const message = (error.message || error.toString()).toLowerCase();
  
  if (message.includes('permission') || message.includes('access denied')) {
    return 'PERMISSION_DENIED';
  }
  
  if (message.includes('network') || message.includes('timeout') || message.includes('connection')) {
    return 'NETWORK_ERROR';
  }
  
  if (message.includes('storage') || message.includes('disk') || message.includes('space')) {
    return 'STORAGE_ERROR';
  }
  
  if (message.includes('validation') || message.includes('invalid')) {
    return 'VALIDATION_ERROR';
  }
  
  if (message.includes('sync') || message.includes('conflict')) {
    return 'SYNC_ERROR';
  }
  
  return 'UNKNOWN_ERROR';
};

/**
 * Retry a function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // If it's not retryable, throw immediately
      if (isImageError(error) && error.retryable === false) {
        throw error;
      }
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      imageLogger.warn('sync', `Attempt ${attempt} failed, retrying in ${delay}ms`, { error });
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * Handle network errors specifically
 */
export const handleNetworkError = (
  category: LogCategory,
  operation: string,
  url: string,
  status?: number,
  error?: any
): ImageError => {
  const message = status 
    ? `Network request failed with status ${status}`
    : 'Network request failed';
    
  const imageError = createImageError('NETWORK_ERROR', message, {
    context: { url, status },
    retryable: true,
    originalError: error
  });
  
  imageLogger.logNetworkError(category, operation, url, status, error);
  
  return imageError;
};

/**
 * Handle file operation errors specifically
 */
export const handleFileError = (
  category: LogCategory,
  operation: string,
  filePath: string,
  error?: any
): ImageError => {
  const message = `File operation failed for ${filePath}`;
  const imageError = createImageError('FILE_ERROR', message, {
    context: { filePath },
    retryable: false, // File errors are typically not retryable
    originalError: error
  });
  
  imageLogger.logFileError(category, operation, filePath, error);
  
  return imageError;
};

/**
 * Get user-friendly error message
 */
export const getUserFriendlyMessage = (error: ImageError): string => {
  switch (error.type) {
    case 'PERMISSION_DENIED':
      return 'Permission denied. Please check app permissions.';
    case 'NETWORK_ERROR':
      return 'Network connection failed. Please check your internet connection.';
    case 'FILE_ERROR':
      return 'File operation failed. Please try again.';
    case 'VALIDATION_ERROR':
      return 'Invalid image. Please select a valid image file.';
    case 'STORAGE_ERROR':
      return 'Storage error. Please free up space and try again.';
    case 'SYNC_ERROR':
      return 'Sync failed. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};

export default {
  createImageError,
  handleImageError,
  handleNetworkError,
  handleFileError,
  retryWithBackoff,
  getUserFriendlyMessage,
  isImageError,
  isRetryableError
};