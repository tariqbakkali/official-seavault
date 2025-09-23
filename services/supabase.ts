import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage'; // For session persistence
import Constants from 'expo-constants';
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
  bucket: string,
  folder: string,
  isPublic: boolean = true
): Promise<string | null> => {
  try {
    // Fetch file and convert to ArrayBuffer
    const response = await fetch(uri);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();

    // Generate unique file path
    const fileExt = blob.type.split('/')[1] || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, arrayBuffer, {
        contentType: blob.type || 'image/jpeg',
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