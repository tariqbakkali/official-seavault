/**
 * Data validation utility
 */

export interface ValidationRule {
  field: string;
  type: 'required' | 'string' | 'number' | 'boolean' | 'email' | 'date' | 'uuid' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  value: any;
}

/**
 * Validate data against a set of rules
 * @param data The data to validate
 * @param rules The validation rules
 * @returns Validation result
 */
export function validateData(data: any, rules: ValidationRule[]): ValidationResult {
  const errors: ValidationError[] = [];
  
  for (const rule of rules) {
    const { field, type, customValidator, ...constraints } = rule;
    const value = data[field];
    
    // Check required fields
    if (type === 'required' && (value === undefined || value === null || value === '')) {
      errors.push({
        field,
        message: `${field} is required`,
        value
      });
      continue;
    }
    
    // Skip validation for undefined or null values (unless required)
    if (value === undefined || value === null) {
      continue;
    }
    
    // Type validation
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push({
            field,
            message: `${field} must be a string`,
            value
          });
        } else {
          // String constraints
          if (constraints.minLength !== undefined && value.length < constraints.minLength) {
            errors.push({
              field,
              message: `${field} must be at least ${constraints.minLength} characters`,
              value
            });
          }
          
          if (constraints.maxLength !== undefined && value.length > constraints.maxLength) {
            errors.push({
              field,
              message: `${field} must be no more than ${constraints.maxLength} characters`,
              value
            });
          }
          
          if (constraints.pattern && !constraints.pattern.test(value)) {
            errors.push({
              field,
              message: `${field} does not match the required pattern`,
              value
            });
          }
        }
        break;
        
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push({
            field,
            message: `${field} must be a number`,
            value
          });
        } else {
          // Number constraints
          if (constraints.minValue !== undefined && value < constraints.minValue) {
            errors.push({
              field,
              message: `${field} must be at least ${constraints.minValue}`,
              value
            });
          }
          
          if (constraints.maxValue !== undefined && value > constraints.maxValue) {
            errors.push({
              field,
              message: `${field} must be no more than ${constraints.maxValue}`,
              value
            });
          }
        }
        break;
        
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push({
            field,
            message: `${field} must be a boolean`,
            value
          });
        }
        break;
        
      case 'email':
        if (typeof value !== 'string' || !isValidEmail(value)) {
          errors.push({
            field,
            message: `${field} must be a valid email address`,
            value
          });
        }
        break;
        
      case 'date':
        if (!(value instanceof Date) && !isValidDate(value)) {
          errors.push({
            field,
            message: `${field} must be a valid date`,
            value
          });
        }
        break;
        
      case 'uuid':
        if (typeof value !== 'string' || !isValidUUID(value)) {
          errors.push({
            field,
            message: `${field} must be a valid UUID`,
            value
          });
        }
        break;
        
      case 'array':
        if (!Array.isArray(value)) {
          errors.push({
            field,
            message: `${field} must be an array`,
            value
          });
        }
        break;
        
      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          errors.push({
            field,
            message: `${field} must be an object`,
            value
          });
        }
        break;
    }
    
    // Custom validation
    if (customValidator && !customValidator(value)) {
      errors.push({
        field,
        message: `${field} failed custom validation`,
        value
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate a creature record
 * @param creature The creature record to validate
 * @returns Validation result
 */
export function validateCreature(creature: any): ValidationResult {
  const rules: ValidationRule[] = [
    { field: 'id', type: 'uuid' },
    { field: 'creature_id', type: 'required' },
    { field: 'name', type: 'required' },
    { field: 'category_id', type: 'uuid' },
    { field: 'points', type: 'number', minValue: 0 },
    { field: 'description', type: 'string', maxLength: 1000 },
    { field: 'habitat', type: 'string', maxLength: 500 },
    { field: 'diet', type: 'string', maxLength: 500 },
    { field: 'depth_range', type: 'string', maxLength: 100 },
    { field: 'length', type: 'string', maxLength: 100 },
    { field: 'weight', type: 'string', maxLength: 100 },
    { field: 'lifespan', type: 'string', maxLength: 100 },
    { field: 'image_url', type: 'string', maxLength: 500 },
    { field: 'created_at', type: 'date' }
  ];
  
  return validateData(creature, rules);
}

/**
 * Validate a category record
 * @param category The category record to validate
 * @returns Validation result
 */
export function validateCategory(category: any): ValidationResult {
  const rules: ValidationRule[] = [
    { field: 'id', type: 'uuid' },
    { field: 'name', type: 'required' },
    { field: 'created_at', type: 'date' },
    { field: 'image_url', type: 'string', maxLength: 500 }
  ];
  
  return validateData(category, rules);
}

/**
 * Validate a dive site record
 * @param diveSite The dive site record to validate
 * @returns Validation result
 */
export function validateDiveSite(diveSite: any): ValidationResult {
  const rules: ValidationRule[] = [
    { field: 'id', type: 'uuid' },
    { field: 'name', type: 'required' },
    { field: 'latitude', type: 'number', minValue: -90, maxValue: 90 },
    { field: 'longitude', type: 'number', minValue: -180, maxValue: 180 },
    { field: 'osm_id', type: 'string', maxLength: 100 }
  ];
  
  return validateData(diveSite, rules);
}

/**
 * Validate a profile record
 * @param profile The profile record to validate
 * @returns Validation result
 */
export function validateProfile(profile: any): ValidationResult {
  const rules: ValidationRule[] = [
    { field: 'id', type: 'uuid' },
    { field: 'email', type: 'email' },
    { field: 'full_name', type: 'string', maxLength: 100 },
    { field: 'avatar_url', type: 'string', maxLength: 500 },
    { field: 'membership_tier', type: 'string', maxLength: 50 },
    { field: 'created_at', type: 'date' },
    { field: 'is_premium', type: 'boolean' },
    { field: 'has_seen_onboarding', type: 'boolean' }
  ];
  
  return validateData(profile, rules);
}

/**
 * Validate a sighting record
 * @param sighting The sighting record to validate
 * @returns Validation result
 */
export function validateSighting(sighting: any): ValidationResult {
  const rules: ValidationRule[] = [
    { field: 'id', type: 'uuid' },
    { field: 'user_id', type: 'uuid' },
    { field: 'creature_id', type: 'uuid' },
    { field: 'date', type: 'date' },
    { field: 'dive_notes', type: 'string', maxLength: 2000 },
    { field: 'image_url', type: 'string', maxLength: 500 },
    { field: 'created_at', type: 'date' },
    { field: 'dive_site_id', type: 'uuid' },
    { field: 'dive_type', type: 'string', maxLength: 50 },
    { field: 'time_of_day', type: 'string', maxLength: 20 },
    { field: 'depth', type: 'string', maxLength: 20 },
    { field: 'creature_notes', type: 'string', maxLength: 1000 }
  ];
  
  return validateData(sighting, rules);
}

/**
 * Validate a wishlist record
 * @param wishlist The wishlist record to validate
 * @returns Validation result
 */
export function validateWishlist(wishlist: any): ValidationResult {
  const rules: ValidationRule[] = [
    { field: 'id', type: 'uuid' },
    { field: 'user_id', type: 'uuid' },
    { field: 'creature_id', type: 'uuid' },
    { field: 'created_at', type: 'date' }
  ];
  
  return validateData(wishlist, rules);
}

/**
 * Validate an achievement record
 * @param achievement The achievement record to validate
 * @returns Validation result
 */
export function validateAchievement(achievement: any): ValidationResult {
  const rules: ValidationRule[] = [
    { field: 'id', type: 'uuid' },
    { field: 'code', type: 'required' },
    { field: 'name', type: 'required' },
    { field: 'description', type: 'string', maxLength: 500 },
    { field: 'category', type: 'string', maxLength: 50 },
    { field: 'icon_name', type: 'string', maxLength: 50 },
    { field: 'points', type: 'number', minValue: 0 },
    { field: 'created_at', type: 'date' }
  ];
  
  return validateData(achievement, rules);
}

// Helper functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidDate(date: any): boolean {
  return !isNaN(Date.parse(date));
}

function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}