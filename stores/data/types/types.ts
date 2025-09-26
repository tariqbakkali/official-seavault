import { Database } from '../../../types/database';

export type CatalogData = {
  categories: Database['public']['Tables']['categories']['Row'][];
  creatures: Database['public']['Tables']['creatures']['Row'][];
  achievements: Database['public']['Tables']['achievements']['Row'][];
};

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
};

export interface DataState {
  catalog: CatalogData | null;
  userData: UserData | null;
  diveSites: Database['public']['Tables']['dive_sites']['Row'][] | null;
  isLoading: boolean;
  error: string | null;
};

export interface DataActions {
  fetchCatalog: () => Promise<CatalogData>;
  fetchUserData: () => Promise<UserData>;
  fetchDiveSites: () => Promise<Database['public']['Tables']['dive_sites']['Row'][]>;
  fetchLeaderboard: (limit?: number) => Promise<Array<{
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
    creatures_discovered: number;
    total_points: number;
  }>>;
  createSighting: (
    sighting: Omit<Database['public']['Tables']['sightings']['Insert'], 'user_id'>
  ) => Promise<Database['public']['Tables']['sightings']['Row'] | null>;
  updateUserProfile: (
    profile: Omit<Database['public']['Tables']['profiles']['Update'], 'id'>
  ) => Promise<Database['public']['Tables']['profiles']['Row'] | null>;
  toggleWishlistItem: (creatureId: string) => Promise<boolean>;
  ensureUserProfile: () => Promise<Database['public']['Tables']['profiles']['Row'] | null>;
  createProfileForCurrentUser: (
    profileData: Partial<Database['public']['Tables']['profiles']['Insert']>
  ) => Promise<Database['public']['Tables']['profiles']['Row'] | null>;
  reset: () => void;
};