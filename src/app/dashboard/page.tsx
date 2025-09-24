'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface InventoryItem {
  id: number
  product_name: string
  manufacturer: string
  category: string
  price: number
  purchase_price?: number
  purchase_date?: string
  profit_margin?: number
  profit_amount?: number
  created_at: string
}

interface DashboardStats {
  totalItems: number
  totalAssetValue: number
  totalSalesValue: number
  totalProfitValue: number
  averageProfitMargin: number
  oldInventoryItems: number
  lowProfitItems: number
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const router = useRouter()

  // ダッシュボード統計データを取得・計算
  const fetchDashboardStats = async () => {
    setDashboardLoading(true)
    try {
      const { data: inventory, error } = await supabase
        .from('inventory')
        .select('*')

      if (error) throw error

      if (!inventory || inventory.length === 0) {
        setStats({
          totalItems: 0,
          totalAssetValue: 0,
          totalSalesValue: 0,
          totalProfitValue: 0,
          averageProfitMargin: 0,
          oldInventoryItems: 0,
          lowProfitItems: 0
        })
        return
      }

      // 統計計算
      const totalItems = inventory.length
      let totalAssetValue = 0
      let totalSalesValue = 0
      let totalProfitValue = 0
      let totalProfitMargin = 0
      let oldInventoryItems = 0
      let lowProfitItems = 0
      let profitItemsCount = 0

      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      inventory.forEach((item: InventoryItem) => {
        // 販売価格合計
        totalSalesValue += item.price || 0

        // 資産価値（仕入価格がある場合はそれを、なければ販売価格の60%を仮定）
        const assetValue = item.purchase_price || (item.price * 0.6)
        totalAssetValue += assetValue

        // 利益計算
        if (item.purchase_price && item.price) {
          const profit = item.price - item.purchase_price
          totalProfitValue += profit

          const margin = (profit / item.price) * 100
          totalProfitMargin += margin
          profitItemsCount++

          // 低利益商品（利益率20%以下）
          if (margin <= 20) {
            lowProfitItems++
          }
        }

        // 古い在庫（6ヶ月以上前）
        const itemDate = item.purchase_date
          ? new Date(item.purchase_date)
          : new Date(item.created_at)

        if (itemDate < sixMonthsAgo) {
          oldInventoryItems++
        }
      })

      const averageProfitMargin = profitItemsCount > 0
        ? totalProfitMargin / profitItemsCount
        : 0

      setStats({
        totalItems,
        totalAssetValue: Math.round(totalAssetValue),
        totalSalesValue: Math.round(totalSalesValue),
        totalProfitValue: Math.round(totalProfitValue),
        averageProfitMargin: Math.round(averageProfitMargin * 10) / 10,
        oldInventoryItems,
        lowProfitItems
      })
    } catch (error) {
      console.error('Dashboard stats error:', error)
    } finally {
      setDashboardLoading(false)
    }
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)

      if (!user) {
        router.push('/login')
      } else {
        // ユーザーがログイン済みの場合、ダッシュボードデータを取得
        fetchDashboardStats()
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          router.push('/login')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                みどり楽器 在庫管理システム
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                ログイン中: {user.email}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 経営ダッシュボード - 在庫総額 */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 overflow-hidden shadow-xl rounded-lg">
              <div className="p-8 text-white">
                {dashboardLoading ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-green-100">在庫データを計算中...</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center mb-6">
                      <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <h3 className="text-3xl font-bold">
                        💰 在庫資産総額
                      </h3>
                      <button
                        onClick={fetchDashboardStats}
                        className="ml-4 bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-full text-sm transition-all"
                      >
                        🔄 更新
                      </button>
                    </div>

                    <div className="text-center mb-6">
                      <div className="text-6xl font-bold mb-2">
                        ¥{stats?.totalAssetValue?.toLocaleString() || '0'}
                      </div>
                      <p className="text-green-100 text-xl">
                        現在の在庫資産価値（仕入ベース）
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          ¥{stats?.totalSalesValue?.toLocaleString() || '0'}
                        </div>
                        <p className="text-green-100 text-sm">販売価格総額</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          ¥{stats?.totalProfitValue?.toLocaleString() || '0'}
                        </div>
                        <p className="text-green-100 text-sm">見込み利益総額</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {stats?.averageProfitMargin || '0'}%
                        </div>
                        <p className="text-green-100 text-sm">平均利益率</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {stats?.totalItems || '0'}点
                        </div>
                        <p className="text-green-100 text-sm">総在庫数</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 警告・注意事項エリア */}
          {stats && (stats.oldInventoryItems > 0 || stats.lowProfitItems > 0) && (
            <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 滞留在庫警告 */}
              {stats.oldInventoryItems > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <svg className="w-6 h-6 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-yellow-800">
                      ⚠️ 滞留在庫あり
                    </h3>
                  </div>
                  <p className="text-yellow-700 mb-3">
                    6ヶ月以上経過した商品が <strong>{stats.oldInventoryItems}点</strong> あります
                  </p>
                  <p className="text-sm text-yellow-600 mb-3">
                    処分を検討することで在庫回転率が向上し、資金繰りが改善されます
                  </p>
                  <button
                    onClick={() => router.push('/inventory?filter=old')}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm"
                  >
                    処分候補を確認
                  </button>
                </div>
              )}

              {/* 低利益商品警告 */}
              {stats.lowProfitItems > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <svg className="w-6 h-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    </svg>
                    <h3 className="text-lg font-semibold text-red-800">
                      📉 低利益商品
                    </h3>
                  </div>
                  <p className="text-red-700 mb-3">
                    利益率20%以下の商品が <strong>{stats.lowProfitItems}点</strong> あります
                  </p>
                  <p className="text-sm text-red-600 mb-3">
                    価格見直しや仕入先変更で利益率改善を検討しましょう
                  </p>
                  <button
                    onClick={() => router.push('/inventory?filter=low-profit')}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
                  >
                    対象商品を確認
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* AI一括登録カード */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  🤖 AI一括登録
                </h3>
                <p className="text-gray-600 mb-4">
                  PDF・画像から自動で商品情報を読み取り
                </p>
                <button
                  onClick={() => router.push('/inventory/ai-bulk-import')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
                >
                  AI登録を開始
                </button>
              </div>
            </div>

            {/* 在庫入力カード */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  ✏️ 手動登録
                </h3>
                <p className="text-gray-600 mb-4">
                  フォームから新しい商品を登録
                </p>
                <button
                  onClick={() => router.push('/inventory/add')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                >
                  在庫を登録
                </button>
              </div>
            </div>

            {/* 在庫一覧カード */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  📋 在庫一覧
                </h3>
                <p className="text-gray-600 mb-4">
                  登録済み商品の一覧と検索・分析
                </p>
                <button
                  onClick={() => router.push('/inventory')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                >
                  在庫を確認
                </button>
              </div>
            </div>

            {/* 銀行レポートカード */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  🏛️ 銀行提出用レポート
                </h3>
                <p className="text-gray-600 mb-4">
                  事業概況・資産状況の詳細報告書
                </p>
                <button
                  onClick={() => router.push('/bank-report')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
                >
                  レポート作成
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}