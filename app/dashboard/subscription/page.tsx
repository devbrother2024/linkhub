import { redirect } from 'next/navigation'
import { getSession } from '@/server/auth/get-session'
import { getSubscription } from '@/app/dashboard/billing/actions'
import { SubscriptionManagement } from '@/features/billing/components/subscription-management'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export default async function SubscriptionPage() {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  const subscriptionResult = await getSubscription()
  const subscription = subscriptionResult.success
    ? subscriptionResult.subscription
    : null

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            LinkHub
          </h1>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold text-black dark:text-zinc-50">
            구독 관리
          </h2>
        </div>

        {subscription ? (
          <SubscriptionManagement subscription={subscription} />
        ) : (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="mb-4 text-zinc-600 dark:text-zinc-400">
              활성 구독이 없습니다
            </p>
            <a
              href="/pricing"
              className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              요금제 보기
            </a>
          </div>
        )}
      </main>
    </div>
  )
}

