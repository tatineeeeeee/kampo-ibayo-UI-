export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bookings: {
        Row: {
          check_in_date: string
          check_out_date: string
          created_at: string | null
          guest_name: string
          id: number
          number_of_guests: number
          phone: string | null
          special_requests: string | null
          status: string | null
          total_amount: number
          user_id: string | null
        }
        Insert: {
          check_in_date: string
          check_out_date: string
          created_at?: string | null
          guest_name: string
          id?: number
          number_of_guests: number
          phone?: string | null
          special_requests?: string | null
          status?: string | null
          total_amount: number
          user_id?: string | null
        }
        Update: {
          check_in_date?: string
          check_out_date?: string
          created_at?: string | null
          guest_name?: string
          id?: number
          number_of_guests?: number
          phone?: string | null
          special_requests?: string | null
          status?: string | null
          total_amount?: number
          user_id?: string | null
        }
        Relationships: []
      }
      guest_reviews: {
        Row: {
          amenities_rating: number | null
          anonymous: boolean | null
          approved: boolean | null
          booking_id: number | null
          cleanliness_rating: number | null
          created_at: string
          guest_location: string | null
          guest_name: string
          id: string
          location_rating: number | null
          original_submission_date: string | null
          rating: number
          rejection_reason: string | null
          resubmission_count: number | null
          review_text: string
          service_rating: number | null
          stay_dates: string | null
          user_id: string
          value_rating: number | null
        }
        Insert: {
          amenities_rating?: number | null
          anonymous?: boolean | null
          approved?: boolean | null
          booking_id?: number | null
          cleanliness_rating?: number | null
          created_at?: string
          guest_location?: string | null
          guest_name: string
          id?: string
          location_rating?: number | null
          original_submission_date?: string | null
          rating: number
          rejection_reason?: string | null
          resubmission_count?: number | null
          review_text: string
          service_rating?: number | null
          stay_dates?: string | null
          user_id: string
          value_rating?: number | null
        }
        Update: {
          amenities_rating?: number | null
          anonymous?: boolean | null
          approved?: boolean | null
          booking_id?: number | null
          cleanliness_rating?: number | null
          created_at?: string
          guest_location?: string | null
          guest_name?: string
          id?: string
          location_rating?: number | null
          original_submission_date?: string | null
          rating?: number
          rejection_reason?: string | null
          resubmission_count?: number | null
          review_text?: string
          service_rating?: number | null
          stay_dates?: string | null
          user_id?: string
          value_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "guest_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["auth_id"]
          }
        ]
      }
      maintenance_settings: {
        Row: {
          id: number
          is_active: boolean
          message: string
          enabled_at: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: number
          is_active?: boolean
          message?: string
          enabled_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: number
          is_active?: boolean
          message?: string
          enabled_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["auth_id"]
          }
        ]
      }
      review_photos: {
        Row: {
          id: number
          review_id: string
          photo_url: string
          caption: string | null
          display_order: number
          created_at: string
        }
        Insert: {
          id?: number
          review_id: string
          photo_url: string
          caption?: string | null
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: number
          review_id?: string
          photo_url?: string
          caption?: string | null
          display_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_photos_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "guest_reviews"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          auth_id: string | null
          created_at: string | null
          email: string
          id: number
          name: string
          phone: string | null
          role: string | null
        }
        Insert: {
          auth_id?: string | null
          created_at?: string | null
          email: string
          id?: number
          name: string
          phone?: string | null
          role?: string | null
        }
        Update: {
          auth_id?: string | null
          created_at?: string | null
          email?: string
          id?: number
          name?: string
          phone?: string | null
          role?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      availability_calendar: {
        Row: {
          date: string | null
          status: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_maintenance_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      update_maintenance_status: {
        Args: {
          new_is_active: boolean
          new_message: string
          user_id?: string
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never
