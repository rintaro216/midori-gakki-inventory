import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('Multiple OCR endpoint called - Mock processing for multiple images')

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

    console.log(`Processing ${images.length} images with multiple OCR mock processing`)

    // 複数画像のサンプルデータ生成
    const extractedProducts = []

    for (let idx = 0; idx < images.length; idx++) {
      const image = images[idx]
      const fileName = image.name || `image_${idx + 1}.jpg`

      console.log(`Processing image: ${fileName}`)

      // 画像ごとに異なる楽器データを生成
      const mockProducts = [
        {
          category: idx % 3 === 0 ? 'ギター' : idx % 3 === 1 ? 'ベース' : 'ドラム',
          product_name: idx % 3 === 0 ? 'アコースティックギター' : idx % 3 === 1 ? 'エレクトリックベース' : 'ドラムキット',
          manufacturer: idx % 3 === 0 ? 'Yamaha' : idx % 3 === 1 ? 'Fender' : 'Pearl',
          model_number: idx % 3 === 0 ? 'FG830' : idx % 3 === 1 ? 'Player Jazz Bass' : 'Export Series',
          color: idx % 2 === 0 ? 'ナチュラル' : 'ブラック',
          condition: idx % 2 === 0 ? '中古' : '新品',
          price: (30000 + (idx * 5000)).toString(),
          supplier: 'Mock処理',
          notes: `${fileName}からMock OCR処理にて抽出`
        }
      ]

      extractedProducts.push(...mockProducts)
    }

    console.log(`Successfully processed ${images.length} images, extracted ${extractedProducts.length} products`)

    return NextResponse.json({
      success: true,
      products: extractedProducts,
      method: 'Multiple Mock OCR',
      extractedText: `${images.length}枚の画像をMock処理で解析しました。実際のOCR処理との差異がある場合は手動で修正してください。`,
      processingInfo: {
        totalImages: images.length,
        extractedProducts: extractedProducts.length,
        processingTime: '模擬処理のため即時完了'
      }
    })

  } catch (error) {
    console.error('Multiple OCR processing error:', error)
    return NextResponse.json(
      {
        success: false,
        error: `Multiple OCR処理エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
      },
      { status: 500 }
    )
  }
}