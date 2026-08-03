# 배포 명령어

## GitHub Actions 자동 배포 (권장)

`main` 브랜치에 푸시하면 자동으로 Worker + Pages가 배포됩니다.

### 1. GitHub Secrets 설정

Repository → **Settings** → **Secrets and variables** → **Actions**에서 추가:

| Secret | 설명 |
|--------|------|
| `CLOUDFLARE_API_TOKEN` | [Cloudflare 대시보드](https://dash.cloudflare.com/profile/api-tokens) → API Tokens → Create Token → "Edit Cloudflare Workers" 템플릿 사용. **관리자 UI를 R2에 올리려면** 같은 토큰에 **Account → R2 Object Read & Write** 권한을 추가해야 함. (없으면 CI의 "Upload admin UI to R2" 단계에서 403 Forbidden) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 대시보드 우측 사이드바에서 확인 |

#### R2 업로드(admin UI) 시 토큰 권한

CI에서 "Upload admin UI to R2" 단계가 **403 Forbidden**으로 실패하면, `CLOUDFLARE_API_TOKEN`에 **R2 쓰기 권한**이 없는 것입니다.

1. [Cloudflare 대시보드](https://dash.cloudflare.com/profile/api-tokens) → **API Tokens** → 기존 토큰 **편집** 또는 **Create Token**
2. **권한**에 **Account** → **R2 Object Read & Write** 추가 (또는 Cloudflare Workers R2 Storage → Edit)
3. 저장 후, GitHub **Settings** → **Secrets and variables** → **Actions** 에서 `CLOUDFLARE_API_TOKEN` 값을 새 토큰으로 갱신
4. 워크플로 다시 실행 (또는 빈 커밋 푸시)

### 2. Pages 프로젝트 사전 생성

Cloudflare 대시보드에서 **Pages** → **Create project** → **Direct Upload**로 `holaphotograph` 프로젝트를 먼저 생성해 두세요. (한 번만 필요)

---

## 전체 배포 (수동)

```bash
npm run build && cd worker && npx wrangler deploy && cd .. && npx wrangler pages deploy dist --project-name=holaphotograph
```

---

## 단계별 배포

```bash
# 1. 프론트엔드 빌드
npm run build

# 2. Worker 배포
cd worker && npx wrangler deploy

# 3. 프론트엔드 배포 (Cloudflare Pages)
cd .. && npx wrangler pages deploy dist --project-name=holaphotograph
```

---

## 개별 배포

**Worker만 배포할 때:**
```bash
cd worker
npx wrangler deploy
```

**프론트엔드만 배포할 때:**
```bash
npm run build
npx wrangler pages deploy dist --project-name=holaphotograph
```

---

## main 머지 전 — 고객 공유용 테스트 환경

프로덕션은 **Pages 1개 + Worker(`api.holaphoto.com`) 1개 + D1 1개** 구조입니다.  
feature 브랜치에 **Worker/DB 변경**이 있으면, 프론트만 프리뷰해도 새 API가 없어 기능이 깨지고, Worker를 그대로 배포하면 **실서버가 덮어써질 수 있습니다.**

### 선택지 요약

| 방법 | 적합한 경우 | 리스크 |
|------|-------------|--------|
| **ngrok (로컬 터널)** | Worker 포함 기능을 당장 고객에게 보여주기 | PC·터널이 켜져 있어야 함. URL이 자주 바뀜 |
| **Pages 프리뷰만** | UI만 확인 (API 변경 없음) | Worker 변경이 있으면 갤러리 등이 깨질 수 있음 |
| **Staging Worker + D1 분리** | 반복적으로 안전하게 공유 | 초기 세팅 필요 (아직 미구축) |
| **프로덕션에 API만 선배포** | 스키마/API가 하위 호환일 때 | 실서버에 마이그레이션·API가 먼저 들어감 |

기존 참고: `.github/workflows/deploy-design.yml`은 `design-improvement` 브랜치용 Pages 프리뷰 배포 예시입니다.  
**주의:** 그 워크플로는 Worker도 `wrangler deploy`하므로, 그대로 쓰면 프로덕션 API가 바뀔 수 있습니다. 고객 공유용으로는 **Pages만** 프리뷰하거나, staging Worker를 따로 두는 편이 안전합니다.

### A. ngrok으로 로컬 환경 공유 (Worker 포함 시 권장)

프론트(Astro `4321`)와 API(Worker `8787`)를 각각 터널로 엽니다.

#### 1) 준비

```bash
brew install ngrok
ngrok config add-authtoken <토큰>   # https://dashboard.ngrok.com 에서 발급
```

#### 2) 로컬 서버

```bash
# 터미널 1 — Worker
npm run dev:worker
# → http://localhost:8787

# 터미널 2 — Astro
npm run dev
# → http://localhost:4321
```

#### 3) 터널 2개

```bash
ngrok http 4321   # 프론트 → https://xxxx.ngrok-free.app
ngrok http 8787   # API    → https://yyyy.ngrok-free.app
```

#### 4) 프론트가 로컬 Worker를 보게 하기

`src/lib/api.ts`는 hostname이 `localhost`가 아니면 기본으로 `https://api.holaphoto.com`을 사용합니다.  
ngrok 도메인으로 열면 실서버 API를 치므로, **프론트를 다시 띄울 때** API URL을 지정합니다.

```bash
PUBLIC_API_URL=https://yyyy.ngrok-free.app npm run dev
```

고객에게는 **프론트 ngrok URL**만 공유합니다. 예: `https://xxxx.ngrok-free.app/gallery`

#### 주의

- 로컬 PC와 ngrok이 켜져 있는 동안만 접속 가능
- 무료 플랜은 재시작 시 URL이 바뀌고, 브라우저에 ngrok 중간 확인 페이지가 뜰 수 있음
- 공개 `/gallery` 등 확인용으로는 충분. 관리자(Access·쿠키)는 ngrok에서 불편할 수 있음

### B. Cloudflare Pages 프리뷰 (프론트만)

```bash
npm run build
cd worker && npx wrangler pages deploy ../dist \
  --project-name=holaphotograph \
  --branch=feature/site-improvement-2026-07
```

배포 후 나오는 `*.pages.dev` URL을 공유합니다.  
API는 기본적으로 프로덕션(`api.holaphoto.com`)을 가리키므로, **이번처럼 갤러리 Worker/마이그레이션이 필요한 작업에는 부적합**할 수 있습니다.

### C. 앞으로 권장 — Staging 분리

반복 공유가 필요하면 아래를 한 번 구축하는 것이 정석입니다.

- Worker: `holaphotograph-api-staging` (별도 이름)
- D1: staging DB + 마이그레이션
- Pages 프리뷰 빌드 시 `PUBLIC_API_URL`을 staging Worker로 지정

---

## 동적 OG (공유 미리보기)

`/post?id=123`, `/notice?id=456` 링크를 SNS/카카오톡 등에 공유할 때, **글마다 다른 제목·설명·이미지**가 미리보기로 나오게 하려면 아래 둘 중 하나를 사용하면 됩니다.

### 1) API에서 OG HTML만 쓰기 (간단)

- **GET** `https://api.holaphoto.com/api/og?type=post&id=123` 또는 `?type=notice&id=456`  
  → 해당 글 기준으로 `og:title`, `og:description`, `og:image`가 들어간 HTML이 반환됩니다.  
  `og:url`은 항상 `https://holaphoto.com/post?id=123` 형태(메인 사이트)로 고정됩니다.
- 공유 시 **미리보기만** 동적으로 쓰고 싶다면, 공유 클릭 시 위 URL로 리다이렉트하는 방식으로 활용할 수 있습니다. (실제 공유 URL을 메인 사이트로 유지하려면 2번 필요)

### 2) 메인 도메인(holaphoto.com)까지 동적 OG 적용

- 이 Worker를 **holaphoto.com**에도 붙이고, 정적 사이트는 **Pages**에서만 서빙되게 합니다.
- Worker에 **환경 변수** 설정:
  - `SITE_HOST` = `holaphoto.com` (기본값이라 생략 가능)
  - `SITE_ORIGIN` = Pages 배포 URL (예: `https://holaphotograph.pages.dev`)
- 동작:
  - **일반 사용자**가 `holaphoto.com/*` 접속 → Worker가 `SITE_ORIGIN`으로 프록시 → 기존처럼 정적 페이지 표시.
  - **봇**(페이스북, 카카오톡, 트위터 등)이 `holaphoto.com/post?id=123` 또는 `/notice?id=456` 접속 → Worker가 DB에서 해당 글을 조회해 **OG 메타만 넣은 HTML**을 반환 → 공유 미리보기에 글 제목·설명·이미지가 반영됩니다.
- Cloudflare 대시보드에서 **Workers & Pages** → 해당 Worker → **Settings** → **Triggers**에 `holaphoto.com/*` 라우트를 추가하고, **Variables**에 `SITE_ORIGIN`을 설정하면 됩니다.

#### 부연: 왜 프록시가 필요할까?

- **지금 구조**  
  `holaphoto.com`은 Cloudflare **Pages**가 직접 응답합니다. Pages는 빌드된 정적 파일만 주기 때문에, `/post?id=123`이든 `/post?id=456`이든 **항상 같은 HTML**이 나가고, 그 안의 `og:title` / `og:image` 등도 모두 동일합니다. 그래서 공유 시 미리보기가 글마다 바뀌지 않습니다.

- **2번 적용 후 구조**  
  `holaphoto.com`에 **Worker를 라우트로 붙이면**, `holaphoto.com`으로 들어오는 **모든 요청이 먼저 Worker를 거칩니다**. Worker가 “누가, 어떤 URL로” 요청했는지 보고 나눕니다.

  1. **봇**이 **`/post?id=123` 또는 `/notice?id=456`** 로 요청한 경우  
     → Worker가 DB에서 해당 글을 조회해, **OG 메타만 넣은 짧은 HTML**을 만들어 그대로 응답합니다.  
     → 카카오/페이스북 등은 이 응답의 `og:title`, `og:image` 등을 읽어서 미리보기를 띄웁니다.

  2. **그 외** (일반 사용자이거나, `/post`·`/notice`가 아니거나, `id`가 없음)  
     → “실제 화면은 Pages에 있다”고 보므로, Worker가 **`SITE_ORIGIN`(Pages 주소)** 으로 **같은 경로를 대신 요청(fetch)** 합니다.  
     → Pages가 준 HTML/자원을 그대로 사용자에게 넘겨 줍니다.  
     → 이걸 **프록시**라고 합니다. 사용자 입장에서는 여전히 `holaphoto.com`을 쓰고, 화면은 지금처럼 정적 사이트 그대로 보입니다.

- **정리**  
  - **일반 사용자**: `holaphoto.com` 접속 → Worker → (Worker가 Pages에 같은 URL 요청) → Pages 응답을 그대로 전달 → 기존과 동일한 페이지.  
  - **봇이 `/post?id=123` 등으로 접속**: Worker가 OG용 HTML만 만들어서 반환 → 공유 미리보기만 글이 바뀐 것처럼 보임.
