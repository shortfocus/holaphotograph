# Cloudflare 설정 총정리

이 프로젝트에서 사용하는 Cloudflare 서비스와 설정을 한 문서에 정리했습니다.

---

## 1. 개요

| 서비스 | 용도 | 프로젝트 내 이름/식별자 |
|--------|------|-------------------------|
| **Workers** | API 서버 (후기·강의 신청·이미지·RSS·유튜브 등) | `holaphotograph-api` |
| **Pages** | 프론트엔드 정적 사이트 (Astro) | `holaphotograph` |
| **D1** | SQL DB (고객 후기, 강의 신청 목록) | `holaphotograph-db` |
| **R2** | 이미지 스토리지 (후기 썸네일·본문 이미지) | `camera-review-images` |
| **KV** | Rate limiting + YouTube API 캐시 | `APP_KV` (네임스페이스 1개) |
| **Access** | 관리자 페이지·API 로그인 보호 | holaphoto.com/admin, api.holaphoto.com/api/admin/* |
| **커스텀 도메인** | workers.dev / pages.dev 대신 사용 | holaphoto.com, api.holaphoto.com |

---

## 2. Workers (API)

- **이름**: `holaphotograph-api`
- **진입점**: `worker/src/index.ts`
- **커스텀 도메인**: `api.holaphoto.com` (Workers & Pages → holaphotograph-api → Settings → Domains)

### 2.1 바인딩 (wrangler.toml)

| 바인딩 | 서비스 | 설명 |
|--------|--------|------|
| `DB` | D1 | `holaphotograph-db` — 고객 후기·강의 신청 테이블 |
| `BUCKET` | R2 | `camera-review-images` — 이미지 업로드/조회/삭제 |
| `APP_KV` | KV | Rate limit(후기·업로드) + YouTube 캐시(10분 TTL) |

### 2.2 환경 변수·시크릿

| 이름 | 종류 | 용도 |
|------|------|------|
| `ALLOWED_EMAILS` | Variable / Secret | Access 통과 시 관리자로 인정할 이메일(쉼표 구분). 미설정 시 프로덕션에서 관리자 API 401. |
| `YOUTUBE_API_KEY` | Secret | YouTube Data API v3 키. `wrangler secret put YOUTUBE_API_KEY` |
| `NAVER_BLOG_VISITORS` | Variable (wrangler.toml [vars]) | 네이버 블로그 총 방문자 수(수동 업데이트). |

- **설정 위치**: Workers & Pages → **holaphotograph-api** → **Settings** → **Variables and Secrets**
- **ALLOWED_EMAILS**: 대시보드에서 Variables로 추가하거나, `npx wrangler secret put ALLOWED_EMAILS` (값은 배포 시만 사용, 저장소에 넣지 않음)

---

## 3. D1 (데이터베이스)

- **데이터베이스 이름**: `holaphotograph-db`
- **database_id**: wrangler.toml 참고 (계정마다 다름)

### 3.1 생성

```bash
cd worker
npx wrangler d1 create holaphotograph-db
```

출력된 `database_id`를 `worker/wrangler.toml`의 `[[d1_databases]]`에 넣습니다.

### 3.2 마이그레이션

- **경로**: `worker/migrations/`
- **적용(프로덕션)**: `cd worker && npx wrangler d1 migrations apply holaphotograph-db --remote`
- **로컬**: `npm run db:migrate` (또는 `db:local` 등, package.json 스크립트 참고)

### 3.3 주요 테이블

| 테이블 | 용도 |
|--------|------|
| `customer_reviews` | 고객 후기 (id, title, content, thumbnail_url, author_name, status, review_type 등) |
| `lecture_signups` | 강의 소식 수신 신청 (이메일·생성일 등) |

---

## 4. R2 (스토리지)

- **버킷 이름**: `camera-review-images`
- **바인딩**: Worker에서 `env.BUCKET`

### 4.1 용도

- 고객 후기 썸네일·본문 이미지 업로드 (POST /api/admin/upload)
- 이미지 조회: GET /api/images/:path (공개), 삭제: DELETE /api/admin/images/:path (관리자)
- **관리자 UI 정적 파일**: `admin-ui/` 프리픽스로 업로드 (dist/admin, dist/_astro). Worker가 GET /admin, /_astro 요청 시 이 객체를 서빙. 배포 시 `npm run upload-admin-ui` 실행 (또는 CI에 포함). **CI에서 403이 나면** GitHub Secrets의 `CLOUDFLARE_API_TOKEN`에 **Account → R2 Object Read & Write** 권한이 있어야 함 → [DEPLOY.md](./DEPLOY.md) §1 참고.

### 4.2 생성

Cloudflare 대시보드 → **R2** → **Create bucket** → 이름 `camera-review-images`.  
Worker의 wrangler.toml에 `[[r2_buckets]]`로 바인딩만 하면 됩니다 (기존 버킷 사용).

---

## 5. KV (캐시·Rate limit)

- **바인딩**: `APP_KV`
- **상세**: [docs/KV_SETUP.md](./KV_SETUP.md)

### 5.1 네임스페이스 생성

```bash
cd worker
npx wrangler kv namespace create "APP_KV"           # 프로덕션 id
npx wrangler kv namespace create "APP_KV" --preview # 프리뷰(로컬) preview_id
```

생성된 `id` / `preview_id`를 `worker/wrangler.toml`의 `[[kv_namespaces]]`에 넣습니다.

### 5.2 용도

| 용도 | 키 예시 | 비고 |
|------|---------|------|
| Rate limit (후기 제출) | `rl:reviews:<IP>:<window>` | 60초당 3회/IP |
| Rate limit (이미지 업로드) | `rl:reviews_upload:<IP>:<window>` | 60초당 5회/IP |
| YouTube 최신 영상 캐시 | `ytcache:latest` | TTL 10분 |

---

## 6. Cloudflare Access

### 6.1 앱 구성

| 앱(이름 예시) | 보호 대상 | 비고 |
|---------------|-----------|------|
| API + 관리자 UI | `api.holaphoto.com` 경로 `/api/admin/*`, `/admin`, `/admin/*` | Self-hosted. 관리자 화면도 api.holaphoto.com/admin 에서 서빙하므로, 한 번 로그인으로 화면+API 모두 사용. holaphoto.com/admin 접속 시 자동으로 api.holaphoto.com/admin 으로 리다이렉트됨. |

### 6.2 API Access 설정 요약

- **공개 호스트 이름**: `api.holaphoto.com` (경로 `/api/admin/*` 만 보호 권장)
- **정책**: Admin Only 등 관리자만 허용하는 정책 연결
- **로그인**: Google 등 IDP
- **고급 설정 → CORS**: **옵션 요청을 원본으로 바이패스** 켜기 (preflight OPTIONS가 Worker까지 가도록)
- **상세 절차**: [docs/ACCESS_API_SETUP.md](./ACCESS_API_SETUP.md)

### 6.3 Worker와의 연동

- Access 통과 요청에는 `Cf-Access-Authenticated-User-Email` 헤더가 붙음.
- Worker는 `ALLOWED_EMAILS`에 해당 이메일이 있을 때만 관리자 API 허용 (`isAllowedAdmin`).

---

## 7. Pages (프론트엔드)

- **프로젝트 이름**: `holaphotograph`
- **배포**: `npx wrangler pages deploy dist --project-name=holaphotograph` (또는 GitHub Actions)
- **커스텀 도메인**: `holaphoto.com`, `www.holaphoto.com` (Pages → Custom domains)

### 7.1 환경 변수 (선택)

- **Production**: `PUBLIC_API_URL` = `https://api.holaphoto.com`, `PUBLIC_ADMIN_API_URL` = 동일
- Workers & Pages → **holaphotograph** (Pages) → Settings → Environment variables

---

## 8. 커스텀 도메인 요약

| 대상 | 도메인 | 설정 위치 |
|------|--------|-----------|
| Pages (프론트) | holaphoto.com, www.holaphoto.com | Pages → holaphotograph → Custom domains |
| Worker (API) | api.holaphoto.com | Workers & Pages → holaphotograph-api → Settings → Domains |

- 도메인을 Cloudflare에 추가한 뒤, DNS 전파 후 Pages/Worker에 도메인 연결.
- 상세: [docs/CUSTOM_DOMAIN.md](./CUSTOM_DOMAIN.md)

---

## 9. 배포

### 9.1 GitHub Actions (권장)

- **main** 푸시 시 Worker + Pages 자동 배포.
- **Secrets**: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` (Repository → Settings → Secrets and variables → Actions)
- Pages 프로젝트 `holaphotograph`는 대시보드에서 미리 생성.

### 9.2 수동

```bash
npm run build
cd worker && npx wrangler deploy
cd .. && npx wrangler pages deploy dist --project-name=holaphotograph
```

- 상세: [docs/DEPLOY.md](./DEPLOY.md)

---

## 10. 문서 인덱스

| 문서 | 내용 |
|------|------|
| [ACCESS_API_SETUP.md](./ACCESS_API_SETUP.md) | api.holaphoto.com Access 등록·CORS·쿠키 안내 |
| [ACCESS_CORS_ISSUE_SUMMARY.md](./ACCESS_CORS_ISSUE_SUMMARY.md) | 커스텀 도메인 + Access 시 CORS/401 이슈 정리 |
| [CUSTOM_DOMAIN.md](./CUSTOM_DOMAIN.md) | 도메인 → Cloudflare 연결, Pages/Worker 도메인 연결 |
| [KV_SETUP.md](./KV_SETUP.md) | KV 네임스페이스 생성·wrangler.toml |
| [DEPLOY.md](./DEPLOY.md) | 배포 명령·GitHub Secrets |

---

## 11. 한눈에 보기 (체크리스트)

- [ ] **D1**: `holaphotograph-db` 생성 후 wrangler.toml에 database_id 반영, migrations 적용
- [ ] **R2**: 버킷 `camera-review-images` 생성, wrangler.toml에 바인딩
- [ ] **KV**: `APP_KV` 프로덕션·프리뷰 네임스페이스 생성 후 id/preview_id 반영
- [ ] **Worker**: ALLOWED_EMAILS(또는 시크릿), YOUTUBE_API_KEY(시크릿) 설정
- [ ] **Access**: api.holaphoto.com 앱 등록, 경로 `/api/admin/*`, `/admin`, `/admin/*`, CORS 옵션 요청 바이패스 켜기
- [ ] **GitHub CI** (admin UI R2 업로드 사용 시): `CLOUDFLARE_API_TOKEN`에 **R2 Object Read & Write** 권한 포함
- [ ] **Pages**: 프로젝트 `holaphotograph` 생성, 커스텀 도메인 holaphoto.com 연결
- [ ] **도메인**: Cloudflare에 도메인 추가, 네임서버 전환, Pages/Worker에 도메인 연결
