import { NextRequest, NextResponse } from 'next/server'

interface UsageLog {
  timestamp: string
  model: string
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  cost_usd: number
  endpoint: string
  user_action: string
}

// 簡易的なインメモリストレージ（本番環境ではデータベースを使用）
let usageLogs: UsageLog[] = []

// OpenAI料金表（2024年現在の料金）
const PRICING = {
  'gpt-4o-mini': {
    input: 0.000150,  // $0.15 per 1M tokens
    output: 0.000600  // $0.60 per 1M tokens
  },
  'gpt-4': {
    input: 0.030,     // $30 per 1M tokens
    output: 0.060     // $60 per 1M tokens
  }
}

export async function POST(request: NextRequest) {
  try {
    const { model, prompt_tokens, completion_tokens, endpoint, user_action } = await request.json()

    if (!model || !prompt_tokens || !completion_tokens) {
      return NextResponse.json(
        { error: 'Required fields missing' },
        { status: 400 }
      )
    }

    const total_tokens = prompt_tokens + completion_tokens
    const pricing = PRICING[model as keyof typeof PRICING] || PRICING['gpt-4o-mini']

    const cost_usd = (
      (prompt_tokens / 1000000) * pricing.input +
      (completion_tokens / 1000000) * pricing.output
    )

    const logEntry: UsageLog = {
      timestamp: new Date().toISOString(),
      model,
      prompt_tokens,
      completion_tokens,
      total_tokens,
      cost_usd: parseFloat(cost_usd.toFixed(6)),
      endpoint: endpoint || 'unknown',
      user_action: user_action || 'unknown'
    }

    usageLogs.push(logEntry)

    // 古いログを削除（最新の100件のみ保持）
    if (usageLogs.length > 100) {
      usageLogs = usageLogs.slice(-100)
    }

    return NextResponse.json({
      success: true,
      logged: logEntry
    })

  } catch (error) {
    console.error('Usage logging error:', error)
    return NextResponse.json(
      { error: 'Failed to log usage' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const period = url.searchParams.get('period') || '24h'

    let filterDate = new Date()
    switch (period) {
      case '1h':
        filterDate.setHours(filterDate.getHours() - 1)
        break
      case '24h':
        filterDate.setDate(filterDate.getDate() - 1)
        break
      case '7d':
        filterDate.setDate(filterDate.getDate() - 7)
        break
      case '30d':
        filterDate.setDate(filterDate.getDate() - 30)
        break
      default:
        filterDate.setDate(filterDate.getDate() - 1)
    }

    const filteredLogs = usageLogs.filter(log =>
      new Date(log.timestamp) >= filterDate
    )

    const stats = {
      total_requests: filteredLogs.length,
      total_tokens: filteredLogs.reduce((sum, log) => sum + log.total_tokens, 0),
      total_cost_usd: parseFloat(filteredLogs.reduce((sum, log) => sum + log.cost_usd, 0).toFixed(6)),
      total_cost_jpy: parseFloat((filteredLogs.reduce((sum, log) => sum + log.cost_usd, 0) * 150).toFixed(2)), // 1USD = 150円で概算
      by_model: {} as Record<string, any>,
      by_endpoint: {} as Record<string, any>,
      recent_logs: filteredLogs.slice(-10)
    }

    // モデル別統計
    filteredLogs.forEach(log => {
      if (!stats.by_model[log.model]) {
        stats.by_model[log.model] = {
          requests: 0,
          tokens: 0,
          cost_usd: 0
        }
      }
      stats.by_model[log.model].requests++
      stats.by_model[log.model].tokens += log.total_tokens
      stats.by_model[log.model].cost_usd += log.cost_usd
    })

    // エンドポイント別統計
    filteredLogs.forEach(log => {
      if (!stats.by_endpoint[log.endpoint]) {
        stats.by_endpoint[log.endpoint] = {
          requests: 0,
          tokens: 0,
          cost_usd: 0
        }
      }
      stats.by_endpoint[log.endpoint].requests++
      stats.by_endpoint[log.endpoint].tokens += log.total_tokens
      stats.by_endpoint[log.endpoint].cost_usd += log.cost_usd
    })

    return NextResponse.json({
      success: true,
      period,
      stats
    })

  } catch (error) {
    console.error('Usage stats error:', error)
    return NextResponse.json(
      { error: 'Failed to get usage stats' },
      { status: 500 }
    )
  }
}