/**
 * Formatting utilities for consistent data display
 */

/**
 * Format date for display
 */
export const formatDate = (dateString: string, options?: Intl.DateTimeFormatOptions) => {
  const date = new Date(dateString);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };
  
  return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
};

/**
 * Format time from time string
 */
export const formatTime = (timeString: string | null) => {
  if (!timeString) return null;
  return timeString.slice(0, 5); // HH:MM format
};

/**
 * Format depth with units
 */
export const formatDepth = (depth: number | string | null) => {
  if (!depth) return null;
  return `${depth}m`;
};

/**
 * Format points display
 */
export const formatPoints = (points: number) => {
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}k`;
  }
  return points.toString();
};

/**
 * Format completion percentage
 */
export const formatCompletion = (seen: number, total: number) => {
  if (total === 0) return '0%';
  return `${Math.round((seen / total) * 100)}%`;
};

/**
 * Format scientific name
 */
export const formatScientificName = (name: string) => {
  // Italicize scientific names
  return name.trim();
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
};

/**
 * Convert meters to feet
 */
export const metersToFeet = (meters: number): number => {
  return meters * 3.28084;
};

/**
 * Convert feet to meters
 */
export const feetToMeters = (feet: number): number => {
  return feet / 3.28084;
};