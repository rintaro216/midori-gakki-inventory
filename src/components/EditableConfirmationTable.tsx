'use client'

import { useState } from 'react'

interface Product {
  category: string           // 種類(カテゴリー)
  product_name: string      // 商品名
  manufacturer: string      // メーカー(ブランド)
  model_number: string      // 品番
  color: string            // 色(カラー)
  serial_number?: string   // シリアルナンバー
  price: string           // 価格(定価又は販売価格)
  wholesale_price?: string // 仕入値段
  wholesale_rate?: string  // 仕入掛け率
  purchase_date?: string   // 仕入日
  supplier?: string        // 仕入先
  condition?: string       // 状態（既存フィールドも残す）
  notes?: string          // 備考
}

interface EditableConfirmationTableProps {
  products: Product[]
  onRegister: (products: Product[]) => void
  onCancel: () => void
  isRegistering: boolean
}

const CATEGORIES = ['ギター', 'ベース', 'ドラム', 'キーボード・ピアノ', '管楽器', '弦楽器', 'アンプ', 'エフェクター', 'アクセサリー', 'その他']
const CONDITIONS = ['新品', '中古', '展示品', 'B級品', 'ジャンク']
const COLORS = ['ブラック', 'ホワイト', 'ナチュラル', 'サンバースト', 'チェリー', 'ブルー', 'レッド', 'グリーン', 'イエロー', 'その他']

export default function EditableConfirmationTable({ products, onRegister, onCancel, isRegistering }: EditableConfirmationTableProps) {
  const [editableProducts, setEditableProducts] = useState<Product[]>(products)
  const [editingRow, setEditingRow] = useState<number | null>(null)

  const handleCellEdit = (rowIndex: number, field: keyof Product, value: string) => {
    const updatedProducts = [...editableProducts]
    updatedProducts[rowIndex] = { ...updatedProducts[rowIndex], [field]: value }
    setEditableProducts(updatedProducts)
  }

  const handleEditRow = (rowIndex: number) => {
    setEditingRow(rowIndex)
  }

  const handleSaveRow = (rowIndex: number) => {
    setEditingRow(null)
  }

  const handleCancelEdit = (rowIndex: number) => {
    setEditingRow(null)
    setEditableProducts([...products])
  }

  const addProduct = () => {
    const newProduct: Product = {
      category: 'ギター',
      product_name: '',
      manufacturer: '',
      model_number: '',
      color: 'ブラック',
      serial_number: '',
      price: '',
      wholesale_price: '',
      wholesale_rate: '',
      purchase_date: '',
      supplier: '',
      condition: '中古',
      notes: ''
    }
    setEditableProducts([...editableProducts, newProduct])
  }

  const deleteProduct = (index: number) => {
    const updatedProducts = editableProducts.filter((_, i) => i !== index)
    setEditableProducts(updatedProducts)
  }

  const renderEditableCell = (product: Product, rowIndex: number, field: keyof Product) => {
    const isEditing = editingRow === rowIndex
    const value = product[field] || ''

    if (isEditing) {
      if (field === 'category') {
        return (
          <select
            value={value}
            onChange={(e) => handleCellEdit(rowIndex, field, e.target.value)}
            className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        )
      } else if (field === 'condition') {
        return (
          <select
            value={value}
            onChange={(e) => handleCellEdit(rowIndex, field, e.target.value)}
            className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CONDITIONS.map(cond => (
              <option key={cond} value={cond}>{cond}</option>
            ))}
          </select>
        )
      } else if (field === 'color') {
        return (
          <select
            value={value}
            onChange={(e) => handleCellEdit(rowIndex, field, e.target.value)}
            className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {COLORS.map(color => (
              <option key={color} value={color}>{color}</option>
            ))}
          </select>
        )
      } else {
        const getInputType = () => {
          if (field === 'price' || field === 'wholesale_price') return 'number'
          if (field === 'wholesale_rate') return 'number'
          if (field === 'purchase_date') return 'date'
          return 'text'
        }

        return (
          <input
            type={getInputType()}
            value={value}
            onChange={(e) => handleCellEdit(rowIndex, field, e.target.value)}
            className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )
      }
    }

    return (
      <div className="px-2 py-1 text-sm rounded min-h-[24px]">
        {(field === 'price' || field === 'wholesale_price') && value ? `¥${parseInt(value).toLocaleString()}` : value || '-'}
      </div>
    )
  }

  return (
    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-medium text-green-800">
          📝 商品データの編集・確認 ({editableProducts.length}件)
        </h4>
        <div className="space-x-2">
          <button
            onClick={addProduct}
            className="inline-flex items-center px-3 py-1 text-sm border border-green-300 rounded-md text-green-700 bg-white hover:bg-green-50"
          >
            ➕ 商品追加
          </button>
          <button
            onClick={onCancel}
            className="text-sm text-green-600 hover:text-green-800"
          >
            ← 戻る
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
        <p className="text-sm text-blue-700">
          💡 <strong>編集方法:</strong> 各行の「✏️ 編集」ボタンをクリックして編集モードに入ります。編集完了後は「✓ 保存」または「✕ キャンセル」ボタンを使用してください。
        </p>
      </div>

      <div className="overflow-x-auto mb-4 max-h-96 overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">No</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">カテゴリ*</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">商品名*</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">メーカー*</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">品番*</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">色*</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">シリアルNo</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">販売価格*</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">仕入値段</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">仕入掛け率</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">仕入日</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">仕入先</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">状態</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">備考</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {editableProducts.map((product, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  <div className="flex space-x-1">
                    {editingRow === index ? (
                      <>
                        <button
                          onClick={() => handleSaveRow(index)}
                          className="text-green-600 hover:text-green-800 text-xs px-2 py-1 border border-green-300 rounded"
                          title="保存"
                        >
                          ✓ 保存
                        </button>
                        <button
                          onClick={() => handleCancelEdit(index)}
                          className="text-gray-600 hover:text-gray-800 text-xs px-2 py-1 border border-gray-300 rounded"
                          title="キャンセル"
                        >
                          ✕ キャンセル
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEditRow(index)}
                          className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-300 rounded"
                          title="編集"
                        >
                          ✏️ 編集
                        </button>
                        <button
                          onClick={() => deleteProduct(index)}
                          className="text-red-600 hover:text-red-800 text-xs px-2 py-1 border border-red-300 rounded"
                          title="削除"
                        >
                          🗑️ 削除
                        </button>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 font-medium">
                  {index + 1}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  {renderEditableCell(product, index, 'category')}
                </td>
                <td className="px-3 py-2 text-sm max-w-xs">
                  {renderEditableCell(product, index, 'product_name')}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  {renderEditableCell(product, index, 'manufacturer')}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  {renderEditableCell(product, index, 'model_number')}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  {renderEditableCell(product, index, 'color')}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  {renderEditableCell(product, index, 'serial_number')}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  {renderEditableCell(product, index, 'price')}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  {renderEditableCell(product, index, 'wholesale_price')}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  {renderEditableCell(product, index, 'wholesale_rate')}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  {renderEditableCell(product, index, 'purchase_date')}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  {renderEditableCell(product, index, 'supplier')}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  {renderEditableCell(product, index, 'condition')}
                </td>
                <td className="px-3 py-2 text-sm max-w-xs">
                  {renderEditableCell(product, index, 'notes')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center space-x-4 pt-4 border-t border-green-200">
        <button
          onClick={() => onRegister(editableProducts)}
          disabled={isRegistering || editableProducts.length === 0}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
        >
          {isRegistering ? '登録中...' : `この内容で${editableProducts.length}件を登録する`}
        </button>
        <button
          onClick={onCancel}
          disabled={isRegistering}
          className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          キャンセル
        </button>
      </div>

      <div className="mt-4 text-xs text-gray-600">
        <p>* は必須項目です。「✏️ 編集」ボタンで編集モード、「✓ 保存」または「✕ キャンセル」で完了。</p>
      </div>
    </div>
  )
}