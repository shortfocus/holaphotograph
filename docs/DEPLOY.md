# 배포 명령어

## GitHub Actions 자동 배포 (권장)

`main` 브랜치에 푸시하면 자동으로 Worker + Pages가 배포됩니다.

### 1. GitHub Secrets 설정

Repository → **Settings** → **Secrets and variables** → **Actions**에서 추가:

| Secret | 설명 |
|--------|------|
| `CLOUDFLARE_API_TOKEN` | [Cloudflare 대시보드](https://dash.cloudflare.com/profile/api-tokens) → API Tokens → Create Token → "Edit Cloudflare Workers" 템플릿 사용 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 대시보드 우측 사이드바에서 확인 |

### 2. Pages 프로젝트 사전 생성

Cloudflare 대시보드에서 **Pages** → **Create project** → **Direct Upload**로 `camera-review` 프로젝트를 먼저 생성해 두세요. (한 번만 필요)

---

## 전체 배포 (수동)

```bash
npm run build && cd worker && npx wrangler deploy && cd .. && npx wrangler pages deploy dist --project-name=camera-review
```

---

## 단계별 배포

```bash
# 1. 프론트엔드 빌드
npm run build

# 2. Worker 배포
cd worker && npx wrangler deploy

# 3. 프론트엔드 배포 (Cloudflare Pages)
cd .. && npx wrangler pages deploy dist --project-name=camera-review
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
npx wrangler pages deploy dist --project-name=camera-review
```
