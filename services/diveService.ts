import { 
  createDive, 
  updateDive, 
  createSighting, 
  updateSighting, 
  deleteSighting,
  addMedia, 
  deleteMedia,
  dives$,
  currentUserSightings$,
  media$,
} from '../stores/syncedObservables';
import { uploadImage } from './supabase';
import { Dive, Sighting, Media } from '../types/database';

/**
 * Checks if an ID is a legacy composite key (from DiveLogsScreen)
 */
export const isLegacyId = (id: string) => id.includes('_');

/**
 * Gets legacy sightings for a composite ID
 */
export const getLegacySightings = (legacyId: string) => {
  const sightings = Object.values(currentUserSightings$.peek() || {});
  return sightings.filter(s => {
    const sKey = `${s.date}_${s.time_in || '00:00'}_${s.dive_site_id || 'unknown'}`;
    return sKey === legacyId;
  });
};

export interface DiveSessionData {
  dive: Omit<Dive, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
  sightings: Array<Omit<Sighting, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'dive_id'>>;
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
  let diveId = editDiveId;
  
  // 1. Save or Update the Dive
  if (editDiveId && !isLegacyId(editDiveId)) {
    await updateDive(editDiveId, sessionData.dive);
  } else {
    // Migration logic: If it was legacy, we create a new dive record
    const newDive = await createDive(sessionData.dive);
    diveId = newDive.id;
    
    // If it was legacy, we need to handle the old sightings uniquely
    if (editDiveId && isLegacyId(editDiveId)) {
       const legacySightings = getLegacySightings(editDiveId);
       for (const ls of legacySightings) {
         await deleteSighting(ls.id);
       }
    }
  }

  if (!diveId) throw new Error('Failed to obtain diveId');

  // 2. Handle Sightings
  // For simplicity in the MVP, we might want to "replace" sightings or update them.
  // Given the current architecture, let's create new ones if it's a new dive.
  // If editing, we might need to be more careful.
  
  const sightingIds: string[] = [];
  
  if (editDiveId) {
    // Basic implementation: Delete old sightings and create new ones to ensure sync
    // This is easier than diffing for now.
    const oldSightings = Object.values(currentUserSightings$.peek() || {})
      .filter(s => s.dive_id === editDiveId);
    
    for (const oldS of oldSightings) {
      await deleteSighting(oldS.id);
    }
  }

  for (const sData of sessionData.sightings) {
    const newSighting = await createSighting({
      ...sData,
      dive_id: diveId,
    } as any);
    sightingIds.push(newSighting.id);
  }

  // 3. Handle Media
  // Logic: Upload and link media
  for (const mItem of sessionData.media) {
    let finalUrl = mItem.uri;
    
    if (mItem.uri.startsWith('file://')) {
      const publicUrl = await uploadImage(mItem.uri, 'dives', `dive_media/${diveId}`);
      if (publicUrl) {
        finalUrl = publicUrl;
      }
    }

    await addMedia({
      dive_id: diveId,
      sighting_id: mItem.sightingId || null,
      url: finalUrl,
      type: mItem.type,
    });
  }

  return { diveId, sightingIds };
};

export const getDiveSession = (diveId: string) => {
  const isLegacy = isLegacyId(diveId);
  
  if (!isLegacy) {
    const dive = dives$.peek()[diveId];
    if (dive) {
      const sightings = Object.values(currentUserSightings$.peek() || {})
        .filter(s => s.dive_id === diveId);
      
      const allMedia = Object.values(media$.peek() || {})
        .filter(m => m.dive_id === diveId);

      return { dive, sightings, media: allMedia };
    }
  }

  // Fallback for legacy sightings or if dive record is missing
  const sightings = getLegacySightings(diveId);
  if (sightings.length === 0) return null;

  const firstS = sightings[0];
  // Synthesize a dive object
  const syntheticDive: Dive = {
    id: diveId, // temporary ID
    user_id: firstS.user_id,
    dive_site_id: firstS.dive_site_id,
    date: firstS.date,
    time_in: firstS.time_in,
    time_out: firstS.time_out,
    duration: firstS.duration,
    max_depth: firstS.depth ? parseFloat(firstS.depth) : null,
    air_in: firstS.air_in,
    air_out: firstS.air_out,
    air_unit: firstS.air_unit as any,
    depth_unit: (firstS as any).depth_unit as any || 'meters',
    dive_type: firstS.dive_mode === 'training' ? 'training' : 'leisure',
    course_type: firstS.course_type,
    skills_completed: firstS.skills_completed || [],
    notes: firstS.dive_notes,
    weather: firstS.weather,
    visibility: firstS.visibility,
    current: firstS.current,
    instructor_id: firstS.instructor_id,
    waterway: firstS.waterway,
    created_at: firstS.created_at,
    updated_at: firstS.updated_at,
  };

  return { dive: syntheticDive, sightings, media: [] };
};
