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
