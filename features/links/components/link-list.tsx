'use client'

import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getLinks, deleteLink, toggleLinkStatus } from '@/app/dashboard/actions'
import { copyToClipboard, formatDate, formatShortUrl } from '../utils'
import { toast } from 'sonner'
import { formatRelativeTime } from '../utils'

interface Link {
  id: string
  originalUrl: string
  slug: string
  clickCount: number
  expiresAt: Date | string | null
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED'
  createdAt: Date | string
  shortUrl?: string
}

interface LinkListProps {
  initialLinks?: Link[]
}

export function LinkList({ initialLinks = [] }: LinkListProps) {
  const [links, setLinks] = useState<Link[]>(initialLinks)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED'>(
    'ALL',
  )
  const [loading, setLoading] = useState(false)

  const fetchLinks = async () => {
    setLoading(true)
    try {
      const result = await getLinks()
      if (result.success) {
        setLinks(result.links)
      } else {
        toast.error(result.error || '링크 목록을 불러오는데 실패했습니다.')
      }
    } catch (error) {
      toast.error('링크 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialLinks.length === 0) {
      fetchLinks()
    }
  }, [])

  const handleCopy = async (shortUrl: string) => {
    const success = await copyToClipboard(shortUrl)
    if (success) {
      toast.success('링크가 클립보드에 복사되었습니다!')
    } else {
      toast.error('링크 복사에 실패했습니다.')
    }
  }

  const handleDelete = async (linkId: string) => {
    if (!confirm('정말 이 링크를 삭제하시겠습니까?')) {
      return
    }

    const result = await deleteLink(linkId)
    if (result.success) {
      toast.success('링크가 삭제되었습니다.')
      fetchLinks()
    } else {
      toast.error(result.error || '링크 삭제에 실패했습니다.')
    }
  }

  const handleToggleStatus = async (linkId: string) => {
    const result = await toggleLinkStatus(linkId)
    if (result.success) {
      toast.success('링크 상태가 변경되었습니다.')
      fetchLinks()
    } else {
      toast.error(result.error || '링크 상태 변경에 실패했습니다.')
    }
  }

  // 필터링 및 검색
  const filteredLinks = links.filter((link) => {
    const matchesSearch =
      link.originalUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.slug.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || link.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // 만료 임박 링크 체크 (7일 이내 만료)
  const isExpiringSoon = (expiresAt: Date | string | null): boolean => {
    if (!expiresAt) return false
    const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt
    const now = new Date()
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays > 0 && diffDays <= 7
  }

  // 클릭 제한 초과 체크 (실제로는 link 객체에 clickLimit이 있어야 함)
  // 여기서는 간단히 표시만 함

  if (loading && links.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          링크 목록을 불러오는 중...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>링크 목록</CardTitle>
        <CardDescription>생성한 링크를 관리하세요.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* 검색 및 필터 */}
        <div className="mb-4 flex flex-col gap-4 sm:flex-row">
          <Input
            placeholder="URL 또는 슬러그로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED',
              )
            }
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            <option value="ALL">전체</option>
            <option value="ACTIVE">활성</option>
            <option value="INACTIVE">비활성</option>
            <option value="EXPIRED">만료</option>
          </select>
        </div>

        {/* 테이블 */}
        {filteredLinks.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {searchQuery || statusFilter !== 'ALL'
              ? '검색 결과가 없습니다.'
              : '생성된 링크가 없습니다.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>원본 URL</TableHead>
                  <TableHead>단축 URL</TableHead>
                  <TableHead>클릭 수</TableHead>
                  <TableHead>만료일</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>생성일</TableHead>
                  <TableHead className="text-right">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLinks.map((link) => {
                  const shortUrl = link.shortUrl || formatShortUrl(link.slug)
                  const expiringSoon = isExpiringSoon(link.expiresAt)
                  const isExpired =
                    link.expiresAt &&
                    new Date(link.expiresAt) < new Date()

                  return (
                    <TableRow
                      key={link.id}
                      className={
                        expiringSoon || isExpired
                          ? 'bg-yellow-50 dark:bg-yellow-950/20'
                          : ''
                      }
                    >
                      <TableCell className="max-w-[200px] truncate">
                        <a
                          href={link.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {link.originalUrl}
                        </a>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{shortUrl}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(shortUrl)}
                          >
                            복사
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(shortUrl, '_blank')}
                            title="새 탭에서 열기"
                          >
                            바로가기
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{link.clickCount}</TableCell>
                      <TableCell>
                        {link.expiresAt ? (
                          <span
                            className={
                              isExpired
                                ? 'text-destructive'
                                : expiringSoon
                                  ? 'text-yellow-600 dark:text-yellow-400'
                                  : ''
                            }
                          >
                            {formatDate(link.expiresAt)}
                            {expiringSoon && !isExpired && ' (만료 임박)'}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            link.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : link.status === 'INACTIVE'
                                ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}
                        >
                          {link.status === 'ACTIVE'
                            ? '활성'
                            : link.status === 'INACTIVE'
                              ? '비활성'
                              : '만료'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatRelativeTime(link.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(link.id)}
                          >
                            {link.status === 'ACTIVE' ? '비활성화' : '활성화'}
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(link.id)}
                          >
                            삭제
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

