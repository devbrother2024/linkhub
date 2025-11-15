#!/usr/bin/env node

/**
 * 구독 갱신 테스트 스크립트
 * 만료일 조건 없이 모든 활성 구독에 대해 강제로 결제를 실행합니다.
 * 개발/테스트 환경에서만 사용하세요.
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// 환경 변수를 먼저 로드
config({ path: resolve(process.cwd(), '.env.local') })

async function testBillingRenewal() {
  // 환경 변수 로드 후에 동적 import
  const { eq } = await import('drizzle-orm')
  const { db } = await import('../db/client')
  const { subscription } = await import('../db/schema')
  const { approveBillingPayment } = await import(
    '../server/billing/toss-service'
  )
  const { renewSubscription } = await import(
    '../server/billing/subscription-service'
  )
  try {
    console.log('🔄 구독 갱신 테스트 시작...')

    // 모든 활성 구독 조회 (만료일 조건 없음)
    const activeSubscriptions = await db.query.subscription.findMany({
      where: eq(subscription.status, 'ACTIVE'),
    })

    if (activeSubscriptions.length === 0) {
      console.log('ℹ️  활성 구독이 없습니다.')
      return
    }

    console.log(
      `📋 총 ${activeSubscriptions.length}개의 활성 구독을 찾았습니다.`,
    )

    const results = []

    for (const sub of activeSubscriptions) {
      try {
        if (!sub.billingKey || !sub.customerKey) {
          console.warn(
            `⚠️  구독 ${sub.id}: 빌링키 또는 고객키가 없습니다. 건너뜁니다.`,
          )
          continue
        }

        console.log(`\n💳 구독 ${sub.id} 결제 처리 중...`)
        console.log(`   - 사용자: ${sub.userId}`)
        console.log(`   - 현재 만료일: ${sub.currentPeriodEnd}`)

        // 자동결제 승인
        const orderId = `order_${sub.id}_${Date.now()}`
        const amount = 4900 // 월 구독료

        console.log(`   - 주문번호: ${orderId}`)
        console.log(`   - 금액: ${amount.toLocaleString()}원`)

        const paymentResult = await approveBillingPayment(
          sub.billingKey,
          sub.customerKey,
          orderId,
          'LinkHub Pro 구독 (테스트)',
          amount,
        )

        console.log(`   ✅ 결제 승인 완료: ${paymentResult.paymentKey}`)
        console.log(`   - 상태: ${paymentResult.status}`)
        console.log(`   - 승인 시간: ${paymentResult.approvedAt}`)

        // 구독 갱신
        await renewSubscription({
          subscriptionId: sub.id,
          amount: paymentResult.totalAmount,
          paymentKey: paymentResult.paymentKey,
          orderId,
          paymentMethod: paymentResult.method,
          approvedAt: paymentResult.approvedAt,
        })

        console.log(`   ✅ 구독 갱신 완료`)

        results.push({
          subscriptionId: sub.id,
          userId: sub.userId,
          success: true,
          paymentKey: paymentResult.paymentKey,
          orderId,
          amount: paymentResult.totalAmount,
        })
      } catch (error) {
        console.error(`   ❌ 구독 ${sub.id} 갱신 실패:`, error)
        results.push({
          subscriptionId: sub.id,
          userId: sub.userId,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    console.log('\n📊 결과 요약:')
    console.log(`   - 총 처리: ${activeSubscriptions.length}개`)
    console.log(`   - 성공: ${results.filter((r) => r.success).length}개`)
    console.log(`   - 실패: ${results.filter((r) => !r.success).length}개`)

    if (results.some((r) => !r.success)) {
      console.log('\n❌ 실패한 구독:')
      results
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(`   - 구독 ${r.subscriptionId}: ${r.error}`)
        })
    }

    console.log('\n✅ 테스트 완료')
  } catch (error) {
    console.error('❌ 테스트 실행 실패:', error)
    process.exit(1)
  }
}

// 확인 프롬프트 (선택사항)
const args = process.argv.slice(2)
const skipConfirm = args.includes('--yes') || args.includes('-y')

if (!skipConfirm) {
  console.log('⚠️  이 스크립트는 모든 활성 구독에 대해 실제 결제를 실행합니다.')
  console.log('   테스트 환경에서만 사용하세요.')
  console.log('   계속하려면 --yes 또는 -y 플래그를 추가하세요.')
  console.log('   예: pnpm test:billing --yes\n')
  process.exit(0)
}

testBillingRenewal()
