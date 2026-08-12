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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          meta: Json | null
          target: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          target?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          target?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      addresses: {
        Row: {
          apartment: string | null
          area: string
          block: string | null
          building: string | null
          contact_phone: string | null
          created_at: string
          customer_id: string
          extra_directions: string | null
          floor: string | null
          id: string
          is_default: boolean
          label: string | null
          lat: number | null
          lng: number | null
          street: string | null
        }
        Insert: {
          apartment?: string | null
          area: string
          block?: string | null
          building?: string | null
          contact_phone?: string | null
          created_at?: string
          customer_id: string
          extra_directions?: string | null
          floor?: string | null
          id?: string
          is_default?: boolean
          label?: string | null
          lat?: number | null
          lng?: number | null
          street?: string | null
        }
        Update: {
          apartment?: string | null
          area?: string
          block?: string | null
          building?: string | null
          contact_phone?: string | null
          created_at?: string
          customer_id?: string
          extra_directions?: string | null
          floor?: string | null
          id?: string
          is_default?: boolean
          label?: string | null
          lat?: number | null
          lng?: number | null
          street?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount_fils: number
          created_at: string
          customer_id: string
          id: string
          note: string | null
          order_id: string | null
          reference: string | null
          type: Database["public"]["Enums"]["credit_txn_type"]
        }
        Insert: {
          amount_fils: number
          created_at?: string
          customer_id: string
          id?: string
          note?: string | null
          order_id?: string | null
          reference?: string | null
          type: Database["public"]["Enums"]["credit_txn_type"]
        }
        Update: {
          amount_fils?: number
          created_at?: string
          customer_id?: string
          id?: string
          note?: string | null
          order_id?: string | null
          reference?: string | null
          type?: Database["public"]["Enums"]["credit_txn_type"]
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          channel: string
          created_at: string
          id: string
          message: string | null
          order_id: string | null
          recipient_id: string | null
          recipient_phone: string | null
          status: string
          template: string
        }
        Insert: {
          channel?: string
          created_at?: string
          id?: string
          message?: string | null
          order_id?: string | null
          recipient_id?: string | null
          recipient_phone?: string | null
          status?: string
          template: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          message?: string | null
          order_id?: string | null
          recipient_id?: string | null
          recipient_phone?: string | null
          status?: string
          template?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_events: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          note: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          garment: string | null
          id: string
          order_id: string
          qty: number
          service: string
          unit_price_fils: number
        }
        Insert: {
          created_at?: string
          garment?: string | null
          id?: string
          order_id: string
          qty?: number
          service?: string
          unit_price_fils?: number
        }
        Update: {
          created_at?: string
          garment?: string | null
          id?: string
          order_id?: string
          qty?: number
          service?: string
          unit_price_fils?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancel_reason: string | null
          charged: boolean
          created_at: string
          customer_id: string
          customer_note: string | null
          delivery_date: string | null
          delivery_driver_id: string | null
          delivery_photo_url: string | null
          dispatch_date: string | null
          dispatch_late: boolean
          fulfillment: string
          id: string
          order_no: string
          pickup_address_id: string | null
          pickup_driver_id: string | null
          piece_count: number | null
          price_fils: number | null
          receipt_sent_at: string | null
          receipt_token: string
          refund_fils: number | null
          staff_note: string | null
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
        }
        Insert: {
          cancel_reason?: string | null
          charged?: boolean
          created_at?: string
          customer_id: string
          customer_note?: string | null
          delivery_date?: string | null
          delivery_driver_id?: string | null
          delivery_photo_url?: string | null
          dispatch_date?: string | null
          dispatch_late?: boolean
          fulfillment?: string
          id?: string
          order_no?: string
          pickup_address_id?: string | null
          pickup_driver_id?: string | null
          piece_count?: number | null
          price_fils?: number | null
          receipt_sent_at?: string | null
          receipt_token?: string
          refund_fils?: number | null
          staff_note?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Update: {
          cancel_reason?: string | null
          charged?: boolean
          created_at?: string
          customer_id?: string
          customer_note?: string | null
          delivery_date?: string | null
          delivery_driver_id?: string | null
          delivery_photo_url?: string | null
          dispatch_date?: string | null
          dispatch_late?: boolean
          fulfillment?: string
          id?: string
          order_no?: string
          pickup_address_id?: string | null
          pickup_driver_id?: string | null
          piece_count?: number | null
          price_fils?: number | null
          receipt_sent_at?: string | null
          receipt_token?: string
          refund_fils?: number | null
          staff_note?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_delivery_driver_id_fkey"
            columns: ["delivery_driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_pickup_address_id_fkey"
            columns: ["pickup_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_pickup_driver_id_fkey"
            columns: ["pickup_driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_codes: {
        Row: {
          code: string
          consumed_at: string | null
          created_at: string
          customer_id: string
          expires_at: string
          id: string
          purpose: string
        }
        Insert: {
          code: string
          consumed_at?: string | null
          created_at?: string
          customer_id: string
          expires_at: string
          id?: string
          purpose?: string
        }
        Update: {
          code?: string
          consumed_at?: string | null
          created_at?: string
          customer_id?: string
          expires_at?: string
          id?: string
          purpose?: string
        }
        Relationships: [
          {
            foreignKeyName: "otp_codes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_fils: number
          created_at: string
          credit_fils: number | null
          customer_id: string
          id: string
          paid_at: string | null
          provider: string
          provider_ref: string | null
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount_fils: number
          created_at?: string
          credit_fils?: number | null
          customer_id: string
          id?: string
          paid_at?: string | null
          provider?: string
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount_fils?: number
          created_at?: string
          credit_fils?: number | null
          customer_id?: string
          id?: string
          paid_at?: string | null
          provider?: string
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          credit_fils: number
          customer_no: number | null
          full_name: string | null
          id: string
          is_active: boolean
          login_password_hash: string | null
          phone: string
          preferences: Json
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          credit_fils?: number
          customer_no?: number | null
          full_name?: string | null
          id: string
          is_active?: boolean
          login_password_hash?: string | null
          phone: string
          preferences?: Json
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          credit_fils?: number
          customer_no?: number | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          login_password_hash?: string | null
          phone?: string
          preferences?: Json
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_dashboard_stats: { Args: never; Returns: Json }
      check_staff_login: {
        Args: { p_password: string; p_phone: string }
        Returns: {
          needs_password: boolean
          password_ok: boolean
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      set_login_password: {
        Args: { p_password: string; p_user: string }
        Returns: undefined
      }
      shop_customer_list: {
        Args: never
        Returns: {
          credit_fils: number
          customer_no: number
          full_name: string
          id: string
          last_order_at: string
          orders_count: number
          pending_fils: number
          phone: string
        }[]
      }
      wallet_adjust: {
        Args: { p_amount: number; p_customer: string; p_note?: string }
        Returns: undefined
      }
      wallet_refund: {
        Args: {
          p_amount: number
          p_customer: string
          p_note?: string
          p_order: string
        }
        Returns: undefined
      }
      wallet_topup: {
        Args: {
          p_amount: number
          p_customer: string
          p_note?: string
          p_reference?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      credit_txn_type: "topup" | "order_charge" | "refund" | "adjustment"
      order_status:
        | "new"
        | "pickup_requested"
        | "picked_up"
        | "counting"
        | "awaiting_payment"
        | "washing"
        | "ready"
        | "delivering"
        | "delivered"
        | "cancelled"
      payment_status: "pending" | "paid" | "failed" | "cancelled"
      user_role: "customer" | "shop" | "driver" | "admin"
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

// Convenience aliases used across the app.
export type OrderStatus = Database["public"]["Enums"]["order_status"]
export type UserRole = Database["public"]["Enums"]["user_role"]

export const Constants = {
  public: {
    Enums: {
      credit_txn_type: ["topup", "order_charge", "refund", "adjustment"],
      order_status: [
        "new",
        "pickup_requested",
        "picked_up",
        "counting",
        "awaiting_payment",
        "washing",
        "ready",
        "delivering",
        "delivered",
        "cancelled",
      ],
      payment_status: ["pending", "paid", "failed", "cancelled"],
      user_role: ["customer", "shop", "driver", "admin"],
    },
  },
} as const
