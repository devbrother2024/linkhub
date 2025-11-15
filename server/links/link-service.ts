import { db } from '@/db/client'
import { link, linkEvent } from '@/db/schema'
import { eq, and, gte, sql, count, desc } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { generateSlug, validateSlug } from '@/lib/slug'
import {
  checkDailyLimit,
  checkActiveLinksLimit,
  type PlanType,
} from '@/lib/plan'

export interface CreateLinkInput {
  userId: string
  originalUrl: string
  slug?: string
  expiresAt?: Date
  clickLimit?: number
}

export interface UpdateLinkInput {
  originalUrl?: string
  expiresAt?: Date | null
  clickLimit?: number | null
  status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED'
}

/**
 * 오늘 생성한 링크 수 조회
 */
async function getTodayLinkCount(userId: string): Promise<number> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const result = await db
    .select({ count: count() })
    .from(link)
    .where(
      and(
        eq(link.userId, userId),
        gte(link.createdAt, today),
      ),
    )

  return result[0]?.count || 0
}

/**
 * 활성 링크 수 조회
 */
async function getActiveLinkCount(userId: string): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(link)
    .where(
      and(
        eq(link.userId, userId),
        eq(link.status, 'ACTIVE'),
      ),
    )

  return result[0]?.count || 0
}

/**
 * 링크 생성
 */
export async function createLink(
  input: CreateLinkInput,
  planType: PlanType,
): Promise<{ success: true; linkId: string; slug: string } | { success: false; error: string }> {
  // 플랜 제한 검증
  const dailyCount = await getTodayLinkCount(input.userId)
  const dailyCheck = checkDailyLimit(planType, dailyCount)
  if (!dailyCheck.canCreate) {
    return { success: false, error: dailyCheck.reason || '일일 생성 한도 초과' }
  }

  const activeCount = await getActiveLinkCount(input.userId)
  const activeCheck = checkActiveLinksLimit(planType, activeCount)
  if (!activeCheck.canCreate) {
    return { success: false, error: activeCheck.reason || '활성 링크 한도 초과' }
  }

  // 슬러그 생성 또는 검증
  let finalSlug: string
  if (input.slug) {
    const validation = validateSlug(input.slug)
    if (!validation.valid) {
      return { success: false, error: validation.error || '유효하지 않은 슬러그' }
    }

    // 슬러그 중복 체크
    const existing = await db.query.link.findFirst({
      where: eq(link.slug, input.slug),
    })
    if (existing) {
      return { success: false, error: '이미 사용 중인 슬러그입니다.' }
    }
    finalSlug = input.slug
  } else {
    // 고유한 슬러그 생성 (최대 10번 시도)
    let attempts = 0
    let slugGenerated = false
    while (attempts < 10 && !slugGenerated) {
      const candidateSlug = generateSlug()
      const existing = await db.query.link.findFirst({
        where: eq(link.slug, candidateSlug),
      })
      if (!existing) {
        finalSlug = candidateSlug
        slugGenerated = true
      }
      attempts++
    }
    if (!slugGenerated) {
      return { success: false, error: '슬러그 생성에 실패했습니다. 다시 시도해주세요.' }
    }
  }

  // 링크 생성
  const linkId = randomUUID()
  try {
    await db.insert(link).values({
      id: linkId,
      userId: input.userId,
      originalUrl: input.originalUrl,
      slug: finalSlug!,
      expiresAt: input.expiresAt,
      clickLimit: input.clickLimit,
      clickCount: 0,
      status: 'ACTIVE',
    })

    return { success: true, linkId, slug: finalSlug! }
  } catch (error) {
    console.error('링크 생성 실패:', error)
    return { success: false, error: '링크 생성에 실패했습니다.' }
  }
}

/**
 * 사용자별 링크 목록 조회
 */
export async function getUserLinks(userId: string) {
  return await db.query.link.findMany({
    where: eq(link.userId, userId),
    orderBy: [desc(link.createdAt)],
  })
}

/**
 * 슬러그로 링크 조회
 */
export async function getLinkBySlug(slug: string) {
  return await db.query.link.findFirst({
    where: eq(link.slug, slug),
  })
}

/**
 * 링크 수정
 */
export async function updateLink(
  linkId: string,
  userId: string,
  input: UpdateLinkInput,
): Promise<{ success: boolean; error?: string }> {
  // 권한 확인
  const existingLink = await db.query.link.findFirst({
    where: and(eq(link.id, linkId), eq(link.userId, userId)),
  })

  if (!existingLink) {
    return { success: false, error: '링크를 찾을 수 없거나 권한이 없습니다.' }
  }

  try {
    await db
      .update(link)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(link.id, linkId))

    return { success: true }
  } catch (error) {
    console.error('링크 수정 실패:', error)
    return { success: false, error: '링크 수정에 실패했습니다.' }
  }
}

/**
 * 링크 삭제
 */
export async function deleteLink(
  linkId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  // 권한 확인
  const existingLink = await db.query.link.findFirst({
    where: and(eq(link.id, linkId), eq(link.userId, userId)),
  })

  if (!existingLink) {
    return { success: false, error: '링크를 찾을 수 없거나 권한이 없습니다.' }
  }

  try {
    await db.delete(link).where(eq(link.id, linkId))
    return { success: true }
  } catch (error) {
    console.error('링크 삭제 실패:', error)
    return { success: false, error: '링크 삭제에 실패했습니다.' }
  }
}

/**
 * 링크 상태 토글
 */
export async function toggleLinkStatus(
  linkId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  // 권한 확인
  const existingLink = await db.query.link.findFirst({
    where: and(eq(link.id, linkId), eq(link.userId, userId)),
  })

  if (!existingLink) {
    return { success: false, error: '링크를 찾을 수 없거나 권한이 없습니다.' }
  }

  const newStatus = existingLink.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'

  try {
    await db
      .update(link)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(link.id, linkId))

    return { success: true }
  } catch (error) {
    console.error('링크 상태 변경 실패:', error)
    return { success: false, error: '링크 상태 변경에 실패했습니다.' }
  }
}

/**
 * 클릭 수 증가 (비동기)
 */
export async function incrementClickCount(
  linkId: string,
  origin?: string,
  userAgent?: string,
): Promise<void> {
  try {
    // 트랜잭션으로 클릭 수 증가 및 이벤트 기록
    await db.transaction(async (tx) => {
      // 클릭 수 증가
      await tx
        .update(link)
        .set({
          clickCount: sql`${link.clickCount} + 1`,
        })
        .where(eq(link.id, linkId))

      // 이벤트 기록 (선택적)
      await tx.insert(linkEvent).values({
        id: randomUUID(),
        linkId,
        eventType: 'CLICK',
        origin: origin || null,
        userAgent: userAgent || null,
      })
    })
  } catch (error) {
    console.error('클릭 수 증가 실패:', error)
    // 실패해도 리다이렉션은 계속 진행되므로 에러를 던지지 않음
  }
}

/**
 * 사용자 통계 조회
 */
export async function getUserLinkStats(userId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [dailyCountResult, activeCountResult] = await Promise.all([
    db
      .select({ count: count() })
      .from(link)
      .where(
        and(
          eq(link.userId, userId),
          gte(link.createdAt, today),
        ),
      ),
    db
      .select({ count: count() })
      .from(link)
      .where(
        and(
          eq(link.userId, userId),
          eq(link.status, 'ACTIVE'),
        ),
      ),
  ])

  return {
    dailyCount: dailyCountResult[0]?.count || 0,
    activeCount: activeCountResult[0]?.count || 0,
  }
}

