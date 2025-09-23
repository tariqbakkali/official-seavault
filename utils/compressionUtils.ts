/**
 * Compression utilities for sync operations
 */

// Simple run-length encoding for arrays with repeated values
export function compressArray<T>(array: T[]): { data: T[]; counts: number[] } {
  if (array.length === 0) {
    return { data: [], counts: [] };
  }
  
  const data: T[] = [];
  const counts: number[] = [];
  
  let current = array[0];
  let count = 1;
  
  for (let i = 1; i < array.length; i++) {
    if (array[i] === current) {
      count++;
    } else {
      data.push(current);
      counts.push(count);
      current = array[i];
      count = 1;
    }
  }
  
  // Don't forget the last group
  data.push(current);
  counts.push(count);
  
  return { data, counts };
}

// Decompress run-length encoded array
export function decompressArray<T>(compressed: { data: T[]; counts: number[] }): T[] {
  const result: T[] = [];
  
  for (let i = 0; i < compressed.data.length; i++) {
    const value = compressed.data[i];
    const count = compressed.counts[i];
    
    for (let j = 0; j < count; j++) {
      result.push(value);
    }
  }
  
  return result;
}

// Compress JSON data by removing whitespace and unnecessary characters
export function compressJSON(data: any): string {
  // Convert to JSON string
  let jsonString = JSON.stringify(data);
  
  // Remove unnecessary whitespace
  jsonString = jsonString.replace(/\s+/g, ' ');
  jsonString = jsonString.replace(/\s*([{}[\],:])\s*/g, '$1');
  
  return jsonString;
}

// Decompress JSON data
export function decompressJSON(compressed: string): any {
  try {
    return JSON.parse(compressed);
  } catch (error) {
    console.error('Error decompressing JSON:', error);
    throw error;
  }
}

// Compress sync data by removing redundant fields
export function compressSyncData(data: any[]): any[] {
  if (data.length === 0) {
    return data;
  }
  
  // Get all unique keys from the data
  const allKeys = new Set<string>();
  data.forEach(item => {
    if (item && typeof item === 'object') {
      Object.keys(item).forEach(key => allKeys.add(key));
    }
  });
  
  // Create a schema of keys and their types
  const schema: Record<string, string> = {};
  allKeys.forEach(key => {
    // Determine the type of the first non-null value for this key
    for (const item of data) {
      if (item && typeof item === 'object' && item[key] !== undefined && item[key] !== null) {
        schema[key] = typeof item[key];
        break;
      }
    }
  });
  
  // Compress each item by removing default values
  return data.map(item => {
    if (!item || typeof item !== 'object') {
      return item;
    }
    
    const compressed: any = {};
    
    Object.keys(item).forEach(key => {
      const value = item[key];
      
      // Skip undefined values
      if (value === undefined) {
        return;
      }
      
      // Skip default values based on type
      switch (schema[key]) {
        case 'string':
          if (value === '') return;
          break;
        case 'number':
          if (value === 0) return;
          break;
        case 'boolean':
          if (value === false) return;
          break;
        case 'object':
          if (value === null) return;
          break;
      }
      
      compressed[key] = value;
    });
    
    return compressed;
  });
}

// Decompress sync data by restoring default values
export function decompressSyncData(compressed: any[], schema?: Record<string, string>): any[] {
  if (compressed.length === 0) {
    return compressed;
  }
  
  // If no schema provided, create one from the compressed data
  if (!schema) {
    schema = {};
    compressed.forEach(item => {
      if (item && typeof item === 'object') {
        Object.keys(item).forEach(key => {
          if (schema![key] === undefined) {
            const value = item[key];
            if (value !== undefined && value !== null) {
              schema![key] = typeof value;
            }
          }
        });
      }
    });
  }
  
  // Decompress each item by restoring default values
  return compressed.map(item => {
    if (!item || typeof item !== 'object') {
      return item;
    }
    
    const decompressed: any = { ...item };
    
    Object.keys(schema!).forEach(key => {
      // If the key is missing, add the default value
      if (!(key in item)) {
        switch (schema![key]) {
          case 'string':
            decompressed[key] = '';
            break;
          case 'number':
            decompressed[key] = 0;
            break;
          case 'boolean':
            decompressed[key] = false;
            break;
          case 'object':
            decompressed[key] = null;
            break;
        }
      }
    });
    
    return decompressed;
  });
}

// Estimate the size of data in bytes
export function estimateDataSize(data: any): number {
  if (data === null || data === undefined) {
    return 0;
  }
  
  if (typeof data === 'string') {
    return data.length * 2; // UTF-16 uses 2 bytes per character
  }
  
  if (typeof data === 'number') {
    return 8; // JavaScript numbers are 64-bit floats
  }
  
  if (typeof data === 'boolean') {
    return 4; // Booleans are typically 4 bytes
  }
  
  if (Array.isArray(data)) {
    return data.reduce((sum, item) => sum + estimateDataSize(item), 0);
  }
  
  if (typeof data === 'object') {
    return Object.keys(data).reduce((sum, key) => {
      return sum + (key.length * 2) + estimateDataSize(data[key]);
    }, 0);
  }
  
  return 0;
}

// Get compression ratio
export function getCompressionRatio(original: any, compressed: any): number {
  const originalSize = estimateDataSize(original);
  const compressedSize = estimateDataSize(compressed);
  
  if (originalSize === 0) {
    return 1;
  }
  
  return compressedSize / originalSize;
}