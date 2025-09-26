/**
 * Utility functions for dive site operations
 */

/**
 * Validate dive site coordinates
 * @param latitude - Latitude value to validate
 * @param longitude - Longitude value to validate
 * @returns Object with isValid flag and error message if invalid
 */
export const validateCoordinates = (
  latitude: number | null, 
  longitude: number | null
): { isValid: boolean; error?: string } => {
  if (latitude === null || longitude === null) {
    return { isValid: false, error: 'Both latitude and longitude are required' };
  }

  if (isNaN(latitude) || isNaN(longitude)) {
    return { isValid: false, error: 'Coordinates must be valid numbers' };
  }

  if (latitude < -90 || latitude > 90) {
    return { isValid: false, error: 'Latitude must be between -90 and 90 degrees' };
  }

  if (longitude < -180 || longitude > 180) {
    return { isValid: false, error: 'Longitude must be between -180 and 180 degrees' };
  }

  return { isValid: true };
};

/**
 * Format coordinate for display
 * @param coordinate - Coordinate value to format
 * @param decimals - Number of decimal places (default: 6)
 * @returns Formatted coordinate string
 */
export const formatCoordinate = (coordinate: number | null, decimals: number = 6): string => {
  if (coordinate === null) return '';
  return coordinate.toFixed(decimals);
};

/**
 * Check if a dive site has valid coordinates
 * @param site - Dive site object to check
 * @returns Boolean indicating if coordinates are valid
 */
export const hasValidCoordinates = (site: any): boolean => {
  return site.latitude !== null && 
         site.longitude !== null && 
         site.latitude !== undefined && 
         site.longitude !== undefined &&
         !isNaN(site.latitude) && 
         !isNaN(site.longitude);
};