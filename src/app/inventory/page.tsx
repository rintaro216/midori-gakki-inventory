'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Product {
  id: string
  category: string
  product_name: string
  manufacturer: string
  model_number: string
  color: string
  condition: string
  price: number
  supplier?: string
  list_price?: number
  wholesale_price?: number
  wholesale_rate?: string
  gross_margin?: number
  notes?: string
  created_at: string
  updated_at?: string
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching inventory:', error)
        setError('在庫データの取得に失敗しました')
        return
      }

      setInventory(data || [])
    } catch (err) {
      console.error('Fetch error:', err)
      setError('データ取得中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">在庫データを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error}</p>
          <button
            onClick={fetchInventory}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            再試行
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">在庫管理システム</h1>

            <div className="mb-6">
              <p className="text-gray-600">総商品数: {inventory.length}件</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inventory.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {item.product_name}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">メーカー:</span> {item.manufacturer}</p>
                    <p><span className="font-medium">モデル:</span> {item.model_number}</p>
                    <p><span className="font-medium">カテゴリ:</span> {item.category}</p>
                    <p><span className="font-medium">色:</span> {item.color}</p>
                    <p><span className="font-medium">状態:</span> {item.condition}</p>
                    <p><span className="font-medium">価格:</span> ¥{item.price.toLocaleString()}</p>
                    {item.supplier && (
                      <p><span className="font-medium">仕入先:</span> {item.supplier}</p>
                    )}
                  </div>
                  {item.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">{item.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {inventory.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">在庫データがありません</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}