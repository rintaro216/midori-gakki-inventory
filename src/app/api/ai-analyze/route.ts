import { NextRequest, NextResponse } from 'next/server'
import { analyzeInventory } from '@/services/openai'

export async function POST(request: NextRequest) {
  try {
    const { inventoryData } = await request.json()

    if (!Array.isArray(inventoryData)) {
      return NextResponse.json(
        { error: 'Inventory data must be an array' },
        { status: 400 }
      )
    }

    const result = await analyzeInventory(inventoryData)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      insights: result.insights
    })

  } catch (error) {
    console.error('AI Analyze API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}