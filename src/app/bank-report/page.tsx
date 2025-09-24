'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type InventoryItem = Database['public']['Tables']['inventory']['Row']

interface BankReportData {
  totalItems: number
  totalAssetValue: number
  totalSalesValue: number
  totalProfitValue: number
  averageProfitMargin: number
  categoryBreakdown: { [category: string]: { count: number, value: number } }
  manufacturerBreakdown: { [manufacturer: string]: { count: number, value: number } }
  conditionBreakdown: { [condition: string]: { count: number, value: number } }
  monthlyTrend: Array<{ month: string, count: number, value: number }>
}

export default function BankReportPage() {
  const router = useRouter()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [reportData, setReportData] = useState<BankReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [reportDate] = useState(new Date().toLocaleDateString('ja-JP'))

  useEffect(() => {
    fetchInventoryAndGenerateReport()
  }, [])

  const fetchInventoryAndGenerateReport = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (!data) {
        setReportData({
          totalItems: 0,
          totalAssetValue: 0,
          totalSalesValue: 0,
          totalProfitValue: 0,
          averageProfitMargin: 0,
          categoryBreakdown: {},
          manufacturerBreakdown: {},
          conditionBreakdown: {},
          monthlyTrend: []
        })
        return
      }

      setInventory(data)
      generateReportData(data)
    } catch (error) {
      console.error('在庫データの取得に失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateReportData = (inventoryData: InventoryItem[]) => {
    let totalAssetValue = 0
    let totalSalesValue = 0
    let totalProfitValue = 0
    let totalProfitMargin = 0
    let profitItemsCount = 0

    const categoryBreakdown: { [category: string]: { count: number, value: number } } = {}
    const manufacturerBreakdown: { [manufacturer: string]: { count: number, value: number } } = {}
    const conditionBreakdown: { [condition: string]: { count: number, value: number } } = {}
    const monthlyData: { [month: string]: { count: number, value: number } } = {}

    inventoryData.forEach((item) => {
      // 販売価格合計
      totalSalesValue += item.price || 0

      // 資産価値（仕入価格または推定値）
      const assetValue = item.purchase_price || (item.price * 0.6)
      totalAssetValue += assetValue

      // 利益計算
      if (item.purchase_price && item.price) {
        const profit = item.price - item.purchase_price
        totalProfitValue += profit

        const margin = (profit / item.price) * 100
        totalProfitMargin += margin
        profitItemsCount++
      }

      // カテゴリ別集計
      if (!categoryBreakdown[item.category]) {
        categoryBreakdown[item.category] = { count: 0, value: 0 }
      }
      categoryBreakdown[item.category].count++
      categoryBreakdown[item.category].value += assetValue

      // メーカー別集計
      if (!manufacturerBreakdown[item.manufacturer]) {
        manufacturerBreakdown[item.manufacturer] = { count: 0, value: 0 }
      }
      manufacturerBreakdown[item.manufacturer].count++
      manufacturerBreakdown[item.manufacturer].value += assetValue

      // 状態別集計
      if (!conditionBreakdown[item.condition]) {
        conditionBreakdown[item.condition] = { count: 0, value: 0 }
      }
      conditionBreakdown[item.condition].count++
      conditionBreakdown[item.condition].value += assetValue

      // 月別トレンド
      const month = new Date(item.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short' })
      if (!monthlyData[month]) {
        monthlyData[month] = { count: 0, value: 0 }
      }
      monthlyData[month].count++
      monthlyData[month].value += assetValue
    })

    const monthlyTrend = Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-12) // 直近12ヶ月

    const averageProfitMargin = profitItemsCount > 0 ? totalProfitMargin / profitItemsCount : 0

    setReportData({
      totalItems: inventoryData.length,
      totalAssetValue: Math.round(totalAssetValue),
      totalSalesValue: Math.round(totalSalesValue),
      totalProfitValue: Math.round(totalProfitValue),
      averageProfitMargin: Math.round(averageProfitMargin * 10) / 10,
      categoryBreakdown,
      manufacturerBreakdown,
      conditionBreakdown,
      monthlyTrend
    })
  }

  const printReport = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>レポートを生成中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 印刷時以外に表示されるヘッダー */}
      <header className="bg-white shadow print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">銀行提出用 事業報告書</h1>
              <p className="text-sm text-gray-600 mt-1">
                作成日: {reportDate}
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={printReport}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                印刷・PDF保存
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

      {/* 印刷用レポート本体 */}
      <main className="max-w-4xl mx-auto py-8 px-4 print:py-0 print:px-0">
        {/* レポートヘッダー */}
        <div className="text-center mb-8 print:mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 print:text-2xl">
            みどり楽器 事業概況報告書
          </h1>
          <p className="text-lg text-gray-600 print:text-base">
            在庫資産・事業状況詳細レポート
          </p>
          <p className="text-sm text-gray-500 mt-2">
            作成日: {reportDate} | 対象期間: 全期間
          </p>
        </div>

        {reportData && (
          <>
            {/* 事業概要サマリー */}
            <section className="mb-8 print:mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 print:text-xl">
                📊 事業概要サマリー
              </h2>
              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg print:bg-gray-50 print:border">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 print:text-xl">
                      {reportData.totalItems}点
                    </div>
                    <div className="text-sm text-gray-600">総在庫数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 print:text-xl">
                      ¥{reportData.totalAssetValue.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">総資産価値</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 print:text-xl">
                      ¥{reportData.totalSalesValue.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">販売予定総額</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 print:text-xl">
                      {reportData.averageProfitMargin}%
                    </div>
                    <div className="text-sm text-gray-600">平均利益率</div>
                  </div>
                </div>
              </div>
            </section>

            {/* カテゴリ別資産内訳 */}
            <section className="mb-8 print:mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 print:text-xl">
                🎵 商品カテゴリ別資産内訳
              </h2>
              <div className="bg-white border rounded-lg overflow-hidden print:border-gray-300">
                <table className="w-full">
                  <thead className="bg-gray-50 print:bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        カテゴリ
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        商品数
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        資産価値
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        構成比
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(reportData.categoryBreakdown)
                      .sort(([,a], [,b]) => b.value - a.value)
                      .map(([category, data]) => (
                        <tr key={category}>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {category}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-right">
                            {data.count}点
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                            ¥{data.value.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-right">
                            {((data.value / reportData.totalAssetValue) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 主要メーカー分析 */}
            <section className="mb-8 print:mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 print:text-xl">
                🏭 主要取扱メーカー（上位10社）
              </h2>
              <div className="bg-white border rounded-lg overflow-hidden print:border-gray-300">
                <table className="w-full">
                  <thead className="bg-gray-50 print:bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        メーカー名
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        商品数
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        資産価値
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(reportData.manufacturerBreakdown)
                      .sort(([,a], [,b]) => b.value - a.value)
                      .slice(0, 10)
                      .map(([manufacturer, data]) => (
                        <tr key={manufacturer}>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {manufacturer}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-right">
                            {data.count}点
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                            ¥{data.value.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 商品状態別分析 */}
            <section className="mb-8 print:mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 print:text-xl">
                ⭐ 商品状態別資産構成
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(reportData.conditionBreakdown)
                  .sort(([,a], [,b]) => b.value - a.value)
                  .map(([condition, data]) => (
                    <div key={condition} className="bg-gray-50 p-4 rounded-lg print:border">
                      <h3 className="font-medium text-gray-900 mb-2">{condition}</h3>
                      <div className="text-lg font-bold text-blue-600 mb-1">
                        ¥{data.value.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        {data.count}点 • {((data.value / reportData.totalAssetValue) * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
              </div>
            </section>

            {/* 事業の強みと特徴 */}
            <section className="mb-8 print:mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 print:text-xl">
                💪 事業の強みと特徴
              </h2>
              <div className="bg-blue-50 p-6 rounded-lg print:bg-gray-50 print:border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3">🎯 事業の特徴</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• 総在庫点数: {reportData.totalItems}点の豊富な品揃え</li>
                      <li>• 平均利益率: {reportData.averageProfitMargin}%の健全な収益性</li>
                      <li>• 多様なメーカー: {Object.keys(reportData.manufacturerBreakdown).length}社との取引実績</li>
                      <li>• 幅広いカテゴリ: {Object.keys(reportData.categoryBreakdown).length}分野での専門性</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3">📈 財務健全性</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• 総資産価値: ¥{reportData.totalAssetValue.toLocaleString()}</li>
                      <li>• 潜在販売総額: ¥{reportData.totalSalesValue.toLocaleString()}</li>
                      <li>• 見込み利益総額: ¥{reportData.totalProfitValue.toLocaleString()}</li>
                      <li>• 在庫回転によるキャッシュフロー改善余地大</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* レポート末尾 */}
            <section className="text-center pt-6 print:pt-4">
              <div className="border-t border-gray-200 pt-4 print:border-black">
                <p className="text-sm text-gray-600">
                  本資料は みどり楽器 の在庫管理システムより自動生成されたものです
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  データ最終更新: {reportDate} | システム生成レポート
                </p>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}