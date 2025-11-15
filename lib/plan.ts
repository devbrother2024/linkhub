export type PlanType = 'FREE' | 'PRO'

export interface PlanLimits {
  dailyLinkCreation: number
  maxActiveLinks: number
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  FREE: {
    dailyLinkCreation: 5,
    maxActiveLinks: 30,
  },
  PRO: {
    dailyLinkCreation: Infinity,
    maxActiveLinks: Infinity,
  },
}

export function getPlanLimits(planType: PlanType): PlanLimits {
  return PLAN_LIMITS[planType]
}

export function isProPlan(planType: PlanType): boolean {
  return planType === 'PRO'
}

export interface PlanLimitCheck {
  canCreate: boolean
  reason?: string
}

/**
 * 일일 생성 한도 체크
 * @param planType 플랜 타입
 * @param dailyCount 오늘 생성한 링크 수
 * @returns 한도 체크 결과
 */
export function checkDailyLimit(
  planType: PlanType,
  dailyCount: number,
): PlanLimitCheck {
  const limits = getPlanLimits(planType)
  if (limits.dailyLinkCreation === Infinity) {
    return { canCreate: true }
  }
  if (dailyCount >= limits.dailyLinkCreation) {
    return {
      canCreate: false,
      reason: `일일 생성 한도(${limits.dailyLinkCreation}개)를 초과했습니다.`,
    }
  }
  return { canCreate: true }
}

/**
 * 활성 링크 수 한도 체크
 * @param planType 플랜 타입
 * @param activeCount 현재 활성 링크 수
 * @returns 한도 체크 결과
 */
export function checkActiveLinksLimit(
  planType: PlanType,
  activeCount: number,
): PlanLimitCheck {
  const limits = getPlanLimits(planType)
  if (limits.maxActiveLinks === Infinity) {
    return { canCreate: true }
  }
  if (activeCount >= limits.maxActiveLinks) {
    return {
      canCreate: false,
      reason: `최대 활성 링크 수(${limits.maxActiveLinks}개)를 초과했습니다.`,
    }
  }
  return { canCreate: true }
}


