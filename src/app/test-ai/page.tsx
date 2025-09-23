'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PDFExtractorAI from '@/components/PDFExtractorAI'

interface ProductInfo {
  name: string
  brand: string
  model: string
  price: string
  category: string
  condition: string
  supplier?: string
  purchase_price?: string
  list_price?: string
  wholesale_price?: string
  color?: string
  notes?: string
}

export default function TestAIPage() {
  const router = useRouter()
  const [extractedProduct, setExtractedProduct] = useState<ProductInfo | null>(null)
  const [message, setMessage] = useState('')

  const handleProductInfoExtracted = (productInfo: ProductInfo) => {
    setExtractedProduct(productInfo)
    setMessage('✅ AI抽出が完了しました！結果を確認してください。')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🧪 AI機能テストページ</h1>
              <p className="text-sm text-gray-600 mt-1">
                OpenAI API統合PDF抽出機能のテスト環境
              </p>
            </div>
            <button
              onClick={() => router.push('/inventory')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
            >
              在庫一覧に戻る
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 space-y-8">
        {/* 設定状況 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">🔧 システム設定状況</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY
                  ? 'bg-green-500'
                  : 'bg-red-500'
              }`}></div>
              <span className="text-sm">
                OpenAI API: {
                  process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY
                    ? '✅ 設定済み'
                    : '❌ 未設定'
                }
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-sm">フォールバック機能: ✅ 利用可能</span>
            </div>
          </div>
          {!(process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY) && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>注意:</strong> OpenAI APIキーが設定されていません。
                従来の正規表現ベースの抽出が使用されます。
              </p>
            </div>
          )}
        </div>

        {/* AI抽出機能テスト */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">🤖 AI PDF抽出テスト</h2>
          <PDFExtractorAI onProductInfoExtracted={handleProductInfoExtracted} />
        </div>

        {/* メッセージ表示 */}
        {message && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-blue-800">{message}</p>
          </div>
        )}

        {/* 抽出結果表示 */}
        {extractedProduct && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">📋 抽出結果</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 基本情報 */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 border-b pb-2">基本情報</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">商品名:</span>
                    <p className="font-medium">{extractedProduct.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">メーカー:</span>
                    <p className="font-medium">{extractedProduct.brand}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">型番:</span>
                    <p className="font-medium">{extractedProduct.model || '-'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">カテゴリ:</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {extractedProduct.category}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">状態:</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      extractedProduct.condition === '新品' ? 'bg-green-100 text-green-800' :
                      extractedProduct.condition === '中古' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {extractedProduct.condition}
                    </span>
                  </div>
                </div>
              </div>

              {/* 価格情報 */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 border-b pb-2">価格情報</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">販売価格:</span>
                    <p className="font-bold text-lg text-green-600">
                      ¥{parseInt(extractedProduct.price || '0').toLocaleString()}
                    </p>
                  </div>
                  {extractedProduct.purchase_price && (
                    <div>
                      <span className="text-gray-500">仕入れ価格:</span>
                      <p className="font-medium text-orange-600">
                        ¥{parseInt(extractedProduct.purchase_price).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {extractedProduct.list_price && (
                    <div>
                      <span className="text-gray-500">定価:</span>
                      <p className="font-medium text-gray-600">
                        ¥{parseInt(extractedProduct.list_price).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {extractedProduct.wholesale_price && (
                    <div>
                      <span className="text-gray-500">卸価格:</span>
                      <p className="font-medium text-blue-600">
                        ¥{parseInt(extractedProduct.wholesale_price).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* 利益計算表示 */}
                  {extractedProduct.purchase_price && extractedProduct.price && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <h4 className="text-sm font-medium text-green-800 mb-2">利益計算</h4>
                      <div className="space-y-1 text-sm text-green-700">
                        <div>
                          利益額: <span className="font-bold">
                            ¥{(parseInt(extractedProduct.price) - parseInt(extractedProduct.purchase_price)).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          利益率: <span className="font-bold">
                            {(((parseInt(extractedProduct.price) - parseInt(extractedProduct.purchase_price)) / parseInt(extractedProduct.price)) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 追加情報 */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 border-b pb-2">追加情報</h3>
                <div className="space-y-2 text-sm">
                  {extractedProduct.color && (
                    <div>
                      <span className="text-gray-500">色:</span>
                      <p className="font-medium">{extractedProduct.color}</p>
                    </div>
                  )}
                  {extractedProduct.supplier && (
                    <div>
                      <span className="text-gray-500">仕入先:</span>
                      <p className="font-medium">{extractedProduct.supplier}</p>
                    </div>
                  )}
                  {extractedProduct.notes && (
                    <div>
                      <span className="text-gray-500">備考:</span>
                      <p className="font-medium text-gray-700">{extractedProduct.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 生データ表示 */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-medium text-gray-900 mb-2">🔧 開発者向け: 生データ</h3>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                {JSON.stringify(extractedProduct, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}