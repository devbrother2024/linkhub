#!/usr/bin/env node

/**
 * 로컬에서 Cron 작업 테스트
 * 실제 Vercel Cron과 동일한 로직 실행
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// 환경 변수 로드
config({ path: resolve(process.cwd(), '.env.local') })

async function runCron() {
  const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000'
  const cronSecret = process.env.VERCEL_CRON_SECRET || 'test-secret'

  console.log('🔄 자동 구독 갱신 Cron 실행 중...')
  console.log(`📍 URL: ${baseUrl}/api/cron/billing`)

  try {
    const response = await fetch(`${baseUrl}/api/cron/billing`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${cronSecret}`,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(error)}`)
    }

    const result = await response.json()
    console.log('✅ Cron 실행 완료:')
    console.log(JSON.stringify(result, null, 2))
  } catch (error) {
    console.error('❌ Cron 실행 실패:', error)
    process.exit(1)
  }
}

runCron()
