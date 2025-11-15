'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

declare global {
  interface Window {
    TossPayments: any
  }
}

export function BillingAuthButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleBillingAuth = async () => {
    try {
      setIsLoading(true)

      const clientKey = process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY
      if (!clientKey) {
        toast.error('결제 설정이 올바르지 않습니다')
        return
      }

      // 고객 키 및 사용자 정보 서버에서 가져오기
      const customerKeyResponse = await fetch('/api/billing/customer-key')
      if (!customerKeyResponse.ok) {
        throw new Error('고객 키를 가져올 수 없습니다')
      }
      const { customerKey, customerEmail, customerName } =
        await customerKeyResponse.json()

      // Toss Payments SDK 로드
      if (!window.TossPayments) {
        const script = document.createElement('script')
        script.src = 'https://js.tosspayments.com/v2/standard'
        script.async = true
        document.head.appendChild(script)

        await new Promise((resolve, reject) => {
          script.onload = resolve
          script.onerror = reject
        })
      }

      const tossPayments = window.TossPayments(clientKey)
      const payment = tossPayments.payment({ customerKey })

      // 자동결제 등록 요청
      await payment.requestBillingAuth({
        method: 'CARD',
        successUrl: `${window.location.origin}/billing/success`,
        failUrl: `${window.location.origin}/billing/fail`,
        customerEmail,
        customerName,
      })
    } catch (error) {
      console.error('결제창 오픈 실패:', error)
      toast.error('결제창을 열 수 없습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleBillingAuth}
      disabled={isLoading}
      className="w-full bg-blue-600 hover:bg-blue-700"
    >
      {isLoading ? '처리 중...' : 'Pro 플랜 시작하기'}
    </Button>
  )
}

