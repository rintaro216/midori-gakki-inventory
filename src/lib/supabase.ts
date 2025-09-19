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
          photo_url?: string
          notes?: string
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
          photo_url?: string
          notes?: string
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
          photo_url?: string
          notes?: string
        }
      }
    }
  }
}