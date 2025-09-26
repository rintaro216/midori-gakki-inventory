import { NextRequest, NextResponse } from 'next/server'
import Tesseract from 'tesseract.js'

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
    console.log('Real OCR endpoint called - using actual Tesseract OCR processing')

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

    console.log(`Processing ${images.length} images with actual Tesseract OCR`)

    // 実際のOCR処理で商品データを抽出
    const extractedProducts: Product[] = []

    for (let idx = 0; idx < images.length; idx++) {
      const image = images[idx]
      const fileName = image.name || `image_${idx + 1}.jpg`

      console.log(`Processing image: ${fileName}`)

      try {
        // 画像をバッファに変換
        const buffer = await image.arrayBuffer()

        // Tesseract.jsでOCR処理
        const result = await Tesseract.recognize(
          Buffer.from(buffer),
          'jpn+eng', // 日本語と英語を認識
          {
            logger: (m) => {
              if (m.status === 'recognizing text') {
                console.log(`OCR Progress for ${fileName}: ${Math.round(m.progress * 100)}%`)
              }
            }
          }
        )

        const extractedText = result.data.text
        console.log(`OCR extracted text from ${fileName}:`, extractedText.substring(0, 200))

        if (extractedText && extractedText.length > 3) {
          // OCRで抽出したテキストから商品情報を解析
          const product = extractProductFromOCR(extractedText, fileName)
          if (product) {
            extractedProducts.push(product)
          }
        } else {
          console.log(`No text extracted from ${fileName}`)
        }

      } catch (ocrError) {
        console.error(`OCR processing failed for ${fileName}:`, ocrError)
        // エラーがあっても他の画像の処理は続行
        extractedProducts.push({
          category: 'その他',
          product_name: `OCR処理失敗: ${fileName}`,
          manufacturer: '',
          model_number: '',
          color: '',
          condition: '不明',
          price: '',
          notes: `OCR処理中にエラーが発生しました: ${ocrError instanceof Error ? ocrError.message : 'Unknown error'}`
        })
      }
    }

    if (extractedProducts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '全ての画像からテキストを抽出できませんでした。より鮮明な画像をお試しください。'
        },
        { status: 400 }
      )
    }

    console.log(`Successfully extracted ${extractedProducts.length} products using real OCR processing`)

    return NextResponse.json({
      success: true,
      products: extractedProducts,
      method: 'Real OCR処理 (Tesseract.js)',
      extractedText: `${extractedProducts.length}個の画像を処理しました`
    })

  } catch (error) {
    console.error('Real OCR extraction error:', error)
    return NextResponse.json(
      {
        success: false,
        error: `Real OCR処理エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
      },
      { status: 500 }
    )
  }
}

function extractProductFromOCR(text: string, fileName: string): Product | null {
  console.log('Analyzing OCR text:', text)

  // 価格の抽出（様々な形式に対応）
  const pricePatterns = [
    /[¥￥]?\s*[\d,]+\s*(?:円|YEN|\?)/gi,
    /[\d,]+\s*[¥￥]/gi,
    /price[:\s]*[\d,]+/gi,
    /値段[:\s]*[\d,]+/gi
  ]

  let price = ''
  for (const pattern of pricePatterns) {
    const match = text.match(pattern)
    if (match) {
      price = match[0].replace(/[¥￥円,\s]/g, '')
      break
    }
  }

  // ブランド名の抽出
  const brands = [
    'YAMAHA', 'Fender', 'Gibson', 'Martin', 'Taylor', 'Ibanez', 'ESP', 'PRS',
    'Roland', 'KORG', 'Casio', 'Pearl', 'Tama', 'DW', 'Ludwig',
    'Boss', 'MXR', 'TC Electronic'
  ]

  let detectedBrand = ''
  for (const brand of brands) {
    if (text.toLowerCase().includes(brand.toLowerCase())) {
      detectedBrand = brand
      break
    }
  }

  // 型番の抽出
  const modelPatterns = [
    /model[:\s]*([A-Z0-9-]+)/gi,
    /型番[:\s]*([A-Z0-9-]+)/gi,
    /[A-Z]{2,}\s*-?\s*[0-9]+[A-Z]*/g
  ]

  let model = ''
  for (const pattern of modelPatterns) {
    const match = text.match(pattern)
    if (match) {
      model = match[0].replace(/model[:\s]*/gi, '').replace(/型番[:\s]*/gi, '')
      break
    }
  }

  // カテゴリの判定
  const categoryKeywords = {
    'ギター': ['guitar', 'ギター', 'エレキギター', 'アコギ'],
    'ベース': ['bass', 'ベース', 'エレキベース'],
    'ドラム': ['drum', 'ドラム', 'ドラムセット'],
    'キーボード・ピアノ': ['piano', 'keyboard', 'ピアノ', 'キーボード'],
    'アンプ': ['amp', 'amplifier', 'アンプ'],
    'エフェクター': ['effect', 'pedal', 'エフェクター']
  }

  let detectedCategory = 'その他'
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()))) {
      detectedCategory = category
      break
    }
  }

  // 商品名を生成
  let productName = detectedBrand
  if (model) productName += ` ${model}`
  if (!productName) productName = detectedCategory

  // 有効な情報があるかチェック
  if (!productName || productName === 'その他') {
    return null
  }

  return {
    category: detectedCategory,
    product_name: productName,
    manufacturer: detectedBrand,
    model_number: model,
    color: 'ナチュラル', // デフォルト
    condition: '中古', // デフォルト
    price,
    notes: `${fileName}からOCR自動抽出`
  }
}