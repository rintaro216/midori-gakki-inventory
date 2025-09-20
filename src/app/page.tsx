'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // ダッシュボードにリダイレクト
    router.push('/dashboard')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          みどり楽器 在庫管理システム
        </h1>
        <p className="text-gray-600">ダッシュボードに移動中...</p>
      </div>
    </div>
  )
}
