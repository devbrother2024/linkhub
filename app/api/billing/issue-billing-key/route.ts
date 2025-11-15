/**
 * 빌링키 발급 API Route Handler
 * Toss Payments 결제창에서 리다이렉트된 후 authKey로 빌링키 발급
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/server/auth/get-session'
import { issueBillingKey, approveBillingPayment } from '@/server/billing/toss-service'
import { createSubscriptionWithPayment } from '@/server/billing/subscription-service'
import { db } from '@/db/client'
import { user } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { authKey, amount, customerKey: providedCustomerKey } = body

    if (!authKey) {
      return NextResponse.json(
        { error: 'authKey is required' },
        { status: 400 },
      )
    }

    // customerKey는 사용자 ID 기반으로 생성 (필요 시 기본값 사용)
    const customerKey = providedCustomerKey || `customer_${session.user.id}`
    const price = amount || 4900

    // 빌링키 발급
    const billingResult = await issueBillingKey(authKey, customerKey)

    // 최초 결제 승인 (빌링키 기반)
    const subscriptionId = nanoid()
    const orderId = `order_${subscriptionId}_${Date.now()}`
    const paymentResult = await approveBillingPayment(
      billingResult.billingKey,
      billingResult.customerKey,
      orderId,
      'LinkHub Pro 구독',
      price,
    )

    if (paymentResult.status !== 'DONE') {
      throw new Error('결제 승인이 완료되지 않았습니다')
    }

    // 구독 생성 및 첫 결제 처리
    const subscriptionResult = await createSubscriptionWithPayment({
      subscriptionId,
      userId: session.user.id,
      billingKey: billingResult.billingKey,
      customerKey: billingResult.customerKey,
      payment: {
        orderId,
        paymentKey: paymentResult.paymentKey,
        paymentMethod: paymentResult.method,
        amount: paymentResult.totalAmount,
        approvedAt: paymentResult.approvedAt,
      },
    })

    // 사용자 플랜 타입 업데이트
    await db
      .update(user)
      .set({
        planType: 'PRO',
        planExpiresAt: subscriptionResult.subscription.currentPeriodEnd,
      })
      .where(eq(user.id, session.user.id))

    return NextResponse.json({
      success: true,
      subscription: subscriptionResult.subscription,
      payment: subscriptionResult.payment,
    })
  } catch (error) {
    console.error('빌링키 발급 실패:', error)
    return NextResponse.json(
      {
        error: '빌링키 발급에 실패했습니다',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

