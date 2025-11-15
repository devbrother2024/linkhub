import { z } from 'zod'
import { randomUUID } from 'crypto'

/**
 * 슬러그 검증 스키마
 * - 영문자, 숫자, 하이픈, 언더스코어만 허용
 * - 최소 3자, 최대 50자
 */
export const slugSchema = z
  .string()
  .min(3, '슬러그는 최소 3자 이상이어야 합니다.')
  .max(50, '슬러그는 최대 50자까지 가능합니다.')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    '슬러그는 영문자, 숫자, 하이픈(-), 언더스코어(_)만 사용할 수 있습니다.',
  )

/**
 * UUID 기반 8자 슬러그 생성
 * @returns 8자리 랜덤 슬러그
 */
export function generateSlug(): string {
  const uuid = randomUUID().replace(/-/g, '')
  // UUID에서 8자 추출 (앞에서부터)
  return uuid.substring(0, 8)
}

/**
 * 슬러그 유효성 검증
 * @param slug 검증할 슬러그
 * @returns 검증 결과
 */
export function validateSlug(slug: string): {
  valid: boolean
  error?: string
} {
  try {
    slugSchema.parse(slug)
    return { valid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        error: error.errors[0]?.message || '유효하지 않은 슬러그입니다.',
      }
    }
    return { valid: false, error: '유효하지 않은 슬러그입니다.' }
  }
}

