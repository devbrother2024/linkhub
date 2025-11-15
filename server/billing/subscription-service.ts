/**
 * 구독 서비스 계층
 * 구독 생성, 갱신, 취소 등의 비즈니스 로직 처리
 */

import { db } from '@/db/client'
import { subscription, paymentHistory } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { extendSubscriptionPeriod } from '@/lib/billing'

/**
 * 사용자의 활성 구독 조회
 */
export async function getActiveSubscription(userId: string) {
  const result = await db.query.subscription.findFirst({
    where: and(
      eq(subscription.userId, userId),
      eq(subscription.status, 'ACTIVE'),
    ),
    with: {
      paymentHistories: {
        orderBy: (histories, { desc }) => [desc(histories.createdAt)],
        limit: 10,
      },
    },
  })

  return result
}

/**
 * 사용자의 모든 구독 조회 (취소된 것 포함)
 */
export async function getUserSubscription(userId: string) {
  const result = await db.query.subscription.findFirst({
    where: eq(subscription.userId, userId),
    with: {
      paymentHistories: {
        orderBy: (histories, { desc }) => [desc(histories.createdAt)],
      },
    },
  })

  return result
}

interface PaymentInfo {
  orderId: string
  paymentKey: string
  paymentMethod?: string
  amount: number
  approvedAt?: string | Date | null
}

interface CreateSubscriptionParams {
  subscriptionId: string
  userId: string
  billingKey: string
  customerKey: string
  payment: PaymentInfo
}

/**
 * 구독 생성 (최초 결제 시)
 */
export async function createSubscriptionWithPayment({
  subscriptionId,
  userId,
  billingKey,
  customerKey,
  payment,
}: CreateSubscriptionParams) {
  const paidAt = payment.approvedAt
    ? new Date(payment.approvedAt)
    : new Date()
  const periodEnd = extendSubscriptionPeriod(null)

  // 구독 생성 및 첫 결제 이력 기록을 트랜잭션으로 처리
  const result = await db.transaction(async (tx) => {
    // 구독 생성
    const [newSubscription] = await tx
      .insert(subscription)
      .values({
        id: subscriptionId,
        userId,
        planType: 'PRO',
        status: 'ACTIVE',
        currentPeriodStart: paidAt,
        currentPeriodEnd: periodEnd,
        billingKey,
        customerKey,
      })
      .returning()

    // 첫 결제 이력 기록 (실제 결제 데이터 저장)
    const [paymentHistoryRecord] = await tx
      .insert(paymentHistory)
      .values({
        id: nanoid(),
        subscriptionId: newSubscription.id,
        orderId: payment.orderId,
        paymentKey: payment.paymentKey,
        paymentMethod: payment.paymentMethod || 'CARD',
        amount: payment.amount,
        status: 'SUCCESS',
        paidAt,
      })
      .returning()

    return { subscription: newSubscription, payment: paymentHistoryRecord }
  })

  return result
}

/**
 * orderId로 구독 찾기 (orderId 형식: order_{subscriptionId}_{timestamp})
 * nanoid는 가변 길이이므로 마지막 숫자 부분(timestamp)을 제거하여 subscriptionId 추출
 */
export async function findSubscriptionByOrderId(orderId: string) {
  // orderId 형식: order_{subscriptionId}_{timestamp}
  if (!orderId.startsWith('order_')) {
    return null
  }

  // order_ 제거
  const rest = orderId.substring(6) // 'order_'.length = 6

  // 마지막 _ 이후의 숫자 부분(timestamp) 찾기
  const lastUnderscoreIndex = rest.lastIndexOf('_')
  if (lastUnderscoreIndex === -1) {
    return null
  }

  // timestamp 부분이 숫자인지 확인
  const timestampPart = rest.substring(lastUnderscoreIndex + 1)
  if (!/^\d+$/.test(timestampPart)) {
    // timestamp가 아니면 전체를 subscriptionId로 간주
    const sub = await db.query.subscription.findFirst({
      where: eq(subscription.id, rest),
    })
    return sub
  }

  // subscriptionId 추출 (마지막 _ 이전 부분)
  const subscriptionId = rest.substring(0, lastUnderscoreIndex)

  const sub = await db.query.subscription.findFirst({
    where: eq(subscription.id, subscriptionId),
  })

  return sub
}

/**
 * 구독 갱신 (자동 결제 성공 시)
 */
interface RenewSubscriptionParams {
  subscriptionId: string
  amount: number
  paymentKey: string
  orderId: string
  paymentMethod?: string
  approvedAt?: string | Date | null
}

export async function renewSubscription({
  subscriptionId,
  amount,
  paymentKey,
  orderId,
  paymentMethod,
  approvedAt,
}: RenewSubscriptionParams) {
  const now = new Date()
  const paidAt = approvedAt ? new Date(approvedAt) : now

  const result = await db.transaction(async (tx) => {
    // 기존 구독 조회
    const existing = await tx.query.subscription.findFirst({
      where: eq(subscription.id, subscriptionId),
    })

    if (!existing) {
      throw new Error('구독을 찾을 수 없습니다')
    }

    // 구독 기간 연장
    const newPeriodEnd = extendSubscriptionPeriod(existing.currentPeriodEnd)

    // 구독 업데이트
    const [updated] = await tx
      .update(subscription)
      .set({
        status: 'ACTIVE',
        currentPeriodEnd: newPeriodEnd,
        updatedAt: now,
      })
      .where(eq(subscription.id, subscriptionId))
      .returning()

    // 결제 이력 기록
    const [payment] = await tx
      .insert(paymentHistory)
      .values({
        id: nanoid(),
        subscriptionId,
        orderId,
        paymentKey,
        paymentMethod: paymentMethod || 'CARD',
        amount,
        status: 'SUCCESS',
        paidAt,
      })
      .returning()

    return { subscription: updated, payment }
  })

  return result
}

/**
 * 구독 취소 (만료일까지 유지)
 */
export async function cancelSubscription(subscriptionId: string) {
  const now = new Date()

  const [updated] = await db
    .update(subscription)
    .set({
      status: 'CANCELLED',
      updatedAt: now,
    })
    .where(eq(subscription.id, subscriptionId))
    .returning()

  return updated
}

/**
 * 구독 재활성화 (재구독)
 */
export async function reactivateSubscription(
  subscriptionId: string,
  billingKey: string,
  customerKey: string,
) {
  const now = new Date()
  const periodEnd = extendSubscriptionPeriod(null)

  const [updated] = await db
    .update(subscription)
    .set({
      status: 'ACTIVE',
      billingKey,
      customerKey,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      updatedAt: now,
    })
    .where(eq(subscription.id, subscriptionId))
    .returning()

  return updated
}

/**
 * 만료된 구독을 EXPIRED로 변경
 */
export async function expireSubscription(subscriptionId: string) {
  const now = new Date()

  const [updated] = await db
    .update(subscription)
    .set({
      status: 'EXPIRED',
      updatedAt: now,
    })
    .where(eq(subscription.id, subscriptionId))
    .returning()

  return updated
}

