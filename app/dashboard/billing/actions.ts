'use server'

import { getSession } from '@/server/auth/get-session'
import {
  getUserSubscription,
  cancelSubscription,
  reactivateSubscription,
} from '@/server/billing/subscription-service'
import { db } from '@/db/client'
import { user } from '@/db/schema'
import { eq } from 'drizzle-orm'

/**
 * 사용자 구독 정보 조회
 */
export async function getSubscription() {
  try {
    const session = await getSession()
    if (!session) {
      return { success: false, error: 'Unauthorized' }
    }

    const subscription = await getUserSubscription(session.user.id)
    return { success: true, subscription }
  } catch (error) {
    console.error('구독 정보 조회 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 구독 취소
 */
export async function cancelUserSubscription() {
  try {
    const session = await getSession()
    if (!session) {
      return { success: false, error: 'Unauthorized' }
    }

    const subscription = await getUserSubscription(session.user.id)
    if (!subscription) {
      return { success: false, error: '구독을 찾을 수 없습니다' }
    }

    const cancelled = await cancelSubscription(subscription.id)

    return { success: true, subscription: cancelled }
  } catch (error) {
    console.error('구독 취소 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 구독 재활성화 (재구독)
 */
export async function reactivateUserSubscription(
  billingKey: string,
  customerKey: string,
) {
  try {
    const session = await getSession()
    if (!session) {
      return { success: false, error: 'Unauthorized' }
    }

    const subscription = await getUserSubscription(session.user.id)
    if (!subscription) {
      return { success: false, error: '구독을 찾을 수 없습니다' }
    }

    const reactivated = await reactivateSubscription(
      subscription.id,
      billingKey,
      customerKey,
    )

    // 사용자 플랜 업데이트
    await db
      .update(user)
      .set({
        planType: 'PRO',
        planExpiresAt: reactivated.currentPeriodEnd,
      })
      .where(eq(user.id, session.user.id))

    return { success: true, subscription: reactivated }
  } catch (error) {
    console.error('구독 재활성화 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

