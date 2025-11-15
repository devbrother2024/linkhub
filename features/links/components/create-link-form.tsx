'use client'

import { useActionState, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createLink } from '@/app/dashboard/actions'
import { copyToClipboard, formatShortUrl } from '../utils'
import { toast } from 'sonner'
import { isProPlan, type PlanType } from '@/lib/plan'

interface CreateLinkFormProps {
  planType: PlanType
}

export function CreateLinkForm({ planType }: CreateLinkFormProps) {
  const [state, formAction, isPending] = useActionState(createLink, null)
  const [originalUrl, setOriginalUrl] = useState('')
  const [slug, setSlug] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [clickLimit, setClickLimit] = useState('')
  const [createdShortUrl, setCreatedShortUrl] = useState<string | null>(null)

  const isPro = isProPlan(planType)

  useEffect(() => {
    if (state?.success) {
      const shortUrl = state.shortUrl || formatShortUrl(state.slug)
      setCreatedShortUrl(shortUrl)
      setOriginalUrl('')
      setSlug('')
      setExpiresAt('')
      setClickLimit('')
      toast.success('링크가 생성되었습니다!')
      // 페이지 새로고침으로 통계 및 링크 목록 업데이트
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  const handleCopy = async () => {
    if (createdShortUrl) {
      const success = await copyToClipboard(createdShortUrl)
      if (success) {
        toast.success('링크가 클립보드에 복사되었습니다!')
      } else {
        toast.error('링크 복사에 실패했습니다.')
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>새 링크 생성</CardTitle>
        <CardDescription>
          URL을 입력하고 단축 링크를 생성하세요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {/* 원본 URL */}
          <div className="space-y-2">
            <Label htmlFor="originalUrl">원본 URL *</Label>
            <Input
              id="originalUrl"
              name="originalUrl"
              type="url"
              placeholder="https://example.com"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              required
              disabled={isPending}
            />
          </div>

          {/* 커스텀 슬러그 (Pro 플랜만) */}
          {isPro && (
            <div className="space-y-2">
              <Label htmlFor="slug">커스텀 슬러그 (선택사항)</Label>
              <Input
                id="slug"
                name="slug"
                type="text"
                placeholder="my-custom-link"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                disabled={isPending}
                pattern="[a-zA-Z0-9_-]{3,50}"
                title="영문자, 숫자, 하이픈(-), 언더스코어(_)만 사용 가능하며 3-50자여야 합니다."
              />
              <p className="text-muted-foreground text-xs">
                영문자, 숫자, 하이픈(-), 언더스코어(_)만 사용 가능합니다. (3-50자)
              </p>
            </div>
          )}

          {/* 만료일 (Pro 플랜만) */}
          {isPro && (
            <div className="space-y-2">
              <Label htmlFor="expiresAt">만료일 (선택사항)</Label>
              <Input
                id="expiresAt"
                name="expiresAt"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                disabled={isPending}
              />
            </div>
          )}

          {/* 클릭 제한 (Pro 플랜만) */}
          {isPro && (
            <div className="space-y-2">
              <Label htmlFor="clickLimit">클릭 제한 (선택사항)</Label>
              <Input
                id="clickLimit"
                name="clickLimit"
                type="number"
                placeholder="100"
                min="1"
                value={clickLimit}
                onChange={(e) => setClickLimit(e.target.value)}
                disabled={isPending}
              />
              <p className="text-muted-foreground text-xs">
                최대 클릭 수를 설정할 수 있습니다.
              </p>
            </div>
          )}

          {/* 생성 버튼 */}
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? '생성 중...' : '링크 생성'}
          </Button>
        </form>

        {/* 생성 성공 시 단축 URL 표시 */}
        {createdShortUrl && (
          <div className="mt-4 space-y-2 rounded-lg border bg-muted/50 p-4">
            <Label>생성된 단축 링크</Label>
            <div className="flex gap-2">
              <Input value={createdShortUrl} readOnly className="font-mono text-sm" />
              <Button type="button" onClick={handleCopy} variant="outline">
                복사
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

