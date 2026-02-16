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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      dish_ingredients: {
        Row: {
          dish_id: string
          id: string
          ingredient_id: string
          quantity: number
          unit: string
        }
        Insert: {
          dish_id: string
          id?: string
          ingredient_id: string
          quantity?: number
          unit?: string
        }
        Update: {
          dish_id?: string
          id?: string
          ingredient_id?: string
          quantity?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "dish_ingredients_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dish_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      dishes: {
        Row: {
          allergens: number[]
          category: Database["public"]["Enums"]["dish_category"]
          cost: number
          created_at: string
          final_price: number | null
          grammage: string | null
          id: string
          is_daily_menu: boolean
          is_permanent_offer: boolean
          name: string
          recommended_price: number
          restaurant_id: string
          subtype: string | null
          updated_at: string
          vat_rate: number
        }
        Insert: {
          allergens?: number[]
          category?: Database["public"]["Enums"]["dish_category"]
          cost?: number
          created_at?: string
          final_price?: number | null
          grammage?: string | null
          id?: string
          is_daily_menu?: boolean
          is_permanent_offer?: boolean
          name: string
          recommended_price?: number
          restaurant_id: string
          subtype?: string | null
          updated_at?: string
          vat_rate?: number
        }
        Update: {
          allergens?: number[]
          category?: Database["public"]["Enums"]["dish_category"]
          cost?: number
          created_at?: string
          final_price?: number | null
          grammage?: string | null
          id?: string
          is_daily_menu?: boolean
          is_permanent_offer?: boolean
          name?: string
          recommended_price?: number
          restaurant_id?: string
          subtype?: string | null
          updated_at?: string
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "dishes_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          base_price: number
          created_at: string
          id: string
          name: string
          restaurant_id: string
          unit: string
          updated_at: string
        }
        Insert: {
          base_price?: number
          created_at?: string
          id?: string
          name: string
          restaurant_id: string
          unit?: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          created_at?: string
          id?: string
          name?: string
          restaurant_id?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredients_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_exports: {
        Row: {
          created_at: string
          exported_by: string | null
          file_url: string | null
          format: Database["public"]["Enums"]["export_format"]
          id: string
          menu_id: string
          template_name: string | null
        }
        Insert: {
          created_at?: string
          exported_by?: string | null
          file_url?: string | null
          format: Database["public"]["Enums"]["export_format"]
          id?: string
          menu_id: string
          template_name?: string | null
        }
        Update: {
          created_at?: string
          exported_by?: string | null
          file_url?: string | null
          format?: Database["public"]["Enums"]["export_format"]
          id?: string
          menu_id?: string
          template_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_exports_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          created_at: string
          dish_id: string
          id: string
          menu_id: string
          override_price: number | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          dish_id: string
          id?: string
          menu_id: string
          override_price?: number | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          dish_id?: string
          id?: string
          menu_id?: string
          override_price?: number | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
        ]
      }
      menus: {
        Row: {
          created_at: string
          id: string
          menu_date: string
          restaurant_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          menu_date: string
          restaurant_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          menu_date?: string
          restaurant_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menus_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      permanent_menu_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          restaurant_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          restaurant_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          restaurant_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "permanent_menu_categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      permanent_menu_items: {
        Row: {
          category_id: string
          created_at: string
          dish_id: string
          id: string
          sort_order: number
        }
        Insert: {
          category_id: string
          created_at?: string
          dish_id: string
          id?: string
          sort_order?: number
        }
        Update: {
          category_id?: string
          created_at?: string
          dish_id?: string
          id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "permanent_menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "permanent_menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permanent_menu_items_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recipes: {
        Row: {
          ai_confidence: number | null
          cook_time_minutes: number | null
          created_at: string
          dish_id: string
          id: string
          instructions: string | null
          is_locked: boolean
          prep_time_minutes: number | null
          servings: number | null
          source_metadata: string | null
          updated_at: string
        }
        Insert: {
          ai_confidence?: number | null
          cook_time_minutes?: number | null
          created_at?: string
          dish_id: string
          id?: string
          instructions?: string | null
          is_locked?: boolean
          prep_time_minutes?: number | null
          servings?: number | null
          source_metadata?: string | null
          updated_at?: string
        }
        Update: {
          ai_confidence?: number | null
          cook_time_minutes?: number | null
          created_at?: string
          dish_id?: string
          id?: string
          instructions?: string | null
          is_locked?: boolean
          prep_time_minutes?: number | null
          servings?: number | null
          source_metadata?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: true
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_members: {
        Row: {
          created_at: string
          id: string
          restaurant_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          restaurant_id: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          restaurant_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_members_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          settings: Json
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          settings?: Json
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          settings?: Json
          updated_at?: string
        }
        Relationships: []
      }
      supplier_prices: {
        Row: {
          confidence: string | null
          created_at: string
          id: string
          ingredient_id: string
          is_promo: boolean
          price: number
          supplier_name: string
          updated_at: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          confidence?: string | null
          created_at?: string
          id?: string
          ingredient_id: string
          is_promo?: boolean
          price: number
          supplier_name: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          confidence?: string | null
          created_at?: string
          id?: string
          ingredient_id?: string
          is_promo?: boolean
          price?: number
          supplier_name?: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_prices_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_restaurant_with_owner: {
        Args: { _address?: string; _name: string }
        Returns: string
      }
      get_user_restaurant_ids: { Args: { _user_id: string }; Returns: string[] }
      is_restaurant_member: {
        Args: { _restaurant_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "manager" | "staff"
      dish_category:
        | "polievka"
        | "hlavne_jedlo"
        | "dezert"
        | "predjedlo"
        | "salat"
        | "pizza"
        | "burger"
        | "pasta"
        | "napoj"
        | "ine"
      export_format: "tv" | "pdf" | "excel" | "webflow"
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
      app_role: ["owner", "manager", "staff"],
      dish_category: [
        "polievka",
        "hlavne_jedlo",
        "dezert",
        "predjedlo",
        "salat",
        "pizza",
        "burger",
        "pasta",
        "napoj",
        "ine",
      ],
      export_format: ["tv", "pdf", "excel", "webflow"],
    },
  },
} as const
