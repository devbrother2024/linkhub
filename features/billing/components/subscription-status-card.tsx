import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { getEffectivePlanType, getDaysUntilExpiry } from '@/lib/billing'

interface SubscriptionStatusCardProps {
  planType: 'FREE' | 'PRO'
  subscriptionStatus?: 'ACTIVE' | 'CANCELLED' | 'EXPIRED'
  currentPeriodEnd?: Date | null
}

export function SubscriptionStatusCard({
  planType,
  subscriptionStatus,
  currentPeriodEnd,
}: SubscriptionStatusCardProps) {
  const effectivePlanType = getEffectivePlanType(
    planType,
    subscriptionStatus || 'EXPIRED',
    currentPeriodEnd ?? null,
  )

  const daysUntilExpiry = currentPeriodEnd
    ? getDaysUntilExpiry(currentPeriodEnd)
    : getDaysUntilExpiry(null)

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="mb-2 text-lg font-semibold text-black dark:text-zinc-50">
            구독 상태
          </h3>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                현재 플랜:
              </span>
              <span className="font-medium text-black dark:text-zinc-50">
                {effectivePlanType}
              </span>
            </div>
            {currentPeriodEnd && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  구독 만료일:
                </span>
                <span className="font-medium text-black dark:text-zinc-50">
                  {format(new Date(currentPeriodEnd), 'yyyy년 MM월 dd일', {
                    locale: ko,
                  })}
                  {daysUntilExpiry > 0 && (
                    <span className="ml-2 text-xs text-zinc-500">
                      ({daysUntilExpiry}일 남음)
                    </span>
                  )}
                </span>
              </div>
            )}
            {subscriptionStatus === 'CANCELLED' && (
              <div className="mt-2 rounded-md bg-yellow-50 px-3 py-2 text-sm text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                구독이 취소되었지만 만료일까지 서비스를 이용할 수 있습니다.
              </div>
            )}
          </div>
        </div>
        <Link href="/dashboard/subscription">
          <Button variant="outline">구독 관리</Button>
        </Link>
      </div>
    </Card>
  )
}

