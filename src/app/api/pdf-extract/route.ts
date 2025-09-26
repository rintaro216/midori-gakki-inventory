import { NextRequest, NextResponse } from 'next/server'
import pdfParse from 'pdf-parse'

interface ProductInfo {
  name: string
  brand: string
  model: string
  price: string
  category: string
  condition: string
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

    console.log('Processing PDF with pdf-parse...')
    const buffer = await file.arrayBuffer()

    let extractedText = ''

    try {
      // pdf-parseを使用してテキストを抽出
      const data = await pdfParse(Buffer.from(buffer))
      extractedText = data.text
      console.log(`PDF has ${data.numpages} pages`)
      console.log(`Extracted text length: ${extractedText.length}`)

    } catch (pdfError) {
      console.error('pdf-parse extraction failed:', pdfError)
      return NextResponse.json({
        success: false,
        error: `PDFの読み込みに失敗しました: ${pdfError instanceof Error ? pdfError.message : 'Unknown PDF error'}`
      }, { status: 400 })
    }

    if (!extractedText || extractedText.length < 10) {
      return NextResponse.json({
        success: false,
        error: 'PDFから十分なテキストを抽出できませんでした。画像ベースのPDFの可能性があります。',
        note: 'OCR機能をお試しください。'
      }, { status: 400 })
    }

    // 基本的なパターンマッチングで商品情報を抽出
    const productInfo = extractProductInfo(extractedText)

    return NextResponse.json({
      success: true,
      productInfo,
      extractedText: extractedText.substring(0, 500) + '...' // デバッグ用
    })

  } catch (error) {
    console.error('PDF processing error:', error)
    return NextResponse.json(
      {
        success: false,
        error: `PDF処理エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
      },
      { status: 500 }
    )
  }
}

function extractProductInfo(text: string): ProductInfo {
  // 基本的なパターンマッチング
  const priceMatch = text.match(/[¥￥]?[\d,]+(?:円)?|[\d,]+[¥￥]/)
  const price = priceMatch ? priceMatch[0].replace(/[¥￥円,]/g, '') : ''

  // 楽器ブランドの検出
  const brands = ['YAMAHA', 'Fender', 'Gibson', 'Martin', 'Taylor', 'Ibanez', 'ESP', 'Roland', 'KORG', 'Pearl', 'Tama']
  const brandMatch = brands.find(brand =>
    text.toUpperCase().includes(brand.toUpperCase())
  )

  // カテゴリの検出
  const categories = {
    'ギター': ['guitar', 'ギター', 'エレキギター', 'アコギ'],
    'ベース': ['bass', 'ベース', 'エレキベース'],
    'ドラム': ['drum', 'ドラム', 'ドラムセット'],
    'キーボード・ピアノ': ['piano', 'keyboard', 'ピアノ', 'キーボード'],
    'アンプ': ['amp', 'amplifier', 'アンプ']
  }

  let detectedCategory = 'その他'
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()))) {
      detectedCategory = category
      break
    }
  }

  return {
    name: brandMatch ? `${brandMatch} 楽器` : '楽器',
    brand: brandMatch || '',
    model: '',
    price,
    category: detectedCategory,
    condition: '中古' // デフォルト
  }
}