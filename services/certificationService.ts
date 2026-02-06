import { supabase } from './supabase';
import { Certification } from '@/types/database';
import { debugLogger } from '@/utils/debugLogger';
import * as FileSystem from 'expo-file-system';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { v4 as uuidv4 } from 'uuid';

export type CertificationAgency = 'PADI' | 'SSI' | 'NAUI' | 'SDI' | 'BSAC' | 'CMAS' | 'Other';

export interface CertificationInput {
  agency: CertificationAgency;
  level: string;
  certification_number?: string;
  issued_at?: string;
}

/**
 * Get all certifications for a user
 */
export const getUserCertifications = async (userId: string): Promise<Certification[]> => {
  try {
    const { data, error } = await supabase
      .from('certifications')
      .select('*')
      .eq('user_id', userId)
      .order('issued_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Certification[];
  } catch (error) {
    debugLogger.logError('[CertificationService] Error fetching certifications:', error);
    throw error;
  }
};

/**
 * Add a new certification
 */
export const addCertification = async (
  userId: string,
  input: CertificationInput
): Promise<Certification> => {
  try {
    const insertData = {
      user_id: userId,
      agency: input.agency,
      level: input.level,
      certification_number: input.certification_number || null,
      issued_at: input.issued_at || null,
    };
    
    const { data, error } = await supabase
      .from('certifications')
      .insert(insertData as any)
      .select()
      .single();

    if (error) throw error;
    return data as Certification;
  } catch (error) {
    debugLogger.logError('[CertificationService] Error adding certification:', error);
    throw error;
  }
};

/**
 * Update an existing certification
 */
export const updateCertification = async (
  certId: string,
  updates: Partial<CertificationInput>
): Promise<Certification> => {
  try {
    const updateData: Record<string, any> = { ...updates };
    const { data, error } = await supabase
      .from('certifications')
      // @ts-expect-error - certifications table not in generated types
      .update(updateData)
      .eq('id', certId)
      .select()
      .single();

    if (error) throw error;
    return data as Certification;
  } catch (error) {
    debugLogger.logError('[CertificationService] Error updating certification:', error);
    throw error;
  }
};

/**
 * Delete a certification and its associated images
 */
export const deleteCertification = async (
  userId: string,
  certId: string
): Promise<void> => {
  try {
    // Get the certification first to find any images to delete
    const { data: cert, error: fetchError } = await supabase
      .from('certifications')
      .select('card_front_url, card_back_url')
      .eq('id', certId)
      .single();

    if (fetchError) throw fetchError;

    const certData = cert as any;
    
    // Delete associated images from storage
    const filesToDelete: string[] = [];
    if (certData?.card_front_url) {
      const frontPath = extractStoragePath(certData.card_front_url);
      if (frontPath) filesToDelete.push(frontPath);
    }
    if (certData?.card_back_url) {
      const backPath = extractStoragePath(certData.card_back_url);
      if (backPath) filesToDelete.push(backPath);
    }

    if (filesToDelete.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('cert-cards')
        .remove(filesToDelete);
      
      if (storageError) {
        console.warn('[CertificationService] Error deleting images:', storageError);
      }
    }

    // Delete the certification record
    const { error: deleteError } = await supabase
      .from('certifications')
      .delete()
      .eq('id', certId);

    if (deleteError) throw deleteError;
  } catch (error) {
    debugLogger.logError('[CertificationService] Error deleting certification:', error);
    throw error;
  }
};

/**
 * Upload a card image (front or back)
 */
export const uploadCardImage = async (
  userId: string,
  certId: string,
  side: 'front' | 'back',
  imageUri: string
): Promise<string> => {
  try {
    // Read image as base64
    const base64 = await readAsStringAsync(imageUri, {
      encoding: EncodingType.Base64,
    });

    // Convert base64 to ArrayBuffer
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Determine file extension and mime type
    const extension = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
    
    // Create file path: userId/certId_front.jpg or userId/certId_back.jpg
    const fileName = `${certId}_${side}.${extension}`;
    const filePath = `${userId}/${fileName}`;

    // Upload to storage
    const { data, error } = await supabase.storage
      .from('cert-cards')
      .upload(filePath, bytes.buffer, {
        contentType: mimeType,
        upsert: true, // Replace if exists
      });

    if (error) throw error;

    // Get signed URL (for private bucket)
    const signedUrl = await getSignedCardUrl(filePath);

    // Update certification with the new URL
    const updateField = side === 'front' ? 'card_front_url' : 'card_back_url';
    const updateData: Record<string, any> = { [updateField]: filePath };
    const { error: updateError } = await supabase
      .from('certifications')
      // @ts-expect-error - certifications table not in generated types
      .update(updateData)
      .eq('id', certId);

    if (updateError) throw updateError;

    return signedUrl;
  } catch (error) {
    debugLogger.logError(`[CertificationService] Error uploading ${side} card image:`, error);
    throw error;
  }
};

/**
 * Get a signed URL for a card image (valid for 1 hour)
 */
export const getSignedCardUrl = async (path: string): Promise<string> => {
  try {
    const { data, error } = await supabase.storage
      .from('cert-cards')
      .createSignedUrl(path, 3600); // 1 hour expiry

    if (error) throw error;
    return data.signedUrl;
  } catch (error) {
    debugLogger.logError('[CertificationService] Error creating signed URL:', error);
    throw error;
  }
};

/**
 * Refresh signed URLs for a certification's images
 */
export const refreshCertificationUrls = async (cert: Certification): Promise<{
  front: string | null;
  back: string | null;
}> => {
  const result: { front: string | null; back: string | null } = {
    front: null,
    back: null,
  };

  try {
    if (cert.card_front_url) {
      // card_front_url stores the path, not a full URL
      result.front = await getSignedCardUrl(cert.card_front_url);
    }
    if (cert.card_back_url) {
      result.back = await getSignedCardUrl(cert.card_back_url);
    }
  } catch (error) {
    debugLogger.logError('[CertificationService] Error refreshing URLs:', error);
  }

  return result;
};

/**
 * Extract storage path from a signed URL or direct path
 */
const extractStoragePath = (url: string): string | null => {
  try {
    // If it's already a path (not a URL), return it
    if (!url.startsWith('http')) {
      return url;
    }
    
    // Parse the URL and extract the path after /object/sign/cert-cards/
    const urlObj = new URL(url);
    const match = urlObj.pathname.match(/\/object\/sign\/cert-cards\/(.+)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
    
    // Try alternate pattern for public URLs
    const altMatch = urlObj.pathname.match(/\/cert-cards\/(.+)/);
    if (altMatch) {
      return decodeURIComponent(altMatch[1]);
    }
    
    return null;
  } catch {
    return null;
  }
};

/**
 * Get agency display name and color
 */
export const getAgencyInfo = (agency: CertificationAgency): { name: string; color: string } => {
  const agencyMap: Record<CertificationAgency, { name: string; color: string }> = {
    PADI: { name: 'PADI', color: '#0057A8' },
    SSI: { name: 'SSI', color: '#00AEEF' },
    NAUI: { name: 'NAUI', color: '#003366' },
    SDI: { name: 'SDI', color: '#FF6600' },
    BSAC: { name: 'BSAC', color: '#0033A0' },
    CMAS: { name: 'CMAS', color: '#E31B23' },
    Other: { name: 'Other', color: '#666666' },
  };
  return agencyMap[agency] || agencyMap.Other;
};
