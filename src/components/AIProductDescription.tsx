'use client'

import { useState } from 'react'
import type { Database } from '@/lib/supabase'

type InventoryItem = Database['public']['Tables']['inventory']['Row']

interface AIProductDescriptionProps {
  product: InventoryItem
  onDescriptionGenerated?: (description: string) => void
}

export default function AIProductDescription({ product, onDescriptionGenerated }: AIProductDescriptionProps) {
  const [generating, setGenerating] = useState(false)
  const [description, setDescription] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generateDescription = async () => {
    try {
      setGenerating(true)
      setError(null)

      const response = await fetch('/api/ai-describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productData: product })
      })

      if (!response.ok) {
        throw new Error(`APIエラー: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '説明文生成に失敗しました')
      }

      setDescription(result.description)
      onDescriptionGenerated?.(result.description)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました'
      setError(errorMessage)
      console.error('説明文生成エラー:', err)
    } finally {
      setGenerating(false)
    }
  }

  const copyToClipboard = async () => {
    if (description) {
      try {
        await navigator.clipboard.writeText(description)
        alert('説明文をクリップボードにコピーしました！')
      } catch (err) {
        console.error('コピーに失敗:', err)
        alert('コピーに失敗しました')
      }
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900">
          ✨ AI商品説明生成
        </h4>
        <button
          onClick={generateDescription}
          disabled={generating}
          className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-1 rounded text-xs font-medium"
        >
          {generating ? (
            <>
              <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
              生成中...
            </>
          ) : (
            '説明文を生成'
          )}
        </button>
      </div>

      <div className="text-xs text-gray-500 mb-3">
        商品: {product.product_name} ({product.manufacturer} {product.model_number})
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
          <p className="text-red-800 text-xs">{error}</p>
        </div>
      )}

      {description && (
        <div className="bg-gray-50 border border-gray-200 rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-700">生成された説明文:</span>
            <button
              onClick={copyToClipboard}
              className="text-blue-600 hover:text-blue-800 text-xs"
            >
              📋 コピー
            </button>
          </div>
          <p className="text-sm text-gray-900 whitespace-pre-wrap">{description}</p>
        </div>
      )}

      {!description && !error && !generating && (
        <div className="text-center py-4 text-gray-400">
          <svg className="mx-auto h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <p className="mt-1 text-xs">ボタンをクリックして魅力的な商品説明を生成</p>
        </div>
      )}
    </div>
  )
}