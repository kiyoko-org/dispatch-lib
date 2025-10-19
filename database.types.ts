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
      barangays: {
        Row: {
          created_at: string
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
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
      lost_and_found: {
        Row: {
          category: string
          created_at: string
          date_lost: string
          description: string | null
          id: number
          item_title: string
          lat: number
          lon: number
          photo: string | null
        }
        Insert: {
          category: string
          created_at?: string
          date_lost: string
          description?: string | null
          id?: number
          item_title: string
          lat: number
          lon: number
          photo?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          date_lost?: string
          description?: string | null
          id?: number
          item_title?: string
          lat?: number
          lon?: number
          photo?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          title: string | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          title?: string | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      officers: {
        Row: {
          assigned_report_id: number | null
          badge_number: string | null
          created_at: string | null
          fcm_token: string | null
          first_name: string | null
          id: string
          last_name: string | null
          middle_name: string | null
          rank: string | null
          role: Database["public"]["Enums"]["role"]
          updated_at: string | null
        }
        Insert: {
          assigned_report_id?: number | null
          badge_number?: string | null
          created_at?: string | null
          fcm_token?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          middle_name?: string | null
          rank?: string | null
          role?: Database["public"]["Enums"]["role"]
          updated_at?: string | null
        }
        Update: {
          assigned_report_id?: number | null
          badge_number?: string | null
          created_at?: string | null
          fcm_token?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          middle_name?: string | null
          rank?: string | null
          role?: Database["public"]["Enums"]["role"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "officers_assigned_report_id_fkey"
            columns: ["assigned_report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          first_name: string | null
          id: string
          last_name: string | null
          middle_name: string | null
          phone_number: string | null
          role: Database["public"]["Enums"]["role"]
          updated_at: string | null
          user_type: string | null
        }
        Insert: {
          avatar_url?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          middle_name?: string | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["role"]
          updated_at?: string | null
          user_type?: string | null
        }
        Update: {
          avatar_url?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          middle_name?: string | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["role"]
          updated_at?: string | null
          user_type?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          archived_date: string | null
          attachments: string[] | null
          category_id: number | null
          created_at: string
          id: number
          incident_date: string | null
          incident_time: string | null
          incident_title: string | null
          injuries_reported: string | null
          is_archived: boolean | null
          latitude: number
          longitude: number
          nearby_landmark: string | null
          number_of_witnesses: string | null
          officers_involved: string[] | null
          property_damage: string | null
          reporter_id: string
          resolved_at: string | null
          status: string
          street_address: string | null
          sub_category: number | null
          suspect_description: string | null
          what_happened: string | null
          who_was_involved: string | null
          witness_contact_info: string | null
        }
        Insert: {
          archived_date?: string | null
          attachments?: string[] | null
          category_id?: number | null
          created_at?: string
          id?: number
          incident_date?: string | null
          incident_time?: string | null
          incident_title?: string | null
          injuries_reported?: string | null
          is_archived?: boolean | null
          latitude: number
          longitude: number
          nearby_landmark?: string | null
          number_of_witnesses?: string | null
          officers_involved?: string[] | null
          property_damage?: string | null
          reporter_id?: string
          resolved_at?: string | null
          status?: string
          street_address?: string | null
          sub_category?: number | null
          suspect_description?: string | null
          what_happened?: string | null
          who_was_involved?: string | null
          witness_contact_info?: string | null
        }
        Update: {
          archived_date?: string | null
          attachments?: string[] | null
          category_id?: number | null
          created_at?: string
          id?: number
          incident_date?: string | null
          incident_time?: string | null
          incident_title?: string | null
          injuries_reported?: string | null
          is_archived?: boolean | null
          latitude?: number
          longitude?: number
          nearby_landmark?: string | null
          number_of_witnesses?: string | null
          officers_involved?: string[] | null
          property_damage?: string | null
          reporter_id?: string
          resolved_at?: string | null
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
      user_data: {
        Row: {
          id: string
          settings_json: Json | null
        }
        Insert: {
          id?: string
          settings_json?: Json | null
        }
        Update: {
          id?: string
          settings_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "user_data_id_fkey"
            columns: ["id"]
            isOneToOne: true
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
      get_officer_email_by_badge: {
        Args: { badge_number_param: string }
        Returns: {
          email: string
        }[]
      }
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
      signout_user: {
        Args: { user_uuid: string }
        Returns: Json
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
