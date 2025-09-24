import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// 仕入先一覧取得
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name')

    if (error) throw error

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Suppliers fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        error: `仕入先取得エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
      },
      { status: 500 }
    )
  }
}

// 仕入先登録
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // バリデーション
    if (!data.name) {
      return NextResponse.json(
        {
          success: false,
          error: '仕入先名は必須です'
        },
        { status: 400 }
      )
    }

    const { data: insertedData, error } = await supabase
      .from('suppliers')
      .insert([data])
      .select()

    if (error) throw error

    console.log(`Successfully created supplier: ${data.name}`)

    return NextResponse.json({
      success: true,
      data: insertedData[0],
      message: '仕入先を正常に登録しました'
    })

  } catch (error) {
    console.error('Supplier creation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: `仕入先登録エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
      },
      { status: 500 }
    )
  }
}