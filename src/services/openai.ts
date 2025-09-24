import OpenAI from 'openai'

// OpenAI client configuration
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

// Log usage statistics
const logUsage = async (
  model: string,
  promptTokens: number,
  completionTokens: number,
  endpoint: string,
  userAction: string
) => {
  try {
    await fetch('/api/ai-usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        endpoint,
        user_action: userAction
      })
    })
  } catch (error) {
    console.error('Failed to log usage:', error)
  }
}

// Extract product information from text using GPT-4
export async function extractProductInfo(text: string): Promise<{
  success: boolean
  data?: any
  error?: string
}> {
  try {
    if (!openai) {
      return {
        success: false,
        error: 'OpenAI API key not configured'
      }
    }
    const prompt = `
以下のテキストから楽器の商品情報を抽出してください。
JSONフォーマットで以下の情報を返してください：

{
  "category": "楽器のカテゴリ（ギター、ベース、ドラム、キーボード・ピアノ、管楽器、弦楽器、アンプ、エフェクター、アクセサリー、その他）",
  "product_name": "商品名",
  "manufacturer": "メーカー名",
  "model_number": "型番",
  "color": "色",
  "condition": "状態（新品、中古、展示品、B級品、ジャンク）",
  "price": "価格（数値のみ）",
  "list_price": "定価（数値のみ、わからない場合はnull）",
  "wholesale_price": "卸価格（数値のみ、わからない場合はnull）",
  "supplier": "仕入先（わからない場合は空文字）",
  "notes": "その他メモ（わからない場合は空文字）"
}

テキスト:
${text}
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'あなたは楽器店の在庫管理システムのアシスタントです。テキストから楽器の商品情報を正確に抽出してJSONで返してください。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 800
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    // Log usage
    await logUsage(
      'gpt-4o-mini',
      response.usage?.prompt_tokens || 0,
      response.usage?.completion_tokens || 0,
      '/api/ai-extract',
      'product_info_extraction'
    )

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const productData = JSON.parse(jsonMatch[0])

    return {
      success: true,
      data: productData
    }

  } catch (error) {
    console.error('Error extracting product info:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Analyze inventory trends and provide insights
export async function analyzeInventory(inventoryData: any[]): Promise<{
  success: boolean
  insights?: string
  error?: string
}> {
  try {
    if (!openai) {
      return {
        success: false,
        error: 'OpenAI API key not configured'
      }
    }
    const summary = {
      totalItems: inventoryData.length,
      totalValue: inventoryData.reduce((sum, item) => sum + (item.price || 0), 0),
      categories: [...new Set(inventoryData.map(item => item.category))],
      manufacturers: [...new Set(inventoryData.map(item => item.manufacturer))],
      conditions: inventoryData.reduce((acc, item) => {
        acc[item.condition] = (acc[item.condition] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      priceRanges: {
        under10k: inventoryData.filter(item => item.price < 10000).length,
        '10k-50k': inventoryData.filter(item => item.price >= 10000 && item.price < 50000).length,
        '50k-100k': inventoryData.filter(item => item.price >= 50000 && item.price < 100000).length,
        over100k: inventoryData.filter(item => item.price >= 100000).length
      }
    }

    const prompt = `
以下の楽器店の在庫データを分析して、ビジネス上の洞察とアドバイスを日本語で提供してください：

在庫サマリー:
- 総商品数: ${summary.totalItems}件
- 総在庫額: ¥${summary.totalValue.toLocaleString()}
- カテゴリ: ${summary.categories.join(', ')}
- メーカー数: ${summary.manufacturers.length}社
- 状態別内訳: ${Object.entries(summary.conditions).map(([k,v]) => `${k}: ${v}件`).join(', ')}
- 価格帯別: 1万円未満: ${summary.priceRanges.under10k}件, 1-5万円: ${summary.priceRanges['10k-50k']}件, 5-10万円: ${summary.priceRanges['50k-100k']}件, 10万円以上: ${summary.priceRanges.over100k}件

以下の観点で分析してください：
1. 在庫バランスの評価
2. 売れ筋・滞留在庫の予測
3. 仕入戦略の提案
4. 価格設定の最適化提案
5. リスクと機会の特定

具体的で実行可能なアドバイスを提供してください。
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'あなたは楽器業界に精通したビジネスアナリストです。在庫データから実用的な経営アドバイスを提供してください。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    })

    const insights = response.choices[0]?.message?.content

    // Log usage
    await logUsage(
      'gpt-4o-mini',
      response.usage?.prompt_tokens || 0,
      response.usage?.completion_tokens || 0,
      '/api/ai-analyze',
      'inventory_analysis'
    )

    return {
      success: true,
      insights: insights || 'No insights generated'
    }

  } catch (error) {
    console.error('Error analyzing inventory:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Generate product descriptions
export async function generateProductDescription(productData: any): Promise<{
  success: boolean
  description?: string
  error?: string
}> {
  try {
    if (!openai) {
      return {
        success: false,
        error: 'OpenAI API key not configured'
      }
    }
    const prompt = `
以下の楽器商品の魅力的な商品説明文を作成してください：

商品情報:
- カテゴリ: ${productData.category}
- 商品名: ${productData.product_name}
- メーカー: ${productData.manufacturer}
- 型番: ${productData.model_number}
- 色: ${productData.color}
- 状態: ${productData.condition}
- 価格: ¥${productData.price?.toLocaleString()}

以下の要素を含めた魅力的な説明文を作成してください：
1. 商品の特徴とメリット
2. 適用シーンや対象者
3. この商品を選ぶべき理由
4. 状態に関する適切な説明

200-300文字程度の読みやすい文章でお願いします。
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'あなたは楽器店の商品説明を書く専門家です。顧客の購買意欲を喚起する魅力的な説明文を作成してください。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    })

    const description = response.choices[0]?.message?.content

    // Log usage
    await logUsage(
      'gpt-4o-mini',
      response.usage?.prompt_tokens || 0,
      response.usage?.completion_tokens || 0,
      '/api/ai-describe',
      'product_description'
    )

    return {
      success: true,
      description: description || 'No description generated'
    }

  } catch (error) {
    console.error('Error generating description:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export default openai || {} as OpenAI