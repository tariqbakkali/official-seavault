import { 
  createSighting, 
  deleteSighting,
  currentUserSightings$,
} from '../stores/syncedObservables';
import { uploadImage } from './supabase';
import { Sighting } from '../types/database';
import { v4 as uuidv4 } from 'uuid';

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
    
    if (mItem.uri.startsWith('file://')) {
      const publicUrl = await uploadImage(mItem.uri, 'dives', `dive_media/${diveId}`);
      if (publicUrl) {
        finalUrl = publicUrl;
      }
    }

    // Attach to the specific sighting or the first one
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
              syncStatus: 'synced',
              createdAt: new Date().toISOString(),
              fileName: finalUrl.split('/').pop() || 'image.png',
              mimeType: (mItem as any).type === 'video' ? 'video/mp4' : 'image/png'
            }
          ];
          
          (currentUserSightings$ as any)[actualSightingId].images.set(newImages);
          
          // Also set the main image_url if not already set, for legacy compatibility and thumbnail usage
          if (!targetSighting.image_url) {
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
          sighting_id: s.id
        });
      });
    }
  });

  return { dive, sightings, media };
};
