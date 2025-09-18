import { VALIDATION } from '@/constants';

/**
 * Validation utilities for form inputs and data
 */

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password requirements
 */
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < VALIDATION.MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters long`);
  }
  
  if (password.length > VALIDATION.MAX_PASSWORD_LENGTH) {
    errors.push(`Password must be less than ${VALIDATION.MAX_PASSWORD_LENGTH} characters`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate required field
 */
export const validateRequired = (value: string, fieldName: string): string | null => {
  if (!value || value.trim().length === 0) {
    return `${fieldName} is required`;
  }
  return null;
};

/**
 * Validate depth value
 */
export const validateDepth = (depth: string): string | null => {
  const numericDepth = parseFloat(depth);
  
  if (isNaN(numericDepth)) {
    return 'Depth must be a valid number';
  }
  
  if (numericDepth < VALIDATION.MIN_DEPTH) {
    return `Depth must be at least ${VALIDATION.MIN_DEPTH} meters`;
  }
  
  if (numericDepth > VALIDATION.MAX_DEPTH) {
    return `Depth cannot exceed ${VALIDATION.MAX_DEPTH} meters`;
  }
  
  return null;
};

/**
 * Validate text length
 */
export const validateTextLength = (
  text: string,
  maxLength: number,
  fieldName: string
): string | null => {
  if (text.length > maxLength) {
    return `${fieldName} cannot exceed ${maxLength} characters`;
  }
  return null;
};

/**
 * Validate date format
 */
export const validateDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  const dateMatch = dateString.match(/^\d{4}-\d{2}-\d{2}$/);
  return !isNaN(date.getTime()) && dateMatch !== null;
};

/**
 * Validate time format (HH:MM)
 */
export const validateTime = (timeString: string): boolean => {
  return timeString.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/) !== null;
};