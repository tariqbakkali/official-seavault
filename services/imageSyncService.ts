import { observable, observe } from '@legendapp/state';
import { currentUserID$, currentUserSightings$ } from '../stores/syncedObservables';
import { supabase, uploadImage } from './supabase';
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system/legacy'; // Import FileSystem from legacy
import { Sighting } from '../types/database';

// Observable to track network state
export const isOnline$ = observable(false);

// Initialize network state observer
NetInfo.addEventListener(state => {
  isOnline$.set(!!(state.isConnected && state.isInternetReachable));
});

// Function to process a single pending image upload
const processPendingImageUpload = async (sighting: Sighting) => {
  if (!sighting.image_url || !sighting.image_url.startsWith('file://') || sighting.image_upload_status === 'uploaded') {
    return; // Not a local image or already uploaded
  }

  console.log(`Attempting to upload image for sighting ${sighting.id}: ${sighting.image_url}`);

  try {
    const userId = currentUserID$.get();
    if (!userId) {
      console.error('Cannot upload image: User not logged in.');
      return;
    }

    // Check if the file actually exists before attempting upload
    const fileInfo = await FileSystem.getInfoAsync(sighting.image_url);
    if (!fileInfo.exists) {
      console.warn(`Local image file does not exist for sighting ${sighting.id}: ${sighting.image_url}`);
      // Mark as failed since the file is missing
      (currentUserSightings$ as any)[sighting.id].image_upload_status.set('failed');
      return;
    }

    // Update status to pending before upload attempt
    (currentUserSightings$ as any)[sighting.id].image_upload_status.set('pending');

    const originalLocalUri = sighting.image_url; // Store the original local URI

    const publicUrl = await uploadImage(originalLocalUri, 'sightings', `sighting_images/${userId}`);

    if (publicUrl) {
      console.log(`Image uploaded successfully for sighting ${sighting.id}. Public URL: ${publicUrl}`);
      // Update the observable with the new URL and status
      (currentUserSightings$ as any)[sighting.id].image_url.set(publicUrl);
      (currentUserSightings$ as any)[sighting.id].image_upload_status.set('uploaded');

      // Delete the local file after successful upload
      try {
        await FileSystem.deleteAsync(originalLocalUri);
        console.log(`Deleted local image file: ${originalLocalUri}`);
      } catch (deleteError) {
        console.error(`Error deleting local image file ${originalLocalUri}:`, deleteError);
      }
    } else {
      console.warn(`Image upload failed for sighting ${sighting.id}. Retrying later.`);
      (currentUserSightings$ as any)[sighting.id].image_upload_status.set('failed');
    }
  } catch (error) {
    console.error(`Error processing image upload for sighting ${sighting.id}:`, error);
    (currentUserSightings$ as any)[sighting.id].image_upload_status.set('failed');
  }
};

// Observer to watch for online status and trigger pending uploads
observe(() => {
  if (isOnline$.get()) {
    console.log('App is online. Checking for pending image uploads...');
    const sightings = currentUserSightings$.get();
    if (sightings) {
      Object.values(sightings).forEach(sighting => {
        // Type assertion to access properties
        const s = sighting as any;
        // Only process if this is a local image that hasn't been uploaded
        if (s.image_url && s.image_url.startsWith('file://') && s.image_upload_status !== 'uploaded') {
          // Add a small delay before processing to avoid overwhelming the system
          setTimeout(() => {
            processPendingImageUpload(s as Sighting);
          }, 100);
        }
      });
    }
  }
});

// Export a function to manually trigger a check for pending uploads (e.g., on app start)
export const checkPendingImageUploads = () => {
  if (isOnline$.get()) {
    console.log('Manually checking for pending image uploads...');
    const sightings = currentUserSightings$.get();
    if (sightings) {
      Object.values(sightings).forEach(sighting => {
        // Type assertion to access properties
        const s = sighting as any;
        if (s.image_url && s.image_url.startsWith('file://') && s.image_upload_status !== 'uploaded') {
          processPendingImageUpload(s as Sighting);
        }
      });
    }
  }
};