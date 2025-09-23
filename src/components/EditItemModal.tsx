'use client'

import { useState, useEffect } from 'react'
import type { Database } from '@/lib/supabase'

type InventoryItem = Database['public']['Tables']['inventory']['Row']

interface EditItemModalProps {
  item: InventoryItem | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedItem: InventoryItem) => void
}

export default function EditItemModal({ item, isOpen, onClose, onSave }: EditItemModalProps) {
  const [formData, setFormData] = useState<Partial<InventoryItem>>({})
  const [saving, setSaving] = useState(false)

  const categories = [
    'ギター',
    'ベース',
    'ドラム',
    'キーボード・ピアノ',
    '管楽器',
    '弦楽器',
    'アンプ',
    'エフェクター',
    'アクセサリー',
    'その他'
  ]

  const conditions = ['新品', '中古', '展示品', 'B級品', 'ジャンク']

  useEffect(() => {
    if (item) {
      setFormData(item)
    }
  }, [item])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item || !formData) return

    setSaving(true)
    try {
      const response = await fetch(`/api/inventory/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        onSave(result.updated_item)
        onClose()
      } else {
        alert(`更新に失敗しました: ${result.error}`)
      }
    } catch (error) {
      console.error('更新エラー:', error)
      alert('更新中にエラーが発生しました')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof InventoryItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (!isOpen || !item) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-medium text-gray-900">
            商品情報を編集
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* カテゴリ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                カテゴリ *
              </label>
              <select
                value={formData.category || ''}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="">選択してください</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* 商品名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                商品名 *
              </label>
              <input
                type="text"
                value={formData.product_name || ''}
                onChange={(e) => handleChange('product_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>

            {/* メーカー */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メーカー *
              </label>
              <input
                type="text"
                value={formData.manufacturer || ''}
                onChange={(e) => handleChange('manufacturer', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>

            {/* 型番 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                型番 *
              </label>
              <input
                type="text"
                value={formData.model_number || ''}
                onChange={(e) => handleChange('model_number', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>

            {/* カラー */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                カラー *
              </label>
              <input
                type="text"
                value={formData.color || ''}
                onChange={(e) => handleChange('color', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>

            {/* 状態 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                状態 *
              </label>
              <select
                value={formData.condition || ''}
                onChange={(e) => handleChange('condition', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="">選択してください</option>
                {conditions.map((condition) => (
                  <option key={condition} value={condition}>
                    {condition}
                  </option>
                ))}
              </select>
            </div>

            {/* 価格 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                価格 (円) *
              </label>
              <input
                type="number"
                value={formData.price || ''}
                onChange={(e) => handleChange('price', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                required
                min="0"
              />
            </div>

            {/* 仕入先 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                仕入先
              </label>
              <input
                type="text"
                value={formData.supplier || ''}
                onChange={(e) => handleChange('supplier', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* 定価 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                定価 (円)
              </label>
              <input
                type="number"
                value={formData.list_price || ''}
                onChange={(e) => handleChange('list_price', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                min="0"
              />
            </div>

            {/* 卸価格 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                卸価格 (円)
              </label>
              <input
                type="number"
                value={formData.wholesale_price || ''}
                onChange={(e) => handleChange('wholesale_price', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                min="0"
              />
            </div>

            {/* 卸率 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                卸率 (%)
              </label>
              <input
                type="text"
                value={formData.wholesale_rate || ''}
                onChange={(e) => handleChange('wholesale_rate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* 粗利 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                粗利 (円)
              </label>
              <input
                type="number"
                value={formData.gross_margin || ''}
                onChange={(e) => handleChange('gross_margin', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          {/* メモ */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メモ
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* ボタン */}
          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              disabled={saving}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}