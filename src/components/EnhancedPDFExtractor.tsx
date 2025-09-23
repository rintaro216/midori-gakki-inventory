'use client'

import { useState, useRef } from 'react'

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

interface EnhancedPDFExtractorProps {
  onProductsExtracted: (products: Product[]) => void
}

export default function EnhancedPDFExtractor({ onProductsExtracted }: EnhancedPDFExtractorProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [extractedProducts, setExtractedProducts] = useState<Product[]>([])
  const [useAI, setUseAI] = useState(true) // デフォルトでAI処理を有効
  const [processingMethod, setProcessingMethod] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await processPDF(file)
    }
  }

  const processPDF = async (file: File) => {
    setIsProcessing(true)
    setMessage(null)
    setError(null)
    setExtractedProducts([])
    setProcessingMethod('')

    try {
      const formData = new FormData()
      formData.append('pdf', file)

      // AI処理または従来処理の選択
      const endpoint = useAI ? '/api/ai-pdf-extract' : '/api/multiple-pdf-extract'

      console.log(`Using ${useAI ? 'AI' : 'Traditional'} processing method`)

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setExtractedProducts(result.products)
        setProcessingMethod(result.method || (useAI ? 'AI処理' : '従来処理'))
        setMessage(`${result.products.length}件の商品情報を読み取りました (${result.method || (useAI ? 'AI処理' : '従来処理')})`)
        onProductsExtracted(result.products)
      } else {
        // AI処理が失敗した場合、自動的に従来処理に切り替え
        if (useAI && result.error.includes('OpenAI')) {
          console.log('AI processing failed, falling back to traditional method')
          setError(`AI処理が失敗しました: ${result.error}`)
          setMessage('従来の処理方法に切り替えて再試行してください')
        } else {
          setError(result.error || 'PDF処理に失敗しました')
        }
      }
    } catch (err) {
      console.error('PDF processing error:', err)
      setError('PDF処理中にエラーが発生しました')
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadCSV = () => {
    if (extractedProducts.length === 0) return

    const headers = [
      'category', 'product_name', 'manufacturer', 'model_number', 'color',
      'condition', 'price', 'supplier', 'list_price', 'wholesale_price',
      'wholesale_rate', 'gross_margin', 'notes'
    ]

    const csvContent = [
      headers.join(','),
      ...extractedProducts.map(product =>
        headers.map(header => {
          const value = product[header as keyof Product] || ''
          return `"${value.toString().replace(/"/g, '""')}"`
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `extracted_products_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="space-y-6">
      {/* AI処理選択UI */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-blue-900 mb-3">📋 処理方法の選択</h3>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="radio"
              name="processing-method"
              checked={useAI}
              onChange={() => setUseAI(true)}
              className="mr-3 text-blue-600"
            />
            <div>
              <span className="font-medium text-blue-900">🤖 AI処理 (推奨)</span>
              <p className="text-sm text-blue-700">
                OpenAI GPT-4を使用。異なる請求書フォーマットに自動対応、高精度抽出
              </p>
            </div>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="processing-method"
              checked={!useAI}
              onChange={() => setUseAI(false)}
              className="mr-3 text-blue-600"
            />
            <div>
              <span className="font-medium text-blue-900">⚙️ 従来処理</span>
              <p className="text-sm text-blue-700">
                パターンマッチング方式。標準的なフォーマットに対応
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* PDF アップロード */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="mt-4">
            <h3 className="text-lg font-medium text-gray-900">多品目PDFから商品情報を読み取り</h3>
            <p className="mt-2 text-sm text-gray-600">
              請求書やカタログPDFから複数の商品情報を自動で読み取ります
            </p>
            {useAI && (
              <p className="mt-1 text-sm text-blue-600">
                ✨ AI処理により異なる企業フォーマットにも自動対応
              </p>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className={`mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
              useAI
                ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
            }`}
          >
            {useAI ? (
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
            {isProcessing ? 'PDF処理中...' : `PDFファイルを選択 (${useAI ? 'AI' : '従来'}処理)`}
          </button>
        </div>
      </div>

      {/* メッセージ表示 */}
      {message && (
        <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {message}
          {processingMethod && (
            <div className="text-sm mt-1">処理方法: {processingMethod}</div>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
          {useAI && error.includes('OpenAI') && (
            <div className="text-sm mt-2">
              💡 従来処理に切り替えて再試行するか、OpenAI API キーを設定してください
            </div>
          )}
        </div>
      )}

      {/* 読み取り結果の表示 */}
      {extractedProducts.length > 0 && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h4 className="text-lg font-medium text-gray-900">
              読み取った商品情報 ({extractedProducts.length}件)
              {processingMethod && (
                <span className="text-sm text-gray-600 ml-2">- {processingMethod}</span>
              )}
            </h4>
            <button
              onClick={downloadCSV}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CSV出力
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">メーカー</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">型番</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">価格</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">カテゴリ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状態</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {extractedProducts.map((product, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.product_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.manufacturer}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.model_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ¥{parseInt(product.price || '0').toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.condition}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI処理の詳細情報 */}
      {useAI && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <h5 className="font-medium text-blue-900">🤖 AI処理について</h5>
          <ul className="text-sm text-blue-700 mt-2 space-y-1">
            <li>• 企業ごとの異なる請求書フォーマットに自動対応</li>
            <li>• 自然言語処理により高精度な商品情報抽出</li>
            <li>• OpenAI GPT-4o-miniを使用（コスト効率重視）</li>
            <li>• API使用料: 約$0.01-0.05/回（処理内容により変動）</li>
          </ul>
        </div>
      )}
    </div>
  )
}