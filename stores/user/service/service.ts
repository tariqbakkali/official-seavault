import { useUserStore } from '../store/store';
import { UserData } from '../types/types';
import { Database } from '../../../types/database';

// Export functional service functions for backward compatibility
export const fetchUserData = (): Promise<UserData> => {
  return useUserStore.getState().fetchUserData();
};

export const updateUserProfile = (
  profile: Omit<Database['public']['Tables']['profiles']['Update'], 'id'>
): Promise<Database['public']['Tables']['profiles']['Row'] | null> => {
  return useUserStore.getState().updateUserProfile(profile);
};

export const ensureUserProfile = (): Promise<Database['public']['Tables']['profiles']['Row'] | null> => {
  return useUserStore.getState().ensureUserProfile();
};

export const createProfileForCurrentUser = (
  profileData: Partial<Database['public']['Tables']['profiles']['Insert']>
): Promise<Database['public']['Tables']['profiles']['Row'] | null> => {
  return useUserStore.getState().createProfileForCurrentUser(profileData);
};