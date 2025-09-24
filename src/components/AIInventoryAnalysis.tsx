'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface AnalysisProps {
  onAnalysisComplete?: (insights: string) => void
}

export default function AIInventoryAnalysis({ onAnalysisComplete }: AnalysisProps) {
  const [analyzing, setAnalyzing] = useState(false)
  const [insights, setInsights] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runAnalysis = async () => {
    try {
      setAnalyzing(true)
      setError(null)

      // 在庫データを取得
      const { data: inventoryData, error: dbError } = await supabase
        .from('inventory')
        .select('*')

      if (dbError) {
        throw new Error(`データベースエラー: ${dbError.message}`)
      }

      if (!inventoryData || inventoryData.length === 0) {
        throw new Error('分析対象の在庫データがありません')
      }

      // AI分析API呼び出し
      const response = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventoryData })
      })

      if (!response.ok) {
        throw new Error(`分析APIエラー: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '分析に失敗しました')
      }

      setInsights(result.insights)
      onAnalysisComplete?.(result.insights)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました'
      setError(errorMessage)
      console.error('分析エラー:', err)
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            🧠 AI在庫分析
          </h3>
          <button
            onClick={runAnalysis}
            disabled={analyzing}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            {analyzing ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                分析中...
              </>
            ) : (
              '分析を実行'
            )}
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          現在の在庫データをAIが分析し、ビジネス上の洞察とアドバイスを提供します。
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">エラーが発生しました</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {insights && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800 mb-2">AI分析結果</h3>
                <div className="text-sm text-blue-700 whitespace-pre-wrap">
                  {insights}
                </div>
              </div>
            </div>
          </div>
        )}

        {!insights && !error && !analyzing && (
          <div className="text-center py-8 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="mt-2">「分析を実行」ボタンをクリックして在庫分析を開始してください</p>
          </div>
        )}
      </div>
    </div>
  )
}