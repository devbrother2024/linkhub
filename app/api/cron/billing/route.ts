/**
 * Vercel Cron: 자동 구독 갱신
 * 매일 03:00 (서울시간) 실행
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/client'
import { subscription } from '@/db/schema'
import { eq, and, lte } from 'drizzle-orm'
import { approveBillingPayment } from '@/server/billing/toss-service'
import { renewSubscription } from '@/server/billing/subscription-service'

/**
 * Cron 요청 인증 (Vercel Cron Secret)
 */
function verifyCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return false
  }

  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
  try {
    // Cron 인증 확인
    if (!verifyCronRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // 만료일이 오늘인 활성 구독 조회
    const subscriptionsToRenew = await db.query.subscription.findMany({
      where: and(
        eq(subscription.status, 'ACTIVE'),
        lte(subscription.currentPeriodEnd, tomorrow),
      ),
    })

    const results = []

    for (const sub of subscriptionsToRenew) {
      try {
        if (!sub.billingKey || !sub.customerKey) {
          console.warn(
            `구독 ${sub.id}: 빌링키 또는 고객키가 없습니다. 건너뜁니다.`,
          )
          continue
        }

        // 자동결제 승인
        const orderId = `order_${sub.id}_${Date.now()}`
        const amount = 4900 // 월 구독료

        const paymentResult = await approveBillingPayment(
          sub.billingKey,
          sub.customerKey,
          orderId,
          'LinkHub Pro 구독',
          amount,
        )

        // 구독 갱신
        await renewSubscription({
          subscriptionId: sub.id,
          amount,
          paymentKey: paymentResult.paymentKey,
          orderId,
          paymentMethod: paymentResult.method,
          approvedAt: paymentResult.approvedAt,
        })

        results.push({
          subscriptionId: sub.id,
          success: true,
          paymentKey: paymentResult.paymentKey,
        })
      } catch (error) {
        console.error(`구독 ${sub.id} 갱신 실패:`, error)
        results.push({
          subscriptionId: sub.id,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: subscriptionsToRenew.length,
      results,
    })
  } catch (error) {
    console.error('Cron 실행 실패:', error)
    return NextResponse.json(
      {
        error: 'Cron execution failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
