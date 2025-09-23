import { Profile } from '@/types/database';

/**
 * Check if profile has unsaved changes
 */
export const hasUnsavedChanges = (
  profile: Profile | null,
  fullName: string,
  email: string,
  avatarUri: string | null
): boolean => {
  if (!profile) return false;
  
  return (
    fullName !== (profile.full_name || '') ||
    email !== (profile.email || '') ||
    (avatarUri && avatarUri !== profile.avatar_url)
  );
};

/**
 * Calculate password strength
 */
export const calculatePasswordStrength = (password: string): number => {
  if (!password) return 0;
  
  let strength = 0;
  if (password.length >= 6) strength += 1;
  if (password.length >= 10) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;
  
  return Math.min(strength, 4);
};

/**
 * Validate profile form fields
 */
export const validateProfileForm = (
  fullName: string,
  email: string,
  newPassword: string,
  confirmPassword: string,
  isValidEmail: (email: string) => boolean
): { [key: string]: string } => {
  const errors: { [key: string]: string } = {};

  if (fullName && fullName.trim().length < 2) {
    errors.fullName = 'Name must be at least 2 characters';
  }

  if (email && !isValidEmail(email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (newPassword) {
    if (newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }
    if (confirmPassword && newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
  }

  return errors;
};

/**
 * Safely convert a nullable boolean to a boolean
 */
export const toBoolean = (value: boolean | null | undefined): boolean => {
  return value === true;
};

/**
 * Check if a nullable boolean is explicitly false (not null or undefined)
 */
export const isExplicitlyFalse = (value: boolean | null | undefined): boolean => {
  return value === false;
};