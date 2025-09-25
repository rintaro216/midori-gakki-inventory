'use client'

import { useState, useEffect } from 'react'

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

interface EditableProductTableProps {
  products: Product[]
  onProductsChange: (products: Product[]) => void
  onRegister: () => void
  onCancel: () => void
  isRegistering: boolean
}

const CATEGORIES = [
  'ギター', 'ベース', 'ドラム', 'キーボード・ピアノ', '管楽器',
  '弦楽器', 'アンプ', 'エフェクター', 'アクセサリー', 'その他'
]

const CONDITIONS = ['新品', '中古', '展示品', 'B級品', 'ジャンク']

const COLORS = [
  'ブラック', 'ホワイト', 'ナチュラル', 'サンバースト', 'チェリー',
  'ブルー', 'レッド', 'グリーン', 'イエロー', 'その他'
]

export default function EditableProductTable({
  products,
  onProductsChange,
  onRegister,
  onCancel,
  isRegistering
}: EditableProductTableProps) {
  const [editableProducts, setEditableProducts] = useState<Product[]>(products)
  const [editingCell, setEditingCell] = useState<{row: number, field: keyof Product} | null>(null)

  useEffect(() => {
    setEditableProducts(products)
  }, [products])

  const handleCellEdit = (rowIndex: number, field: keyof Product, value: string) => {
    const updatedProducts = [...editableProducts]
    updatedProducts[rowIndex] = { ...updatedProducts[rowIndex], [field]: value }
    setEditableProducts(updatedProducts)
    onProductsChange(updatedProducts)
  }

  const handleCellClick = (rowIndex: number, field: keyof Product) => {
    setEditingCell({ row: rowIndex, field })
  }

  const handleCellBlur = () => {
    setEditingCell(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, field: keyof Product) => {
    if (e.key === 'Enter') {
      setEditingCell(null)
    } else if (e.key === 'Escape') {
      setEditingCell(null)
    }
  }

  const addNewProduct = () => {
    const newProduct: Product = {
      category: 'ギター',
      product_name: '',
      manufacturer: '',
      model_number: '',
      color: 'ブラック',
      condition: '中古',
      price: '0',
      supplier: '',
      notes: ''
    }
    const updatedProducts = [...editableProducts, newProduct]
    setEditableProducts(updatedProducts)
    onProductsChange(updatedProducts)
  }

  const deleteProduct = (index: number) => {
    const updatedProducts = editableProducts.filter((_, i) => i !== index)
    setEditableProducts(updatedProducts)
    onProductsChange(updatedProducts)
  }

  const renderEditableCell = (product: Product, rowIndex: number, field: keyof Product) => {
    const isEditing = editingCell?.row === rowIndex && editingCell?.field === field
    const value = product[field] || ''

    if (isEditing) {
      if (field === 'category') {
        return (
          <select
            value={value}
            onChange={(e) => handleCellEdit(rowIndex, field, e.target.value)}
            onBlur={handleCellBlur}
            onKeyDown={(e) => handleKeyDown(e, rowIndex, field)}
            className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
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
            onBlur={handleCellBlur}
            onKeyDown={(e) => handleKeyDown(e, rowIndex, field)}
            className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
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
            onBlur={handleCellBlur}
            onKeyDown={(e) => handleKeyDown(e, rowIndex, field)}
            className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          >
            {COLORS.map(color => (
              <option key={color} value={color}>{color}</option>
            ))}
          </select>
        )
      } else {
        return (
          <input
            type={field === 'price' || field === 'list_price' || field === 'wholesale_price' ? 'number' : 'text'}
            value={value}
            onChange={(e) => handleCellEdit(rowIndex, field, e.target.value)}
            onBlur={handleCellBlur}
            onKeyDown={(e) => handleKeyDown(e, rowIndex, field)}
            className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        )
      }
    }

    return (
      <div
        onClick={() => handleCellClick(rowIndex, field)}
        className="px-2 py-1 text-sm cursor-pointer hover:bg-blue-50 rounded min-h-[24px]"
        title="クリックして編集"
      >
        {field === 'price' && value ? `¥${parseInt(value).toLocaleString()}` : value || '-'}
      </div>
    )
  }

  return (
    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-medium text-green-800">
          📝 抽出された商品データの編集・確認 ({editableProducts.length}件)
        </h4>
        <div className="space-x-2">
          <button
            onClick={addNewProduct}
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
          💡 <strong>編集方法:</strong> セルをクリックして直接編集できます。Enter/Escキーで編集完了。
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
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">型番*</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">色*</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">状態*</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">価格*</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">仕入先</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">備考</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {editableProducts.map((product, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  <button
                    onClick={() => deleteProduct(index)}
                    className="text-red-600 hover:text-red-800 text-xs"
                    title="削除"
                  >
                    🗑️
                  </button>
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
                  {renderEditableCell(product, index, 'condition')}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  {renderEditableCell(product, index, 'price')}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  {renderEditableCell(product, index, 'supplier')}
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
          onClick={onRegister}
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
        <p>* は必須項目です。編集後、「登録」ボタンをクリックしてください。</p>
      </div>
    </div>
  )
}