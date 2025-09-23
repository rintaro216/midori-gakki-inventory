'use client'

import { useState, useRef } from 'react'

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
      const formData = new FormData()
      formData.append('pdf', file)

      const response = await fetch('/api/pdf-extract', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('PDF処理に失敗しました')
      }

      const result = await response.json()

      if (result.success) {
        onProductInfoExtracted(result.productInfo)
        if (result.note) {
          setError(`注意: ${result.note}`)
        }
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
        accept=".pdf,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!uploadedFile ? (
        <div>
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-900 mb-2">
            商品カタログPDFをアップロードしてください
          </p>
          <p className="text-sm text-gray-600 mb-4">
            PDF内の商品情報（商品名、価格、型番など）を自動で読み取ります
          </p>
          <button
            onClick={handleFileUpload}
            disabled={isProcessing}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            PDFファイルを選択
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <div className="flex items-center justify-center p-4 bg-red-50 rounded-lg">
              <svg className="w-8 h-8 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">{uploadedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
          </div>
          {isProcessing && (
            <div className="mb-4">
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-green-600">PDFを解析中...</span>
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
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              別のPDFを選択
            </button>
            <button
              onClick={clearFile}
              disabled={isProcessing}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              クリア
            </button>
          </div>
        </div>
      )}
    </div>
  )
}