/**
 * Toss Payments API 서비스
 * 빌링키 발급 및 자동결제 승인 API 호출
 */

const TOSS_API_BASE_URL = 'https://api.tosspayments.com/v1'

/**
 * Basic 인증 헤더 생성 (시크릿 키 base64 인코딩)
 */
function getAuthHeader(): string {
  const secretKey = process.env.TOSS_PAYMENTS_SECRET_KEY
  if (!secretKey) {
    throw new Error('TOSS_PAYMENTS_SECRET_KEY is not set')
  }

  // 시크릿 키 뒤에 콜론(:) 추가 후 base64 인코딩
  const encoded = Buffer.from(`${secretKey}:`).toString('base64')
  return `Basic ${encoded}`
}

/**
 * 빌링키 발급 요청
 * @param authKey 성공 리다이렉트 URL에서 받은 authKey
 * @param customerKey 구매자 ID (사용자 ID 기반)
 */
export async function issueBillingKey(
  authKey: string,
  customerKey: string,
): Promise<{
  billingKey: string
  customerKey: string
  method: string
  authenticatedAt: string
}> {
  const response = await fetch(`${TOSS_API_BASE_URL}/billing/authorizations/issue`, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      authKey,
      customerKey,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(
      `빌링키 발급 실패: ${response.status} ${JSON.stringify(error)}`,
    )
  }

  const data = await response.json()
  return {
    billingKey: data.billingKey,
    customerKey: data.customerKey,
    method: data.method,
    authenticatedAt: data.authenticatedAt,
  }
}

/**
 * 빌링키로 자동결제 승인
 * @param billingKey 빌링키
 * @param customerKey 구매자 ID
 * @param orderId 주문번호
 * @param orderName 주문명
 * @param amount 결제 금액 (원)
 */
export async function approveBillingPayment(
  billingKey: string,
  customerKey: string,
  orderId: string,
  orderName: string,
  amount: number,
): Promise<{
  paymentKey: string
  orderId: string
  status: string
  totalAmount: number
  approvedAt: string
  method: string
}> {
  const response = await fetch(
    `${TOSS_API_BASE_URL}/billing/${billingKey}`,
    {
      method: 'POST',
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerKey,
        orderId,
        orderName,
        amount,
        currency: 'KRW',
      }),
    },
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(
      `자동결제 승인 실패: ${response.status} ${JSON.stringify(error)}`,
    )
  }

  const data = await response.json()
  return {
    paymentKey: data.paymentKey,
    orderId: data.orderId,
    status: data.status,
    totalAmount: data.totalAmount,
    approvedAt: data.approvedAt,
    method: data.method,
  }
}

/**
 * 빌링키 삭제 (자동결제 해지)
 * @param billingKey 빌링키
 */
export async function deleteBillingKey(billingKey: string): Promise<void> {
  const response = await fetch(`${TOSS_API_BASE_URL}/billing`, {
    method: 'DELETE',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      billingKey,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(
      `빌링키 삭제 실패: ${response.status} ${JSON.stringify(error)}`,
    )
  }
}

