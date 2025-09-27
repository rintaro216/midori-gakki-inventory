'use client'

import { useState, useRef } from 'react'
import { processPDFClient, Product } from '@/lib/client-pdf-processor'

interface MultiplePDFExtractorProps {
  onProductsExtracted: (products: Product[]) => void
}

export default function MultiplePDFExtractor({ onProductsExtracted }: MultiplePDFExtractorProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [extractedProducts, setExtractedProducts] = useState<Product[]>([])
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

    try {
      const result = await processPDFClient(file)

      if (result.success && result.products) {
        const products = result.products
        setExtractedProducts(products)
        setMessage(`${products.length}個の商品を抽出しました（${result.method}）`)
        onProductsExtracted(products)
      } else {
        throw new Error(result.error || 'PDF処理に失敗しました')
      }
    } catch (err) {
      console.error('PDF processing error:', err)
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const clearResults = () => {
    setExtractedProducts([])
    setMessage(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      {/* File Upload Section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="mb-4">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          複数商品のPDF解析
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          商品一覧やカタログのPDFファイルから複数の商品情報を一括で抽出します
        </p>
        <button
          onClick={handleFileUpload}
          disabled={isProcessing}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isProcessing ? (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          )}
          {isProcessing ? '解析中...' : 'PDFファイルを選択'}
        </button>
      </div>

      {/* Results Section */}
      {(message || error || extractedProducts.length > 0) && (
        <div className="bg-white border border-gray-200 rounded-lg shadow">
          <div className="px-4 py-5 sm:p-6">
            {message && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                {message}
              </div>
            )}
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {extractedProducts.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-900">
                    抽出された商品 ({extractedProducts.length}個)
                  </h4>
                  <button
                    onClick={clearResults}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    クリア
                  </button>
                </div>

                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">商品名</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">メーカー</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">型番</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">価格</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">カテゴリ</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {extractedProducts.slice(0, 10).map((product, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.product_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.manufacturer}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.model_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ¥{product.price ? Number(product.price).toLocaleString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.category}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {extractedProducts.length > 10 && (
                    <div className="bg-gray-50 px-4 py-3 text-sm text-gray-500">
                      最初の10件を表示中（合計: {extractedProducts.length}件）
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
