import { NextRequest, NextResponse } from 'next/server'
import pdfParse from 'pdf-parse'

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

    console.log('Processing PDF with multiple product extraction...')
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
        error: 'PDFの読み込みに失敗しました。ファイルが破損している可能性があります。'
      }, { status: 400 })
    }

    if (!extractedText || extractedText.length < 10) {
      return NextResponse.json({
        success: false,
        error: 'PDFから十分なテキストを抽出できませんでした。画像ベースのPDFの可能性があります。'
      }, { status: 400 })
    }

    // 複数商品の抽出
    const products = extractMultipleProducts(extractedText)

    if (products.length === 0) {
      return NextResponse.json({
        success: false,
        error: '商品情報を抽出できませんでした。PDFの形式を確認してください。'
      }, { status: 400 })
    }

    console.log(`Successfully extracted ${products.length} products`)

    return NextResponse.json({
      success: true,
      products,
      method: '従来処理 (pdf-parse)',
      fileName: file.name
    })

  } catch (error) {
    console.error('Multiple PDF extraction error:', error)
    return NextResponse.json(
      {
        success: false,
        error: `PDF処理エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
      },
      { status: 500 }
    )
  }
}

function extractMultipleProducts(text: string): Product[] {
  const products: Product[] = []

  // テキストを行に分割
  const lines = text.split('\n').filter(line => line.trim().length > 0)

  // 楽器ブランド
  const brands = [
    'YAMAHA', 'Fender', 'Gibson', 'Martin', 'Taylor', 'Ibanez', 'ESP', 'PRS',
    'Roland', 'KORG', 'Casio', 'Pearl', 'Tama', 'DW', 'Ludwig', 'Boss', 'MXR'
  ]

  // カテゴリキーワード
  const categoryKeywords = {
    'ギター': ['guitar', 'ギター', 'エレキギター', 'アコギ', 'strat', 'les paul', 'telecaster'],
    'ベース': ['bass', 'ベース', 'エレキベース', 'jazz bass', 'precision'],
    'ドラム': ['drum', 'ドラム', 'ドラムセット', 'snare', 'cymbal', 'kit'],
    'キーボード・ピアノ': ['piano', 'keyboard', 'ピアノ', 'キーボード', 'synth'],
    'アンプ': ['amp', 'amplifier', 'アンプ', 'combo', 'head'],
    'エフェクター': ['effect', 'pedal', 'エフェクター', 'distortion', 'reverb', 'delay']
  }

  // 各行を解析して商品を抽出
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // ブランド名が含まれる行を探す
    const foundBrand = brands.find(brand =>
      line.toLowerCase().includes(brand.toLowerCase())
    )

    if (foundBrand) {
      // 価格を抽出
      const priceMatch = line.match(/[¥￥]?[\d,]+(?:円)?|[\d,]+[¥￥]/)
      const price = priceMatch ? priceMatch[0].replace(/[¥￥円,]/g, '') : ''

      // カテゴリを推定
      let category = 'その他'
      for (const [cat, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => line.toLowerCase().includes(keyword.toLowerCase()))) {
          category = cat
          break
        }
      }

      // 型番を抽出
      const modelMatch = line.match(/[A-Z0-9-]{3,}/g)
      const model = modelMatch ? modelMatch.find(m => m !== foundBrand) || '' : ''

      // 色を抽出
      const colors = ['ナチュラル', 'ブラック', 'ホワイト', 'レッド', 'ブルー', 'サンバースト']
      const foundColor = colors.find(color =>
        line.toLowerCase().includes(color.toLowerCase())
      ) || 'ナチュラル'

      // 商品名を生成
      let productName = foundBrand
      if (model) productName += ` ${model}`
      if (category !== 'その他') productName += ` ${category}`

      if (productName && price) {
        products.push({
          category,
          product_name: productName,
          manufacturer: foundBrand,
          model_number: model,
          color: foundColor,
          condition: '中古', // デフォルト
          price,
          notes: `PDF自動抽出: ${line.substring(0, 100)}...`
        })
      }
    }
  }

  // 重複除去
  const uniqueProducts = products.filter((product, index, self) =>
    index === self.findIndex(p =>
      p.product_name === product.product_name &&
      p.manufacturer === product.manufacturer &&
      p.price === product.price
    )
  )

  return uniqueProducts
}