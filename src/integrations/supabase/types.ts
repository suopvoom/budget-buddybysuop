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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          diff: Json | null
          entity: string
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          discount_amount: number | null
          discount_pct: number | null
          expires_at: string | null
          id: string
          marketplace_id: string | null
          min_order: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          discount_amount?: number | null
          discount_pct?: number | null
          expires_at?: string | null
          id?: string
          marketplace_id?: string | null
          min_order?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          discount_amount?: number | null
          discount_pct?: number | null
          expires_at?: string | null
          id?: string
          marketplace_id?: string | null
          min_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupons_marketplace_id_fkey"
            columns: ["marketplace_id"]
            isOneToOne: false
            referencedRelation: "marketplaces"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_integrations: {
        Row: {
          adapter_key: string
          created_at: string
          data_source_type: string
          display_name: string
          docs_url: string | null
          enabled: boolean
          id: string
          last_error: string | null
          last_error_at: string | null
          last_success_at: string | null
          marketplace_id: string | null
          notes: string | null
          required_secrets: string[]
          sync_interval_minutes: number
          updated_at: string
        }
        Insert: {
          adapter_key: string
          created_at?: string
          data_source_type?: string
          display_name: string
          docs_url?: string | null
          enabled?: boolean
          id?: string
          last_error?: string | null
          last_error_at?: string | null
          last_success_at?: string | null
          marketplace_id?: string | null
          notes?: string | null
          required_secrets?: string[]
          sync_interval_minutes?: number
          updated_at?: string
        }
        Update: {
          adapter_key?: string
          created_at?: string
          data_source_type?: string
          display_name?: string
          docs_url?: string | null
          enabled?: boolean
          id?: string
          last_error?: string | null
          last_error_at?: string | null
          last_success_at?: string | null
          marketplace_id?: string | null
          notes?: string | null
          required_secrets?: string[]
          sync_interval_minutes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_integrations_marketplace_id_fkey"
            columns: ["marketplace_id"]
            isOneToOne: false
            referencedRelation: "marketplaces"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplaces: {
        Row: {
          base_url: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          slug: string
        }
        Insert: {
          base_url?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
        }
        Update: {
          base_url?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      price_alerts: {
        Row: {
          active: boolean
          alert_type: Database["public"]["Enums"]["alert_type"]
          created_at: string
          id: string
          product_ref: string
          target_price: number | null
          triggered_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          alert_type?: Database["public"]["Enums"]["alert_type"]
          created_at?: string
          id?: string
          product_ref: string
          target_price?: number | null
          triggered_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          alert_type?: Database["public"]["Enums"]["alert_type"]
          created_at?: string
          id?: string
          product_ref?: string
          target_price?: number | null
          triggered_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      price_history: {
        Row: {
          availability: string
          discount_percentage: number | null
          id: number
          marketplace_id: string | null
          mrp: number | null
          price: number
          product_id: string
          product_marketplace_id: string | null
          recorded_at: string
          source: string
        }
        Insert: {
          availability?: string
          discount_percentage?: number | null
          id?: number
          marketplace_id?: string | null
          mrp?: number | null
          price: number
          product_id: string
          product_marketplace_id?: string | null
          recorded_at?: string
          source?: string
        }
        Update: {
          availability?: string
          discount_percentage?: number | null
          id?: number
          marketplace_id?: string | null
          mrp?: number | null
          price?: number
          product_id?: string
          product_marketplace_id?: string | null
          recorded_at?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_history_marketplace_id_fkey"
            columns: ["marketplace_id"]
            isOneToOne: false
            referencedRelation: "marketplaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_history_product_marketplace_id_fkey"
            columns: ["product_marketplace_id"]
            isOneToOne: false
            referencedRelation: "product_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_history_product_marketplace_id_fkey"
            columns: ["product_marketplace_id"]
            isOneToOne: false
            referencedRelation: "product_marketplaces"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          is_primary: boolean
          position: number
          product_id: string
          url: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          position?: number
          product_id: string
          url: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          position?: number
          product_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_listings: {
        Row: {
          availability: string
          cashback: string | null
          coupon_code: string | null
          created_at: string
          currency: string
          data_source: string
          delivery: string | null
          discount_pct: number | null
          external_product_id: string | null
          id: string
          in_stock: boolean
          is_active: boolean
          last_checked: string
          last_error: string | null
          last_error_at: string | null
          last_synced_at: string | null
          marketplace_id: string
          mrp: number | null
          normalized_url: string | null
          price: number
          product_id: string
          seller: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          availability?: string
          cashback?: string | null
          coupon_code?: string | null
          created_at?: string
          currency?: string
          data_source?: string
          delivery?: string | null
          discount_pct?: number | null
          external_product_id?: string | null
          id?: string
          in_stock?: boolean
          is_active?: boolean
          last_checked?: string
          last_error?: string | null
          last_error_at?: string | null
          last_synced_at?: string | null
          marketplace_id: string
          mrp?: number | null
          normalized_url?: string | null
          price: number
          product_id: string
          seller?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          availability?: string
          cashback?: string | null
          coupon_code?: string | null
          created_at?: string
          currency?: string
          data_source?: string
          delivery?: string | null
          discount_pct?: number | null
          external_product_id?: string | null
          id?: string
          in_stock?: boolean
          is_active?: boolean
          last_checked?: string
          last_error?: string | null
          last_error_at?: string | null
          last_synced_at?: string | null
          marketplace_id?: string
          mrp?: number | null
          normalized_url?: string | null
          price?: number
          product_id?: string
          seller?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_listings_marketplace_id_fkey"
            columns: ["marketplace_id"]
            isOneToOne: false
            referencedRelation: "marketplaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_listings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tags: {
        Row: {
          created_at: string
          id: string
          product_id: string
          tag: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          tag: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_tags_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          barcode: string | null
          created_at: string
          id: string
          image_url: string | null
          name: string
          product_id: string
          shade: string | null
          size: string | null
          sku: string | null
          updated_at: string
          value: string | null
        }
        Insert: {
          barcode?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          product_id: string
          shade?: string | null
          size?: string | null
          sku?: string | null
          updated_at?: string
          value?: string | null
        }
        Update: {
          barcode?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          product_id?: string
          shade?: string | null
          size?: string | null
          sku?: string | null
          updated_at?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_views: {
        Row: {
          id: string
          product_id: string
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_views_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          archived_at: string | null
          attributes: Json | null
          availability: string
          avg_price: number | null
          barcode: string | null
          benefits: string | null
          best_seller: boolean
          brand_id: string | null
          category_id: string | null
          created_at: string
          current_price: number
          description: string | null
          featured: boolean
          gender: string | null
          highest_price: number | null
          how_to_use: string | null
          id: string
          image_gallery: string[]
          image_url: string | null
          ingredients: string | null
          lowest_price: number | null
          mrp: number
          name: string
          new_arrival: boolean
          product_type: string | null
          product_url: string | null
          rating: number | null
          reviews_count: number | null
          size: string | null
          sku: string | null
          slug: string | null
          stock_status: string
          sub_category_id: string | null
          tags: string[]
          thumbnail_url: string | null
          trending: boolean
          updated_at: string
          variants: Json
          weight: string | null
        }
        Insert: {
          archived_at?: string | null
          attributes?: Json | null
          availability?: string
          avg_price?: number | null
          barcode?: string | null
          benefits?: string | null
          best_seller?: boolean
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          current_price?: number
          description?: string | null
          featured?: boolean
          gender?: string | null
          highest_price?: number | null
          how_to_use?: string | null
          id?: string
          image_gallery?: string[]
          image_url?: string | null
          ingredients?: string | null
          lowest_price?: number | null
          mrp?: number
          name: string
          new_arrival?: boolean
          product_type?: string | null
          product_url?: string | null
          rating?: number | null
          reviews_count?: number | null
          size?: string | null
          sku?: string | null
          slug?: string | null
          stock_status?: string
          sub_category_id?: string | null
          tags?: string[]
          thumbnail_url?: string | null
          trending?: boolean
          updated_at?: string
          variants?: Json
          weight?: string | null
        }
        Update: {
          archived_at?: string | null
          attributes?: Json | null
          availability?: string
          avg_price?: number | null
          barcode?: string | null
          benefits?: string | null
          best_seller?: boolean
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          current_price?: number
          description?: string | null
          featured?: boolean
          gender?: string | null
          highest_price?: number | null
          how_to_use?: string | null
          id?: string
          image_gallery?: string[]
          image_url?: string | null
          ingredients?: string | null
          lowest_price?: number | null
          mrp?: number
          name?: string
          new_arrival?: boolean
          product_type?: string | null
          product_url?: string | null
          rating?: number | null
          reviews_count?: number | null
          size?: string | null
          sku?: string | null
          slug?: string | null
          stock_status?: string
          sub_category_id?: string | null
          tags?: string[]
          thumbnail_url?: string | null
          trending?: boolean
          updated_at?: string
          variants?: Json
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_subcategory_fk"
            columns: ["sub_category_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      subcategories: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_runs: {
        Row: {
          adapter_key: string
          error_message: string | null
          finished_at: string | null
          id: string
          items_failed: number
          items_processed: number
          items_updated: number
          marketplace_id: string | null
          started_at: string
          status: string
          trigger_source: string
        }
        Insert: {
          adapter_key: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          items_failed?: number
          items_processed?: number
          items_updated?: number
          marketplace_id?: string | null
          started_at?: string
          status?: string
          trigger_source?: string
        }
        Update: {
          adapter_key?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          items_failed?: number
          items_processed?: number
          items_updated?: number
          marketplace_id?: string | null
          started_at?: string
          status?: string
          trigger_source?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_runs_marketplace_id_fkey"
            columns: ["marketplace_id"]
            isOneToOne: false
            referencedRelation: "marketplaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          created_at: string
          id: string
          product_ref: string
          target_price: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_ref: string
          target_price?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_ref?: string
          target_price?: number | null
          user_id?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      product_marketplaces: {
        Row: {
          availability: string | null
          cashback: string | null
          coupon_code: string | null
          created_at: string | null
          currency: string | null
          data_source: string | null
          delivery: string | null
          discount_pct: number | null
          external_product_id: string | null
          id: string | null
          in_stock: boolean | null
          is_active: boolean | null
          last_checked: string | null
          last_error: string | null
          last_error_at: string | null
          last_synced_at: string | null
          marketplace_id: string | null
          mrp: number | null
          normalized_url: string | null
          price: number | null
          product_id: string | null
          seller: string | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          availability?: string | null
          cashback?: string | null
          coupon_code?: string | null
          created_at?: string | null
          currency?: string | null
          data_source?: string | null
          delivery?: string | null
          discount_pct?: number | null
          external_product_id?: string | null
          id?: string | null
          in_stock?: boolean | null
          is_active?: boolean | null
          last_checked?: string | null
          last_error?: string | null
          last_error_at?: string | null
          last_synced_at?: string | null
          marketplace_id?: string | null
          mrp?: number | null
          normalized_url?: string | null
          price?: number | null
          product_id?: string | null
          seller?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          availability?: string | null
          cashback?: string | null
          coupon_code?: string | null
          created_at?: string | null
          currency?: string | null
          data_source?: string | null
          delivery?: string | null
          discount_pct?: number | null
          external_product_id?: string | null
          id?: string | null
          in_stock?: boolean | null
          is_active?: boolean | null
          last_checked?: string | null
          last_error?: string | null
          last_error_at?: string | null
          last_synced_at?: string | null
          marketplace_id?: string | null
          mrp?: number | null
          normalized_url?: string | null
          price?: number | null
          product_id?: string | null
          seller?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_listings_marketplace_id_fkey"
            columns: ["marketplace_id"]
            isOneToOne: false
            referencedRelation: "marketplaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_listings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      alert_type: "price_drop" | "target_price" | "restock"
      app_role: "admin" | "user" | "editor" | "moderator" | "viewer"
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
      alert_type: ["price_drop", "target_price", "restock"],
      app_role: ["admin", "user", "editor", "moderator", "viewer"],
    },
  },
} as const
