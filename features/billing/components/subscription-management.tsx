'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  cancelUserSubscription,
  reactivateUserSubscription,
} from '@/app/dashboard/billing/actions'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { isSubscriptionActive, isCancelledButActive } from '@/lib/billing'

interface SubscriptionManagementProps {
  subscription: {
    id: string
    planType: string
    status: string
    currentPeriodStart: Date | null
    currentPeriodEnd: Date | null
    billingKey: string | null
    customerKey: string | null
    createdAt: Date
    paymentHistories?: Array<{
      id: string
      orderId: string
      paymentMethod: string
      amount: number
      status: string
      paidAt: Date | null
      createdAt: Date
    }>
  }
}

export function SubscriptionManagement({
  subscription,
}: SubscriptionManagementProps) {
  const [isCancelling, setIsCancelling] = useState(false)
  const router = useRouter()

  const handleCancel = async () => {
    if (
      !confirm(
        '구독을 취소하시겠습니까? 만료일까지는 계속 서비스를 이용할 수 있습니다.',
      )
    ) {
      return
    }

    try {
      setIsCancelling(true)
      const result = await cancelUserSubscription()

      if (result.success) {
        toast.success('구독이 취소되었습니다. 만료일까지 서비스를 이용할 수 있습니다.')
        router.refresh()
      } else {
        toast.error(result.error || '구독 취소에 실패했습니다')
      }
    } catch (error) {
      toast.error('구독 취소 중 오류가 발생했습니다')
    } finally {
      setIsCancelling(false)
    }
  }

  const handleReactivate = async () => {
    // 재구독은 새로운 결제 플로우 필요
    router.push('/pricing')
  }

  const isActive = isSubscriptionActive(
    subscription.status as any,
    subscription.currentPeriodEnd,
  )
  const isCancelledButStillActive = isCancelledButActive(
    subscription.status as any,
    subscription.currentPeriodEnd,
  )

  return (
    <div className="space-y-6">
      {/* 현재 구독 정보 */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-black dark:text-zinc-50">
          현재 구독 정보
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-zinc-600 dark:text-zinc-400">플랜</span>
            <span className="font-medium text-black dark:text-zinc-50">
              {subscription.planType}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600 dark:text-zinc-400">상태</span>
            <span className="font-medium text-black dark:text-zinc-50">
              {subscription.status === 'ACTIVE'
                ? '활성'
                : subscription.status === 'CANCELLED'
                  ? '취소됨'
                  : '만료됨'}
            </span>
          </div>
          {subscription.currentPeriodStart && (
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">
                구독 시작일
              </span>
              <span className="font-medium text-black dark:text-zinc-50">
                {format(
                  new Date(subscription.currentPeriodStart),
                  'yyyy년 MM월 dd일',
                  { locale: ko },
                )}
              </span>
            </div>
          )}
          {subscription.currentPeriodEnd && (
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">
                구독 만료일
              </span>
              <span className="font-medium text-black dark:text-zinc-50">
                {format(
                  new Date(subscription.currentPeriodEnd),
                  'yyyy년 MM월 dd일',
                  { locale: ko },
                )}
              </span>
            </div>
          )}
          {subscription.paymentHistories &&
            subscription.paymentHistories.length > 0 && (
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">
                  마지막 결제일
                </span>
                <span className="font-medium text-black dark:text-zinc-50">
                  {subscription.paymentHistories[0].paidAt
                    ? format(
                        new Date(subscription.paymentHistories[0].paidAt),
                        'yyyy년 MM월 dd일',
                        { locale: ko },
                      )
                    : '-'}
                </span>
              </div>
            )}
        </div>

        <div className="mt-6 flex gap-4">
          {isActive && !isCancelledButStillActive && (
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? '처리 중...' : '구독 취소'}
            </Button>
          )}
          {!isActive && (
            <Button onClick={handleReactivate}>다시 구독하기</Button>
          )}
          {isCancelledButStillActive && (
            <div className="rounded-md bg-yellow-50 px-4 py-2 text-sm text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              구독이 취소되었지만 만료일까지 서비스를 이용할 수 있습니다.
            </div>
          )}
        </div>
      </Card>

      {/* 결제 이력 */}
      {subscription.paymentHistories &&
        subscription.paymentHistories.length > 0 && (
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-black dark:text-zinc-50">
              결제 이력
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>결제일</TableHead>
                  <TableHead>결제 수단</TableHead>
                  <TableHead>금액</TableHead>
                  <TableHead>주문번호</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscription.paymentHistories.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {payment.paidAt
                        ? format(
                            new Date(payment.paidAt),
                            'yyyy-MM-dd HH:mm',
                            { locale: ko },
                          )
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {payment.paymentMethod === 'CARD' ? '카드' : '계좌이체'}
                    </TableCell>
                    <TableCell>
                      {payment.amount.toLocaleString()}원
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {payment.orderId}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          payment.status === 'SUCCESS'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : payment.status === 'FAILED'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}
                      >
                        {payment.status === 'SUCCESS'
                          ? '성공'
                          : payment.status === 'FAILED'
                            ? '실패'
                            : '대기중'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
    </div>
  )
}

