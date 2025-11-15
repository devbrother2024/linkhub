'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function BillingSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const processBillingKey = async () => {
      const authKey = searchParams.get('authKey')
      const customerKey = searchParams.get('customerKey')

      if (!authKey || !customerKey) {
        toast.error('결제 정보가 올바르지 않습니다')
        router.push('/pricing')
        return
      }

      try {
        // 빌링키 발급 API 호출
        const response = await fetch('/api/billing/issue-billing-key', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            authKey,
            customerKey,
            amount: 4900,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || '빌링키 발급 실패')
        }

        toast.success('구독이 활성화되었습니다!')
        router.push('/dashboard/subscription')
      } catch (error) {
        console.error('빌링키 발급 실패:', error)
        toast.error(
          error instanceof Error ? error.message : '구독 활성화에 실패했습니다',
        )
        router.push('/pricing')
      } finally {
        setIsProcessing(false)
      }
    }

    processBillingKey()
  }, [searchParams, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="text-center">
        {isProcessing ? (
          <>
            <div className="mb-4 text-2xl font-semibold text-black dark:text-zinc-50">
              구독 처리 중...
            </div>
            <p className="text-zinc-600 dark:text-zinc-400">
              잠시만 기다려주세요
            </p>
          </>
        ) : (
          <>
            <div className="mb-4 text-2xl font-semibold text-black dark:text-zinc-50">
              구독이 완료되었습니다!
            </div>
            <Button onClick={() => router.push('/dashboard/subscription')}>
              구독 관리로 이동
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

