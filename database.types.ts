export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          id: number
          name: string
          sub_categories: string[] | null
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          sub_categories?: string[] | null
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          sub_categories?: string[] | null
        }
        Relationships: []
      }
      emergency_calls: {
        Row: {
          call_timestamp: string | null
          call_type: string | null
          called_number: string
          caller_number: string | null
          created_at: string | null
          id: string
          location_lat: number | null
          location_lng: number | null
          outcome: string | null
          user_id: string
        }
        Insert: {
          call_timestamp?: string | null
          call_type?: string | null
          called_number: string
          caller_number?: string | null
          created_at?: string | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          outcome?: string | null
          user_id: string
        }
        Update: {
          call_timestamp?: string | null
          call_type?: string | null
          called_number?: string
          caller_number?: string | null
          created_at?: string | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          outcome?: string | null
          user_id?: string
        }
        Relationships: []
      }
      hotlines: {
        Row: {
          available: boolean
          created_at: string
          description: string | null
          id: number
          name: string
          phone_number: string
        }
        Insert: {
          available: boolean
          created_at?: string
          description?: string | null
          id?: number
          name: string
          phone_number: string
        }
        Update: {
          available?: boolean
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          phone_number?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          badge_number: string | null
          first_name: string | null
          id: string
          last_name: string | null
          middle_name: string | null
          rank: string | null
          role: Database["public"]["Enums"]["role"]
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          badge_number?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          middle_name?: string | null
          rank?: string | null
          role?: Database["public"]["Enums"]["role"]
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          badge_number?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          middle_name?: string | null
          rank?: string | null
          role?: Database["public"]["Enums"]["role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          attachments: string[] | null
          brief_description: string | null
          category_id: number | null
          city: string | null
          created_at: string
          id: number
          incident_date: string | null
          incident_time: string | null
          incident_title: string | null
          injuries_reported: string | null
          is_anonymous: boolean | null
          is_archived: boolean | null
          latitude: number
          longitude: number
          nearby_landmark: string | null
          number_of_witnesses: string | null
          property_damage: string | null
          province: string | null
          reporter_id: string
          request_follow_up: boolean | null
          resolved_at: string | null
          share_with_community: boolean | null
          status: string
          street_address: string | null
          sub_category: number | null
          suspect_description: string | null
          what_happened: string | null
          who_was_involved: string | null
          witness_contact_info: string | null
        }
        Insert: {
          attachments?: string[] | null
          brief_description?: string | null
          category_id?: number | null
          city?: string | null
          created_at?: string
          id?: number
          incident_date?: string | null
          incident_time?: string | null
          incident_title?: string | null
          injuries_reported?: string | null
          is_anonymous?: boolean | null
          is_archived?: boolean | null
          latitude: number
          longitude: number
          nearby_landmark?: string | null
          number_of_witnesses?: string | null
          property_damage?: string | null
          province?: string | null
          reporter_id?: string
          request_follow_up?: boolean | null
          resolved_at?: string | null
          share_with_community?: boolean | null
          status?: string
          street_address?: string | null
          sub_category?: number | null
          suspect_description?: string | null
          what_happened?: string | null
          who_was_involved?: string | null
          witness_contact_info?: string | null
        }
        Update: {
          attachments?: string[] | null
          brief_description?: string | null
          category_id?: number | null
          city?: string | null
          created_at?: string
          id?: number
          incident_date?: string | null
          incident_time?: string | null
          incident_title?: string | null
          injuries_reported?: string | null
          is_anonymous?: boolean | null
          is_archived?: boolean | null
          latitude?: number
          longitude?: number
          nearby_landmark?: string | null
          number_of_witnesses?: string | null
          property_damage?: string | null
          province?: string | null
          reporter_id?: string
          request_follow_up?: boolean | null
          resolved_at?: string | null
          share_with_community?: boolean | null
          status?: string
          street_address?: string | null
          sub_category?: number | null
          suspect_description?: string | null
          what_happened?: string | null
          who_was_involved?: string | null
          witness_contact_info?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
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
      get_profiles_with_emails: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string
          badge_number: string
          email: string
          first_name: string
          id: string
          joined_date: string
          last_name: string
          last_sign_in_at: string
          middle_name: string
          reports_count: number
        }[]
      }
    }
    Enums: {
      role: "admin" | "officer" | "user"
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
  public: {
    Enums: {
      role: ["admin", "officer", "user"],
    },
  },
} as const
