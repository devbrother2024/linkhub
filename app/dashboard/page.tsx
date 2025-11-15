import { redirect } from 'next/navigation'
import { getSession } from '@/server/auth/get-session'
import { LogoutButton } from '@/features/auth/components/logout-button'
import { LinkStatsCard } from '@/features/links/components/link-stats-card'
import { CreateLinkForm } from '@/features/links/components/create-link-form'
import { LinkList } from '@/features/links/components/link-list'
import { getLinks, getLinkStats } from '@/app/dashboard/actions'
import { Toaster } from '@/components/ui/sonner'

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  const planType = (session.user.planType as 'FREE' | 'PRO') || 'FREE'

  // 통계 및 링크 목록 조회
  const [statsResult, linksResult] = await Promise.all([
    getLinkStats(),
    getLinks(),
  ])

  const stats = statsResult.success ? statsResult.stats : { dailyCount: 0, activeCount: 0 }
  const links = linksResult.success ? linksResult.links : []

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
          {/* 통계 카드 */}
          <LinkStatsCard
            planType={planType}
            dailyCount={stats.dailyCount}
            activeCount={stats.activeCount}
          />
        </div>

        <div className="mb-8">
          {/* 링크 생성 폼 */}
          <CreateLinkForm planType={planType} />
        </div>

        <div>
          {/* 링크 목록 */}
          <LinkList initialLinks={links} />
        </div>
      </main>
      <Toaster />
    </div>
  )
}
