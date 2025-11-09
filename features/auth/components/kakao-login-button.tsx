'use client'

import { authClient } from '@/lib/auth-client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function KakaoLoginButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleKakaoLogin = async () => {
    try {
      setIsLoading(true)
      setError(null)

      await authClient.signIn.social({
        provider: 'kakao',
        callbackURL: '/dashboard',
      })

      // 리다이렉트는 Better Auth가 자동으로 처리합니다
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다',
      )
      setIsLoading(false)
    }
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <button
        onClick={handleKakaoLogin}
        disabled={isLoading}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#FEE500] text-black transition-colors hover:bg-[#FDD835] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <span>로그인 중...</span>
        ) : (
          <>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 0C4.48 0 0 3.74 0 8.35c0 2.9 1.88 5.46 4.7 6.95L3.5 20l5.25-2.8c.7.1 1.42.15 2.25.15 5.52 0 10-3.74 10-8.35S15.52 0 10 0z"
                fill="currentColor"
              />
            </svg>
            <span className="font-medium">카카오로 시작하기</span>
          </>
        )}
      </button>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}
