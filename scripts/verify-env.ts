#!/usr/bin/env node

/**
 * 환경 변수 검증 스크립트
 * 배포 전 필수 환경 변수가 설정되어 있는지 확인합니다.
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
  'NEXT_PUBLIC_BETTER_AUTH_URL',
  'KAKAO_CLIENT_ID',
  'KAKAO_CLIENT_SECRET',
  'TOSS_PAYMENTS_CLIENT_KEY',
  'TOSS_PAYMENTS_SECRET_KEY',
  'NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY',
  'VERCEL_CRON_SECRET',
]

const optionalEnvVars = [
  'NODE_ENV',
]

function verifyEnv() {
  const missing: string[] = []
  const warnings: string[] = []

  // 필수 환경 변수 확인
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar)
    }
  }

  // 선택적 환경 변수 확인 (경고만)
  for (const envVar of optionalEnvVars) {
    if (!process.env[envVar]) {
      warnings.push(envVar)
    }
  }

  // 결과 출력
  if (missing.length > 0) {
    console.error('❌ 필수 환경 변수가 누락되었습니다:')
    missing.forEach((envVar) => {
      console.error(`   - ${envVar}`)
    })
    process.exit(1)
  }

  if (warnings.length > 0) {
    console.warn('⚠️  선택적 환경 변수가 설정되지 않았습니다:')
    warnings.forEach((envVar) => {
      console.warn(`   - ${envVar}`)
    })
  }

  console.log('✅ 모든 필수 환경 변수가 설정되어 있습니다.')
}

verifyEnv()

