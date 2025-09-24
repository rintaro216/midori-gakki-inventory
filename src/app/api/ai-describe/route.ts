import { NextRequest, NextResponse } from 'next/server'
import { generateProductDescription } from '@/services/openai'

export async function POST(request: NextRequest) {
  try {
    const { productData } = await request.json()

    if (!productData || typeof productData !== 'object') {
      return NextResponse.json(
        { error: 'Product data is required and must be an object' },
        { status: 400 }
      )
    }

    const result = await generateProductDescription(productData)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      description: result.description
    })

  } catch (error) {
    console.error('AI Describe API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}