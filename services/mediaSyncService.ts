import { observe } from '@legendapp/state';
import { currentUserSightings$, media$ } from '../stores/syncedObservables';
import { uploadVideo } from './cloudinaryService';
import { Sighting } from '../types/database';
import { isOnline$ } from '@/stores/networkStore';
import * as FileSystem from 'expo-file-system/legacy';
let VideoThumbnails: any = null;
try {
    VideoThumbnails = require('expo-video-thumbnails');
} catch (e) {
    console.warn('[mediaSyncService] expo-video-thumbnails not available');
}
import { v4 as uuidv4 } from 'uuid';

// Sync lock to prevent parallel runs
let isSyncing = false;

// Cache to prevent duplicate uploads of the same file
const uploadCache: Record<string, Promise<{ secure_url: string; thumbnail_url: string | null }>> = {};

const processVideoUpload = async (localUri: string): Promise<{ secure_url: string; thumbnail_url: string | null } | 'MISSING' | null> => {
    if (!localUri.startsWith('file://')) return null;

    // Check if already uploading to prevent duplicates
    const cachedPromise = uploadCache[localUri];
    if (cachedPromise) {
        console.log('[mediaSyncService] Using existing upload promise for:', localUri);
        return cachedPromise;
    }

    console.log('[mediaSyncService] Starting background upload for:', localUri);

    // Start upload
    const uploadPromise = uploadVideo(localUri).then(res => ({
        secure_url: res.secure_url,
        thumbnail_url: res.thumbnail_url || null
    }));

    uploadCache[localUri] = uploadPromise;

    try {
        const result = await uploadPromise;
        // Clean up cache after a delay to allow all observers to settle
        setTimeout(() => {
            delete uploadCache[localUri];
        }, 10000);
        return result;
    } catch (error: any) {
        // If file doesn't exist, we can't upload it. Stop retrying.
        if (error.message && (error.message.includes('File does not exist') || error.message.includes('ENOENT'))) {
            console.warn('[mediaSyncService] File missing, skipping upload forever:', localUri);
            
            // Persist the "failed" state so we don't try again after refresh
            return 'MISSING'; 
        }

        console.error('[mediaSyncService] Upload failed for', localUri, error);
        delete uploadCache[localUri]; // Allow retry immediately on other errors
        return null;
    }
};

const syncMediaTable = async () => {
    const media = media$.peek();
    if (!media) return;

    for (const key in media) {
        const item = media[key];
        // Check for local video
        if (item.url && item.url.startsWith('file://') && (item.type === 'video' || item.type === 'video_link')) {
            const result = await processVideoUpload(item.url);
            if (result === 'MISSING') {
                // Mark as failed in store so we never try again
                media$[key].assign({
                    url: '', 
                    metadata: { ...(item.metadata || {}), error: 'FILE_MISSING_DURING_SYNC' }
                });
            } else if (result) {
                console.log('[mediaSyncService] Synced media item:', item.id);
                media$[key].assign({
                    url: result.secure_url,
                    thumbnail_url: result.thumbnail_url ?? undefined,
                    type: 'video_link'
                });
            }
        }
    }
};

const syncSightingsTable = async () => {
    const sightings = currentUserSightings$.peek();
    if (!sightings) return;

    for (const key in sightings) {
        const item = sightings[key] as Sighting;
        
        // Sync video_url if it's a local file
        if (item.video_url && item.video_url.startsWith('file://')) {
            const result = await processVideoUpload(item.video_url);
            if (result === 'MISSING') {
                 // Clear the video_url so it doesn't trigger sync anymore
                 (currentUserSightings$ as any)[key].assign({
                     video_url: null,
                     image_upload_status: 'failed'
                 });
            } else if (result) {
                console.log('[mediaSyncService] Synced sighting video:', item.id);
                
                // Update video_url
                (currentUserSightings$ as any)[key].video_url.set(result.secure_url);
                
                // Also update images array if it contains the same local URI
                const currentImages = item.images || [];
                
                const newImages = currentImages.map((img: any) => {
                    if (img.remoteUrl === item.video_url) {
                        return { 
                            ...img, 
                            remoteUrl: result.secure_url,
                            thumbnailUrl: result.thumbnail_url,
                            syncStatus: 'synced'
                        };
                    }
                    return img;
                });
                
                if (newImages !== currentImages) {
                     (currentUserSightings$ as any)[key].images.set(newImages);
                }
            }
        }
    }
};

const repairLegacyMedia = async () => {
    const sightings = currentUserSightings$.peek();
    const globalMedia = Object.values(media$.peek() || {}) as any[];
    if (!sightings) return;

    let totalRepaired = 0;

    for (const key in sightings) {
        const sighting = sightings[key] as any;
        const currentImages = sighting.images || [];
        let needsUpdate = false;

        const repairedImages = await Promise.all(currentImages.map(async (img: any) => {
            let updated = { ...img };
            let changed = false;

            // 1. Repair missing type/mimeType
            if (!img.mimeType && img.remoteUrl) {
                const ext = img.remoteUrl.split('.').pop()?.toLowerCase();
                if (['mp4', 'mov', 'm4v', '3gp'].includes(ext || '')) {
                    updated.mimeType = 'video/mp4';
                    changed = true;
                } else if (['jpg', 'jpeg', 'png', 'heic'].includes(ext || '')) {
                    updated.mimeType = 'image/jpeg';
                    changed = true;
                }
            }

            // 2. Repair missing thumbnailUrl for synced Cloudinary videos
            if (!img.thumbnailUrl && img.remoteUrl?.includes('cloudinary.com')) {
                updated.thumbnailUrl = img.remoteUrl.replace(/\.\w+$/, '.jpg');
                changed = true;
            }

            // 3. Resolve dead local URIs if they exist in global media store
            if (img.remoteUrl?.startsWith('file://')) {
                const match = globalMedia.find(m => m.url === img.remoteUrl);
                if (match && match.url?.startsWith('http')) {
                    updated.remoteUrl = match.url;
                    updated.thumbnailUrl = match.thumbnail_url;
                    updated.syncStatus = 'synced';
                    changed = true;
                } else if (match && match.thumbnail_url) {
                    updated.thumbnailUrl = match.thumbnail_url;
                    changed = true;
                }
                
                // 4. Generate local thumbnail if missing for existing local video
                if (!updated.thumbnailUrl && (updated.mimeType?.startsWith('video') || updated.remoteUrl.match(/\.(mp4|mov|m4v|3gp)/i))) {
                    if (VideoThumbnails) {
                        try {
                            const fileInfo = await FileSystem.getInfoAsync(updated.remoteUrl);
                            if (fileInfo.exists) {
                                const { uri: thumbUri } = await VideoThumbnails.getThumbnailAsync(updated.remoteUrl, { time: 1000 });
                                const mediaDir = `${FileSystem.documentDirectory}media/`;
                                await FileSystem.makeDirectoryAsync(mediaDir, { intermediates: true });
                                const thumbName = `repair-thumb-${uuidv4()}.jpg`;
                                const persistentThumbUri = `${mediaDir}${thumbName}`;
                                await FileSystem.moveAsync({ from: thumbUri, to: persistentThumbUri });
                                updated.thumbnailUrl = persistentThumbUri;
                                changed = true;
                            }
                        } catch (e) {
                            // silently fail repair attempt
                        }
                    } else {
                        // If no VideoThumbnails, we can still fall back to Cloudinary-style URL if it was already synced
                        // but this block is specifically for local videos.
                    }
                }
            }

            if (changed) {
                needsUpdate = true;
            }
            return updated;
        }));

        if (needsUpdate) {
            (currentUserSightings$ as any)[key].images.set(repairedImages);
            totalRepaired++;
        }
    }

    if (totalRepaired > 0) {
        console.log(`[mediaSyncService] Repaired legacy media for ${totalRepaired} sightings`);
    }
};

export const checkPendingMediaUploads = async () => {
    // Run repair once before checking uploads
    await repairLegacyMedia();

    // Only run if online
    if (!isOnline$.peek()) return;
    
    if (isSyncing) {
        console.log('[mediaSyncService] Sync already in progress, skipping...');
        return;
    }

    try {
        isSyncing = true;
        console.log('[mediaSyncService] Checking for pending video uploads...');
        await Promise.all([
            syncMediaTable(),
            syncSightingsTable()
        ]);
    } finally {
        isSyncing = false;
    }
};

// Initialize observation
let initialized = false;
export const initMediaSync = () => {
    if (initialized) return;
    initialized = true;

    console.log('[mediaSyncService] Initializing media sync observer');
    
    // Observe changes to network, media, or sightings
    observe(() => {
        const isOnline = isOnline$.get();
        // strictly track these so the observer re-runs when they change
        const mediaKeys = Object.keys(media$.get() || {});
        const sightingKeys = Object.keys(currentUserSightings$.get() || {});
        
        console.log(`[mediaSyncService] Observer triggered. Online: ${isOnline}, Media Items: ${mediaKeys.length}, Sightings: ${sightingKeys.length}`);

        if (isOnline) {
            checkPendingMediaUploads();
        }
    });
};
