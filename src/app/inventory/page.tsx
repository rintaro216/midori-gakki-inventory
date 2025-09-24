'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'
import { exportToCSV, exportToExcel } from '@/utils/exportUtils'
import EditItemModal from '@/components/EditItemModal'
import DeleteConfirmModal from '@/components/DeleteConfirmModal'

type InventoryItem = Database['public']['Tables']['inventory']['Row']

export default function InventoryPage() {
  const router = useRouter()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [manufacturerFilter, setManufacturerFilter] = useState('')
  const [colorFilter, setColorFilter] = useState('')
  const [ageFilter, setAgeFilter] = useState('') // 滞留期間フィルタ
  const [profitFilter, setProfitFilter] = useState('') // 利益率フィルタ
  const [priceRangeFilter, setPriceRangeFilter] = useState('') // 価格帯フィルタ
  const [viewMode, setViewMode] = useState<'detailed' | 'compact'>('detailed')
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

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

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setInventory(data || [])
    } catch (error) {
      console.error('在庫データの取得に失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditSave = (updatedItem: InventoryItem) => {
    setInventory(prev => prev.map(item =>
      item.id === updatedItem.id ? updatedItem : item
    ))
    setIsEditModalOpen(false)
    setEditingItem(null)
  }

  const handleDeleteConfirm = (itemId: string) => {
    setInventory(prev => prev.filter(item => item.id !== itemId))
    setIsDeleteModalOpen(false)
    setDeletingItem(null)
  }

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = searchTerm === '' ||
      item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model_number.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = categoryFilter === '' || item.category === categoryFilter
    const matchesManufacturer = manufacturerFilter === '' || item.manufacturer === manufacturerFilter
    const matchesColor = colorFilter === '' || item.color.toLowerCase().includes(colorFilter.toLowerCase())

    // 滞留在庫分析用計算
    const purchasePrice = item.purchase_price || item.wholesale_price || (item.list_price ? Math.round(item.list_price * 0.7) : Math.round(item.price * 0.6))
    const profitMargin = item.profit_margin || (purchasePrice > 0 ? ((item.price - purchasePrice) / item.price * 100) : 0)
    const itemDate = item.purchase_date ? new Date(item.purchase_date) : new Date(item.created_at)
    const daysSinceEntry = Math.floor((new Date().getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24))

    // 滞留期間フィルタ
    let matchesAge = true
    if (ageFilter === '3months') {
      matchesAge = daysSinceEntry >= 90
    } else if (ageFilter === '6months') {
      matchesAge = daysSinceEntry >= 180
    } else if (ageFilter === '1year') {
      matchesAge = daysSinceEntry >= 365
    } else if (ageFilter === '2years') {
      matchesAge = daysSinceEntry >= 730
    }

    // 利益率フィルタ
    let matchesProfit = true
    if (profitFilter === 'low') {
      matchesProfit = profitMargin <= 20
    } else if (profitFilter === 'medium') {
      matchesProfit = profitMargin > 20 && profitMargin <= 40
    } else if (profitFilter === 'high') {
      matchesProfit = profitMargin > 40
    } else if (profitFilter === 'negative') {
      matchesProfit = profitMargin < 0
    }

    // 価格帯フィルタ
    let matchesPriceRange = true
    if (priceRangeFilter === 'under10k') {
      matchesPriceRange = item.price < 10000
    } else if (priceRangeFilter === '10k-50k') {
      matchesPriceRange = item.price >= 10000 && item.price < 50000
    } else if (priceRangeFilter === '50k-100k') {
      matchesPriceRange = item.price >= 50000 && item.price < 100000
    } else if (priceRangeFilter === '100k-300k') {
      matchesPriceRange = item.price >= 100000 && item.price < 300000
    } else if (priceRangeFilter === 'over300k') {
      matchesPriceRange = item.price >= 300000
    }

    return matchesSearch && matchesCategory && matchesManufacturer && matchesColor && matchesAge && matchesProfit && matchesPriceRange
  })

  const uniqueManufacturers = Array.from(new Set(inventory.map(item => item.manufacturer))).sort()

  const totalValue = filteredInventory.reduce((sum, item) => sum + item.price, 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">在庫一覧</h1>
              <p className="text-sm text-gray-600 mt-1">
                {filteredInventory.length}件の商品 • 総額: ¥{totalValue.toLocaleString()}
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => exportToCSV(filteredInventory, 'みどり楽器_在庫一覧')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                CSV出力
              </button>
              <button
                onClick={() => exportToExcel(filteredInventory, 'みどり楽器_在庫一覧')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
              >
                Excel出力
              </button>
              <button
                onClick={() => router.push('/inventory/add')}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
              >
                在庫を追加
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
              >
                ダッシュボードに戻る
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* フィルタセクション */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">検索・フィルタ</h3>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('detailed')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'detailed'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                詳細表示
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'compact'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                コンパクト表示
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 検索 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                キーワード検索
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="商品名、メーカー、型番で検索"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* カテゴリフィルタ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                カテゴリ
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                <option value="">すべて</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* メーカーフィルタ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メーカー
              </label>
              <select
                value={manufacturerFilter}
                onChange={(e) => setManufacturerFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                <option value="">すべて</option>
                {uniqueManufacturers.map(manufacturer => (
                  <option key={manufacturer} value={manufacturer}>{manufacturer}</option>
                ))}
              </select>
            </div>

            {/* カラーフィルタ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                カラー
              </label>
              <input
                type="text"
                value={colorFilter}
                onChange={(e) => setColorFilter(e.target.value)}
                placeholder="カラーで検索"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          {/* 滞留在庫分析フィルタ */}
          <div className="mt-6 border-t pt-6">
            <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
              📊 滞留在庫分析・処分検討フィルタ
              <span className="ml-2 text-sm text-gray-500">（資金繰り改善・収益性向上）</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 滞留期間フィルタ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ⏰ 滞留期間
                </label>
                <select
                  value={ageFilter}
                  onChange={(e) => setAgeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">すべて</option>
                  <option value="3months">3ヶ月以上 (回転率検討)</option>
                  <option value="6months">6ヶ月以上 (処分検討)</option>
                  <option value="1year">1年以上 (処分推奨)</option>
                  <option value="2years">2年以上 (早急処分)</option>
                </select>
              </div>

              {/* 利益率フィルタ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  💰 利益率
                </label>
                <select
                  value={profitFilter}
                  onChange={(e) => setProfitFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">すべて</option>
                  <option value="negative">赤字 (0%未満)</option>
                  <option value="low">低利益 (20%以下)</option>
                  <option value="medium">中利益 (20-40%)</option>
                  <option value="high">高利益 (40%超)</option>
                </select>
              </div>

              {/* 価格帯フィルタ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  💵 価格帯
                </label>
                <select
                  value={priceRangeFilter}
                  onChange={(e) => setPriceRangeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">すべて</option>
                  <option value="under10k">1万円未満</option>
                  <option value="10k-50k">1万円～5万円</option>
                  <option value="50k-100k">5万円～10万円</option>
                  <option value="100k-300k">10万円～30万円</option>
                  <option value="over300k">30万円以上</option>
                </select>
              </div>
            </div>

            {/* 処分候補クイックフィルタボタン */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setAgeFilter('6months')
                  setProfitFilter('low')
                }}
                className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full text-sm border border-yellow-300"
              >
                ⚠️ 処分候補 (6ヶ月以上・低利益)
              </button>
              <button
                onClick={() => {
                  setAgeFilter('1year')
                }}
                className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-full text-sm border border-red-300"
              >
                🚨 長期滞留 (1年以上)
              </button>
              <button
                onClick={() => {
                  setProfitFilter('negative')
                }}
                className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-full text-sm border border-red-300"
              >
                📉 赤字商品
              </button>
              <button
                onClick={() => {
                  setPriceRangeFilter('over300k')
                  setAgeFilter('6months')
                }}
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm border border-blue-300"
              >
                💎 高額滞留 (30万円以上・6ヶ月以上)
              </button>
            </div>
          </div>

          {/* フィルタクリア */}
          <div className="mt-4 flex justify-between items-center">
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setCategoryFilter('')
                  setManufacturerFilter('')
                  setColorFilter('')
                }}
                className="text-green-600 hover:text-green-500 text-sm"
              >
                基本フィルタをクリア
              </button>
              <button
                onClick={() => {
                  setAgeFilter('')
                  setProfitFilter('')
                  setPriceRangeFilter('')
                }}
                className="text-orange-600 hover:text-orange-500 text-sm"
              >
                分析フィルタをクリア
              </button>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setCategoryFilter('')
                  setManufacturerFilter('')
                  setColorFilter('')
                  setAgeFilter('')
                  setProfitFilter('')
                  setPriceRangeFilter('')
                }}
                className="text-red-600 hover:text-red-500 text-sm font-medium"
              >
                すべてクリア
              </button>
            </div>
            {(ageFilter || profitFilter || priceRangeFilter) && (
              <div className="text-sm text-orange-700 bg-orange-50 px-3 py-1 rounded-full">
                分析モード: {filteredInventory.length}件表示中
              </div>
            )}
          </div>
        </div>

        {/* 在庫テーブル */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            {viewMode === 'detailed' ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      カテゴリ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      商品名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      メーカー
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      型番
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      カラー
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状態
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      価格
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      仕入れ情報
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      登録日
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      アクション
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-4 text-center text-gray-500">
                        該当する商品が見つかりません
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map((item) => {
                      const purchasePrice = item.purchase_price || item.wholesale_price || (item.list_price ? Math.round(item.list_price * 0.7) : Math.round(item.price * 0.6))
                      const profitMargin = item.profit_margin || (purchasePrice > 0 ? ((item.price - purchasePrice) / item.price * 100) : 0)
                      const itemDate = item.purchase_date ? new Date(item.purchase_date) : new Date(item.created_at)
                      const daysSinceEntry = Math.floor((new Date().getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24))

                      // 滞留アラートレベル判定
                      const isOld = daysSinceEntry >= 180 // 6ヶ月以上
                      const isVeryOld = daysSinceEntry >= 365 // 1年以上
                      const isLowProfit = profitMargin <= 20
                      const isNegativeProfit = profitMargin < 0

                      return (
                        <tr key={item.id} className={`hover:bg-gray-50 ${
                          isVeryOld ? 'bg-red-50' :
                          isOld && isLowProfit ? 'bg-yellow-50' :
                          isNegativeProfit ? 'bg-red-50' : ''
                        }`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div className="flex items-center">
                              {item.product_name}
                              {/* 滞留アラート */}
                              <div className="ml-2 flex space-x-1">
                                {isVeryOld && (
                                  <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700" title="1年以上滞留">
                                    🚨
                                  </span>
                                )}
                                {isOld && isLowProfit && (
                                  <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700" title="処分検討対象">
                                    ⚠️
                                  </span>
                                )}
                                {isNegativeProfit && (
                                  <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700" title="赤字商品">
                                    📉
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.manufacturer}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.model_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {item.color}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.condition === '新品' ? 'bg-green-100 text-green-800' :
                              item.condition === '中古' ? 'bg-yellow-100 text-yellow-800' :
                              item.condition === '展示品' ? 'bg-blue-100 text-blue-800' :
                              item.condition === 'B級品' ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {item.condition}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            ¥{item.price.toLocaleString()}
                            <div className="text-xs text-gray-500 mt-1">
                              利益率: {profitMargin.toFixed(1)}%
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.purchase_price ? (
                              <div>
                                <div className="font-medium">
                                  ¥{item.purchase_price.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  仕入価格
                                </div>
                                {item.purchase_date && (
                                  <div className="text-xs text-gray-500">
                                    {new Date(item.purchase_date).toLocaleDateString('ja-JP')}
                                  </div>
                                )}
                                {item.supplier && (
                                  <div className="text-xs text-gray-500 truncate max-w-20" title={item.supplier}>
                                    {item.supplier}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400 italic">
                                仕入情報なし
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(item.created_at).toLocaleDateString('ja-JP')}
                            <div className="text-xs text-gray-400 mt-1">
                              {daysSinceEntry}日経過
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setEditingItem(item)
                                  setIsEditModalOpen(true)
                                }}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                編集
                              </button>
                              <button
                                onClick={() => {
                                  setDeletingItem(item)
                                  setIsDeleteModalOpen(true)
                                }}
                                className="text-red-600 hover:text-red-900"
                              >
                                削除
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            ) : (
              /* コンパクト表示（経理・管理重視） */
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      商品情報
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      仕入価格
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      販売価格
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      利益率
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      登録日・状態
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-3 text-center text-gray-500">
                        該当する商品が見つかりません
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map((item) => {
                      // 仕入価格の計算（統合後：purchase_price → wholesale_price → 推定価格の順）
                      const purchasePrice = item.purchase_price || item.wholesale_price || (item.list_price ? Math.round(item.list_price * 0.7) : Math.round(item.price * 0.6))
                      // 利益率の計算（統合後：profit_marginがあればそれを、なければ計算）
                      const profitMargin = item.profit_margin || (purchasePrice > 0 ? ((item.price - purchasePrice) / item.price * 100) : 0)
                      // 登録からの日数計算
                      const itemDate = item.purchase_date ? new Date(item.purchase_date) : new Date(item.created_at)
                      const daysSinceEntry = Math.floor((new Date().getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24))

                      // 滞留アラートレベル判定
                      const isOld = daysSinceEntry >= 180 // 6ヶ月以上
                      const isVeryOld = daysSinceEntry >= 365 // 1年以上
                      const isLowProfit = profitMargin <= 20
                      const isNegativeProfit = profitMargin < 0

                      return (
                        <tr key={item.id} className={`hover:bg-gray-50 ${
                          isVeryOld ? 'bg-red-50' :
                          isOld && isLowProfit ? 'bg-yellow-50' :
                          isNegativeProfit ? 'bg-red-50' : ''
                        }`}>
                          <td className="px-3 py-2">
                            <div>
                              <div className="text-sm font-medium text-gray-900 truncate max-w-xs flex items-center">
                                {item.product_name}
                                {/* 滞留アラート */}
                                <div className="ml-2 flex space-x-1">
                                  {isVeryOld && (
                                    <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700" title="1年以上滞留">
                                      🚨
                                    </span>
                                  )}
                                  {isOld && isLowProfit && (
                                    <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700" title="処分検討対象">
                                      ⚠️
                                    </span>
                                  )}
                                  {isNegativeProfit && (
                                    <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700" title="赤字商品">
                                      📉
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                {item.manufacturer} • {item.category}
                              </div>
                              {item.model_number && (
                                <div className="text-xs text-gray-400">
                                  型番: {item.model_number}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="text-sm text-gray-900">
                              ¥{purchasePrice.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.purchase_price ? '実際の仕入価格' : item.wholesale_price ? '卸価格' : 'list_priceがあればその70%、なければ販売価格の60%で算出'}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="text-sm font-medium text-gray-900">
                              ¥{item.price.toLocaleString()}
                            </div>
                            {item.list_price && (
                              <div className="text-xs text-gray-500">
                                定価: ¥{item.list_price.toLocaleString()}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className={`text-sm font-medium ${
                              profitMargin >= 50 ? 'text-green-600' :
                              profitMargin >= 30 ? 'text-blue-600' :
                              profitMargin >= 10 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {profitMargin.toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500">
                              利益: ¥{item.profit_amount ? item.profit_amount.toLocaleString() : (item.price - purchasePrice).toLocaleString()}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="text-xs text-gray-900">
                              {new Date(item.created_at).toLocaleDateString('ja-JP')}
                            </div>
                            <div className={`text-xs ${
                              daysSinceEntry >= 365 ? 'text-red-600 font-medium' :
                              daysSinceEntry >= 180 ? 'text-yellow-600 font-medium' :
                              'text-gray-500'
                            }`}>
                              {daysSinceEntry}日経過
                            </div>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                              item.condition === '新品' ? 'bg-green-100 text-green-800' :
                              item.condition === '中古' ? 'bg-yellow-100 text-yellow-800' :
                              item.condition === '展示品' ? 'bg-blue-100 text-blue-800' :
                              item.condition === 'B級品' ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {item.condition}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-col space-y-1">
                              <button
                                onClick={() => {
                                  setEditingItem(item)
                                  setIsEditModalOpen(true)
                                }}
                                className="text-indigo-600 hover:text-indigo-900 text-xs"
                              >
                                編集
                              </button>
                              <button
                                onClick={() => {
                                  setDeletingItem(item)
                                  setIsDeleteModalOpen(true)
                                }}
                                className="text-red-600 hover:text-red-900 text-xs"
                              >
                                削除
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <EditItemModal
        item={editingItem}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingItem(null)
        }}
        onSave={handleEditSave}
      />

      {/* Delete Modal */}
      <DeleteConfirmModal
        item={deletingItem}
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setDeletingItem(null)
        }}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}