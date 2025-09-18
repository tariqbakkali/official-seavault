/**
 * Color constants for the app theme
 * Using semantic naming for better maintainability
 */
export const COLORS = {
  // Primary brand colors
  PRIMARY: '#007AFF',
  PRIMARY_DARK: '#0056CC',
  PRIMARY_LIGHT: '#4DA6FF',
  
  // Secondary colors
  SECONDARY: '#FF9500',
  SUCCESS: '#34C759',
  WARNING: '#FF9500',
  ERROR: '#FF3B30',
  INFO: '#007AFF',
  
  // Background colors
  BACKGROUND: '#000000',
  SURFACE: '#1a1a1a',
  SURFACE_SECONDARY: '#2a2a2a',
  
  // Text colors
  TEXT_PRIMARY: '#FFFFFF',
  TEXT_SECONDARY: '#CCCCCC',
  TEXT_TERTIARY: '#999999',
  TEXT_DISABLED: '#666666',
  
  // Interactive states
  PRESSED: 'rgba(255, 255, 255, 0.1)',
  DISABLED: 'rgba(255, 255, 255, 0.3)',
  OVERLAY: 'rgba(0, 0, 0, 0.5)',
  
  // Gradient colors
  GRADIENT_START: 'transparent',
  GRADIENT_END: 'rgba(0, 0, 0, 0.8)',
  
  // Border colors
  BORDER_PRIMARY: '#333333',
  BORDER_SECONDARY: '#666666',
  
  // Status colors
  ONLINE: '#34C759',
  OFFLINE: '#999999',
} as const;

export const OPACITY = {
  DISABLED: 0.6,
  OVERLAY: 0.5,
  PRESSED: 0.8,
  LIGHT: 0.1,
  MEDIUM: 0.3,
  STRONG: 0.7,
} as const;