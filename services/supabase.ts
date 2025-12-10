import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage'; // For session persistence
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { Database } from '@/types/database';

// ✅ Load Supabase credentials from app config / env
const supabaseUrl =
  Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Custom fetch with timeout for better network error handling
const fetchWithTimeout = async (url: RequestInfo | URL, options: RequestInit = {}): Promise<Response> => {
  const timeout = 30000; // 30 seconds
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Network request timed out. Please check your connection and try again.');
    }
    throw error;
  }
};


// ✅ Create Supabase client with AsyncStorage for React Native
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // No browser URL handling in RN
  },
  global: {
    fetch: fetchWithTimeout,
  },
});

// ✅ Upload image utility
export const uploadImage = async (
  uri: string,
  bucket: "avatars" | "sightings" | "keypictures",
  folder: string,
  isPublic: boolean = true
): Promise<string | null> => {
  try {
    // Read file as base64
    const base64 = await readAsStringAsync(uri, {
      encoding: EncodingType.Base64,
    });

    // Convert base64 to Uint8Array
    const arrayBuffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

    // Determine file extension from URI
    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Determine content type
    const contentType = `image/${fileExt === 'jpg' || fileExt === 'jpeg' ? 'jpeg' : fileExt}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, arrayBuffer, {
        contentType: contentType,
        upsert: false,
      });

    if (error) throw error;

    // Return public or signed URL
    if (isPublic) {
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filePath);
      return publicUrl;
    } else {
      const { data: signedUrlData } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 60 * 60); // 1-hour signed URL
      return signedUrlData?.signedUrl ?? null;
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
};