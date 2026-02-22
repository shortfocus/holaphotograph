# 카메라 리뷰 - Cloudflare 배포 가이드

이 문서는 관리자 페이지, Cloudflare Access, Worker, D1, R2 설정 방법을 안내합니다.

## 아키텍처 개요

```
관리자 (구글 로그인)
        ↓
Cloudflare Access
        ↓
/admin/* 보호
        ↓
Cloudflare Worker (API)
        ↓
Cloudflare D1 (DB) + R2 (이미지)
```

---

## 1. Cloudflare D1 데이터베이스 생성

```bash
cd worker
npm install
npx wrangler d1 create holaphotograph-db
```

출력된 `database_id`를 `worker/wrangler.toml`의 `database_id`에 입력합니다.

### 마이그레이션 적용

```bash
# 로컬 개발용
npm run db:local

# 프로덕션
npm run db:migrate
```

---

## 2. Cloudflare R2 버킷 생성

1. [Cloudflare 대시보드](https://dash.cloudflare.com) → **R2** → **Create bucket**
2. 버킷 이름: `holaphotograph-images`
3. 생성 후 `worker/wrangler.toml`의 `bucket_name`이 일치하는지 확인

---

## 3. Worker 배포

```bash
cd worker
npm run deploy
```

배포 후 Worker URL (예: `https://holaphotograph-api.xxx.workers.dev`)을 확인합니다.

---

## 4. Cloudflare Access 설정 (구글 로그인)

> **이메일 기반 검증**: Access가 구글 로그인 후 `Cf-Access-Authenticated-User-Email` 헤더로 이메일을 전달합니다. Worker에서 `ALLOWED_EMAILS` 환경변수와 비교해 허용 여부를 판단합니다. JWT 검증 불필요.

### 4.1 Identity Provider 추가

1. [Cloudflare One](https://one.dash.cloudflare.com) → **Settings** → **Authentication**
2. **Login methods** → **Add new** → **Google**
3. Google OAuth 클라이언트 ID/Secret 설정 (또는 One-Click Google 사용)

### 4.2 Access 애플리케이션 생성 (Pages 사이트)

1. **Access** → **Applications** → **Add an application**
2. **Self-hosted** 선택
3. **Application name**: `Holaphotograph Admin`
4. **Application domain**:
   - Pages 도메인 (예: `holaphotograph.pages.dev` 또는 커스텀 도메인)
   - **Path**: `admin` → `/admin/*` 로 설정

### 4.3 Access 애플리케이션 생성 (Worker API)

1. **Add an application** → **Self-hosted**
2. **Application name**: `Holaphotograph API`
3. **Application domain**:
   - Worker 도메인 (예: `holaphotograph-api.xxx.workers.dev`)
   - 또는 커스텀 도메인 `api.yourdomain.com`
4. **Path**: 전체 (`/`)

### 4.4 정책 설정 (이메일만 허용)

두 애플리케이션 모두:
- **Policies** → **Add a policy**:
  - **Policy name**: `Admin Only`
  - **Action**: Allow
  - **Include** → **Emails** → 관리자 이메일 추가 (예: `your@email.com`)

→ 구글 로그인 후 해당 이메일만 접근 가능합니다.

### 4.5 Worker에 허용 이메일 설정

Worker가 쓰기 요청(POST/PUT/DELETE/upload) 시 이메일을 검증하려면:

```bash
cd worker
npx wrangler secret put ALLOWED_EMAILS   # 예: your@email.com 또는 admin1@a.com,admin2@b.com
```

또는 `wrangler.toml`에 하드코딩:

```toml
[vars]
ALLOWED_EMAILS = "your@email.com"
```

> **주의**: Worker를 Access로 보호하면 `GET /api/posts`도 로그인이 필요해 메인 페이지에서 리뷰를 불러올 수 없습니다.  
> **권장**: 동일 코드로 Worker를 두 번 배포합니다.
> - **공개 Worker** (예: `holaphotograph-api`): Access 없음 → 메인 페이지가 `GET /api/posts` 호출
> - **관리자 Worker** (예: `holaphotograph-admin-api`): Access 보호 + `ALLOWED_EMAILS` → 관리자 페이지가 이 URL 사용

---

## 5. Astro 사이트 배포 (Cloudflare Pages)

### 5.1 환경 변수 설정

Pages 프로젝트 설정에서:

- `PUBLIC_API_URL`: 공개 Worker URL (메인 페이지용, 예: `https://holaphotograph-api.xxx.workers.dev`)
- `PUBLIC_ADMIN_API_URL`: (선택) 관리자 Worker URL. Access 보호된 Worker. 없으면 `PUBLIC_API_URL` 사용
- `PUBLIC_TURNSTILE_SITE_KEY`: (선택) [Cloudflare Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile) 위젯 Site Key. 후기 등록 폼 봇 방지용. 설정 시 Worker에 시크릿 키도 필요.

### 5.2 Cloudflare Turnstile (후기 등록 봇 방지)

고객 후기 등록 시 봇 제출을 막으려면 Turnstile을 사용할 수 있습니다.

1. [Cloudflare 대시보드](https://dash.cloudflare.com) → **Turnstile** → **Add site** → 도메인 입력 후 위젯 생성
2. **Site Key**(공개)와 **Secret Key**(비공개) 확인
3. **Pages** 환경 변수에 `PUBLIC_TURNSTILE_SITE_KEY` = Site Key 설정
4. **Worker** 시크릿 설정:
   ```bash
   cd worker
   npx wrangler secret put TURNSTILE_SECRET_KEY   # Secret Key 입력
   ```
5. 둘 다 설정된 경우에만 후기 제출 시 토큰 검증이 수행됩니다. 키를 넣지 않으면 Turnstile 없이 동작합니다.

### 5.3 배포

> 전체 배포 명령어는 [DEPLOY.md](./DEPLOY.md) 참고.

```bash
# 로컬 빌드
npm run build

# Cloudflare Pages에 배포 (Git 연동 또는 wrangler)
npx wrangler pages deploy dist --project-name=holaphotograph
```

---

## 6. CORS 및 도메인 설정

Worker와 Pages가 다른 도메인일 경우, Worker의 `corsHeaders`에서 `Access-Control-Allow-Origin`을 Pages 도메인으로 제한할 수 있습니다:

```typescript
// worker/src/index.ts
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://your-site.pages.dev",  // 또는 "*"
  // ...
};
```

---

## 7. 로컬 개발

### 터미널 1: Worker

```bash
cd worker
npm run dev
```

### 터미널 2: Astro

```bash
npm run dev
```

- Astro: http://localhost:4321
- Worker API: http://localhost:8787

`.env` 파일에 `PUBLIC_API_URL=http://localhost:8787` 설정 (선택).

---

## 8. 요약 체크리스트

- [ ] D1 데이터베이스 생성 및 마이그레이션
- [ ] R2 버킷 생성
- [ ] Worker 배포
- [ ] Cloudflare Access: Google IdP, /admin/* 보호
- [ ] Pages 배포 및 PUBLIC_API_URL 설정
