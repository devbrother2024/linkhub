import { KakaoLoginButton } from '@/features/auth/components/kakao-login-button'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex w-full max-w-md flex-col items-center gap-8 rounded-lg bg-white p-8 shadow-lg dark:bg-zinc-900">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
            LinkHub에 오신 것을 환영합니다
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            간편하게 소셜 로그인으로 시작하세요
          </p>
        </div>
        <KakaoLoginButton />
      </main>
    </div>
  )
}
