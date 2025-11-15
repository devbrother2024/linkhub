'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getPlanLimits, type PlanType } from '@/lib/plan'
import Link from 'next/link'

interface LinkStatsCardProps {
  planType: PlanType
  dailyCount: number
  activeCount: number
}

export function LinkStatsCard({
  planType,
  dailyCount,
  activeCount,
}: LinkStatsCardProps) {
  const limits = getPlanLimits(planType)
  const isPro = planType === 'PRO'

  const dailyLimit = limits.dailyLinkCreation
  const activeLimit = limits.maxActiveLinks

  const dailyPercentage =
    dailyLimit === Infinity ? 0 : (dailyCount / dailyLimit) * 100
  const activePercentage =
    activeLimit === Infinity ? 0 : (activeCount / activeLimit) * 100

  const dailyWarning = dailyPercentage >= 80
  const activeWarning = activePercentage >= 80

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* 일일 생성 한도 카드 */}
      <Card>
        <CardHeader>
          <CardTitle>일일 링크 생성 한도</CardTitle>
          <CardDescription>
            {isPro ? '무제한' : `오늘 ${dailyCount}개 생성`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {isPro ? '∞' : dailyCount}
              </span>
              {!isPro && (
                <span className="text-muted-foreground text-sm">
                  / {dailyLimit}개
                </span>
              )}
            </div>
            {!isPro && (
              <>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full transition-all ${
                      dailyWarning
                        ? 'bg-destructive'
                        : dailyPercentage >= 50
                          ? 'bg-yellow-500'
                          : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min(dailyPercentage, 100)}%` }}
                  />
                </div>
                {dailyWarning && (
                  <p className="text-destructive text-sm">
                    한도에 근접했습니다. Pro 플랜으로 업그레이드하세요.
                  </p>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 활성 링크 한도 카드 */}
      <Card>
        <CardHeader>
          <CardTitle>최대 활성 링크 수</CardTitle>
          <CardDescription>
            {isPro ? '무제한' : `현재 ${activeCount}개 활성`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {isPro ? '∞' : activeCount}
              </span>
              {!isPro && (
                <span className="text-muted-foreground text-sm">
                  / {activeLimit}개
                </span>
              )}
            </div>
            {!isPro && (
              <>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full transition-all ${
                      activeWarning
                        ? 'bg-destructive'
                        : activePercentage >= 50
                          ? 'bg-yellow-500'
                          : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min(activePercentage, 100)}%` }}
                  />
                </div>
                {activeWarning && (
                  <p className="text-destructive text-sm">
                    한도에 근접했습니다. Pro 플랜으로 업그레이드하세요.
                  </p>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 업그레이드 CTA (Free 플랜이고 한도에 근접한 경우) */}
      {!isPro && (dailyWarning || activeWarning) && (
        <Card className="md:col-span-2 border-primary">
          <CardHeader>
            <CardTitle>Pro 플랜으로 업그레이드</CardTitle>
            <CardDescription>
              무제한 링크 생성과 고급 기능을 사용하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/pricing">Pro 플랜 구독하기</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

