'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface UsageStats {
  total_requests: number
  total_tokens: number
  total_cost_usd: number
  total_cost_jpy: number
  by_model: Record<string, {
    requests: number
    tokens: number
    cost_usd: number
  }>
  by_endpoint: Record<string, {
    requests: number
    tokens: number
    cost_usd: number
  }>
  recent_logs: Array<{
    timestamp: string
    model: string
    total_tokens: number
    cost_usd: number
    endpoint: string
    user_action: string
  }>
}

export default function AIDashboardPage() {
  const router = useRouter()
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [period, setPeriod] = useState('24h')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsageStats = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/ai-usage?period=${period}`)
      if (!response.ok) throw new Error('Failed to fetch stats')
      const data = await response.json()
      setUsageStats(data.stats)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsageStats()
  }, [period])

  const periodLabels = {
    '1h': '過去1時間',
    '24h': '過去24時間',
    '7d': '過去7日間',
    '30d': '過去30日間'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🤖 AI使用量ダッシュボード</h1>
              <p className="text-sm text-gray-600 mt-1">
                OpenAI API使用量とコストの詳細分析
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(periodLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <button
                onClick={fetchUsageStats}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
              >
                更新
              </button>
              <button
                onClick={() => router.push('/inventory')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm"
              >
                在庫一覧に戻る
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 space-y-8">
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">データを読み込み中...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">エラー: {error}</p>
          </div>
        )}

        {usageStats && !loading && (
          <>
            {/* 概要統計 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm">📊</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          総リクエスト数
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {usageStats.total_requests.toLocaleString()}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm">🎯</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          総トークン数
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {usageStats.total_tokens.toLocaleString()}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm">💰</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          コスト（USD）
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          ${usageStats.total_cost_usd.toFixed(4)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm">¥</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          コスト（円）
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          ¥{usageStats.total_cost_jpy.toFixed(2)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* モデル別統計 */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  モデル別使用状況
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          モデル
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          リクエスト数
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          トークン数
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          コスト（USD）
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          平均コスト/リクエスト
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(usageStats.by_model).map(([model, stats]) => (
                        <tr key={model}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {model}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {stats.requests.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {stats.tokens.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${stats.cost_usd.toFixed(4)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${(stats.cost_usd / stats.requests).toFixed(4)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* エンドポイント別統計 */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  機能別使用状況
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(usageStats.by_endpoint).map(([endpoint, stats]) => (
                    <div key={endpoint} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        {endpoint === 'pdf-extract-ai' ? '📄 PDF抽出' :
                         endpoint === 'image-ocr-ai' ? '📷 画像OCR' :
                         endpoint}
                      </h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>リクエスト: {stats.requests}</div>
                        <div>トークン: {stats.tokens.toLocaleString()}</div>
                        <div>コスト: ${stats.cost_usd.toFixed(4)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 最近のアクティビティ */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  最近のAI使用履歴
                </h3>
                <div className="flow-root">
                  <ul className="-mb-8">
                    {usageStats.recent_logs.map((log, idx) => (
                      <li key={idx}>
                        <div className="relative pb-8">
                          {idx !== usageStats.recent_logs.length - 1 && (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                <span className="text-white text-xs">🤖</span>
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-500">
                                  <span className="font-medium text-gray-900">{log.model}</span>で
                                  {log.endpoint === 'pdf-extract-ai' ? 'PDF抽出' : log.user_action}を実行
                                </p>
                                <p className="text-xs text-gray-400">
                                  {log.total_tokens.toLocaleString()}トークン • ${log.cost_usd.toFixed(4)}
                                </p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                {new Date(log.timestamp).toLocaleString('ja-JP')}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* コスト見積もり */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-4">💡 月額コスト見積もり</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">現在のペース（24時間基準）:</span>
                  <p className="text-blue-600">
                    月額約 ${(usageStats.total_cost_usd * 30).toFixed(2)} USD
                    （¥{(usageStats.total_cost_jpy * 30).toFixed(0)}）
                  </p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">1日平均:</span>
                  <p className="text-blue-600">
                    {usageStats.total_requests}リクエスト • ${usageStats.total_cost_usd.toFixed(4)} USD
                  </p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">1リクエスト平均:</span>
                  <p className="text-blue-600">
                    {usageStats.total_requests > 0 ?
                      `${Math.round(usageStats.total_tokens / usageStats.total_requests)}トークン • $${(usageStats.total_cost_usd / usageStats.total_requests).toFixed(4)}`
                      : 'データなし'
                    }
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}