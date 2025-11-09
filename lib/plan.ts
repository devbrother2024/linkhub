export type PlanType = 'FREE' | 'PRO'

export interface PlanLimits {
  dailyLinkCreation: number
  maxActiveLinks: number
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  FREE: {
    dailyLinkCreation: 10,
    maxActiveLinks: 50,
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
