'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import MultiplePDFExtractor from '@/components/MultiplePDFExtractor'
import MultipleImageOCR from '@/components/MultipleImageOCR'
import CSVBulkRegister from '@/components/CSVBulkRegister'

interface Product {
  category: string
  product_name: string
  manufacturer: string
  model_number: string
  color: string
  condition: string
  price: string
  supplier?: string
  list_price?: string
  wholesale_price?: string
  wholesale_rate?: string
  gross_margin?: string
  notes?: string
}

export default function BulkImportPage() {
  const router = useRouter()
  const [extractedProducts, setExtractedProducts] = useState<Product[]>([])
  const [currentStep, setCurrentStep] = useState<'extract' | 'register'>('extract')
  const [extractMethod, setExtractMethod] = useState<'pdf' | 'ocr'>('pdf')
  const [message, setMessage] = useState<string | null>(null)

  const handleProductsExtracted = (products: Product[]) => {
    setExtractedProducts(products)
    setCurrentStep('register')
    setMessage(`${products.length}件の商品情報を読み取りました。CSV出力して確認するか、そのまま一括登録できます。`)
  }

  const handleRegisterComplete = () => {
    setMessage('商品を一括登録しました！')
    setExtractedProducts([])
    setTimeout(() => {
      router.push('/inventory')
    }, 2000)
  }

  const resetProcess = () => {
    setExtractedProducts([])
    setCurrentStep('extract')
    setMessage(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">多品目一括登録</h1>
              <p className="text-gray-600 mt-1">PDF・写真から複数商品を読み取り → CSV確認 → 一括登録</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/inventory/add')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
              >
                単品登録へ
              </button>
              <button
                onClick={() => router.push('/inventory')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                在庫一覧に戻る
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* ステップインジケーター */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            <div className={`flex items-center ${currentStep === 'extract' ? 'text-blue-600' : 'text-green-600'}`}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep === 'extract' ? 'border-blue-600 bg-blue-50' : 'border-green-600 bg-green-50'
              }`}>
                {currentStep === 'extract' ? (
                  <span className="text-sm font-bold">1</span>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="ml-3 font-medium">多品目読み取り</span>
            </div>

            <div className={`w-16 h-1 ${currentStep === 'register' ? 'bg-green-600' : 'bg-gray-300'}`}></div>

            <div className={`flex items-center ${currentStep === 'register' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep === 'register' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 bg-gray-50'
              }`}>
                <span className="text-sm font-bold">2</span>
              </div>
              <span className="ml-3 font-medium">CSV確認・一括登録</span>
            </div>
          </div>
        </div>

        {/* メッセージ表示 */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('エラー') || message.includes('失敗')
              ? 'bg-red-100 border border-red-400 text-red-700'
              : 'bg-green-100 border border-green-400 text-green-700'
          }`}>
            {message}
          </div>
        )}

        {/* コンテンツエリア */}
        <div className="bg-white shadow rounded-lg p-6">
          {currentStep === 'extract' && (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  多品目読み取り
                </h2>
                <p className="text-gray-600">
                  PDFや写真から複数の商品情報を一度に読み取ります
                </p>
              </div>

              {/* 読み取り方法選択 */}
              <div className="mb-6">
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setExtractMethod('pdf')}
                    className={`px-6 py-3 rounded-lg font-medium ${
                      extractMethod === 'pdf'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    📄 PDF読み取り
                  </button>
                  <button
                    onClick={() => setExtractMethod('ocr')}
                    className={`px-6 py-3 rounded-lg font-medium ${
                      extractMethod === 'ocr'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    📷 写真読み取り
                  </button>
                </div>
              </div>

              {/* 選択された方法のコンポーネント */}
              {extractMethod === 'pdf' ? (
                <MultiplePDFExtractor onProductsExtracted={handleProductsExtracted} />
              ) : (
                <MultipleImageOCR onProductsExtracted={handleProductsExtracted} />
              )}
            </div>
          )}

          {currentStep === 'register' && (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  📊 CSV確認・一括登録
                </h2>
                <p className="text-gray-600">
                  読み取った商品をCSV出力して確認・編集するか、そのまま一括登録できます
                </p>
              </div>

              <div className="mb-6 flex justify-center">
                <button
                  onClick={resetProcess}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  別の商品を読み取る
                </button>
              </div>

              <CSVBulkRegister
                products={extractedProducts}
                onRegisterComplete={handleRegisterComplete}
              />
            </div>
          )}
        </div>

        {/* 使い方ガイド */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-800 mb-3">💡 使い方ガイド</h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p><strong>ステップ1:</strong> PDFファイル または 商品ラベルの写真（複数枚可）をアップロード</p>
            <p><strong>ステップ2:</strong> 読み取った商品情報をCSV出力してExcelで確認・編集</p>
            <p><strong>ステップ3:</strong> 確認済みCSVをアップロードして一括登録、または直接一括登録</p>
            <p className="mt-3 font-medium">📝 推奨: 必ずCSV出力して内容を確認してから登録することをお勧めします</p>
          </div>
        </div>
      </main>
    </div>
  )
}