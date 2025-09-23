import { useDataStore } from '../store/store';
import { CatalogData, UserData } from '../types/types';
import { Database } from '../../../types/database';

// Export functional service functions for backward compatibility
export const fetchCatalog = (): Promise<CatalogData> => {
  return useDataStore.getState().fetchCatalog();
};

export const fetchUserData = (): Promise<UserData> => {
  return useDataStore.getState().fetchUserData();
};

export const fetchDiveSites = (): Promise<Database['public']['Tables']['dive_sites']['Row'][]> => {
  return useDataStore.getState().fetchDiveSites();
};

export const createSighting = (
  sighting: Omit<Database['public']['Tables']['sightings']['Insert'], 'user_id'>
): Promise<Database['public']['Tables']['sightings']['Row'] | null> => {
  return useDataStore.getState().createSighting(sighting);
};

export const updateUserProfile = (
  profile: Omit<Database['public']['Tables']['profiles']['Update'], 'id'>
): Promise<Database['public']['Tables']['profiles']['Row'] | null> => {
  return useDataStore.getState().updateUserProfile(profile);
};

export const toggleWishlistItem = (creatureId: string): Promise<boolean> => {
  return useDataStore.getState().toggleWishlistItem(creatureId);
};

export const ensureUserProfile = (): Promise<Database['public']['Tables']['profiles']['Row'] | null> => {
  return useDataStore.getState().ensureUserProfile();
};

export const createProfileForCurrentUser = (
  profileData: Partial<Database['public']['Tables']['profiles']['Insert']>
): Promise<Database['public']['Tables']['profiles']['Row'] | null> => {
  return useDataStore.getState().createProfileForCurrentUser(profileData);
};