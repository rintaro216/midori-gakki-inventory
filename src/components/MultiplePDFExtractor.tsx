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
      const formData = new FormData()
      formData.append('pdf', file)

      const response = await fetch('/api/multiple-pdf-extract', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setExtractedProducts(result.products)
        setMessage(`${result.products.length}件の商品情報を読み取りました`)
        onProductsExtracted(result.products)
      } else {
        setError(result.error || 'PDF処理に失敗しました')
      }
    } catch (err) {
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
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {isProcessing ? 'PDF処理中...' : 'PDFファイルを選択'}
          </button>
        </div>
      </div>

      {/* メッセージ表示 */}
      {message && (
        <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {message}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* 読み取り結果の表示 */}
      {extractedProducts.length > 0 && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h4 className="text-lg font-medium text-gray-900">
              読み取った商品情報 ({extractedProducts.length}件)
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">¥{parseInt(product.price).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.condition}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}