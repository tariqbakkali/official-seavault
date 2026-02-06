export interface Database {
  public: {
    Tables: {
      articles: {
        Row: {
          id: string;
          title: string;
          image_url: string | null;
          subtitle: string | null;
          content: string | null;
          external_link: string | null;
          featured: boolean;
          category: string | null;
          display_order: number | null;
          status: string | null; // 'draft', 'published', 'archived'
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['articles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['articles']['Insert']>;
        Relationships: [];
      };
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
          updated_at: string;
          fascination: string | null;
        };
        Insert: Omit<Database['public']['Tables']['creatures']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['creatures']['Insert']>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          image_url: string | null;
          updated_at: string;
          fascination: string | null;
        };
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
        Relationships: [];
      };
      dive_sites: {
        Row: {
          id: string;
          name: string;
          latitude: number | null;
          longitude: number | null;
          osm_id: string | null;
          created_at: string;
          updated_at: string;
          deleted: boolean | null;
        };
        Insert: Omit<Database['public']['Tables']['dive_sites']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['dive_sites']['Insert']>;
        Relationships: [];
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
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      sightings: {
        Row: {
          id: string;
          user_id: string;
          creature_id: string | null;
          date: string;
          dive_notes: string | null;
          image_url: string | null;
          created_at: string;
          dive_site_id: string | null;
          dive_type: string | null;
          time_of_day: string | null;
          depth: string | null; // Keep supporting the old string depth if needed
          max_depth: number | null; // Correct number type
          creature_notes: string | null; // Sighting specific
          updated_at: string;
          image_upload_status?: 'pending' | 'uploaded' | 'failed' | null;
          images: any[] | null;
          dive_id: string | null;
          // Dive-level fields (stored in each sighting)
          duration: number | null; // in minutes
          weather: string | null;
          visibility: string | null;
          current: string | null;
          time_in: string | null;
          time_out: string | null;
          air_in: number | null;
          air_out: number | null;
          air_unit: 'bar' | 'psi' | null;
          depth_unit?: 'meters' | 'feet' | null;
          course_type: string | null;
          skills_completed: string[] | null;
          instructor_id: string | null;
          instructor_name: string | null;
          waterway: string | null;
          dive_mode: 'leisure' | 'training' | null;
          is_public_template: boolean | null;
        };
        Insert: Omit<Database['public']['Tables']['sightings']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['sightings']['Insert']>;
        Relationships: [];
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
        Relationships: [];
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
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['achievements']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['achievements']['Insert']>;
        Relationships: [];
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
        Relationships: [];
      };
      dive_shops: {
        Row: {
          id: number;
          name: string;
          padi_link: string | null;
          address: string | null;
          country: string | null;
          referral_code: string;
          offering_id: string | null;
          ios_link: string | null;
          android_link: string | null;
          created_at: string;
          discount_percent: number;
          lifetime: boolean;
          is_active: boolean;
          total_redeemed: number;
        };
        Insert: Omit<Database['public']['Tables']['dive_shops']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['dive_shops']['Insert']>;
      };
      shop_referrals: {
        Row: {
          id: number;
          shop_id: number;
          user_id: string;
          redeemed_at: string;
        };
        Insert: Omit<Database['public']['Tables']['shop_referrals']['Row'], 'id' | 'redeemed_at'>;
        Update: Partial<Database['public']['Tables']['shop_referrals']['Insert']>;
      };
      instructors: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['instructors']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['instructors']['Insert']>;
        Relationships: [];
      };
      friends: {
        Row: {
          id: string;
          user_id: string;
          friend_id: string;
          status: 'pending' | 'accepted' | 'blocked';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['friends']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['friends']['Insert']>;
        Relationships: [];
      };
      certifications: {
        Row: {
          id: string;
          user_id: string;
          agency: 'PADI' | 'SSI' | 'NAUI' | 'SDI' | 'BSAC' | 'CMAS' | 'Other';
          level: string;
          certification_number: string | null;
          card_front_url: string | null;
          card_back_url: string | null;
          issued_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['certifications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['certifications']['Insert']>;
        Relationships: [];
      };
    };
    Functions: {
      clone_dive: {
        Args: {
          source_dive_id: string;
          target_user_id: string;
        };
        Returns: string;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
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
export type Article = Database['public']['Tables']['articles']['Row'];
export type Instructor = Database['public']['Tables']['instructors']['Row'];
export type Friend = Database['public']['Tables']['friends']['Row'];
export type Certification = Database['public']['Tables']['certifications']['Row'];


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