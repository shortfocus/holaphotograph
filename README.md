# 카메라 리뷰 & 촬영 가이드

올라포토의 실사용 중심 카메라 리뷰와 촬영 가이드를 제공하는 웹사이트입니다.

## 주요 기능

- **히어로 캐러셀**: 메인 소개, 프로모션, 고객 리뷰 안내
- **유튜브**: 넷플릭스 스타일 가로 스크롤로 최신 영상 노출 (롱폼)
- **Shorts**: 유튜브 Shorts 가로 스크롤
- **최신 블로그**: 네이버 블로그 최신 글 6개 (1:1 썸네일)
- **고객 후기**: DB 기반 고객 리뷰 목록/상세
- **관리자 페이지**: Cloudflare Access로 보호된 관리자 기능

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프론트엔드 | Astro, Tailwind CSS |
| API | Cloudflare Worker |
| DB | Cloudflare D1 |
| 스토리지 | Cloudflare R2 |
| 배포 | Cloudflare Pages |

## 프로젝트 구조

```
camera-review/
├── src/
│   ├── layouts/     # 레이아웃 (헤더, 푸터)
│   ├── lib/         # API 클라이언트
│   ├── pages/       # 페이지 (index, admin, reviews, post)
│   └── styles/      # 글로벌 스타일
├── worker/          # Cloudflare Worker (API)
│   ├── src/index.ts
│   └── migrations/
├── public/          # 정적 에셋
└── docs/            # 설정 가이드
```

## 시작하기

### 사전 요구사항

- Node.js 18+
- npm 또는 yarn

### 설치

```bash
npm install
cd worker && npm install
```

### 로컬 개발

**터미널 1 – Worker API**
```bash
cd worker
npm run dev
```

**터미널 2 – Astro 프론트엔드**
```bash
npm run dev
```

- 프론트엔드: http://localhost:4321
- API: http://localhost:8787

### 빌드

```bash
npm run build
```

## 배포

### 자동 배포 (GitHub Actions)

`main` 브랜치에 푸시하면 Cloudflare Worker + Pages가 자동 배포됩니다.

**필수 설정**: GitHub Repository → Settings → Secrets에 `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` 추가

### 수동 배포

```bash
npm run build && cd worker && npx wrangler deploy && cd .. && npx wrangler pages deploy dist --project-name=camera-review
```

자세한 설정은 [docs/SETUP.md](docs/SETUP.md)와 [docs/DEPLOY.md](docs/DEPLOY.md)를 참고하세요.

## 데이터 소스

| 섹션 | 소스 |
|------|------|
| 유튜브 | YouTube Data API v3 |
| Shorts | YouTube Data API v3 (60초 이하 영상) |
| 최신 블로그 | 네이버 블로그 RSS |

RSS·유튜브 연동 설정: [docs/RSS_YOUTUBE_SETUP.md](docs/RSS_YOUTUBE_SETUP.md)

## 문서

- [SETUP.md](docs/SETUP.md) – Cloudflare D1, R2, Access 설정
- [DEPLOY.md](docs/DEPLOY.md) – 배포 명령어
- [RSS_YOUTUBE_SETUP.md](docs/RSS_YOUTUBE_SETUP.md) – RSS·유튜브 API 설정

## 라이선스

Private
