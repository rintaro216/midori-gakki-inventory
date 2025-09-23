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

interface EnhancedImageOCRProps {
  onProductsExtracted: (products: Product[]) => void
}

export default function EnhancedImageOCR({ onProductsExtracted }: EnhancedImageOCRProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [extractedProducts, setExtractedProducts] = useState<Product[]>([])
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [useRealOCR, setUseRealOCR] = useState(true) // デフォルトで実際のOCR使用
  const [processingProgress, setProcessingProgress] = useState<string>('')
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
      await processImages(files)
    }
  }

  const processImages = async (files: FileList) => {
    setIsProcessing(true)
    setMessage(null)
    setError(null)
    setExtractedProducts([])
    setProcessingProgress('')

    try {
      const formData = new FormData()
      formData.append('count', files.length.toString())

      // 画像ファイルを追加
      for (let i = 0; i < files.length; i++) {
        formData.append(`image_${i}`, files[i])
      }

      // 処理方法の選択
      const endpoint = useRealOCR ? '/api/real-ocr' : '/api/multiple-ocr'

      console.log(`Using ${useRealOCR ? 'Real OCR' : 'Mock'} processing for ${files.length} images`)

      if (useRealOCR) {
        setProcessingProgress(`Tesseract.js OCRで${files.length}枚の画像を処理中...`)
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setExtractedProducts(result.products)
        const methodText = result.method || (useRealOCR ? 'Real OCR' : 'Mock OCR')
        setMessage(`${result.products.length}件の商品情報を読み取りました (${methodText})`)

        if (result.errors && result.errors.length > 0) {
          setError(`${result.errors.length}件の画像でエラーが発生しました`)
        }

        onProductsExtracted(result.products)
      } else {
        // 実際のOCR処理が失敗した場合、自動的にMock処理に切り替えの提案
        if (useRealOCR && result.error) {
          console.log('Real OCR processing failed, suggesting fallback to mock')
          setError(`OCR処理が失敗しました: ${result.error}`)
          setMessage('Mock処理に切り替えて再試行してください')
        } else {
          setError(result.error || 'OCR処理に失敗しました')
        }
      }
    } catch (err) {
      console.error('OCR processing error:', err)
      setError('OCR処理中にエラーが発生しました')
    } finally {
      setIsProcessing(false)
      setProcessingProgress('')
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
    link.download = `ocr_products_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="space-y-6">
      {/* OCR処理選択UI */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-green-900 mb-3">📷 OCR処理方法の選択</h3>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="radio"
              name="ocr-method"
              checked={useRealOCR}
              onChange={() => setUseRealOCR(true)}
              className="mr-3 text-green-600"
            />
            <div>
              <span className="font-medium text-green-900">🔍 実際のOCR処理 (推奨)</span>
              <p className="text-sm text-green-700">
                Tesseract.js使用。実際の画像からテキストを抽出、日本語・英語対応
              </p>
            </div>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="ocr-method"
              checked={!useRealOCR}
              onChange={() => setUseRealOCR(false)}
              className="mr-3 text-green-600"
            />
            <div>
              <span className="font-medium text-green-900">🎭 テスト用Mock処理</span>
              <p className="text-sm text-green-700">
                サンプルデータを返します。動作確認・デモ用
              </p>
            </div>
          </label>
        </div>
      </div>

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
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h36v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2zM6 20v16a2 2 0 002 2h32a2 2 0 002-2V20H6z"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="mt-4">
            <h3 className="text-lg font-medium text-gray-900">商品画像からOCR読み取り</h3>
            <p className="mt-2 text-sm text-gray-600">
              商品ラベル、価格表、カタログの画像から商品情報を自動で読み取ります
            </p>
            {useRealOCR && (
              <p className="mt-1 text-sm text-green-600">
                ✨ 実際のOCR処理で画像からテキストを抽出します
              </p>
            )}
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
            className={`mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
              useRealOCR
                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            }`}
          >
            {useRealOCR ? (
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h36v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2zM6 20v16a2 2 0 002 2h32a2 2 0 002-2V20H6z" />
              </svg>
            )}
            {isProcessing ? 'OCR処理中...' : `画像を選択 (${useRealOCR ? '実際のOCR' : 'Mock'}処理)`}
          </button>
        </div>
      </div>

      {/* 処理進捗表示 */}
      {processingProgress && (
        <div className="p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          {processingProgress}
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
          {useRealOCR && (
            <div className="text-sm mt-2">
              💡 Mock処理に切り替えて再試行するか、画像の品質を確認してください
            </div>
          )}
        </div>
      )}

      {/* 画像プレビュー */}
      {previewImages.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h4 className="text-lg font-medium text-gray-900 mb-3">
            選択された画像 ({previewImages.length}枚)
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {previewImages.map((src, index) => (
              <div key={index} className="border rounded overflow-hidden">
                <img
                  src={src}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover"
                />
                <div className="p-2 bg-gray-50 text-xs text-gray-600 text-center">
                  画像 {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 読み取り結果の表示 */}
      {extractedProducts.length > 0 && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h4 className="text-lg font-medium text-gray-900">
              OCR読み取り結果 ({extractedProducts.length}件)
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

      {/* OCR処理の詳細情報 */}
      {useRealOCR && (
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <h5 className="font-medium text-green-900">🔍 実際のOCR処理について</h5>
          <ul className="text-sm text-green-700 mt-2 space-y-1">
            <li>• Tesseract.js使用（Googleの高精度OCRエンジン）</li>
            <li>• 日本語・英語の混在テキストに対応</li>
            <li>• 画像の品質により精度が変動（鮮明な画像推奨）</li>
            <li>• 処理時間: 1枚あたり3-10秒程度</li>
            <li>• 費用: 完全無料（ローカル処理）</li>
          </ul>
        </div>
      )}
    </div>
  )
}