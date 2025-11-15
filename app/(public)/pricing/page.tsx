import { redirect } from 'next/navigation'
import { getSession } from '@/server/auth/get-session'
import { BillingAuthButton } from '@/features/billing/components/billing-auth-button'

export default async function PricingPage() {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            LinkHub
          </h1>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl font-bold text-black dark:text-zinc-50">
            요금제 선택
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            링크 단축 서비스를 무료로 시작하거나 Pro 플랜으로 업그레이드하세요
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Free 플랜 */}
          <div className="rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-2 text-2xl font-semibold text-black dark:text-zinc-50">
              Free
            </h3>
            <div className="mb-6">
              <span className="text-4xl font-bold text-black dark:text-zinc-50">
                0원
              </span>
              <span className="text-zinc-600 dark:text-zinc-400">/월</span>
            </div>
            <ul className="mb-8 space-y-3">
              <li className="flex items-start">
                <span className="mr-2 text-green-500">✓</span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  일일 링크 생성 5개
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-green-500">✓</span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  최대 활성 링크 30개
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-green-500">✓</span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  기본 통계 제공
                </span>
              </li>
            </ul>
            {session.user.planType === 'FREE' ? (
              <div className="rounded-md bg-zinc-100 px-4 py-2 text-center text-sm font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                현재 플랜
              </div>
            ) : (
              <div className="rounded-md bg-zinc-100 px-4 py-2 text-center text-sm font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                다운그레이드 불가
              </div>
            )}
          </div>

          {/* Pro 플랜 */}
          <div className="rounded-lg border-2 border-blue-500 bg-white p-8 shadow-lg dark:bg-zinc-900">
            <div className="mb-4">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                추천
              </span>
            </div>
            <h3 className="mb-2 text-2xl font-semibold text-black dark:text-zinc-50">
              Pro
            </h3>
            <div className="mb-6">
              <span className="text-4xl font-bold text-black dark:text-zinc-50">
                4,900원
              </span>
              <span className="text-zinc-600 dark:text-zinc-400">/월</span>
            </div>
            <ul className="mb-8 space-y-3">
              <li className="flex items-start">
                <span className="mr-2 text-green-500">✓</span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  무제한 링크 생성
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-green-500">✓</span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  무제한 활성 링크
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-green-500">✓</span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  커스텀 슬러그
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-green-500">✓</span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  만료일 및 클릭 제한 설정
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-green-500">✓</span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  상세 통계 제공
                </span>
              </li>
            </ul>
            {session.user.planType === 'PRO' ? (
              <div className="rounded-md bg-blue-100 px-4 py-2 text-center text-sm font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                현재 플랜
              </div>
            ) : (
              <BillingAuthButton />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
