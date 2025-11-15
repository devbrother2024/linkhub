import { redirect, notFound } from 'next/navigation'
import { getLinkBySlug, incrementClickCount } from '@/server/links/link-service'
import { headers } from 'next/headers'

interface RedirectPageProps {
  params: Promise<{ slug: string }>
}

export default async function RedirectPage({ params }: RedirectPageProps) {
  const { slug } = await params

  // 슬러그로 링크 조회
  const link = await getLinkBySlug(slug)

  if (!link) {
    notFound()
  }

  // 만료 체크
  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">링크가 만료되었습니다</h1>
          <p className="text-muted-foreground">
            이 링크는 만료되어 더 이상 사용할 수 없습니다.
          </p>
        </div>
      </div>
    )
  }

  // 클릭 제한 체크
  if (
    link.clickLimit !== null &&
    link.clickLimit !== undefined &&
    link.clickCount >= link.clickLimit
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">클릭 제한을 초과했습니다</h1>
          <p className="text-muted-foreground">
            이 링크는 최대 클릭 수({link.clickLimit}회)에 도달했습니다.
          </p>
        </div>
      </div>
    )
  }

  // 비활성 상태 체크
  if (link.status !== 'ACTIVE') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">링크가 비활성화되었습니다</h1>
          <p className="text-muted-foreground">
            이 링크는 현재 사용할 수 없습니다.
          </p>
        </div>
      </div>
    )
  }

  // 클릭 수 증가 (비동기로 처리)
  const headersList = await headers()
  const origin = headersList.get('referer') || headersList.get('origin') || undefined
  const userAgent = headersList.get('user-agent') || undefined

  // 비동기로 클릭 수 증가 (리다이렉션을 막지 않음)
  incrementClickCount(link.id, origin, userAgent).catch((error) => {
    console.error('클릭 수 증가 실패:', error)
  })

  // 원본 URL로 리다이렉션
  redirect(link.originalUrl)
}

