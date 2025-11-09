import { redirect } from 'next/navigation'
import { getSession } from '@/server/auth/get-session'
import { getPlanLimits } from '@/lib/plan'
import { LogoutButton } from '@/features/auth/components/logout-button'

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  const planLimits = getPlanLimits(
    (session.user.planType as 'FREE' | 'PRO') || 'FREE',
  )

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            LinkHub
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {session.user.name || session.user.email}
            </span>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {session.user.planType || 'FREE'}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-black dark:text-zinc-50">
            대시보드
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                일일 링크 생성 한도
              </h3>
              <p className="text-2xl font-semibold text-black dark:text-zinc-50">
                {planLimits.dailyLinkCreation === Infinity
                  ? '무제한'
                  : planLimits.dailyLinkCreation}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                최대 활성 링크 수
              </h3>
              <p className="text-2xl font-semibold text-black dark:text-zinc-50">
                {planLimits.maxActiveLinks === Infinity
                  ? '무제한'
                  : planLimits.maxActiveLinks}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-zinc-600 dark:text-zinc-400">
            링크 생성 기능은 곧 추가될 예정입니다.
          </p>
        </div>
      </main>
    </div>
  )
}
