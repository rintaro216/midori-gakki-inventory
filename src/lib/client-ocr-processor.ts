'use client'

import Tesseract from 'tesseract.js'

export interface ProductInfo {
  name: string
  brand: string
  model: string
  price: string
  category: string
  condition: string
}

export async function processImageOCRClient(file: File): Promise<{
  success: boolean
  productInfo?: ProductInfo
  extractedText?: string
  error?: string
}> {
  try {
    console.log('Processing image with client-side Tesseract OCR...')

    // ファイルサイズチェック (5MB制限)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('画像ファイルサイズが大きすぎます。5MB以下の画像を選択してください。')
    }

    // ファイルタイプチェック
    if (!file.type.startsWith('image/')) {
      throw new Error('画像ファイルを選択してください。')
    }

    console.log('Tesseract settings:', {
      corePath: process.env.NODE_ENV === 'production'
        ? 'https://unpkg.com/tesseract.js@6.0.1/dist'
        : undefined,
      workerPath: process.env.NODE_ENV === 'production'
        ? 'https://unpkg.com/tesseract.js@6.0.1/dist/worker.min.js'
        : undefined
    })

    // Tesseract.js 6.0.1対応 - タイムアウト付き
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('OCR処理がタイムアウトしました。より小さな画像をお試しください。')), 60000)
    )

    const ocrPromise = Tesseract.recognize(
      file,
      'jpn+eng', // 日本語と英語を認識
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
          }
        },
        // Netlify静的サイト用の設定
        corePath: process.env.NODE_ENV === 'production'
          ? 'https://unpkg.com/tesseract.js@6.0.1/dist'
          : undefined,
        workerPath: process.env.NODE_ENV === 'production'
          ? 'https://unpkg.com/tesseract.js@6.0.1/dist/worker.min.js'
          : undefined
      }
    )

    const result = await Promise.race([ocrPromise, timeoutPromise]) as any

    const extractedText = result.data.text
    console.log(`OCR extracted text length: ${extractedText.length}`)

    if (!extractedText || extractedText.length < 3) {
      return {
        success: false,
        error: '画像からテキストを抽出できませんでした。より鮮明な画像をお試しください。'
      }
    }

    // OCRで抽出したテキストから商品情報を解析
    const productInfo = extractProductInfoFromOCR(extractedText)

    return {
      success: true,
      productInfo,
      extractedText: extractedText.substring(0, 500) + '...' // デバッグ用
    }

  } catch (error) {
    console.error('Client OCR processing error:', error)
    return {
      success: false,
      error: `OCR処理エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

function extractProductInfoFromOCR(text: string): ProductInfo {
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

  // ブランド名の抽出（大文字小文字を区別しない）
  const brands = [
    'YAMAHA', 'Fender', 'Gibson', 'Martin', 'Taylor', 'Ibanez', 'ESP', 'PRS',
    'Roland', 'KORG', 'Casio', 'Pearl', 'Tama', 'DW', 'Ludwig',
    'Boss', 'MXR', 'TC Electronic', 'Eventide', 'Strymon'
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
    'ギター': ['guitar', 'ギター', 'エレキギター', 'アコギ', 'strat', 'les paul', 'telecaster'],
    'ベース': ['bass', 'ベース', 'エレキベース', 'jazz bass', 'precision'],
    'ドラム': ['drum', 'ドラム', 'ドラムセット', 'snare', 'cymbal', 'kick'],
    'キーボード・ピアノ': ['piano', 'keyboard', 'ピアノ', 'キーボード', 'synth'],
    'アンプ': ['amp', 'amplifier', 'アンプ', 'combo', 'head', 'cabinet'],
    'エフェクター': ['effect', 'pedal', 'エフェクター', 'distortion', 'reverb', 'delay']
  }

  let detectedCategory = 'その他'
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()))) {
      detectedCategory = category
      break
    }
  }

  // 状態の判定
  const conditionKeywords = {
    '新品': ['new', 'mint', '新品', '未使用'],
    '中古良品': ['used', 'good', '中古良品', '美品'],
    '中古': ['used', '中古'],
    'ジャンク': ['junk', 'broken', 'ジャンク', '故障']
  }

  let detectedCondition = '中古' // デフォルト
  for (const [condition, keywords] of Object.entries(conditionKeywords)) {
    if (keywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()))) {
      detectedCondition = condition
      break
    }
  }

  // 商品名を生成
  let productName = detectedBrand
  if (model) {
    productName += ` ${model}`
  }
  if (!productName) {
    productName = detectedCategory
  }

  return {
    name: productName,
    brand: detectedBrand,
    model,
    price,
    category: detectedCategory,
    condition: detectedCondition
  }
}