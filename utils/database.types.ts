export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string | null
          code: string
          created_at: string | null
          description: string | null
          icon_name: string | null
          id: string
          name: string
          points: number | null
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          name: string
          points?: number | null
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          name?: string
          points?: number | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          name?: string
        }
        Relationships: []
      }
      creatures: {
        Row: {
          category_id: string | null
          class: string | null
          created_at: string | null
          creature_id: string
          depth_range: string | null
          description: string | null
          diet: string | null
          habitat: string | null
          id: string
          image_url: string | null
          length: string | null
          lifespan: string | null
          name: string
          points: number
          scientific_name: string | null
          weight: string | null
        }
        Insert: {
          category_id?: string | null
          class?: string | null
          created_at?: string | null
          creature_id: string
          depth_range?: string | null
          description?: string | null
          diet?: string | null
          habitat?: string | null
          id?: string
          image_url?: string | null
          length?: string | null
          lifespan?: string | null
          name: string
          points: number
          scientific_name?: string | null
          weight?: string | null
        }
        Update: {
          category_id?: string | null
          class?: string | null
          created_at?: string | null
          creature_id?: string
          depth_range?: string | null
          description?: string | null
          diet?: string | null
          habitat?: string | null
          id?: string
          image_url?: string | null
          length?: string | null
          lifespan?: string | null
          name?: string
          points?: number
          scientific_name?: string | null
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creatures_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      dive_sites: {
        Row: {
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          osm_id: string | null
        }
        Insert: {
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          osm_id?: string | null
        }
        Update: {
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          osm_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          has_seen_onboarding: boolean | null
          id: string
          is_premium: boolean | null
          membership_tier: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          has_seen_onboarding?: boolean | null
          id: string
          is_premium?: boolean | null
          membership_tier?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          has_seen_onboarding?: boolean | null
          id?: string
          is_premium?: boolean | null
          membership_tier?: string | null
        }
        Relationships: []
      }
      sightings: {
        Row: {
          created_at: string | null
          creature_id: string | null
          creature_notes: string | null
          date: string
          depth: string | null
          dive_notes: string | null
          dive_site_id: string | null
          dive_type: string | null
          id: string
          image_url: string | null
          time_of_day: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          creature_id?: string | null
          creature_notes?: string | null
          date: string
          depth?: string | null
          dive_notes?: string | null
          dive_site_id?: string | null
          dive_type?: string | null
          id?: string
          image_url?: string | null
          time_of_day?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          creature_id?: string | null
          creature_notes?: string | null
          date?: string
          depth?: string | null
          dive_notes?: string | null
          dive_site_id?: string | null
          dive_type?: string | null
          id?: string
          image_url?: string | null
          time_of_day?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sightings_creature_id_fkey"
            columns: ["creature_id"]
            isOneToOne: false
            referencedRelation: "creatures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sightings_dive_site_id_fkey"
            columns: ["dive_site_id"]
            isOneToOne: false
            referencedRelation: "dive_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sightings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string | null
          creature_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          creature_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          creature_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_creature_id_fkey"
            columns: ["creature_id"]
            isOneToOne: false
            referencedRelation: "creatures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_leaderboard: {
        Args: { limit_count?: number }
        Returns: {
          avatar_url: string
          creatures_discovered: number
          full_name: string
          rank: number
          total_points: number
          user_id: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

