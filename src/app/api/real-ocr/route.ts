import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('Real OCR endpoint called - using enhanced mock processing for handwritten documents')

    const formData = await request.formData()
    const images = []
    let i = 0

    // 画像ファイルを収集
    while (true) {
      const image = formData.get(`image_${i}`) as File
      if (!image) break
      images.push(image)
      i++
    }

    if (images.length === 0) {
      return NextResponse.json(
        { success: false, error: '画像ファイルが見つかりません' },
        { status: 400 }
      )
    }

    console.log(`Processing ${images.length} handwritten images with enhanced mock OCR`)

    // 手書き文書用の改良されたサンプルデータ生成
    const extractedProducts = []

    for (let idx = 0; idx < images.length; idx++) {
      const image = images[idx]
      const fileName = image.name || `handwritten_${idx + 1}.jpg`

      console.log(`Processing handwritten image: ${fileName}`)

      // 手書き文書特有のパターンを考慮したサンプルデータ
      const handwrittenProducts = [
        {
          category: 'ギター',
          product_name: 'エレクトリックギター（手書きメモより）',
          manufacturer: 'Fender',
          model_number: 'Stratocaster',
          color: 'サンバースト',
          condition: '中古',
          price: '78000',
          supplier: '手書き請求書',
          notes: `${fileName}から手書き文字認識（模擬処理）`
        },
        {
          category: 'アンプ',
          product_name: 'ギターアンプ（手書きメモより）',
          manufacturer: 'Marshall',
          model_number: 'DSL40C',
          color: 'ブラック',
          condition: '展示品',
          price: '52000',
          supplier: '手書き請求書',
          notes: `${fileName}から手書き文字認識（模擬処理）`
        }
      ]

      extractedProducts.push(...handwrittenProducts)
    }

    console.log(`Successfully processed ${images.length} handwritten images, extracted ${extractedProducts.length} products`)

    // 手書き文書用の特別な応答
    return NextResponse.json({
      success: true,
      products: extractedProducts,
      method: 'Enhanced Mock OCR (手書き文書対応)',
      extractedText: `手書き文書${images.length}枚を処理しました。文字認識の精度向上のため、画像の明度・コントラストの調整をお勧めします。`,
      handwrittenSupport: true,
      recommendations: [
        '📝 手書き文字の認識精度を上げるコツ:',
        '• 明るい照明で撮影する',
        '• 文字を大きくはっきりと書く',
        '• 背景と文字のコントラストを高める',
        '• 画像の傾きを補正する',
        '• Mock処理で継続作業が可能です'
      ]
    })

  } catch (error) {
    console.error('Real OCR processing error:', error)
    return NextResponse.json(
      {
        success: false,
        error: `手書きOCR処理エラー: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestion: 'Mock処理に切り替えて作業を継続してください'
      },
      { status: 500 }
    )
  }
}