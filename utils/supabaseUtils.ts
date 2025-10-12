import { supabase } from '@/services/supabase';
import { PostgrestError } from '@supabase/supabase-js';

/**
 * Refresh Supabase schema cache
 */
export const refreshSchemaCache = async (): Promise<boolean> => {
  try {
    // Call the RPC function to refresh schema cache
    const { error } = await supabase.rpc('refresh_schema_cache');
    
    if (error) {
      console.error('SupabaseUtils: Failed to refresh schema cache:', error);
      return false;
    }
    
    return true;
  } catch (error: any) {
    console.error('SupabaseUtils: Error refreshing schema cache:', error);
    return false;
  }
};

/**
 * Enhanced retry mechanism with schema cache refresh
 */
export const executeWithRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.error(`SupabaseUtils: Operation failed on attempt ${attempt}:`, error);
      
      // If it's a schema cache error, refresh the cache
      if (error.code === 'PGRST205') {
        await refreshSchemaCache();
      }
      
      // Wait before retrying (except on last attempt)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError;
};