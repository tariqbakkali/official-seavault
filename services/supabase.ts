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




// ✅ Create Supabase client with AsyncStorage for React Native
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // No browser URL handling in RN
  },
});

// ✅ Upload image utility
export const uploadImage = async (
  uri: string,
  bucket: "avatars" | "sightings" | "keypictures" | "dives" | "dive-site-images",
  folder: string,
  isPublic: boolean = true
): Promise<string | null> => {
  try {
    // Sanitize folder path: ensure it's not a full path or URL
    // If it looks like a UUID or just a folder name, keep it. 
    // If it contains slashes, take the last part (usually the ID).
    let sanitizedFolder = folder;
    if (folder.includes('/')) {
        const parts = folder.split('/').filter(Boolean);
        // If it's something like "avatars/[userId]", take the second part
        if (parts[0] === 'avatars' && parts.length > 1) {
            sanitizedFolder = parts[1];
        } else {
            sanitizedFolder = parts[parts.length - 1];
        }
    }
    
    // Read file as base64
    const base64 = await readAsStringAsync(uri, {
      encoding: EncodingType.Base64,
    });

    // Convert base64 to Uint8Array
    const arrayBuffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

    // Determine file extension from URI
    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${sanitizedFolder}/${fileName}`;

    // Determine content type
    let contentType = `image/${fileExt === 'jpg' || fileExt === 'jpeg' ? 'jpeg' : fileExt}`;
    if (['mp4', 'mov', 'avi', 'mkv'].includes(fileExt)) {
      contentType = `video/${fileExt === 'mov' ? 'quicktime' : fileExt}`;
    }

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
    console.error(`Error uploading image to bucket "${bucket}":`, error);
    return null;
  }
};