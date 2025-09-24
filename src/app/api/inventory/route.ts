import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// 在庫一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const manufacturer = searchParams.get('manufacturer')
    const search = searchParams.get('search')

    let query = supabase
      .from('inventory')
      .select('*')
      .order('created_at', { ascending: false })

    // フィルタ適用
    if (category) {
      query = query.eq('category', category)
    }
    if (manufacturer) {
      query = query.eq('manufacturer', manufacturer)
    }
    if (search) {
      query = query.or(`product_name.ilike.%${search}%,manufacturer.ilike.%${search}%,model_number.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      inventory: data || []
    })

  } catch (error) {
    console.error('Inventory fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        error: `在庫取得エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
      },
      { status: 500 }
    )
  }
}