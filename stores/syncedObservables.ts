import { observable } from '@legendapp/state';
import { supabase, uploadImage } from '../services/supabase'; // Import uploadImage
import { Database } from '../types/database';
import { v4 as uuidv4 } from 'uuid';
import { customSynced } from '@/services/legendStateConfig';
import { checkAndAwardSightingAchievements } from '@/services/achievementService';
import { syncObservable } from '@legendapp/state/sync';
import { observablePersistAsyncStorage } from '@legendapp/state/persist-plugins/async-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types for our observables
export type Creature = Database['public']['Tables']['creatures']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type DiveSite = Database['public']['Tables']['dive_sites']['Row'];
export type Sighting = Database['public']['Tables']['sightings']['Row'];
export type Dive = Database['public']['Tables']['dives']['Row'];
export type Wishlist = Database['public']['Tables']['wishlists']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Achievement = Database['public']['Tables']['achievements']['Row'];
export type UserAchievement = Database['public']['Tables']['user_achievements']['Row'];
export type Article = Database['public']['Tables']['articles']['Row'];
export type Instructor = Database['public']['Tables']['instructors']['Row'];
export type Media = Database['public']['Tables']['media']['Row'];




// User ID tracking - using an observable to make it reactive
export const currentUserID$ = observable<string | null>(null);

export const setCurrentUserID = (userId: string | null) => {
  currentUserID$.set(userId);
};

// Helper function to get current user ID
export const getCurrentUserID = () => currentUserID$.get();

// Synced observables for read-only data (catalog)
export const categories$ = observable(customSynced({
  supabase,
  collection: 'categories',
  actions: ['read'],
  persist: { name: 'categories_v6' },
    delete: async (item: any) => {
    const data = ""
    return { data, error: null };
  },

  changesSince: 'last-sync',
  fieldCreatedAt: 'created_at',
  realtime: true, // Enable realtime for all catalog data
  select: (select: any) => select.select('*, creatures(count)'), // Fetch creature count
}));

// export const creatures$ = observable<Record<string, Creature>>({});
export const creatures$ = observable(customSynced({
  supabase,
  collection: 'creatures',
  actions: ['read'],
  persist: { name: 'creatures_v6' },
  delete: async (item: any) => {
    const data = ""
    return { data, error: null };
  },
  changesSince: 'last-sync',
  fieldCreatedAt: 'created_at',
  realtime: false, // Catalog doesn't change often
}));

// Manually persist creatures since we're loading them lazily
// Manually persist creatures since we're loading them lazily
// syncObservable(creatures$, {
//   persist: {
//     name: 'creatures',
//     plugin: observablePersistAsyncStorage({ AsyncStorage }),
//   }
// });

// Helper to fetch creatures for a specific category
export const fetchCreaturesForCategory = async (categoryId: string) => {
  // Deprecated: creatures$ now syncs all creatures automatically
  // Trigger sync if needed
  creatures$.get();
  return;
};

export const achievements$ = observable(customSynced({
  supabase,
  collection: 'achievements',
  actions: ['read'],
  persist: { name: 'achievements_v6' },
    delete: async (item: any) => {
    const data = ""
    return { data, error: null };
  },

  changesSince: 'last-sync',
  fieldCreatedAt: 'created_at',
  realtime: true, // Enable realtime for all catalog data
}));

export const userAchievements$ = observable(customSynced({
  supabase,
  collection: 'user_achievements',
  filter: (select: any) => {
    const userId = currentUserID$.get();
    if (!userId) return select.eq('user_id', '00000000-0000-0000-0000-000000000000'); // Return empty result for unauthenticated users
    return select.eq('user_id', userId);
  },
  actions: ['read', 'create'],
  persist: { name: 'user_achievements_v6' },
    delete: async (item: any) => {
    const data = ""
    return { data, error: null };
  },

  // changesSince: 'last-sync',
  fieldCreatedAt: 'created_at',
  fieldUpdatedAt: 'created_at', // Override global default since this table lacks updated_at
  realtime: true,
}));

// Instructors observable - synced for offline support
export const instructors$ = observable(customSynced({
  supabase,
  collection: 'instructors',
  actions: ['read'],
  persist: { name: 'instructors_v1' },
  select: (select: any) => select.select('*'),
  changesSince: 'last-sync',
  fieldCreatedAt: 'created_at',
  realtime: true,
}));

export const diveSites$ = observable(customSynced({
  supabase,
  collection: 'dive_sites',
  actions: ['read', 'update'],
  persist: { name: 'dive_sites_v6' },
  // changesSince: 'last-sync',
  update: async (input: any) => {
    const { data, error } = await supabase
      .from('dive_sites')
      .upsert(input)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update dive site: ${error.message}`);
    } 
    return { data, error: null };
  },
    delete: async (item: any) => {
    const data = ""
    return { data, error: null };
  },

  realtime: true, // Disable realtime for dive sites to reduce constant updates
}));
// Synced observables for user-specific data
// These will be initialized with user ID filter when user logs in

// Current user sightings observable - user-specific
export const currentUserSightings$ = observable(customSynced({
  supabase,
  collection: 'sightings',
  filter: (select: any) => {
    const userId = currentUserID$.get();
    if (!userId) return select.eq('user_id', '00000000-0000-0000-0000-000000000000'); 
    return select.eq('user_id', userId);
  },
  actions: ['read', 'create', 'update', 'delete'],
  persist: { name: 'sightings_v6', retrySync: true },
    delete: async (item: any) => {
    const data = ""
    return { data, error: null };
  },

  // changesSince: 'last-sync',
  update: async (input: any) => {
    // Custom Supabase upsert function for sightings
    const { data, error } = await supabase
      .from('sightings')
      .upsert(input)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update sighting: ${error.message}`);
    }
    return { data, error: null };
  },
  fieldCreatedAt: 'created_at',
  realtime: false, // DEBUG: Disabled to fix initial sync issue
  select: (select: any) => select.select('*, creatures(category_id, points)'),
}));

// All users sightings observable - for leaderboard and community features
export const allUsersSightings$ = observable(customSynced({
  supabase,
  collection: 'sightings',
  actions: ['read', 'create', 'update', 'delete'],
  persist: { name: 'all_sightings_v6' },
    delete: async (item: any) => {
    const data = ""
    return { data, error: null };
  },

  // changesSince: 'last-sync',
  fieldCreatedAt: 'created_at',
  realtime: false, // DEBUG: Disabled to fix initial sync issue
  select: (select: any) => select.select('*, creatures(category_id, points)'),
}));

// All users achievements observable - for leaderboard and community features
export const allUsersAchievements$ = observable(customSynced({
  supabase,
  collection: 'user_achievements',
  actions: ['read'],
  persist: { name: 'all_user_achievements_v6' },
    delete: async (item: any) => {
    const data = ""
    return { data, error: null };
  },

  changesSince: 'last-sync',
  fieldCreatedAt: 'created_at',
  realtime: true, // Enable realtime for all user achievements
}));

// Wishlists observable - user-specific
export const wishlists$ = observable(customSynced({
  supabase,
  collection: 'wishlists',
  filter: (select: any) => {
    const userId = currentUserID$.get();
    if (!userId) return select.eq('user_id', '00000000-0000-0000-0000-000000000000'); 
    return select.eq('user_id', userId);
  },
  actions: ['read', 'update', 'delete'],
  update: async (input: any) => {

    if (input.deleted ) {
      const { data, error } = await supabase
      .from('wishlists')
      .delete()
      .eq('id', input.id)
      .select()
      .single();
      if (error) {
        throw new Error(`Failed to delete wishlist item: ${error.message}`);
      }
      return { data, error: null };
    }

    // Custom Supabase create function for wishlists
    const { data, error } = await supabase
      .from('wishlists')
      .insert(input)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create wishlist item: ${error.message}`);
    }
    
    return { data, error: null };
  },
  persist: { name: 'wishlists_v6', retrySync: true },
  retry:{infinite: true},
  // changesSince: 'last-sync',
  // fieldCreatedAt: 'created_at',
  realtime: true, // Enable realtime for all, filtering will be done by Supabase
}));

// Profile observable - user-specific
export const currentUserProfile$ = observable<Record<string, Profile>>(customSynced({
  supabase,
  collection: 'profiles',
  filter: (select: any) => {
    const userId = currentUserID$.get();
    if (!userId) {
      return select.eq('id', '00000000-0000-0000-0000-000000000000'); 
    }
    const result = select.eq('id', userId);
    return result;
  },
  actions: ['read', 'update'],
   delete: async (item: any) => {
    const data = ""
    return { data, error: null };
  },

  persist: { name: 'currentUserProfile_v6', retrySync: true },
  // changesSince: 'last-sync',
  fieldCreatedAt: 'created_at',
  realtime: true, // Enable realtime for all, filtering will be done by Supabase
}));

// Flag to prevent repeated profile error logging
let profileErrorLogged = false;

export const allUsersProfiles$ = observable<Record<string, Profile>>(customSynced({
  supabase,
  collection: 'profiles',
  actions: ['read'],
  persist: { name: 'all_profiles_v8' },
    delete: async (item: any) => {
    const data = ""
    return { data, error: null };
  },

  fieldCreatedAt: 'created_at',
  realtime: false, // Disabled to prevent sync overhead
  retry: {
    infinite: false,
    times: 1, // Only retry once
    delay: 5000, // Wait 5 seconds before retry
  },
  onError: (error: any) => {
    if (!profileErrorLogged) {
      console.warn('[allUsersProfiles$] Profiles sync restricted or disabled.');
      profileErrorLogged = true;
    }
    return;
  }
}));

// Current user dives observable
// Removed currentUserDives$ - using sightings table only

// Articles observable - synced for offline support
export const articles$ = observable(customSynced({
  supabase,
  collection: 'articles',
  actions: ['read'],
  persist: { name: 'articles_v1' },
  select: (select: any) => select.select('*'),
  changesSince: 'last-sync',
  fieldCreatedAt: 'created_at',
  realtime: true,
}));

// Dives observable
export const dives$ = observable(customSynced({
  supabase,
  collection: 'dives',
  actions: ['read', 'create', 'update', 'delete'],
  persist: { name: 'dives_v1' },
  select: (select: any) => select.select('*'),
  fieldCreatedAt: 'created_at',
  realtime: true,
}));

// Media observable
export const media$ = observable(customSynced({
  supabase,
  collection: 'media',
  actions: ['read', 'create', 'update', 'delete'],
  persist: { name: 'media_v1' },
  select: (select: any) => select.select('*'),
  fieldCreatedAt: 'created_at',
  fieldUpdatedAt: 'created_at', // Override global default since this table lacks updated_at
  realtime: true,
}));

// Utility functions for working with the observables
export const getCategories = () => categories$.get();
export const getCreatures = () => creatures$.get();
export const getAchievements = () => achievements$.get();
export const getUserAchievements = () => {
  const achievements = userAchievements$.get();
  return achievements;
};
export const getAllUsersAchievements = () => allUsersAchievements$.get();
export const getDiveSites = () => diveSites$.get();
export const getCurrentUserSightings = () => currentUserSightings$.get();
export const getAllUsersSightings = () => allUsersSightings$.get();
export const getWishlists = () => wishlists$.get();
export const getCurrentUserProfile = () => currentUserProfile$.get();
export const getAllUsersProfiles = () => allUsersProfiles$.get();
export const getAllArticles = () => articles$.get();
export const getInstructors = () => instructors$.get();
export const getDives = () => dives$.get();
export const getMedia = () => media$.get();
// Removed getCurrentUserDives - using sightings table only

// Utility functions for creating new records
export const createSighting = async (sightingData: Omit<Sighting, 'id' | 'created_at' | 'user_id'>) => {
  const userId = currentUserID$.get();
  if (!userId) {
    throw new Error('User must be logged in to create sightings');
  }
  
  const id = uuidv4();
  let imageUrl = sightingData.image_url;
  let imageUploadStatus: Sighting['image_upload_status'] = null;

  // Check if imageUrl is a local file URI and attempt to upload
  if (imageUrl && imageUrl.startsWith('file://')) {
    imageUploadStatus = 'pending';
    try {
      const publicUrl = await uploadImage(imageUrl, 'sightings', `sighting_images/${userId}`);
      if (publicUrl) {
        imageUrl = publicUrl;
        imageUploadStatus = 'uploaded';
      } else {
        // If upload fails, keep local URI and status as pending
        console.warn('Image upload failed, keeping local URI for retry:', imageUrl);
        imageUploadStatus = 'failed'; // Mark as failed for immediate feedback, will be retried by sync mechanism
      }
    } catch (error) {
      console.error('Error uploading image during sighting creation:', error);
      // Keep local URI and status as pending if upload fails
      imageUploadStatus = 'failed'; // Mark as failed for immediate feedback, will be retried by sync mechanism
    }
  } else if (imageUrl) {
    imageUploadStatus = 'uploaded'; // Already a cloud URL or not a local file
  }

  const newSighting = {
    ...sightingData,
    id,
    user_id: userId,
    created_at: new Date().toISOString(),
    image_url: imageUrl,
    image_upload_status: imageUploadStatus,
  } as Sighting;

  // Update both currentUserSightings$ and allUsersSightings$ observables
  (currentUserSightings$ as any)[id].set(newSighting);
  (allUsersSightings$ as any)[id].set(newSighting);

  // Check for achievements after creating the sighting
  try {
    // Get all current sightings to determine the count of unique creatures
    const allSightings = currentUserSightings$.get() || {};
    const sightingsArray = Object.values(allSightings);
    
    // Count unique creatures
    const uniqueCreatures = new Set(sightingsArray.map((s: any) => s.creature_id)).size;
    
    // Check and award achievements based on the count
    await checkAndAwardSightingAchievements(userId, uniqueCreatures);
  } catch (error) {
    console.error('Error checking achievements:', error);
  }
  
  return newSighting;
};

// Utility function to create a dive
export const createDive = async (diveData: any) => {
  const userId = currentUserID$.get();
  if (!userId) throw new Error('User must be logged in to create dives');
  
  const id = uuidv4();
  const newDive = {
    ...diveData,
    id,
    user_id: userId,
    created_at: new Date().toISOString(),
  };

  // Set the data in the observable
  (dives$ as any)[id].set(newDive);

  return newDive;
};

// Utility function to update a dive
export const updateDive = async (id: string, updates: any) => {
  const existing = (dives$ as any)[id].peek();
  if (!existing) throw new Error('Dive not found');
  
  const updatedDive = {
    ...existing,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  (dives$ as any)[id].set(updatedDive);

  return updatedDive;
};

// Utility function to update a sighting
export const updateSighting = async (id: string, updates: any) => {
  const existing = (currentUserSightings$ as any)[id].peek();
  if (!existing) throw new Error('Sighting not found');
  
  const updatedSighting = {
    ...existing,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  (currentUserSightings$ as any)[id].set(updatedSighting);

  return updatedSighting;
};

// Utility function to delete a dive
export const deleteDive = async (id: string) => {
  return (dives$ as any)[id].delete();
};

// Utility function to delete a sighting
export const deleteSighting = async (id: string) => {
  return (currentUserSightings$ as any)[id].delete();
};

// Utility function to add media
export const addMedia = async (mediaData: Omit<Media, 'id' | 'created_at' | 'user_id'>) => {
  const userId = currentUserID$.get();
  if (!userId) throw new Error('User must be logged in to add media');
  
  const id = uuidv4();
  const newMedia = {
    ...mediaData,
    id,
    user_id: userId,
    created_at: new Date().toISOString(),
  };

  (media$ as any)[id].set(newMedia);

  return newMedia;
};

// Utility function to delete media
export const deleteMedia = async (id: string) => {
  return (media$ as any)[id].delete();
};

export const createWishlistItem = async (creatureId: string) => {
  const userId = currentUserID$.get();
  if (!userId) {
    throw new Error('User must be logged in to create wishlist items');
  }
  
  const id = uuidv4();
  
  // Create the wishlist item data for insert
  const wishlistItemData = {
    id,
    user_id: userId,
    creature_id: creatureId,
    created_at: new Date().toISOString(),
  };
  
  try {
    // Set the data in the observable which will trigger the create action
    (wishlists$ as any)[id].set(wishlistItemData);
    
    return wishlistItemData;
  } catch (error: any) {
    console.error('Error creating wishlist item:', error);
    throw error;
  }
};

export const createDiveSite = (diveSiteData: Omit<DiveSite, 'id' | 'created_at'>) => {
  const userId = currentUserID$.get();
  if (!userId) {
    throw new Error('User must be logged in to create dive sites');
  }
  
  const id = uuidv4();
  const newDiveSite = {
    ...diveSiteData,
    id,
    created_at: new Date().toISOString(),
    deleted: false,
  } as DiveSite;
  
  try {
    console.log('[createDiveSite] Creating dive site:', newDiveSite.name);
    (diveSites$ as any)[id].set(newDiveSite);
    console.log('[createDiveSite] Dive site created locally, will sync to Supabase');
    return newDiveSite;
  } catch (error) {
    console.error('[createDiveSite] Error creating dive site:', error);
    throw error;
  }
};



// Removed createDive - using sightings table only

export const removeWishlistItem = (wishlistId: string) => {
  // Use Legend State's delete method instead of direct deletion
  (wishlists$ as any)[wishlistId].delete();
};

// Toggle wishlist item - adds if not in wishlist, removes if already in wishlist
export const toggleWishlistItem = async (creatureId: string): Promise<boolean> => {
  const userId = currentUserID$.get();

  if (!userId) {
    throw new Error('User must be logged in to toggle wishlist items');
  }
  
  // Get current wishlist items
  const currentWishlists = wishlists$.get() || {};
  
  // Check if item is already wishlisted by looking for an item with this creatureId
  const wishlistEntries = Object.values(currentWishlists);
  const existingWishlistItem = wishlistEntries.find((item: any) => 
    item && item.creature_id === creatureId
  ) as Wishlist | undefined;
  
  if (existingWishlistItem && existingWishlistItem.id) {
    // Remove from wishlist
    removeWishlistItem(existingWishlistItem.id);
    return false; // Item removed
  } else {
    // Add to wishlist
    createWishlistItem(creatureId);
    // We can't easily wait for the creation to complete, so we assume it works
    return true; // Item added
  }
};

// Function to update user profile
export const updateUserProfile = async (updates: Partial<Profile>) => {
  const userId = currentUserID$.get();
  if (!userId) {
    throw new Error('User must be logged in to update profile');
  }
  
  // Get the current profile data
  const currentProfile = currentUserProfile$.get();
  
  // Get the existing profile object for this user, or create a default one
  const existingUserProfile = currentProfile?.[userId];
  
  // Create the updated profile object
  const updatedProfile = {
    id: userId,
    email: existingUserProfile?.email ?? null,
    full_name: existingUserProfile?.full_name ?? null,
    avatar_url: existingUserProfile?.avatar_url ?? null,
    membership_tier: existingUserProfile?.membership_tier ?? null,
    created_at: existingUserProfile?.created_at ?? new Date().toISOString(),
    is_premium: existingUserProfile?.is_premium ?? null,
    has_seen_onboarding: existingUserProfile?.has_seen_onboarding ?? null,
    ...updates,
  } as Profile;
  
  // Update the profile observable with the new data
  currentUserProfile$.assign!({
    [userId]: updatedProfile
  });
};

// Friends observable - moved to standard persisted observable for "The Proper Way"
// This eliminates conflicts between the sync engine and manual realtime listeners.
export const friends$ = observable<Record<string, any>>({});

syncObservable(friends$, {
  persist: {
    name: 'friends_v16',
    plugin: observablePersistAsyncStorage({ AsyncStorage }),
  }
});

export const getSightings = getCurrentUserSightings;
export const getAllFriends = () => friends$.get();