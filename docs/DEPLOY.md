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
