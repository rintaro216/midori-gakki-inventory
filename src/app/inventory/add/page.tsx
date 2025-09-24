'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ImageOCR from '@/components/ImageOCR'
import PDFExtractor from '@/components/PDFExtractor'
import CSVImport from '@/components/CSVImport'

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

// 楽器店用カラーオプション（みどり楽器ブランドカラー：緑・オレンジ基調）
const instrumentColors = [
  { name: 'ナチュラル', value: 'ナチュラル', bgColor: '#F5DEB3', textColor: '#8B4513', description: '木目' },
  { name: 'エイジドナチュラル', value: 'エイジドナチュラル', bgColor: '#D2B48C', textColor: '#654321', description: '経年変化木目' },
  { name: 'ブラック', value: 'ブラック', bgColor: '#000000', textColor: '#FFFFFF', description: '黒' },
  { name: 'ホワイト', value: 'ホワイト', bgColor: '#FFFFFF', textColor: '#000000', description: '白' },
  { name: 'レッド', value: 'レッド', bgColor: '#DC143C', textColor: '#FFFFFF', description: '赤' },
  { name: 'チェリーレッド', value: 'チェリーレッド', bgColor: '#B22222', textColor: '#FFFFFF', description: 'チェリー' },
  { name: 'ブルー', value: 'ブルー', bgColor: '#4169E1', textColor: '#FFFFFF', description: '青' },
  { name: 'ライトブルー', value: 'ライトブルー', bgColor: '#87CEEB', textColor: '#000000', description: '水色' },
  { name: 'グリーン', value: 'グリーン', bgColor: '#228B22', textColor: '#FFFFFF', description: '緑 (店舗カラー)' },
  { name: 'オレンジ', value: 'オレンジ', bgColor: '#FF8C00', textColor: '#FFFFFF', description: 'オレンジ (店舗カラー)' },
  { name: 'イエロー', value: 'イエロー', bgColor: '#FFD700', textColor: '#000000', description: '黄' },
  { name: '3トーンサンバースト', value: '3トーンサンバースト', bgColor: 'linear-gradient(to right, #8B4513, #FF8C00, #FFD700)', textColor: '#FFFFFF', description: '茶→橙→黄' },
  { name: '2トーンサンバースト', value: '2トーンサンバースト', bgColor: 'linear-gradient(to right, #FF8C00, #FFD700)', textColor: '#FFFFFF', description: '橙→黄' },
  { name: 'チェリーサンバースト', value: 'チェリーサンバースト', bgColor: 'linear-gradient(to right, #8B0000, #DC143C)', textColor: '#FFFFFF', description: '濃赤→赤' },
  { name: 'マホガニー', value: 'マホガニー', bgColor: '#C04000', textColor: '#FFFFFF', description: 'マホガニー材' },
  { name: 'メイプル', value: 'メイプル', bgColor: '#DEB887', textColor: '#8B4513', description: 'メイプル材' },
  { name: 'ローズウッド', value: 'ローズウッド', bgColor: '#65000B', textColor: '#FFFFFF', description: 'ローズウッド材' },
  { name: 'パープル', value: 'パープル', bgColor: '#800080', textColor: '#FFFFFF', description: '紫' },
  { name: 'ピンク', value: 'ピンク', bgColor: '#FF69B4', textColor: '#FFFFFF', description: 'ピンク' },
  { name: 'ゴールド', value: 'ゴールド', bgColor: '#FFD700', textColor: '#000000', description: '金色' },
  { name: 'シルバー', value: 'シルバー', bgColor: '#C0C0C0', textColor: '#000000', description: '銀色' },
  { name: '限定色', value: '限定色', bgColor: '#FF1493', textColor: '#FFFFFF', description: '特別カラー' },
  { name: 'その他', value: 'その他', bgColor: '#808080', textColor: '#FFFFFF', description: '上記以外' }
]

export default function AddInventoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeMethod, setActiveMethod] = useState<'csv' | 'pdf' | 'image' | 'manual'>('csv')
  const [formData, setFormData] = useState({
    category: '',
    product_name: '',
    manufacturer: '',
    model_number: '',
    color: '',
    condition: '',
    price: '',
    supplier: '',
    list_price: '',
    wholesale_price: '',
    wholesale_rate: '',
    gross_margin: '',
    notes: '',
    // 仕入れ管理フィールド（統合）
    purchase_date: new Date().toISOString().split('T')[0],
    purchase_price: '',
    invoice_number: '',
    invoice_date: '',
    payment_status: '未払い',
    payment_date: '',
    payment_method: ''
  })
  const [message, setMessage] = useState('')

  const calculateValues = (data: typeof formData) => {
    const listPrice = parseFloat(data.list_price) || 0
    const wholesalePrice = parseFloat(data.wholesale_price) || 0
    const sellingPrice = parseFloat(data.price) || 0
    const purchasePrice = parseFloat(data.purchase_price) || 0

    let calculatedData = { ...data }

    // 卸率の計算
    if (listPrice > 0 && wholesalePrice > 0) {
      const rate = (wholesalePrice / listPrice) * 100
      calculatedData.wholesale_rate = rate.toFixed(1)
    }

    // 粗利の計算（販売価格 - 卸価格 または 販売価格 - 仕入れ価格）
    if (sellingPrice > 0) {
      let margin = 0
      if (purchasePrice > 0) {
        // 仕入れ価格がある場合は仕入れ価格を使用
        margin = sellingPrice - purchasePrice
      } else if (wholesalePrice > 0) {
        // 仕入れ価格がない場合は卸価格を使用
        margin = sellingPrice - wholesalePrice
      }
      calculatedData.gross_margin = margin.toString()
    }

    return calculatedData
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const newData = {
      ...formData,
      [name]: value
    }

    if (name === 'list_price' || name === 'wholesale_price' || name === 'price' || name === 'purchase_price') {
      const calculatedData = calculateValues(newData)
      setFormData(calculatedData)
    } else {
      setFormData(newData)
    }
  }

  const handleProductInfoExtracted = (productInfo: any, source: 'image' | 'pdf' = 'image') => {
    const newData = {
      ...formData,
      product_name: productInfo.name || formData.product_name,
      manufacturer: productInfo.brand || formData.manufacturer,
      model_number: productInfo.model || formData.model_number,
      price: productInfo.price || formData.price,
      category: productInfo.category ?
        (categories.includes(productInfo.category) ? productInfo.category : formData.category)
        : formData.category
    }

    const calculatedData = calculateValues(newData)
    setFormData(calculatedData)

    const sourceText = source === 'pdf' ? 'PDF' : '画像'
    setMessage(`${sourceText}から商品情報を読み取りました。内容をご確認ください。`)
  }

  const handleCSVImportComplete = () => {
    setMessage('CSVファイルから商品を一括登録しました！')
    setTimeout(() => {
      router.push('/dashboard')
    }, 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (!formData.price || parseFloat(formData.price) <= 0) {
        throw new Error('販売価格を正しく入力してください')
      }

      // 利益率の計算（仕入れ価格がある場合）
      let profitMargin = null
      let profitAmount = null
      if (formData.purchase_price && parseFloat(formData.purchase_price) > 0 && parseFloat(formData.price) > 0) {
        const purchase = parseFloat(formData.purchase_price)
        const selling = parseFloat(formData.price)
        profitMargin = ((selling - purchase) / selling * 100)
        profitAmount = selling - purchase
      }

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
          supplier: formData.supplier || null,
          list_price: formData.list_price ? parseInt(formData.list_price) : null,
          wholesale_price: formData.wholesale_price ? parseInt(formData.wholesale_price) : null,
          wholesale_rate: formData.wholesale_rate ? parseFloat(formData.wholesale_rate) : null,
          gross_margin: formData.gross_margin ? parseInt(formData.gross_margin) : null,
          notes: formData.notes || null,
          // 仕入れ管理フィールド（統合）
          purchase_date: formData.purchase_date || null,
          purchase_price: formData.purchase_price ? parseInt(formData.purchase_price) : null,
          invoice_number: formData.invoice_number || null,
          invoice_date: formData.invoice_date || null,
          payment_status: formData.payment_status || '未払い',
          payment_date: formData.payment_date || null,
          payment_method: formData.payment_method || null,
          profit_margin: profitMargin ? parseFloat(profitMargin.toFixed(2)) : null,
          profit_amount: profitAmount ? parseInt(profitAmount.toString()) : null
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
        supplier: '',
        list_price: '',
        wholesale_price: '',
        wholesale_rate: '',
        gross_margin: '',
        notes: '',
        // 仕入れ管理フィールド（統合）
        purchase_date: new Date().toISOString().split('T')[0],
        purchase_price: '',
        invoice_number: '',
        invoice_date: '',
        payment_status: '未払い',
        payment_date: '',
        payment_method: ''
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
            <h1 className="text-3xl font-bold text-gray-900">商品登録</h1>
            <button
              onClick={() => router.push('/inventory')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
            >
              ダッシュボードに戻る
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* 登録方法選択カード */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            どの方法で商品を登録しますか？
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* CSV一括登録 */}
            <div
              onClick={() => setActiveMethod('csv')}
              className={`cursor-pointer rounded-lg p-6 border-2 transition-all ${
                activeMethod === 'csv'
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
              }`}
            >
              <div className="text-center">
                <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100 mb-4">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">📊 CSV一括登録</h3>
                <p className="text-sm text-gray-600">
                  Excel・スプレッドシートで作成したCSVファイルから複数商品を一度に登録
                </p>
                <div className="mt-3 text-xs text-green-600 font-medium">
                  ✨ 推奨！大量登録に最適
                </div>
              </div>
            </div>

            {/* 手動入力 */}
            <div
              onClick={() => setActiveMethod('manual')}
              className={`cursor-pointer rounded-lg p-6 border-2 transition-all ${
                activeMethod === 'manual'
                  ? 'border-gray-500 bg-gray-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}
            >
              <div className="text-center">
                <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gray-100 mb-4">
                  <svg className="h-8 w-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">✏️ 手動入力</h3>
                <p className="text-sm text-gray-600">
                  フォームに直接入力して1点ずつ登録（仕入れ管理対応）
                </p>
                <div className="mt-3 text-xs text-blue-600 font-medium">
                  📊 利益計算機能付き
                </div>
              </div>
            </div>

            {/* PDF自動読取 */}
            <div
              onClick={() => setActiveMethod('pdf')}
              className={`cursor-pointer rounded-lg p-6 border-2 transition-all ${
                activeMethod === 'pdf'
                  ? 'border-green-500 bg-green-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md'
              }`}
            >
              <div className="text-center">
                <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100 mb-4">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">📄 PDF自動読取</h3>
                <p className="text-sm text-gray-600">
                  商品カタログ・請求書のPDFから商品情報を自動で読み取り
                </p>
                <div className="mt-3 text-xs text-blue-600 font-medium">
                  🤖 AI自動処理
                </div>
              </div>
            </div>

            {/* 写真読取 */}
            <div
              onClick={() => setActiveMethod('image')}
              className={`cursor-pointer rounded-lg p-6 border-2 transition-all ${
                activeMethod === 'image'
                  ? 'border-purple-500 bg-purple-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
              }`}
            >
              <div className="text-center">
                <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-purple-100 mb-4">
                  <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">📷 写真読取</h3>
                <p className="text-sm text-gray-600">
                  商品ラベル・値札の写真から商品情報を自動で読み取り
                </p>
                <div className="mt-3 text-xs text-blue-600 font-medium">
                  📱 モバイル対応
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 選択された方法のコンテンツ */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-6">
            {/* CSV一括登録 */}
            {activeMethod === 'csv' && (
              <div>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">📊 CSV一括登録</h3>
                  <p className="text-gray-600">
                    CSVファイルをアップロードして複数の商品を一度に登録できます
                  </p>
                </div>
                <CSVImport onImportComplete={handleCSVImportComplete} />
              </div>
            )}

            {/* 手動入力 - 仕入れ管理フィールド付き完全版フォーム */}
            {activeMethod === 'manual' && (
              <div>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">✏️ 手動入力</h3>
                  <p className="text-gray-600">
                    フォームに直接入力して商品を登録します（仕入れ管理・利益計算対応版）
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 基本情報 */}
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

                    <div>
                      <label htmlFor="model_number" className="block text-sm font-medium text-gray-700">
                        型番／シリアル
                      </label>
                      <input
                        type="text"
                        id="model_number"
                        name="model_number"
                        value={formData.model_number}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="例: ST-62"
                      />
                    </div>

                    <div>
                      <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-3">
                        カラー（色） <span className="text-sm text-gray-500">※楽器の色を選択</span>
                      </label>

                      {/* ビジュアルカラー選択 */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                        {instrumentColors.map((colorOption) => (
                          <button
                            key={colorOption.value}
                            type="button"
                            onClick={() => setFormData({...formData, color: colorOption.value})}
                            className={`
                              relative p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105
                              ${formData.color === colorOption.value
                                ? 'border-green-600 ring-2 ring-green-500 ring-opacity-50 shadow-lg'
                                : 'border-gray-200 hover:border-green-400'
                              }
                            `}
                            style={{
                              background: colorOption.bgColor.includes('gradient')
                                ? colorOption.bgColor
                                : colorOption.bgColor,
                              color: colorOption.textColor
                            }}
                          >
                            <div className="text-center">
                              <div className="font-medium text-xs mb-1">
                                {colorOption.name}
                              </div>
                              <div className="text-xs opacity-80">
                                {colorOption.description}
                              </div>
                            </div>
                            {formData.color === colorOption.value && (
                              <div className="absolute -top-1 -right-1 bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>

                      {/* カスタム色入力（その他選択時） */}
                      {formData.color === 'その他' && (
                        <div className="mt-3">
                          <input
                            type="text"
                            placeholder="カスタムカラーを入力してください"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            onChange={(e) => setFormData({...formData, color: e.target.value || 'その他'})}
                          />
                        </div>
                      )}

                      {/* 選択されたカラー表示 */}
                      {formData.color && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                          <span className="text-sm text-gray-600">選択されたカラー: </span>
                          <span className="font-medium text-green-700">{formData.color}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="condition" className="block text-sm font-medium text-gray-700">
                        状態 <span className="text-red-500">*</span>
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

                    {/* 仕入れ管理情報 */}
                    <div className="md:col-span-2">
                      <h4 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">📅 仕入れ管理情報</h4>
                    </div>

                    <div>
                      <label htmlFor="purchase_date" className="block text-sm font-medium text-gray-700">
                        仕入れ日
                      </label>
                      <input
                        type="date"
                        id="purchase_date"
                        name="purchase_date"
                        value={formData.purchase_date}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="purchase_price" className="block text-sm font-medium text-gray-700">
                        仕入れ価格（円）
                      </label>
                      <input
                        type="number"
                        id="purchase_price"
                        name="purchase_price"
                        min="0"
                        value={formData.purchase_price}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="例: 30000"
                      />
                    </div>

                    <div>
                      <label htmlFor="supplier" className="block text-sm font-medium text-gray-700">
                        仕入先
                      </label>
                      <input
                        type="text"
                        id="supplier"
                        name="supplier"
                        value={formData.supplier}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="例: 楽器商事"
                      />
                    </div>

                    <div>
                      <label htmlFor="invoice_number" className="block text-sm font-medium text-gray-700">
                        請求書番号
                      </label>
                      <input
                        type="text"
                        id="invoice_number"
                        name="invoice_number"
                        value={formData.invoice_number}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="例: INV-2024-001"
                      />
                    </div>

                    <div>
                      <label htmlFor="invoice_date" className="block text-sm font-medium text-gray-700">
                        請求書発行日
                      </label>
                      <input
                        type="date"
                        id="invoice_date"
                        name="invoice_date"
                        value={formData.invoice_date}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="payment_status" className="block text-sm font-medium text-gray-700">
                        支払い状況
                      </label>
                      <select
                        id="payment_status"
                        name="payment_status"
                        value={formData.payment_status}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="未払い">未払い</option>
                        <option value="支払済み">支払済み</option>
                        <option value="部分支払い">部分支払い</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="payment_date" className="block text-sm font-medium text-gray-700">
                        支払日
                      </label>
                      <input
                        type="date"
                        id="payment_date"
                        name="payment_date"
                        value={formData.payment_date}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700">
                        支払い方法
                      </label>
                      <input
                        type="text"
                        id="payment_method"
                        name="payment_method"
                        value={formData.payment_method}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="例: 銀行振込"
                      />
                    </div>

                    {/* 販売価格情報 */}
                    <div className="md:col-span-2">
                      <h4 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">💰 販売価格情報</h4>
                    </div>

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

                    {/* 計算結果 */}
                    <div className="md:col-span-2">
                      <h4 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">📊 利益計算（自動計算）</h4>
                    </div>

                    {formData.purchase_price && formData.price && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            利益率（%）
                          </label>
                          <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-green-50 text-green-800 font-medium">
                            {formData.purchase_price && formData.price ?
                              (((parseFloat(formData.price) - parseFloat(formData.purchase_price)) / parseFloat(formData.price)) * 100).toFixed(1) + '%'
                              : '計算できません'
                            }
                          </div>
                          <p className="text-xs text-gray-500 mt-1">(販売価格 - 仕入れ価格) ÷ 販売価格 × 100</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            利益額（円）
                          </label>
                          <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-green-50 text-green-800 font-medium">
                            {formData.purchase_price && formData.price ?
                              `¥${(parseFloat(formData.price) - parseFloat(formData.purchase_price)).toLocaleString()}`
                              : '計算できません'
                            }
                          </div>
                          <p className="text-xs text-gray-500 mt-1">販売価格 - 仕入れ価格</p>
                        </div>
                      </>
                    )}

                    {/* 参考価格情報 */}
                    <div className="md:col-span-2">
                      <h4 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">💰 参考価格情報</h4>
                    </div>

                    <div>
                      <label htmlFor="list_price" className="block text-sm font-medium text-gray-700">
                        定価（円）
                      </label>
                      <input
                        type="number"
                        id="list_price"
                        name="list_price"
                        min="0"
                        value={formData.list_price}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="例: 80000"
                      />
                    </div>

                    <div>
                      <label htmlFor="wholesale_price" className="block text-sm font-medium text-gray-700">
                        卸価格（円）
                      </label>
                      <input
                        type="number"
                        id="wholesale_price"
                        name="wholesale_price"
                        min="0"
                        value={formData.wholesale_price}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="例: 40000"
                      />
                    </div>

                    <div>
                      <label htmlFor="wholesale_rate" className="block text-sm font-medium text-gray-700">
                        卸率（%）
                      </label>
                      <input
                        type="text"
                        id="wholesale_rate"
                        name="wholesale_rate"
                        value={formData.wholesale_rate}
                        readOnly
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700"
                        placeholder="自動計算されます"
                      />
                      <p className="mt-1 text-xs text-gray-500">定価と卸価格から自動計算</p>
                    </div>

                    <div>
                      <label htmlFor="gross_margin" className="block text-sm font-medium text-gray-700">
                        粗利（円）
                      </label>
                      <input
                        type="text"
                        id="gross_margin"
                        name="gross_margin"
                        value={formData.gross_margin}
                        readOnly
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700"
                        placeholder="自動計算されます"
                      />
                      <p className="mt-1 text-xs text-gray-500">販売価格 - 仕入れ価格（または卸価格）</p>
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                        備考
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        value={formData.notes}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="商品の詳細情報、特記事項など"
                      />
                    </div>
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
                      onClick={() => router.push('/inventory')}
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
            )}

            {/* PDF・画像読取は簡略版として残す */}
            {(activeMethod === 'pdf' || activeMethod === 'image') && (
              <div>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {activeMethod === 'pdf' ? '📄 PDF自動読取' : '📷 写真読取'}
                  </h3>
                  <p className="text-gray-600">
                    より詳細な仕入れ管理情報の入力は「手動入力」をお使いください
                  </p>
                </div>
                {activeMethod === 'pdf' ? (
                  <PDFExtractor onProductInfoExtracted={(info) => handleProductInfoExtracted(info, 'pdf')} />
                ) : (
                  <ImageOCR onProductInfoExtracted={(info) => handleProductInfoExtracted(info, 'image')} />
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}