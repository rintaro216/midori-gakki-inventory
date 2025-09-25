import { NextRequest, NextResponse } from 'next/server'

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
    const formData = await request.formData()
    const file = formData.get('pdf') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'PDFファイルが見つかりません' },
        { status: 400 }
      )
    }

    console.log('Processing PDF with Mock data (502 error workaround)...')

    const fileName = file.name
    console.log('PDF file name:', fileName)

    // ファイル名から楽器関連のキーワードを抽出
    const instrumentKeywords = ['guitar', 'bass', 'drum', 'piano', 'violin', 'sax', 'trumpet', 'ギター', 'ベース', 'ドラム']
    const foundKeyword = instrumentKeywords.find(keyword =>
      fileName.toLowerCase().includes(keyword.toLowerCase())
    )

    // サンプルデータ生成
    const products = [
      {
        category: foundKeyword?.includes('ギター') || foundKeyword?.includes('guitar') ? 'ギター' :
                 foundKeyword?.includes('ベース') || foundKeyword?.includes('bass') ? 'ベース' :
                 foundKeyword?.includes('ドラム') || foundKeyword?.includes('drum') ? 'ドラム' : 'ギター',
        product_name: foundKeyword?.includes('ギター') || foundKeyword?.includes('guitar') ? 'エレクトリックギター' :
                     foundKeyword?.includes('ベース') || foundKeyword?.includes('bass') ? 'エレクトリックベース' :
                     foundKeyword?.includes('ドラム') || foundKeyword?.includes('drum') ? 'ドラムセット' : 'アコースティックギター',
        manufacturer: 'Yamaha',
        model_number: foundKeyword?.includes('ギター') || foundKeyword?.includes('guitar') ? 'PAC612VIIFM' :
                     foundKeyword?.includes('ベース') || foundKeyword?.includes('bass') ? 'TRBX304' :
                     foundKeyword?.includes('ドラム') || foundKeyword?.includes('drum') ? 'RDP2F5' : 'FG830',
        color: 'ナチュラル',
        condition: '中古',
        price: foundKeyword?.includes('ギター') || foundKeyword?.includes('guitar') ? '89800' :
               foundKeyword?.includes('ベース') || foundKeyword?.includes('bass') ? '65000' :
               foundKeyword?.includes('ドラム') || foundKeyword?.includes('drum') ? '198000' : '45000',
        supplier: 'PDFサンプル仕入先',
        list_price: '120000',
        wholesale_price: '60000',
        notes: `${fileName}から抽出されたMockサンプルデータ（502エラー回避）`
      },
      {
        category: 'アンプ',
        product_name: 'ギターアンプ',
        manufacturer: 'Roland',
        model_number: 'JC-40',
        color: 'ブラック',
        condition: '新品',
        price: '68000',
        supplier: 'PDFサンプル仕入先',
        list_price: '85000',
        wholesale_price: '55000',
        notes: `${fileName}から抽出されたMockサンプルデータ（502エラー回避）`
      },
      {
        category: 'エフェクター',
        product_name: 'オーバードライブペダル',
        manufacturer: 'BOSS',
        model_number: 'OD-3',
        color: 'イエロー',
        condition: '展示品',
        price: '12800',
        supplier: 'PDFサンプル仕入先',
        list_price: '16000',
        wholesale_price: '9500',
        notes: `${fileName}から抽出されたMockサンプルデータ（502エラー回避）`
      }
    ]

    const text = `Mock PDF processed successfully, generated ${products.length} sample products`
    console.log('Mock PDF processing completed:', text)

    // 重複除去と検証
    const validProducts = products.filter((product: any) =>
      product.product_name &&
      product.product_name !== '' &&
      product.price &&
      !isNaN(parseInt(product.price.toString()))
    )

    if (validProducts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'PDF内から有効な商品情報を抽出できませんでした。'
        },
        { status: 400 }
      )
    }

    console.log(`Successfully extracted ${validProducts.length} products using Mock processing`)

    return NextResponse.json({
      success: true,
      products: validProducts,
      method: 'Mock処理 (502エラー回避)',
      extractedText: `Mock処理によるサンプルデータ生成完了。ファイル名: ${fileName}`
    })

  } catch (error) {
    console.error('Mock PDF extraction error:', error)
    return NextResponse.json(
      {
        success: false,
        error: `Mock PDF処理エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
      },
      { status: 500 }
    )
  }
}