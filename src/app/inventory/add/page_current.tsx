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
    notes: ''
  })
  const [message, setMessage] = useState('')

  const calculateValues = (data: typeof formData) => {
    const listPrice = parseFloat(data.list_price) || 0
    const wholesalePrice = parseFloat(data.wholesale_price) || 0
    const sellingPrice = parseFloat(data.price) || 0

    let calculatedData = { ...data }

    if (listPrice > 0 && wholesalePrice > 0) {
      const rate = (wholesalePrice / listPrice) * 100
      calculatedData.wholesale_rate = rate.toFixed(1)
    }

    if (sellingPrice > 0 && wholesalePrice > 0) {
      const margin = sellingPrice - wholesalePrice
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

    if (name === 'list_price' || name === 'wholesale_price' || name === 'price') {
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
    // 一覧ページにリダイレクト
    setTimeout(() => {
      router.push('/inventory')
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
        supplier: '',
        list_price: '',
        wholesale_price: '',
        wholesale_rate: '',
        gross_margin: '',
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
            <h1 className="text-3xl font-bold text-gray-900">商品登録</h1>
            <button
              onClick={() => router.push('/inventory')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
            >
              在庫一覧に戻る
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
                  フォームに直接入力して1点ずつ登録
                </p>
                <div className="mt-3 text-xs text-gray-500 font-medium">
                  単発登録・調整用
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

            {/* PDF自動読取 */}
            {activeMethod === 'pdf' && (
              <div>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">📄 PDF自動読取</h3>
                  <p className="text-gray-600">
                    商品カタログや請求書のPDFから商品情報を自動で読み取ります
                  </p>
                </div>
                <PDFExtractor onProductInfoExtracted={(info) => handleProductInfoExtracted(info, 'pdf')} />

                {/* PDF読取後の個別登録フォーム */}
                {(formData.product_name || formData.manufacturer || formData.price) && (
                  <div className="mt-8 border-t pt-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">読み取った商品情報を確認・登録</h4>
                    {/* 簡略化されたフォーム */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">商品名</label>
                        <input
                          type="text"
                          name="product_name"
                          value={formData.product_name}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">メーカー</label>
                        <input
                          type="text"
                          name="manufacturer"
                          value={formData.manufacturer}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">価格</label>
                        <input
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">カテゴリ</label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                          <option value="">選択してください</option>
                          {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md disabled:opacity-50"
                    >
                      {loading ? '登録中...' : 'この商品を登録'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 写真読取 */}
            {activeMethod === 'image' && (
              <div>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">📷 写真読取</h3>
                  <p className="text-gray-600">
                    商品ラベルや値札の写真から商品情報を自動で読み取ります
                  </p>
                </div>
                <ImageOCR onProductInfoExtracted={(info) => handleProductInfoExtracted(info, 'image')} />

                {/* 画像読取後の個別登録フォーム */}
                {(formData.product_name || formData.manufacturer || formData.price) && (
                  <div className="mt-8 border-t pt-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">読み取った商品情報を確認・登録</h4>
                    {/* 簡略化されたフォーム */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">商品名</label>
                        <input
                          type="text"
                          name="product_name"
                          value={formData.product_name}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">メーカー</label>
                        <input
                          type="text"
                          name="manufacturer"
                          value={formData.manufacturer}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">価格</label>
                        <input
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">カテゴリ</label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                          <option value="">選択してください</option>
                          {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md disabled:opacity-50"
                    >
                      {loading ? '登録中...' : 'この商品を登録'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 手動入力 */}
            {activeMethod === 'manual' && (
              <div>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">✏️ 手動入力</h3>
                  <p className="text-gray-600">
                    フォームに直接入力して商品を登録します（単発登録・調整用）
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* 必須項目のみ表示 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        placeholder="例: サンバースト"
                      />
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
          </div>
        </div>
      </main>
    </div>
  )
}