#!/usr/bin/env node

/**
 * 마이그레이션 기록 수동 업데이트 스크립트
 * db:push로 스키마를 적용한 후 마이그레이션 기록을 업데이트할 때 사용
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import postgres from 'postgres'

// 환경 변수 로드
config({ path: resolve(process.cwd(), '.env.local') })

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL 환경 변수가 설정되지 않았습니다')
  process.exit(1)
}

async function markMigrationApplied() {
  const sql = postgres(DATABASE_URL)

  try {
    // 마이그레이션 기록 테이블이 없으면 생성
    await sql`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `

    // 0002_cute_steve_rogers 마이그레이션이 이미 적용되었는지 확인
    const existing = await sql`
      SELECT * FROM drizzle.__drizzle_migrations 
      WHERE hash = '0002_cute_steve_rogers'
    `

    if (existing.length === 0) {
      // 마이그레이션 기록 추가
      await sql`
        INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
        VALUES ('0002_cute_steve_rogers', ${Date.now()})
      `
      console.log('✅ 마이그레이션 0002_cute_steve_rogers 기록이 추가되었습니다')
    } else {
      console.log('ℹ️  마이그레이션 0002_cute_steve_rogers는 이미 기록되어 있습니다')
    }

    console.log('✅ 완료')
  } catch (error) {
    console.error('❌ 오류 발생:', error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

markMigrationApplied()

