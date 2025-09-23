import { Database } from '../../../types/database';

export type UserData = {
  profile: Database['public']['Tables']['profiles']['Row'] | null;
  sightings: Database['public']['Tables']['sightings']['Row'][];
  wishlists: Database['public']['Tables']['wishlists']['Row'][];
};

// Add a stats property to UserData
export type UserDataWithStats = UserData & {
  stats: {
    totalPoints: number;
    uniqueCreatures: number;
    overallCompletion: number;
    categoryStats: Record<string, {
      seen: number;
      total: number;
      completion: number;
    }>;
    categoryNames: Record<string, string>;
  };
};

export interface UserStats {
  totalPoints: number;
  uniqueCreatures: number;
  overallCompletion: number;
  categoryStats: Record<string, {
    seen: number;
    total: number;
    completion: number;
  }>;
  categoryNames: Record<string, string>;
}

export interface UserState {
  userData: UserData | null;
  isLoading: boolean;
  error: string | null;
}

export interface UserActions {
  fetchUserData: () => Promise<UserData>;
  updateUserProfile: (
    profile: Omit<Database['public']['Tables']['profiles']['Update'], 'id'>
  ) => Promise<Database['public']['Tables']['profiles']['Row'] | null>;
  ensureUserProfile: () => Promise<Database['public']['Tables']['profiles']['Row'] | null>;
  createProfileForCurrentUser: (
    profileData: Partial<Database['public']['Tables']['profiles']['Insert']>
  ) => Promise<Database['public']['Tables']['profiles']['Row'] | null>;
  reset: () => void;
}