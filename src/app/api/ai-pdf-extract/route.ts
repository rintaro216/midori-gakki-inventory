import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import pdfParse from 'pdf-parse'

interface Product {
  category: string           // 種類(カテゴリー)
  product_name: string      // 商品名
  manufacturer: string      // メーカー(ブランド)
  model_number: string      // 品番
  color: string            // 色(カラー)
  serial_number?: string   // シリアルナンバー
  price: string           // 価格(定価又は販売価格)
  wholesale_price?: string // 仕入値段
  wholesale_rate?: string  // 仕入掛け率
  purchase_date?: string   // 仕入日
  supplier?: string        // 仕入先
  condition?: string       // 状態（既存フィールドも残す）
  notes?: string          // 備考
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

    console.log('Processing PDF with actual text extraction using pdf-parse...')
    const buffer = await file.arrayBuffer()
    const fileName = file.name
    console.log('PDF file name:', fileName)

    // pdf-parseを使用して実際にPDFからテキストを抽出
    let extractedText = ''

    try {
      console.log('Extracting text from PDF using pdf-parse...')
      const data = await pdfParse(Buffer.from(buffer))
      extractedText = data.text
      console.log(`PDF has ${data.numpages} pages`)
      console.log('PDF text extraction completed, total length:', extractedText.length)

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
        error: 'PDFから十分なテキストを抽出できませんでした。画像ベースのPDFの可能性があります。'
      }, { status: 400 })
    }

    // OpenAI APIでテキストから商品情報を抽出
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API が設定されていません。環境変数 OPENAI_API_KEY を確認してください。'
      }, { status: 500 })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    console.log('Sending text to OpenAI for product extraction...')

    const extractionResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `以下のテキストから楽器商品の情報をJSON配列で抽出してください。

【重要な制約】:
- テキストに明確に記載されている情報のみを抽出する
- 推測や想像で情報を補完しない
- 見つからない項目は空文字 "" にする
- 存在しない情報は絶対に追加しない

JSONフォーマット:
[{"category":"","product_name":"","manufacturer":"","model_number":"","color":"","price":"","condition":"","notes":""}]

抽出対象テキスト:
${extractedText}`
        }
      ],
      temperature: 0.1,
      max_tokens: 4000
    })

    const content = extractionResponse.choices[0]?.message?.content
    if (!content) {
      throw new Error('OpenAI APIからレスポンスが取得できませんでした')
    }

    console.log('Raw AI response length:', content.length)
    console.log('Raw AI response first 500 chars:', content.substring(0, 500))

    // JSON配列を抽出 - より厳密なパターンマッチング
    let jsonString = ''

    // JSON配列を探すための複数のパターン
    const patterns = [
      /\[\s*\{[\s\S]*?\}\s*\]/g,           // 標準配列パターン
      /```json\s*(\[[\s\S]*?\])\s*```/g,   // マークダウンコードブロック
      /```\s*(\[[\s\S]*?\])\s*```/g,       // マークダウンコードブロック（json指定なし）
      /(\[[\s\S]*?\])/g,                   // シンプルな配列パターン
    ]

    let foundMatch = false
    for (const pattern of patterns) {
      const matches = content.match(pattern)
      if (matches && matches.length > 0) {
        console.log(`Found matches with pattern: ${pattern}`)
        // 最も長いマッチを選択
        jsonString = matches.reduce((longest, current) =>
          current.length > longest.length ? current : longest, '')
        foundMatch = true
        break
      }
    }

    if (!foundMatch) {
      // 単一オブジェクトを探す
      const objectMatch = content.match(/\{[\s\S]*?\}/)
      if (objectMatch) {
        jsonString = `[${objectMatch[0]}]`
        foundMatch = true
        console.log('Found single object, wrapped in array')
      }
    }

    if (!foundMatch) {
      console.error('No JSON patterns found in AI response')
      console.error('Full AI response:', content)
      throw new Error('有効なJSON形式が見つかりませんでした')
    }

    console.log('Extracted JSON string:', jsonString)

    // JSON文字列をクリーンアップ
    jsonString = jsonString
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .replace(/[\u201C\u201D]/g, '"') // スマート引用符を通常の引用符に
      .replace(/[\u2018\u2019]/g, "'") // スマート単一引用符
      .trim()

    let products
    try {
      products = JSON.parse(jsonString)
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError)
      console.error('Cleaned JSON string:', jsonString)
      throw new Error(`JSON解析エラー: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
    }

    // 重複除去と検証（条件を緩和）
    const validProducts = products.filter((product: any) => {
      // 商品名または型番のどちらかがあればOK
      const hasIdentifier = (product.product_name && product.product_name.trim() !== '') ||
                           (product.model_number && product.model_number.trim() !== '')

      console.log('Product validation:', {
        product_name: product.product_name,
        model_number: product.model_number,
        price: product.price,
        hasIdentifier
      })

      return hasIdentifier
    })

    if (validProducts.length === 0) {
      console.log('No valid products found. Raw products:', JSON.stringify(products, null, 2))
      return NextResponse.json(
        {
          success: false,
          error: 'PDF内から有効な商品情報を抽出できませんでした。',
          debug: {
            extractedProductCount: products.length,
            rawProducts: products,
            aiResponse: content.substring(0, 1000)
          }
        },
        { status: 400 }
      )
    }

    console.log(`Successfully extracted ${validProducts.length} products from PDF text using AI`)

    return NextResponse.json({
      success: true,
      products: validProducts,
      method: 'AI処理 (pdf-parse + OpenAI GPT-4o-mini)',
      fileName: fileName
    })

  } catch (error) {
    console.error('AI PDF extraction error:', error)
    return NextResponse.json(
      {
        success: false,
        error: `AI PDF処理エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
      },
      { status: 500 }
    )
  }
}