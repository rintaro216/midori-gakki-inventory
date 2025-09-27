'use client'

import * as pdfjsLib from 'pdfjs-dist'

// PDF.js worker を設定 - Netlify静的デプロイ対応
if (typeof window !== 'undefined') {
  // Netlify静的サイトでは絶対パスを使用
  const workerSrc = process.env.NODE_ENV === 'production'
    ? 'https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.mjs'
    : '/pdf.worker.mjs'
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc
}

export interface Product {
  category: string
  product_name: string
  manufacturer: string
  model_number: string
  color: string
  serial_number?: string
  price: string
  wholesale_price?: string
  wholesale_rate?: string
  purchase_date?: string
  supplier?: string
  condition: string
  notes?: string
}

export async function processPDFClient(file: File): Promise<{
  success: boolean
  products?: Product[]
  method?: string
  fileName?: string
  error?: string
}> {
  try {
    console.log('Processing PDF on client side...')

    // ファイルサイズチェック (10MB制限)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('ファイルサイズが大きすぎます。10MB以下のPDFファイルを選択してください。')
    }

    const arrayBuffer = await file.arrayBuffer()
    console.log('PDF worker source:', pdfjsLib.GlobalWorkerOptions.workerSrc)

    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      verbosity: 0 // ログを抑制
    })
    const pdf = await loadingTask.promise

    let extractedText = ''

    // すべてのページからテキストを抽出
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
      extractedText += pageText + ' '
    }

    console.log(`PDF has ${pdf.numPages} pages`)
    console.log('PDF text extraction completed, total length:', extractedText.length)

    if (!extractedText || extractedText.length < 10) {
      return {
        success: false,
        error: 'PDFから十分なテキストを抽出できませんでした。画像ベースのPDFの可能性があります。'
      }
    }

    // 基本的なパターンマッチングで商品情報を抽出
    const products = extractProductsFromText(extractedText)

    return {
      success: true,
      products,
      method: 'クライアント処理 (PDF.js)',
      fileName: file.name
    }

  } catch (error) {
    console.error('Client PDF processing error:', error)
    return {
      success: false,
      error: `PDF処理エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

function extractProductsFromText(text: string): Product[] {
  const products: Product[] = []

  // テキストを行に分割
  const lines = text.split(/[\n\r]+/).filter(line => line.trim().length > 0)

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
          notes: `クライアントPDF処理: ${line.substring(0, 100)}...`
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