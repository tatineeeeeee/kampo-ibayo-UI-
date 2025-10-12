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
      booking_dates: {
        Row: {
          id: number
          booking_id: number | null
          date: string
          status: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          booking_id?: number | null
          date: string
          status?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          booking_id?: number | null
          date?: string
          status?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_dates_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          }
        ]
      }
      bookings: {
        Row: {
          id: number
          user_id: string
          guest_name: string
          guest_email: string
          guest_phone: string | null
          check_in_date: string
          check_out_date: string
          number_of_guests: number
          total_amount: number
          special_requests: string | null
          brings_pet: boolean | null
          status: string | null
          created_at: string | null
          updated_at: string | null
          cancelled_by: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
          payment_intent_id: string | null
          payment_status: string | null
          refund_id: string | null
          refund_amount: number | null
          refund_status: string | null
          refund_reason: string | null
          refund_processed_by: string | null
          refund_processed_at: string | null
        }
        Insert: {
          id?: number
          user_id: string
          guest_name: string
          guest_email: string
          guest_phone?: string | null
          check_in_date: string
          check_out_date: string
          number_of_guests: number
          total_amount: number
          special_requests?: string | null
          brings_pet?: boolean | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
          cancelled_by?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          payment_intent_id?: string | null
          payment_status?: string | null
          refund_id?: string | null
          refund_amount?: number | null
          refund_status?: string | null
          refund_reason?: string | null
          refund_processed_by?: string | null
          refund_processed_at?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          guest_name?: string
          guest_email?: string
          guest_phone?: string | null
          check_in_date?: string
          check_out_date?: string
          number_of_guests?: number
          total_amount?: number
          special_requests?: string | null
          brings_pet?: boolean | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
          cancelled_by?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          payment_intent_id?: string | null
          payment_status?: string | null
          refund_id?: string | null
          refund_amount?: number | null
          refund_status?: string | null
          refund_reason?: string | null
          refund_processed_by?: string | null
          refund_processed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      guest_reviews: {
        Row: {
          id: string
          user_id: string
          booking_id: number | null
          guest_name: string
          guest_location: string | null
          rating: number
          review_text: string
          approved: boolean | null
          created_at: string
          updated_at: string
          cleanliness_rating: number | null
          service_rating: number | null
          location_rating: number | null
          value_rating: number | null
          amenities_rating: number | null
          stay_dates: string | null
          anonymous: boolean | null
          rejection_reason: string | null
          resubmission_count: number | null
          original_submission_date: string | null
        }
        Insert: {
          id?: string
          user_id: string
          booking_id?: number | null
          guest_name: string
          guest_location?: string | null
          rating: number
          review_text: string
          approved?: boolean | null
          created_at?: string
          updated_at?: string
          cleanliness_rating?: number | null
          service_rating?: number | null
          location_rating?: number | null
          value_rating?: number | null
          amenities_rating?: number | null
          stay_dates?: string | null
          anonymous?: boolean | null
          rejection_reason?: string | null
          resubmission_count?: number | null
          original_submission_date?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          booking_id?: number | null
          guest_name?: string
          guest_location?: string | null
          rating?: number
          review_text?: string
          approved?: boolean | null
          created_at?: string
          updated_at?: string
          cleanliness_rating?: number | null
          service_rating?: number | null
          location_rating?: number | null
          value_rating?: number | null
          amenities_rating?: number | null
          stay_dates?: string | null
          anonymous?: boolean | null
          rejection_reason?: string | null
          resubmission_count?: number | null
          original_submission_date?: string | null
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
            referencedColumns: ["id"]
          }
        ]
      }
      maintenance_settings: {
        Row: {
          id: number
          is_active: boolean
          message: string
          enabled_at: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: number
          is_active?: boolean
          message?: string
          enabled_at?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: number
          is_active?: boolean
          message?: string
          enabled_at?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      review_photos: {
        Row: {
          id: string
          review_id: string
          photo_url: string
          caption: string | null
          created_at: string
          display_order: number | null
        }
        Insert: {
          id?: string
          review_id: string
          photo_url: string
          caption?: string | null
          created_at?: string
          display_order?: number | null
        }
        Update: {
          id?: string
          review_id?: string
          photo_url?: string
          caption?: string | null
          created_at?: string
          display_order?: number | null
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
          id: string
          instance_id: string | null
          auth_id: string | null
          name: string
          aud: string | null
          email: string
          role: string | null
          phone: string | null
          encrypted_password: string | null
          created_at: string | null
          email_confirmed_at: string | null
          invited_at: string | null
          paymongo_id: string | null
          confirmation_token: string | null
          confirmation_sent_at: string | null
          recovery_token: string | null
          recovery_sent_at: string | null
          email_change_token_new: string | null
          email_change: string | null
          email_change_sent_at: string | null
          last_sign_in_at: string | null
          raw_app_meta_data: Json | null
          raw_user_meta_data: Json | null
          is_super_admin: boolean | null
          updated_at: string | null
          phone_confirmed_at: string | null
          phone_change: string | null
          phone_change_token: string | null
          phone_change_sent_at: string | null
          confirmed_at: string | null
          email_change_token_current: string | null
          email_change_confirm_status: number | null
          banned_until: string | null
          reauthentication_token: string | null
          reauthentication_sent_at: string | null
          is_sso_user: boolean
          deleted_at: string | null
          is_anonymous: boolean
        }
        Insert: {
          id?: string
          instance_id?: string | null
          auth_id?: string | null
          name: string
          aud?: string | null
          email: string
          role?: string | null
          phone?: string | null
          encrypted_password?: string | null
          created_at?: string | null
          email_confirmed_at?: string | null
          invited_at?: string | null
          paymongo_id?: string | null
          confirmation_token?: string | null
          confirmation_sent_at?: string | null
          recovery_token?: string | null
          recovery_sent_at?: string | null
          email_change_token_new?: string | null
          email_change?: string | null
          email_change_sent_at?: string | null
          last_sign_in_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          is_super_admin?: boolean | null
          updated_at?: string | null
          phone_confirmed_at?: string | null
          phone_change?: string | null
          phone_change_token?: string | null
          phone_change_sent_at?: string | null
          confirmed_at?: string | null
          email_change_token_current?: string | null
          email_change_confirm_status?: number | null
          banned_until?: string | null
          reauthentication_token?: string | null
          reauthentication_sent_at?: string | null
          is_sso_user?: boolean
          deleted_at?: string | null
          is_anonymous?: boolean
        }
        Update: {
          id?: string
          instance_id?: string | null
          auth_id?: string | null
          name?: string
          aud?: string | null
          email?: string
          role?: string | null
          phone?: string | null
          encrypted_password?: string | null
          created_at?: string | null
          email_confirmed_at?: string | null
          invited_at?: string | null
          paymongo_id?: string | null
          confirmation_token?: string | null
          confirmation_sent_at?: string | null
          recovery_token?: string | null
          recovery_sent_at?: string | null
          email_change_token_new?: string | null
          email_change?: string | null
          email_change_sent_at?: string | null
          last_sign_in_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          is_super_admin?: boolean | null
          updated_at?: string | null
          phone_confirmed_at?: string | null
          phone_change?: string | null
          phone_change_token?: string | null
          phone_change_sent_at?: string | null
          confirmed_at?: string | null
          email_change_token_current?: string | null
          email_change_confirm_status?: number | null
          banned_until?: string | null
          reauthentication_token?: string | null
          reauthentication_sent_at?: string | null
          is_sso_user?: boolean
          deleted_at?: string | null
          is_anonymous?: boolean
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
