# Vercel 배포 체크리스트

LinkHub 프로젝트를 Vercel에 배포하기 전 확인사항입니다.

## 📋 사전 준비사항

### 1. GitHub 저장소 확인

- [ ] 프로젝트가 GitHub에 푸시되어 있는지 확인
- [ ] 메인 브랜치가 최신 상태인지 확인
- [ ] `.env.local` 파일이 `.gitignore`에 포함되어 있는지 확인

### 2. Vercel 계정 및 프로젝트 생성

- [ ] Vercel 계정 생성/로그인
- [ ] GitHub 저장소 연결
- [ ] 새 프로젝트 생성 (Import Git Repository)

## 🔧 환경 변수 설정

Vercel 대시보드의 **Settings > Environment Variables**에서 다음 환경 변수들을 설정합니다.

### 필수 환경 변수

#### 데이터베이스

- [ ] `DATABASE_URL` - 프로덕션 PostgreSQL 연결 문자열
- [ ] `DATABASE_URL_UNPOOLED` (선택사항) - PgBouncer 없이 연결

#### Better Auth

- [ ] `BETTER_AUTH_SECRET` - 랜덤 시크릿 키 (최소 32자)
- [ ] `BETTER_AUTH_URL` - 프로덕션 URL (예: `https://your-domain.vercel.app`)
- [ ] `NEXT_PUBLIC_BETTER_AUTH_URL` - 프로덕션 URL (예: `https://your-domain.vercel.app`)

#### Kakao OAuth

- [ ] `KAKAO_CLIENT_ID` - Kakao 개발자 센터에서 발급받은 Client ID
- [ ] `KAKAO_CLIENT_SECRET` - Kakao 개발자 센터에서 발급받은 Client Secret
- [ ] Kakao 개발자 센터에서 Redirect URI 등록:
  - `https://your-domain.vercel.app/api/auth/callback/kakao`

#### Toss Payments

- [ ] `TOSS_PAYMENTS_CLIENT_KEY` - Toss Payments Client Key
- [ ] `TOSS_PAYMENTS_SECRET_KEY` - Toss Payments Secret Key
- [ ] `NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY` - Toss Payments Client Key (Public)

#### Vercel Cron

- [ ] `CRON_SECRET` - Cron 요청 인증용 시크릿 키 (랜덤 문자열)

#### 브랜드 도메인

- [ ] `NEXT_PUBLIC_BRAND_DOMAIN` - 단축 URL에 사용할 도메인 (예: `https://your-domain.vercel.app`)

### 환경 변수 설정 팁

- [ ] Production, Preview, Development 환경별로 적절히 설정
- [ ] Production 환경에는 프로덕션 값 사용
- [ ] Preview/Development 환경에는 테스트 값 사용 가능

## 🗄️ 데이터베이스 설정

### 1. 프로덕션 데이터베이스 준비

- [ ] PostgreSQL 데이터베이스 생성 (Vercel Postgres 또는 외부 서비스)
- [ ] 데이터베이스 연결 정보 확인
- [ ] `DATABASE_URL` 환경 변수에 연결 문자열 설정

### 2. 데이터베이스 마이그레이션

- [ ] 로컬에서 마이그레이션 파일 확인 (`drizzle/` 디렉토리)
- [ ] 프로덕션 데이터베이스에 스키마 적용:
  ```bash
  pnpm db:push
  ```
  또는 Vercel Postgres를 사용하는 경우 자동으로 동기화됨

## ⚙️ Vercel 프로젝트 설정

### Build & Development Settings

- [ ] **Framework Preset**: Next.js
- [ ] **Build Command**: `pnpm build` (자동 감지됨)
- [ ] **Output Directory**: `.next` (자동 감지됨)
- [ ] **Install Command**: `pnpm install` (자동 감지됨)
- [ ] **Root Directory**: `.` (프로젝트 루트)

### Environment Variables

- [ ] 위의 모든 환경 변수가 설정되었는지 확인
- [ ] 각 환경 변수의 값이 올바른지 확인

## 🔄 Vercel Cron 설정

### Cron 작업 확인

- [ ] `vercel.json` 파일이 프로젝트 루트에 있는지 확인
- [ ] Cron 경로: `/api/cron/billing`
- [ ] 스케줄: `0 18 * * *` (매일 UTC 18:00, 한국시간 다음날 03:00)
- [ ] `CRON_SECRET` 환경 변수가 설정되었는지 확인

### Cron 인증 설정

Vercel Cron은 자동으로 `Authorization: Bearer {CRON_SECRET}` 헤더를 추가합니다.

- [ ] `CRON_SECRET` 값이 코드와 일치하는지 확인

## 🌐 도메인 설정 (선택사항)

### 커스텀 도메인

- [ ] 커스텀 도메인 추가 (Settings > Domains)
- [ ] DNS 설정 완료
- [ ] SSL 인증서 자동 발급 확인

### 도메인 관련 환경 변수 업데이트

- [ ] `BETTER_AUTH_URL` 업데이트
- [ ] `NEXT_PUBLIC_BETTER_AUTH_URL` 업데이트
- [ ] `NEXT_PUBLIC_BRAND_DOMAIN` 업데이트

## 🚀 배포 실행

### 1. 초기 배포

- [ ] Vercel 대시보드에서 "Deploy" 클릭
- [ ] 빌드 로그 확인
- [ ] 배포 성공 여부 확인

### 2. 배포 후 확인사항

#### 기본 기능 확인

- [ ] 홈페이지 로드 확인
- [ ] 로그인 페이지 접근 확인 (`/login`)
- [ ] Kakao 로그인 버튼 표시 확인

#### 인증 기능 확인

- [ ] Kakao 로그인 테스트
- [ ] 로그인 후 리다이렉션 확인
- [ ] 세션 유지 확인
- [ ] 로그아웃 기능 확인

#### 대시보드 기능 확인

- [ ] 대시보드 접근 확인 (`/dashboard`)
- [ ] 링크 생성 기능 테스트
- [ ] 링크 목록 표시 확인
- [ ] 링크 삭제 기능 테스트

#### 결제 기능 확인 (테스트 모드)

- [ ] 요금제 페이지 접근 (`/pricing`)
- [ ] 결제 버튼 클릭 테스트
- [ ] Toss Payments 결제창 표시 확인
- [ ] 테스트 결제 진행 (실제 결제 X)

#### 단축 링크 기능 확인

- [ ] 링크 생성 후 단축 URL 확인
- [ ] 단축 링크 접근 테스트 (`/redirect/[slug]`)
- [ ] 원본 URL로 리다이렉션 확인
- [ ] 클릭 수 증가 확인

#### Cron 작업 확인

- [ ] Vercel 대시보드에서 Cron 실행 로그 확인
- [ ] `/api/cron/billing` 엔드포인트 수동 호출 테스트:
  ```bash
  curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
    https://your-domain.vercel.app/api/cron/billing
  ```

## 🔍 문제 해결

### 빌드 실패 시

- [ ] 빌드 로그 확인
- [ ] 환경 변수 누락 확인
- [ ] TypeScript 오류 확인
- [ ] 의존성 설치 오류 확인

### 런타임 오류 시

- [ ] 함수 로그 확인 (Vercel 대시보드 > Functions)
- [ ] 환경 변수 값 확인
- [ ] 데이터베이스 연결 확인
- [ ] API 엔드포인트 응답 확인

### 인증 오류 시

- [ ] `BETTER_AUTH_SECRET` 확인
- [ ] `BETTER_AUTH_URL` 확인
- [ ] Kakao OAuth 설정 확인
- [ ] Redirect URI 확인

### 결제 오류 시

- [ ] Toss Payments 키 확인
- [ ] 결제 모드 확인 (테스트/프로덕션)
- [ ] 콜백 URL 확인

## 📝 배포 후 작업

### 1. 모니터링 설정

- [ ] Vercel Analytics 활성화 (선택사항)
- [ ] 에러 로그 모니터링 설정
- [ ] 성능 모니터링 설정

### 2. 백업 및 복구 계획

- [ ] 데이터베이스 백업 설정
- [ ] 환경 변수 백업 (안전한 곳에 저장)
- [ ] 복구 절차 문서화

### 3. 문서 업데이트

- [ ] 배포 URL 문서화
- [ ] 환경 변수 목록 업데이트
- [ ] 운영 가이드 작성

## ✅ 최종 확인

- [ ] 모든 환경 변수 설정 완료
- [ ] 데이터베이스 연결 및 스키마 적용 완료
- [ ] 빌드 성공 확인
- [ ] 주요 기능 동작 확인
- [ ] Cron 작업 설정 확인
- [ ] 에러 로그 없음 확인

---

## 📚 참고 자료

- [Vercel 공식 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Vercel Cron 문서](https://vercel.com/docs/cron-jobs)
- [Better Auth 문서](https://www.better-auth.com/docs)

## 🆘 지원

문제가 발생하면 다음을 확인하세요:

1. Vercel 대시보드의 로그
2. GitHub Actions (사용하는 경우)
3. 데이터베이스 연결 상태
4. 환경 변수 설정
