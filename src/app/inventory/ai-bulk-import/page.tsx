'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import EnhancedPDFExtractor from '@/components/EnhancedPDFExtractor'
import EnhancedImageOCR from '@/components/EnhancedImageOCR'
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

export default function AIBulkImportPage() {
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
      router.push('/dashboard')
    }, 2000)
  }

  const resetProcess = () => {
    setExtractedProducts([])
    setCurrentStep('extract')
    setMessage(null)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🤖 AI一括商品登録</h1>
              <p className="mt-2 text-gray-600">
                AI技術で請求書フォーマットの違いに自動対応し、高精度な商品情報抽出を実現
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              ← ダッシュボードに戻る
            </button>
          </div>
        </div>

        {/* AI機能の説明 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">✨ AI処理の特徴</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-blue-800">📋 柔軟なフォーマット対応</h3>
              <p className="text-sm text-blue-700">企業ごとの異なる請求書レイアウトに自動適応</p>
            </div>
            <div>
              <h3 className="font-medium text-blue-800">🎯 高精度抽出</h3>
              <p className="text-sm text-blue-700">自然言語処理による文脈理解で精度向上</p>
            </div>
            <div>
              <h3 className="font-medium text-blue-800">⚡ 処理速度</h3>
              <p className="text-sm text-blue-700">GPT-4o-mini使用でコスト効率と速度を両立</p>
            </div>
            <div>
              <h3 className="font-medium text-blue-800">🔄 フォールバック対応</h3>
              <p className="text-sm text-blue-700">AI処理失敗時は従来方式に自動切り替え</p>
            </div>
          </div>
        </div>

        {/* プロセス表示 */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            <div className={`flex items-center ${currentStep === 'extract' ? 'text-blue-600' : 'text-green-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium ${
                currentStep === 'extract' ? 'bg-blue-600' : 'bg-green-600'
              }`}>
                1
              </div>
              <span className="ml-2 font-medium">情報抽出</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 rounded">
              <div className={`h-1 rounded transition-all duration-500 ${
                currentStep === 'register' ? 'w-full bg-green-600' : 'w-0 bg-blue-600'
              }`}></div>
            </div>
            <div className={`flex items-center ${currentStep === 'register' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium ${
                currentStep === 'register' ? 'bg-blue-600' : 'bg-gray-400'
              }`}>
                2
              </div>
              <span className="ml-2 font-medium">一括登録</span>
            </div>
          </div>
        </div>

        {/* メッセージ表示 */}
        {message && (
          <div className="mb-6 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
            {message}
          </div>
        )}

        {/* ステップ1: 情報抽出 */}
        {currentStep === 'extract' && (
          <div className="space-y-8">
            {/* 抽出方法選択 */}
            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">📝 抽出方法の選択</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <label
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    extractMethod === 'pdf'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="extract-method"
                    value="pdf"
                    checked={extractMethod === 'pdf'}
                    onChange={(e) => setExtractMethod(e.target.value as 'pdf' | 'ocr')}
                    className="sr-only"
                  />
                  <div className="flex items-center">
                    <svg className="w-8 h-8 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="font-medium text-gray-900">PDFファイル処理</h3>
                      <p className="text-sm text-gray-600">請求書・納品書・カタログPDFから抽出</p>
                    </div>
                  </div>
                </label>

                <label
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    extractMethod === 'ocr'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="extract-method"
                    value="ocr"
                    checked={extractMethod === 'ocr'}
                    onChange={(e) => setExtractMethod(e.target.value as 'pdf' | 'ocr')}
                    className="sr-only"
                  />
                  <div className="flex items-center">
                    <svg className="w-8 h-8 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="font-medium text-gray-900">画像OCR処理</h3>
                      <p className="text-sm text-gray-600">商品ラベル・価格表の画像から抽出</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* 抽出コンポーネント */}
            <div className="bg-white border rounded-lg p-6">
              {extractMethod === 'pdf' ? (
                <EnhancedPDFExtractor onProductsExtracted={handleProductsExtracted} />
              ) : (
                <EnhancedImageOCR onProductsExtracted={handleProductsExtracted} />
              )}
            </div>
          </div>
        )}

        {/* ステップ2: 一括登録 */}
        {currentStep === 'register' && (
          <div className="space-y-6">
            <div className="bg-white border rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">📊 商品一括登録</h2>
                <button
                  onClick={resetProcess}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  ← やり直し
                </button>
              </div>
              <CSVBulkRegister
                products={extractedProducts}
                onRegisterComplete={handleRegisterComplete}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}