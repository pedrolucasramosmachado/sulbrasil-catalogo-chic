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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      banners: {
        Row: {
          aspect_ratio: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          link_url: string | null
          media_type: string
          media_url: string
          title: string | null
          updated_at: string
        }
        Insert: {
          aspect_ratio?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          link_url?: string | null
          media_type?: string
          media_url: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          aspect_ratio?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          link_url?: string | null
          media_type?: string
          media_url?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      categorias: {
        Row: {
          created_at: string | null
          icone: string
          id: number
          nome: string
        }
        Insert: {
          created_at?: string | null
          icone: string
          id?: never
          nome: string
        }
        Update: {
          created_at?: string | null
          icone?: string
          id?: never
          nome?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          cover_image_url: string | null
          created_at: string
          display_order: number
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          display_order?: number
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          customer_name: string
          id: string
          is_wholesale: boolean
          items: Json
          shipping_cost: number | null
          shipping_method: string | null
          status: string
          total: number
          total_pieces: number
          updated_at: string
          whatsapp_message: string | null
        }
        Insert: {
          created_at?: string
          customer_name: string
          id?: string
          is_wholesale?: boolean
          items: Json
          shipping_cost?: number | null
          shipping_method?: string | null
          status?: string
          total?: number
          total_pieces?: number
          updated_at?: string
          whatsapp_message?: string | null
        }
        Update: {
          created_at?: string
          customer_name?: string
          id?: string
          is_wholesale?: boolean
          items?: Json
          shipping_cost?: number | null
          shipping_method?: string | null
          status?: string
          total?: number
          total_pieces?: number
          updated_at?: string
          whatsapp_message?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          category_id: string | null
          color_name: string | null
          created_at: string
          description: string | null
          display_emoji: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          is_kit: boolean | null
          is_launch: boolean | null
          is_out_of_stock: boolean | null
          is_promotion: boolean | null
          kit_piece_count: number | null
          model_name: string | null
          name: string
          promotion_retail_price: number | null
          promotion_wholesale_price: number | null
          retail_price: number | null
          sizes: string[] | null
          subcategory: string | null
          updated_at: string
          weight_kg: number | null
          wholesale_price: number | null
        }
        Insert: {
          category: string
          category_id?: string | null
          color_name?: string | null
          created_at?: string
          description?: string | null
          display_emoji?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_kit?: boolean | null
          is_launch?: boolean | null
          is_out_of_stock?: boolean | null
          is_promotion?: boolean | null
          kit_piece_count?: number | null
          model_name?: string | null
          name: string
          promotion_retail_price?: number | null
          promotion_wholesale_price?: number | null
          retail_price?: number | null
          sizes?: string[] | null
          subcategory?: string | null
          updated_at?: string
          weight_kg?: number | null
          wholesale_price?: number | null
        }
        Update: {
          category?: string
          category_id?: string | null
          color_name?: string | null
          created_at?: string
          description?: string | null
          display_emoji?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_kit?: boolean | null
          is_launch?: boolean | null
          is_out_of_stock?: boolean | null
          is_promotion?: boolean | null
          kit_piece_count?: number | null
          model_name?: string | null
          name?: string
          promotion_retail_price?: number | null
          promotion_wholesale_price?: number | null
          retail_price?: number | null
          sizes?: string[] | null
          subcategory?: string | null
          updated_at?: string
          weight_kg?: number | null
          wholesale_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      transacoes: {
        Row: {
          categoria_id: number | null
          created_at: string | null
          data: string | null
          descricao: string
          id: number
          tipo: string
          valor: number
        }
        Insert: {
          categoria_id?: number | null
          created_at?: string | null
          data?: string | null
          descricao: string
          id?: never
          tipo: string
          valor: number
        }
        Update: {
          categoria_id?: number | null
          created_at?: string | null
          data?: string | null
          descricao?: string
          id?: never
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
