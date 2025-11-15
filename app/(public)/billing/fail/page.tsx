'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useEffect, Suspense } from 'react'

function BillingFailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const code = searchParams.get('code')
    const message = searchParams.get('message')

    if (code || message) {
      toast.error(message || `결제 실패: ${code}`)
    }
  }, [searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="text-center">
        <div className="mb-4 text-2xl font-semibold text-red-600 dark:text-red-400">
          결제에 실패했습니다
        </div>
        <p className="mb-8 text-zinc-600 dark:text-zinc-400">
          다시 시도하거나 다른 결제 수단을 사용해주세요
        </p>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => router.push('/pricing')}>
            요금제로 돌아가기
          </Button>
          <Button onClick={() => router.push('/dashboard')}>
            대시보드로 이동
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function BillingFailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
          <div className="text-center">
            <div className="mb-4 text-2xl font-semibold text-zinc-600 dark:text-zinc-400">
              로딩 중...
            </div>
          </div>
        </div>
      }
    >
      <BillingFailContent />
    </Suspense>
  )
}
