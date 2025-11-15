/**
 * 고객 키 생성 API
 * Toss Payments customerKey 생성용
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/server/auth/get-session'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // customerKey는 사용자 ID 기반으로 생성
    const customerKey = `customer_${session.user.id}`

    return NextResponse.json({
      customerKey,
      customerName: session.user.name || session.user.email,
      customerEmail: session.user.email,
    })
  } catch (error) {
    console.error('고객 키 생성 실패:', error)
    return NextResponse.json(
      {
        error: '고객 키 생성에 실패했습니다',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

