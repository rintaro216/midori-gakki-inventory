'use client'

import { useState, useRef } from 'react'
import { processPDFClient } from '@/lib/client-pdf-processor'

interface ProductInfo {
  name: string
  brand: string
  model: string
  price: string
  category: string
  condition: string
}

interface PDFExtractorProps {
  onProductInfoExtracted: (productInfo: ProductInfo) => void
}

export default function PDFExtractor({ onProductInfoExtracted }: PDFExtractorProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('PDFファイルを選択してください')
        return
      }

      setUploadedFile(file)
      setError(null)
      // PDF処理を実行
      processPDF(file)
    }
  }

  const processPDF = async (file: File) => {
    setIsProcessing(true)
    setError(null)

    try {
      const result = await processPDFClient(file)

      if (result.success && result.products && result.products.length > 0) {
        // 最初の商品を ProductInfo 形式に変換
        const product = result.products[0]
        const productInfo: ProductInfo = {
          name: product.product_name,
          brand: product.manufacturer,
          model: product.model_number,
          price: product.price,
          category: product.category,
          condition: product.condition || '中古'
        }
        onProductInfoExtracted(productInfo)
      } else {
        throw new Error(result.error || 'PDF処理に失敗しました')
      }
    } catch (err) {
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

  const clearFile = () => {
    setUploadedFile(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!uploadedFile ? (
        <div>
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21l3-3 7 7 13-13 3 3L20 28 7 21z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 12v6m6-18v18M6 18h12" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-900 mb-2">
            PDFファイルをアップロードしてください
          </p>
          <p className="text-sm text-gray-600 mb-4">
            商品カタログやリストから商品情報を抽出します
          </p>
          <button
            onClick={handleFileUpload}
            disabled={isProcessing}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            ファイルを選択
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
              <svg className="w-8 h-8 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm text-gray-700">{uploadedFile.name}</span>
            </div>
          </div>
          {isProcessing && (
            <div className="mb-4">
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-blue-600">PDFを解析中...</span>
              </div>
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          <div className="flex gap-2 justify-center">
            <button
              onClick={handleFileUpload}
              disabled={isProcessing}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              別のファイルを選択
            </button>
            <button
              onClick={clearFile}
              disabled={isProcessing}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              クリア
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
