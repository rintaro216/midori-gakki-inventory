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

interface MultipleImageOCRProps {
  onProductsExtracted: (products: Product[]) => void
}

export default function MultipleImageOCR({ onProductsExtracted }: MultipleImageOCRProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [extractedProducts, setExtractedProducts] = useState<Product[]>([])
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      // プレビュー表示
      const imagePreviews: string[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const reader = new FileReader()
        reader.onload = (e) => {
          imagePreviews.push(e.target?.result as string)
          if (imagePreviews.length === files.length) {
            setPreviewImages(imagePreviews)
          }
        }
        reader.readAsDataURL(file)
      }

      // OCR処理
      await processImages(Array.from(files))
    }
  }

  const processImages = async (files: File[]) => {
    setIsProcessing(true)
    setMessage(null)
    setError(null)
    setExtractedProducts([])

    try {
      const formData = new FormData()
      files.forEach((file, index) => {
        formData.append(`image_${index}`, file)
      })
      formData.append('count', files.length.toString())

      const response = await fetch('/api/multiple-ocr', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setExtractedProducts(result.products)
        setMessage(`${result.products.length}件の商品情報を読み取りました`)
        onProductsExtracted(result.products)
      } else {
        setError(result.error || 'OCR処理に失敗しました')
      }
    } catch (err) {
      setError('画像処理中にエラーが発生しました')
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
    link.download = `ocr_extracted_products_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const clearImages = () => {
    setPreviewImages([])
    setExtractedProducts([])
    setMessage(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      {/* 画像アップロード */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="mt-4">
            <h3 className="text-lg font-medium text-gray-900">複数の商品ラベルを読み取り</h3>
            <p className="mt-2 text-sm text-gray-600">
              商品ラベルや値札の写真から複数の商品情報を自動で読み取ります
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            </svg>
            {isProcessing ? '画像処理中...' : '画像を選択（複数可）'}
          </button>
        </div>
      </div>

      {/* プレビュー画像 */}
      {previewImages.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-medium text-gray-900">
              選択した画像 ({previewImages.length}枚)
            </h4>
            <button
              onClick={clearImages}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {previewImages.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`商品画像 ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border"
              />
            ))}
          </div>
        </div>
      )}

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

      {/* 処理中表示 */}
      {isProcessing && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 text-blue-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-blue-600">画像を解析中...</span>
          </div>
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