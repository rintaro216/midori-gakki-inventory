'use client'

import { useState, useRef } from 'react'
import { processImageOCRClient, ProductInfo } from '@/lib/client-ocr-processor'

interface ImageOCRProps {
  onProductInfoExtracted: (productInfo: ProductInfo) => void
}

export default function ImageOCR({ onProductInfoExtracted }: ImageOCRProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // プレビュー表示
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // OCR処理
      processImage(file)
    }
  }

  const processImage = async (file: File) => {
    setIsProcessing(true)
    setError(null)

    try {
      const result = await processImageOCRClient(file)

      if (result.success && result.productInfo) {
        onProductInfoExtracted(result.productInfo)
      } else {
        throw new Error(result.error || 'OCR処理に失敗しました')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const clearImage = () => {
    setPreviewImage(null)
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
        accept="image/*"
        capture="environment"
        onChange={handleImageSelect}
        className="hidden"
      />

      {!previewImage ? (
        <div>
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-900 mb-2">
            商品ラベルを撮影してください
          </p>
          <p className="text-sm text-gray-600 mb-4">
            商品名、価格、型番などを自動で読み取ります
          </p>
          <button
            onClick={handleCameraCapture}
            disabled={isProcessing}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            写真を撮影
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <img
              src={previewImage}
              alt="撮影した商品"
              className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
            />
          </div>
          {isProcessing && (
            <div className="mb-4">
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-blue-600">画像を解析中...</span>
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
              onClick={handleCameraCapture}
              disabled={isProcessing}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              別の写真を撮影
            </button>
            <button
              onClick={clearImage}
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
