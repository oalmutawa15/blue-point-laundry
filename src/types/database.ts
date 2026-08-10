export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      orders: {
        Row: {
          charged: boolean
          created_at: string
          customer_id: string
          customer_note: string | null
          cancel_reason: string | null
          delivery_date: string | null
          delivery_driver_id: string | null
          delivery_photo_url: string | null
          refund_fils: number | null
          id: string
          order_no: string
          pickup_address_id: string | null
          pickup_driver_id: string | null
          piece_count: number | null
          price_fils: number | null
          receipt_token: string
          receipt_sent_at: string | null
          staff_note: string | null
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
        }
        Insert: {
          charged?: boolean
          created_at?: string
          customer_id: string
          customer_note?: string | null
          cancel_reason?: string | null
          delivery_date?: string | null
          delivery_driver_id?: string | null
          delivery_photo_url?: string | null
          refund_fils?: number | null
          id?: string
          order_no?: string
          pickup_address_id?: string | null
          pickup_driver_id?: string | null
          piece_count?: number | null
          price_fils?: number | null
          receipt_token?: string
          receipt_sent_at?: string | null
          staff_note?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Update: {
          charged?: boolean
          created_at?: string
          customer_id?: string
          customer_note?: string | null
          cancel_reason?: string | null
          delivery_date?: string | null
          delivery_driver_id?: string | null
          delivery_photo_url?: string | null
          refund_fils?: number | null
          id?: string
          order_no?: string
          pickup_address_id?: string | null
          pickup_driver_id?: string | null
          piece_count?: number | null
          price_fils?: number | null
          receipt_token?: string
          receipt_sent_at?: string | null
          staff_note?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          credit_fils: number
          full_name: string | null
          id: string
          is_active: boolean
          phone: string
          preferences: Json
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          credit_fils?: number
          full_name?: string | null
          id: string
          is_active?: boolean
          phone: string
          preferences?: Json
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          credit_fils?: number
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string
          preferences?: Json
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean }
      is_staff: { Args: Record<string, never>; Returns: boolean }
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
    CompositeTypes: { [_ in never]: never }
  }
}

type PublicSchema = Database["public"]

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"]
export type Enums<T extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][T]

export type OrderStatus = Enums<"order_status">
export type UserRole = Enums<"user_role">
