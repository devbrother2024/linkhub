'use server'

import { z } from 'zod'
import { getSession } from '@/server/auth/get-session'
import {
  createLink as createLinkService,
  getUserLinks,
  updateLink as updateLinkService,
  deleteLink as deleteLinkService,
  toggleLinkStatus as toggleLinkStatusService,
  getUserLinkStats,
} from '@/server/links/link-service'

// 입력 검증 스키마
const createLinkSchema = z.object({
  originalUrl: z.string().url('유효한 URL을 입력해주세요.'),
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
  expiresAt: z.coerce.date().optional(),
  clickLimit: z.number().int().positive().optional(),
})

const updateLinkSchema = z.object({
  originalUrl: z.string().url('유효한 URL을 입력해주세요.').optional(),
  expiresAt: z.coerce.date().nullable().optional(),
  clickLimit: z.number().int().positive().nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'EXPIRED']).optional(),
})

/**
 * 링크 생성 Server Action
 * useActionState를 사용하므로 (prevState, formData) 형태로 받아야 함
 */
export async function createLink(
  prevState: {
    success: boolean
    error?: string
    linkId?: string
    slug?: string
    shortUrl?: string
  } | null,
  formData: FormData,
) {
  try {
    const session = await getSession()
    if (!session) {
      return { success: false, error: '로그인이 필요합니다.' }
    }

    // FormData에서 값을 가져올 때 null을 undefined로 변환
    const getFormValue = (key: string): string | undefined => {
      const value = formData.get(key)
      return value && typeof value === 'string' && value.trim() !== ''
        ? value
        : undefined
    }

    const data = {
      originalUrl: formData.get('originalUrl') as string,
      slug: getFormValue('slug'),
      expiresAt: getFormValue('expiresAt')
        ? new Date(getFormValue('expiresAt')!)
        : undefined,
      clickLimit: getFormValue('clickLimit')
        ? parseInt(getFormValue('clickLimit')!, 10)
        : undefined,
    }

    // 입력 검증
    const validation = createLinkSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error:
          validation.error.issues[0]?.message || '입력값이 유효하지 않습니다.',
      }
    }

    const planType = (session.user.planType as 'FREE' | 'PRO') || 'FREE'

    const result = await createLinkService(
      {
        userId: session.user.id,
        ...validation.data,
      },
      planType,
    )

    if (!result.success) {
      return result
    }

    // 단축 URL 생성
    const brandDomain =
      process.env.NEXT_PUBLIC_BRAND_DOMAIN || 'http://localhost:3000'
    const shortUrl = `${brandDomain}/redirect/${result.slug}`

    return {
      success: true,
      linkId: result.linkId,
      slug: result.slug,
      shortUrl,
    }
  } catch (error) {
    console.error('링크 생성 실패:', error)
    return { success: false, error: '링크 생성에 실패했습니다.' }
  }
}

/**
 * 링크 목록 조회 Server Action
 */
export async function getLinks() {
  try {
    const session = await getSession()
    if (!session) {
      return { success: false, error: '로그인이 필요합니다.', links: [] }
    }

    const links = await getUserLinks(session.user.id)
    const brandDomain =
      process.env.NEXT_PUBLIC_BRAND_DOMAIN || 'http://localhost:3000'

    return {
      success: true,
      links: links.map((link) => ({
        ...link,
        shortUrl: `${brandDomain}/redirect/${link.slug}`,
      })),
    }
  } catch (error) {
    console.error('링크 목록 조회 실패:', error)
    return {
      success: false,
      error: '링크 목록 조회에 실패했습니다.',
      links: [],
    }
  }
}

/**
 * 링크 수정 Server Action
 */
export async function updateLink(linkId: string, formData: FormData) {
  try {
    const session = await getSession()
    if (!session) {
      return { success: false, error: '로그인이 필요합니다.' }
    }

    const data: Record<string, unknown> = {}
    if (formData.has('originalUrl')) {
      data.originalUrl = formData.get('originalUrl') as string
    }
    if (formData.has('expiresAt')) {
      const value = formData.get('expiresAt') as string
      data.expiresAt = value ? new Date(value) : null
    }
    if (formData.has('clickLimit')) {
      const value = formData.get('clickLimit') as string
      data.clickLimit = value ? parseInt(value, 10) : null
    }
    if (formData.has('status')) {
      data.status = formData.get('status') as string
    }

    const validation = updateLinkSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error:
          validation.error.issues[0]?.message || '입력값이 유효하지 않습니다.',
      }
    }

    const result = await updateLinkService(
      linkId,
      session.user.id,
      validation.data,
    )

    return result
  } catch (error) {
    console.error('링크 수정 실패:', error)
    return { success: false, error: '링크 수정에 실패했습니다.' }
  }
}

/**
 * 링크 삭제 Server Action
 */
export async function deleteLink(linkId: string) {
  try {
    const session = await getSession()
    if (!session) {
      return { success: false, error: '로그인이 필요합니다.' }
    }

    const result = await deleteLinkService(linkId, session.user.id)
    return result
  } catch (error) {
    console.error('링크 삭제 실패:', error)
    return { success: false, error: '링크 삭제에 실패했습니다.' }
  }
}

/**
 * 링크 상태 토글 Server Action
 */
export async function toggleLinkStatus(linkId: string) {
  try {
    const session = await getSession()
    if (!session) {
      return { success: false, error: '로그인이 필요합니다.' }
    }

    const result = await toggleLinkStatusService(linkId, session.user.id)
    return result
  } catch (error) {
    console.error('링크 상태 변경 실패:', error)
    return { success: false, error: '링크 상태 변경에 실패했습니다.' }
  }
}

/**
 * 사용자 통계 조회 Server Action
 */
export async function getLinkStats() {
  try {
    const session = await getSession()
    if (!session) {
      return {
        success: false,
        error: '로그인이 필요합니다.',
        stats: { dailyCount: 0, activeCount: 0 },
      }
    }

    const stats = await getUserLinkStats(session.user.id)
    return { success: true, stats }
  } catch (error) {
    console.error('통계 조회 실패:', error)
    return {
      success: false,
      error: '통계 조회에 실패했습니다.',
      stats: { dailyCount: 0, activeCount: 0 },
    }
  }
}
