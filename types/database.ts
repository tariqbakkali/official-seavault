export interface Database {
  public: {
    Tables: {
      creatures: {
        Row: {
          id: string;
          creature_id: string;
          name: string;
          scientific_name: string | null;
          category_id: string;
          points: number;
          description: string | null;
          habitat: string | null;
          diet: string | null;
          depth_range: string | null;
          length: string | null;
          weight: string | null;
          lifespan: string | null;
          image_url: string | null;
          created_at: string;
          class: string | null;
        };
        Insert: Omit<Database['public']['Tables']['creatures']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['creatures']['Insert']>;
      };
      categories: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          image_url: string | null;
        };
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
      };
      dive_sites: {
        Row: {
          id: string;
          name: string;
          latitude: number | null;
          longitude: number | null;
          osm_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['dive_sites']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['dive_sites']['Insert']>;
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          membership_tier: string | null;
          created_at: string;
          is_premium: boolean | null;
          has_seen_onboarding: boolean | null;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      sightings: {
        Row: {
          id: string;
          user_id: string;
          creature_id: string;
          date: string;
          dive_notes: string | null;
          image_url: string | null;
          created_at: string;
          dive_site_id: string | null;
          dive_type: string | null;
          time_of_day: string | null;
          depth: string | null;
          creature_notes: string | null;
        };
        Insert: Omit<Database['public']['Tables']['sightings']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['sightings']['Insert']>;
      };
      wishlists: {
        Row: {
          id: string;
          user_id: string;
          creature_id: string;
          created_at: string;
          deleted: boolean | null;
        };
        Insert: Omit<Database['public']['Tables']['wishlists']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['wishlists']['Insert']>;
      };
      achievements: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          category: string | null;
          icon_name: string | null;
          points: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['achievements']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['achievements']['Insert']>;
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_achievements']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['user_achievements']['Insert']>;
      };
    };
  };
}

export type Creature = Database['public']['Tables']['creatures']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type DiveSite = Database['public']['Tables']['dive_sites']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Sighting = Database['public']['Tables']['sightings']['Row'];
export type Wishlist = Database['public']['Tables']['wishlists']['Row'];
export type Achievement = Database['public']['Tables']['achievements']['Row'];
export type UserAchievement = Database['public']['Tables']['user_achievements']['Row'];


export interface CachedCatalog {
  categories: Category[];
  creatures: Creature[];
  lastSyncAt: string;
}

export interface CachedUserData {
  profile: Profile | null;
  sightings: Sighting[];
  wishlists: Wishlist[];
  achievements: Achievement[];
  userAchievements: UserAchievement[];
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
  lastSyncAt: string;
}

export interface PendingOperation {
  clientId: string;
  table: 'sightings' | 'wishlists' | 'profiles'| 'user_achievements';
  op: 'insert' | 'update' | 'delete';
  payload: any;
  ts: number;
}

export interface UnlockedAchievement {
  code: string;
  unlockedAt: string;
}