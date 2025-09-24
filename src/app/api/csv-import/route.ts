import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface Product {
  category: string
  product_name: string
  manufacturer: string
  model_number: string
  color: string
  condition: string
  price: string
  supplier?: string
  list_price?: string
  wholesale_price?: string
  wholesale_rate?: string
  gross_margin?: string
  notes?: string
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let products: Product[]

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData (CSV file upload)
      const formData = await request.formData()
      const file = formData.get('csv') as File

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'CSVファイルが見つかりません' },
          { status: 400 }
        )
      }

      // Parse CSV file
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim().length > 0)

      if (lines.length < 2) {
        return NextResponse.json(
          { success: false, error: 'CSVファイルにデータが含まれていません' },
          { status: 400 }
        )
      }

      // Skip header line and parse products
      products = lines.slice(1).map(line => {
        const columns = line.split(',').map(col => col.trim().replace(/"/g, ''))
        return {
          category: columns[0] || 'その他',
          product_name: columns[1] || '商品名未設定',
          manufacturer: columns[2] || '不明',
          model_number: columns[3] || '',
          color: columns[4] || '不明',
          condition: columns[5] || '中古',
          price: columns[6] || '0',
          supplier: columns[7] || '',
          list_price: columns[8] || '',
          wholesale_price: columns[9] || '',
          wholesale_rate: columns[10] || '',
          gross_margin: columns[11] || '',
          notes: columns[12] || ''
        }
      }).filter(product => product.product_name !== '商品名未設定')
    } else {
      // Handle JSON data (direct product registration)
      const body = await request.json()
      products = body.products || body

      // If it's a single product object, wrap it in an array
      if (!Array.isArray(products)) {
        products = [products]
      }
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { success: false, error: '有効な商品データが見つかりません' },
        { status: 400 }
      )
    }

    console.log(`Processing ${products.length} products for bulk import...`)

    // 商品データをSupabaseに一括登録
    const insertData = products.map((product: Product) => ({
      category: product.category || 'その他',
      product_name: product.product_name || '商品名未設定',
      manufacturer: product.manufacturer || '不明',
      model_number: product.model_number || '',
      color: product.color || '不明',
      condition: product.condition || '中古',
      price: parseInt(product.price) || 0,
      supplier: product.supplier || '',
      list_price: product.list_price ? parseInt(product.list_price) : null,
      wholesale_price: product.wholesale_price ? parseInt(product.wholesale_price) : null,
      wholesale_rate: product.wholesale_rate ? parseFloat(product.wholesale_rate) : null,
      gross_margin: product.gross_margin ? parseFloat(product.gross_margin) : null,
      notes: product.notes || ''
    }))

    // Supabaseに一括挿入
    const { data, error } = await supabase
      .from('inventory')
      .insert(insertData)
      .select()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json(
        {
          success: false,
          error: `データベース登録エラー: ${error.message}`,
          details: error
        },
        { status: 500 }
      )
    }

    console.log(`Successfully imported ${data.length} products`)

    return NextResponse.json({
      success: true,
      imported: data.length,
      products: data,
      message: `${data.length}件の商品を正常に登録しました`
    })

  } catch (error) {
    console.error('CSV import error:', error)
    return NextResponse.json(
      {
        success: false,
        error: `CSV一括登録エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
      },
      { status: 500 }
    )
  }
}