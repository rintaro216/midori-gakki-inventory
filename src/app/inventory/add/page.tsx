'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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

const conditions = [
  '新品',
  '中古',
  '展示品',
  'B級品',
  'ジャンク'
]

export default function AddInventoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    category: '',
    product_name: '',
    manufacturer: '',
    model_number: '',
    color: '',
    condition: '',
    price: '',
    notes: ''
  })
  const [message, setMessage] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('inventory')
        .insert([{
          category: formData.category,
          product_name: formData.product_name,
          manufacturer: formData.manufacturer,
          model_number: formData.model_number,
          color: formData.color,
          condition: formData.condition,
          price: parseInt(formData.price),
          notes: formData.notes || null
        }])

      if (error) throw error

      setMessage('商品を登録しました')
      setFormData({
        category: '',
        product_name: '',
        manufacturer: '',
        model_number: '',
        color: '',
        condition: '',
        price: '',
        notes: ''
      })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <h1 className="text-3xl font-bold text-gray-900">在庫登録</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
            >
              ダッシュボードに戻る
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* カテゴリ */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  カテゴリ <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">選択してください</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* 商品名 */}
              <div>
                <label htmlFor="product_name" className="block text-sm font-medium text-gray-700">
                  商品名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="product_name"
                  name="product_name"
                  required
                  value={formData.product_name}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="例: Stratocaster"
                />
              </div>

              {/* メーカー/ブランド */}
              <div>
                <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700">
                  メーカー／ブランド <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="manufacturer"
                  name="manufacturer"
                  required
                  value={formData.manufacturer}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="例: Fender"
                />
              </div>

              {/* 型番/シリアル */}
              <div>
                <label htmlFor="model_number" className="block text-sm font-medium text-gray-700">
                  型番／シリアル <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="model_number"
                  name="model_number"
                  required
                  value={formData.model_number}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="例: ST-62"
                />
              </div>

              {/* カラー */}
              <div>
                <label htmlFor="color" className="block text-sm font-medium text-gray-700">
                  カラー（色） <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="color"
                  name="color"
                  required
                  value={formData.color}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="例: サンバースト、ブラック、ナチュラル"
                />
              </div>

              {/* 状態 */}
              <div>
                <label htmlFor="condition" className="block text-sm font-medium text-gray-700">
                  状態／備考 <span className="text-red-500">*</span>
                </label>
                <select
                  id="condition"
                  name="condition"
                  required
                  value={formData.condition}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">選択してください</option>
                  {conditions.map(condition => (
                    <option key={condition} value={condition}>{condition}</option>
                  ))}
                </select>
              </div>

              {/* 販売価格 */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  販売価格（円） <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  required
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="例: 50000"
                />
              </div>

              {/* 備考 */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  備考（任意）
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="追加情報があれば記入してください"
                />
              </div>

              {/* メッセージ */}
              {message && (
                <div className={`text-sm ${message.includes('登録しました') ? 'text-green-600' : 'text-red-600'}`}>
                  {message}
                </div>
              )}

              {/* 送信ボタン */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-md"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md disabled:opacity-50"
                >
                  {loading ? '登録中...' : '登録する'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}