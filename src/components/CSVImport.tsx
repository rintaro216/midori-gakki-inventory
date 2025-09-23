'use client'

import { useState, useRef } from 'react'

interface CSVImportProps {
  onImportComplete: () => void
}

export default function CSVImport({ onImportComplete }: CSVImportProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await uploadCSV(file)
    }
  }

  const uploadCSV = async (file: File) => {
    setIsUploading(true)
    setMessage(null)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('csv', file)

      const response = await fetch('/api/csv-import', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setMessage(result.message)
        onImportComplete()
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        setError(result.error || 'インポートに失敗しました')
        if (result.details) {
          console.error('Import details:', result.details)
        }
      }
    } catch (err) {
      setError('ファイルアップロード中にエラーが発生しました')
    } finally {
      setIsUploading(false)
    }
  }

  const downloadTemplate = () => {
    const template = `category,product_name,manufacturer,model_number,color,condition,price,supplier,list_price,wholesale_price,wholesale_rate,gross_margin,notes
ギター,Stratocaster,Fender,ST-62,サンバースト,中古,85000,楽器商事,120000,60000,50.0,25000,ソフトケース付き
ベース,Jazz Bass,Fender,JB-62,ブラック,新品,120000,○○楽器,180000,90000,50.0,30000,
ドラム,Stage Custom,YAMAHA,SBP2F5,ナチュラル,中古,75000,ヤマハ,100000,50000,50.0,25000,シンバル別売
キーボード・ピアノ,Clavinova,YAMAHA,CLP-735,ホワイト,展示品,180000,ヤマハ,250000,125000,50.0,55000,椅子付き`

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'inventory_template.csv'
    link.click()
  }

  return (
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
          <h3 className="text-lg font-medium text-gray-900">CSVファイルから商品を一括登録</h3>
          <p className="mt-2 text-sm text-gray-600">
            CSVファイルを選択してアップロードしてください
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {isUploading ? 'アップロード中...' : 'CSVファイルを選択'}
          </button>

          <button
            onClick={downloadTemplate}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            テンプレートダウンロード
          </button>
        </div>

        {/* 必要なフィールドの説明 */}
        <div className="mt-6 text-left">
          <h4 className="text-sm font-medium text-gray-900 mb-2">フィールド説明：</h4>
          <div className="text-sm text-gray-600 space-y-1 grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <div>
              <p>• <strong>category</strong>: カテゴリ（必須）</p>
              <p>• <strong>product_name</strong>: 商品名（必須）</p>
              <p>• <strong>manufacturer</strong>: メーカー／ブランド（必須）</p>
              <p>• <strong>model_number</strong>: 型番／シリアル（必須）</p>
              <p>• <strong>color</strong>: カラー（必須）</p>
              <p>• <strong>condition</strong>: 状態（必須）</p>
              <p>• <strong>price</strong>: 販売価格（必須）</p>
            </div>
            <div>
              <p>• <strong>supplier</strong>: 仕入先（任意）</p>
              <p>• <strong>list_price</strong>: 定価（任意）</p>
              <p>• <strong>wholesale_price</strong>: 仕切価格（任意）</p>
              <p>• <strong>wholesale_rate</strong>: 仕切率（任意）</p>
              <p>• <strong>gross_margin</strong>: 粗利（任意）</p>
              <p>• <strong>notes</strong>: 備考（任意）</p>
            </div>
          </div>
        </div>

        {/* メッセージ表示 */}
        {message && (
          <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}