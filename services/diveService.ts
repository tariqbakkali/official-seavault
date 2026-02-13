import { 
  createSighting, 
  deleteSighting,
  currentUserSightings$,
  media$,
} from '../stores/syncedObservables';
import { uploadImage } from './supabase';
import { uploadVideo } from './cloudinaryService';
import { Sighting } from '../types/database';
import { v4 as uuidv4 } from 'uuid';
import { isOnline$ } from '@/stores/networkStore';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Checks if an ID is a legacy composite key (from DiveLogsScreen)
 */
export const isLegacyId = (id: string) => id.includes('_');

/**
 * Gets legacy sightings for a composite ID
 */
export const getLegacySightings = (legacyId: string) => {
  const sightings = Object.values(currentUserSightings$.peek() || {}) as Sighting[];
  return sightings.filter(s => {
    const sKey = `${s.date}_${s.time_in || '00:00'}_${s.dive_site_id || 'unknown'}`;
    return sKey === legacyId;
  });
};

export interface DiveSessionData {
  dive: Partial<Sighting>;
  sightings: Array<Partial<Sighting>>;
  media: Array<{
    uri: string;
    type: 'image' | 'video';
    sightingId?: string;
    thumbnailUrl?: string;
  }>;
}

export const saveDiveSession = async (
  sessionData: DiveSessionData,
  editDiveId?: string
) => {
  const diveId = editDiveId || uuidv4();
  
  // 1. Prepare sightings
  // If editing, we delete old sightings for this diveId first
  if (editDiveId) {
    const oldSightings = (Object.values(currentUserSightings$.peek() || {}) as Sighting[])
      .filter(s => s.dive_id === editDiveId);
    
    for (const oldS of oldSightings) {
      await deleteSighting(oldS.id);
    }
  }

  const sightingIds: string[] = [];
  const sightingIdMap: Record<string, string> = {};

  // 2. Create sightings
  // If there are no creature sightings, we create at least one "header" sighting to hold dive info
  const sightingsToCreate = sessionData.sightings.length > 0 
    ? sessionData.sightings 
    : [{}];

  for (const sData of sightingsToCreate) {
    const tempId = (sData as any).id;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, ...rest } = sData as any;

    const newSighting = await createSighting({
      ...sessionData.dive, // Include dive-level info in every sighting
      ...rest,
      dive_id: diveId,
    } as any);

    if (tempId) {
      sightingIdMap[tempId] = newSighting.id;
    }
    sightingIds.push(newSighting.id);
  }

  // 3. Handle Media
  for (const mItem of sessionData.media) {
    let finalUrl = mItem.uri;
    let thumbnailUrl = mItem.thumbnailUrl || null;
    
    if (mItem.uri.startsWith('file://')) {
      const mediaDir = `${FileSystem.documentDirectory}media/`;
      const fileName = mItem.uri.split('/').pop() || (mItem.type === 'video' ? `video_${Date.now()}.mp4` : `image_${Date.now()}.jpg`);
      const targetUri = `${mediaDir}${fileName}`;

      if (mItem.type === 'video') {
        // Local-first: Save local URI immediately. 
        // Background sync (mediaSyncService) will handle upload.
        
        // Check if already in persistent storage
        if (mItem.uri.startsWith(mediaDir)) {
          console.log('[diveService] Video already in persistent storage:', mItem.uri);
          finalUrl = mItem.uri;
        } else {
          // COPY to document directory to prevent cache wipe
          try {
            // Ensure directory exists
            await FileSystem.makeDirectoryAsync(mediaDir, { intermediates: true });
            
            await FileSystem.copyAsync({ from: mItem.uri, to: targetUri });
            finalUrl = targetUri;
            console.log('[diveService] Copied video to persistent storage:', finalUrl);
          } catch (e) {
            console.warn('[diveService] Failed to copy video to persistent storage, using original URI:', e);
            finalUrl = mItem.uri;
          }
        }

        // thumbnail is already in thumbnailUrl from mItem
      } else {
        // Images are small enough to upload immediately or strict local-first pattern ensures we handle them.
        // For now, keep existing logic for images (upload immediately)
        const publicUrl = await uploadImage(mItem.uri, 'dives', `dive_media/${diveId}`);
        if (publicUrl) {
          finalUrl = publicUrl;
        }
      }
    }

    // Save to dive-level media table regardless of whether it's attached to a sighting
    const mediaId = uuidv4();
    media$.assign({
      [mediaId]: {
        id: mediaId,
        dive_id: diveId,
        url: finalUrl,
        thumbnail_url: thumbnailUrl || undefined,
        type: mItem.type === 'video' ? 'video_link' : 'image',
        created_at: new Date().toISOString(),
      }
    });

    // Attach to the specific sighting or the first one (Legacy compatibility)
    const actualSightingId = mItem.sightingId ? (sightingIdMap[mItem.sightingId] || mItem.sightingId) : sightingIds[0];
    
    if (actualSightingId) {
      const targetSighting = (currentUserSightings$ as any)[actualSightingId].peek();
      if (targetSighting) {
        const currentImages = targetSighting.images || [];
        const imageExists = currentImages.some((img: any) => img.remoteUrl === finalUrl);
        
        if (!imageExists) {
          const newImages = [
            ...currentImages,
            {
              id: uuidv4(),
              remoteUrl: finalUrl,
              thumbnailUrl: thumbnailUrl,
              syncStatus: 'synced',
              createdAt: new Date().toISOString(),
              fileName: finalUrl.split('/').pop() || (mItem.type === 'video' ? 'video.mp4' : 'image.png'),
              mimeType: mItem.type === 'video' ? 'video/mp4' : 'image/png'
            }
          ];
          
          (currentUserSightings$ as any)[actualSightingId].images.set(newImages);
          
          // Also set the main image_url or video_url
          if (mItem.type === 'video' && !targetSighting.video_url) {
            (currentUserSightings$ as any)[actualSightingId].video_url.set(finalUrl);
          } else if (mItem.type === 'image' && !targetSighting.image_url) {
            (currentUserSightings$ as any)[actualSightingId].image_url.set(finalUrl);
          }
        }
      }
    }
  }

  return { diveId, sightingIds };
};

export const getDiveSession = (diveId: string) => {
  const isLegacy = isLegacyId(diveId);
  const sightingsAll = Object.values(currentUserSightings$.peek() || {}) as Sighting[];
  
  let sightings = sightingsAll.filter(s => s.dive_id === diveId);
  
  if (isLegacy && sightings.length === 0) {
    sightings = getLegacySightings(diveId);
  }

  if (sightings.length === 0) return null;

  // Aggregate dive-level info from the first sighting
  const firstS = sightings[0];
  const dive = {
    ...firstS,
    // Ensure we don't return sighting-specific fields as dive fields if possible, 
    // but in a flattened model, the first sighting effectively "is" the dive header.
  };

  // Extract all media from all sightings
  const media: any[] = [];
  sightings.forEach(s => {
    if (s.images) {
      s.images.forEach((img: any) => {
        media.push({
          url: img.remoteUrl,
          type: img.mimeType?.startsWith('video') ? 'video' : 'image',
          sighting_id: s.id,
          thumbnail_url: img.thumbnailUrl
        });
      });
    }
  });

  return { dive, sightings, media };
};
