import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      inventory: {
        Row: {
          id: string
          created_at: string
          category: string
          product_name: string
          manufacturer: string
          model_number: string
          color: string
          condition: string
          price: number
          supplier?: string
          list_price?: number
          wholesale_price?: number
          wholesale_rate?: number
          gross_margin?: number
          photo_url?: string
          notes?: string
          // 新しい仕入れ管理フィールド
          purchase_date?: string
          purchase_price?: number
          profit_margin?: number
          profit_amount?: number
          days_in_stock?: number
        }
        Insert: {
          id?: string
          created_at?: string
          category: string
          product_name: string
          manufacturer: string
          model_number: string
          color: string
          condition: string
          price: number
          supplier?: string
          list_price?: number
          wholesale_price?: number
          wholesale_rate?: number
          gross_margin?: number
          photo_url?: string
          notes?: string
          // 新しい仕入れ管理フィールド
          purchase_date?: string
          purchase_price?: number
          profit_margin?: number
          profit_amount?: number
          days_in_stock?: number
        }
        Update: {
          id?: string
          created_at?: string
          category?: string
          product_name?: string
          manufacturer?: string
          model_number?: string
          color?: string
          condition?: string
          price?: number
          supplier?: string
          list_price?: number
          wholesale_price?: number
          wholesale_rate?: number
          gross_margin?: number
          photo_url?: string
          notes?: string
          // 新しい仕入れ管理フィールド
          purchase_date?: string
          purchase_price?: number
          profit_margin?: number
          profit_amount?: number
          days_in_stock?: number
        }
      }
    }
  }
}