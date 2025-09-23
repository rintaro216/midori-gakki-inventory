'use client'

import { useState } from 'react'
import type { Database } from '@/lib/supabase'

type InventoryItem = Database['public']['Tables']['inventory']['Row']

interface DeleteConfirmModalProps {
  item: InventoryItem | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (itemId: string) => void
}

export default function DeleteConfirmModal({ item, isOpen, onClose, onConfirm }: DeleteConfirmModalProps) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!item) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/inventory/${item.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (response.ok && result.success) {
        onConfirm(item.id)
        onClose()
      } else {
        alert(`削除に失敗しました: ${result.error}`)
      }
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除中にエラーが発生しました')
    } finally {
      setDeleting(false)
    }
  }

  if (!isOpen || !item) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
            商品を削除しますか？
          </h3>
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              以下の商品を削除します。この操作は取り消すことができません。
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left">
              <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
              <p className="text-sm text-gray-600">メーカー: {item.manufacturer}</p>
              <p className="text-sm text-gray-600">型番: {item.model_number}</p>
              <p className="text-sm text-gray-600">価格: ¥{item.price.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex justify-center space-x-4 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
              disabled={deleting}
            >
              キャンセル
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50"
              disabled={deleting}
            >
              {deleting ? '削除中...' : '削除する'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}