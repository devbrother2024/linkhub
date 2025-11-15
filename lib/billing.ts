import type { PlanType } from './plan'

export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED'

export type PaymentStatus = 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'PENDING'

/**
 * 구독 상태 확인
 * @param status 구독 상태
 * @param currentPeriodEnd 구독 만료일
 * @returns 현재 구독이 활성화되어 있는지 여부
 */
export function isSubscriptionActive(
  status: SubscriptionStatus,
  currentPeriodEnd: Date | null,
): boolean {
  if (status === 'CANCELLED' || status === 'EXPIRED') {
    return false
  }

  if (!currentPeriodEnd) {
    return status === 'ACTIVE'
  }

  // 취소된 구독도 만료일까지는 사용 가능
  return new Date() < currentPeriodEnd
}

/**
 * 구독 만료일까지 남은 일수 계산
 * @param currentPeriodEnd 구독 만료일
 * @returns 남은 일수 (만료되었으면 0)
 */
export function getDaysUntilExpiry(currentPeriodEnd: Date | null): number {
  if (!currentPeriodEnd) {
    return 0
  }

  const now = new Date()
  const expiry = new Date(currentPeriodEnd)
  const diffTime = expiry.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return Math.max(0, diffDays)
}

/**
 * 구독 취소 후 만료일까지 사용 가능한지 확인
 * @param status 구독 상태
 * @param currentPeriodEnd 구독 만료일
 * @returns 취소되었지만 만료일까지 사용 가능한지 여부
 */
export function isCancelledButActive(
  status: SubscriptionStatus,
  currentPeriodEnd: Date | null,
): boolean {
  if (status !== 'CANCELLED') {
    return false
  }

  return isSubscriptionActive(status, currentPeriodEnd)
}

/**
 * 다음 결제일 계산 (구독 시작일 기준으로 한 달 후)
 * @param currentPeriodStart 구독 시작일
 * @returns 다음 결제일
 */
export function getNextBillingDate(
  currentPeriodStart: Date | null,
): Date | null {
  if (!currentPeriodStart) {
    return null
  }

  const nextDate = new Date(currentPeriodStart)
  nextDate.setMonth(nextDate.getMonth() + 1)
  return nextDate
}

/**
 * 구독 기간 연장 (한 달)
 * @param currentPeriodEnd 현재 만료일
 * @returns 연장된 만료일
 */
export function extendSubscriptionPeriod(
  currentPeriodEnd: Date | null,
): Date {
  const baseDate = currentPeriodEnd ? new Date(currentPeriodEnd) : new Date()
  baseDate.setMonth(baseDate.getMonth() + 1)
  return baseDate
}

/**
 * 사용자의 실제 플랜 타입 결정 (구독 상태 고려)
 * @param planType 사용자 플랜 타입
 * @param subscriptionStatus 구독 상태
 * @param currentPeriodEnd 구독 만료일
 * @returns 실제 적용되는 플랜 타입
 */
export function getEffectivePlanType(
  planType: PlanType,
  subscriptionStatus: SubscriptionStatus,
  currentPeriodEnd: Date | null,
): PlanType {
  if (planType === 'PRO' && isSubscriptionActive(subscriptionStatus, currentPeriodEnd)) {
    return 'PRO'
  }
  return 'FREE'
}

