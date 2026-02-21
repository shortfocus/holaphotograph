# RSS & 유튜브 연동 설정 가이드

## 개요

홈페이지의 다음 섹션들이 외부 소스에서 데이터를 가져옵니다:

| 섹션 | 데이터 소스 | API |
|------|-------------|-----|
| 유튜브 | YouTube Data API v3 | `GET /api/youtube-latest` (60초 초과 영상) |
| Shorts | YouTube Data API v3 | `GET /api/youtube-latest` (60초 이하 영상) |
| 최신 블로그 | 네이버 블로그 RSS | `GET /api/naver-rss` (reviews+guides+models 통합, 날짜순) |

---

## 네이버 블로그 RSS

- **RSS URL**: https://rss.blog.naver.com/holaphotograph.xml
- **별도 설정 없음** – Worker에 하드코딩되어 있음
- **이미지 프록시**: 네이버 썸네일(pstatic.net)은 핫링크 차단으로 직접 노출이 안 되므로 `GET /api/image-proxy?url=...` 로 프록시 서빙
- **카테고리 → 섹션 매핑**: 자세한 내용은 [RSS_SECTION_MAPPING.md](./RSS_SECTION_MAPPING.md) 참고
  - 요약:
  - **위클리 포커스 & 카메라 소식**: 강의, 예약, 세미나, 클래스, 교육, Weekly Focus, 카메라 소식
  - **렌즈 & 액세서리**: 시그마, 렌즈, 삼양, 빌트록스, Accessory, 피지테크
  - **리뷰**: 그 외

---

## 유튜브 API 설정

### 1. Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 또는 선택
3. **API 및 서비스** → **라이브러리** → "YouTube Data API v3" 검색 → **사용** 클릭
4. **API 및 서비스** → **사용자 인증 정보** → **사용자 인증 정보 만들기** → **API 키**
5. 생성된 API 키 복사

### 2. Worker에 시크릿 등록

```bash
cd worker
wrangler secret put YOUTUBE_API_KEY
# 프롬프트에 API 키 붙여넣기
```

### 3. API 키 미설정 시

- 유튜브 / Shorts 섹션에 "유튜브 API 키를 설정해주세요." 메시지 표시
- 최신 블로그 섹션(RSS 기반)은 정상 동작

---

## 채널 통계 (협업/광고 섹션)

`GET /api/channel-stats` 에서 다음 데이터를 반환합니다:

| 항목 | 소스 | 비고 |
|------|------|------|
| 유튜브 구독자 | YouTube Data API v3 | `channels.list` (statistics.subscriberCount) |
| 영상 누적 조회수 | YouTube Data API v3 | `channels.list` (statistics.viewCount) |
| 네이버 블로그 총 방문자 | 수동 설정 | `NAVER_BLOG_VISITORS` 시크릿 |

### 네이버 블로그 방문자 수 설정

네이버는 공식 API가 없어 **수동으로 설정**합니다:

```bash
cd worker
wrangler secret put NAVER_BLOG_VISITORS
# 숫자만 입력 (예: 123456)
```

블로그 관리자 페이지에서 방문자 수를 확인한 뒤, 주기적으로 업데이트하면 됩니다.

---

## 배포

```bash
npm run build
cd worker && npm run deploy
cd .. && npx wrangler pages deploy dist --project-name=holaphotograph
```

---

## 관리자 새 글 작성 (DB)

관리자 페이지(`/admin`)에서 작성하는 글은 **DB에 저장**되며, 현재 홈에서는 **RSS/유튜브만** 표시됩니다.

- DB 글은 `/post?id=xxx` 상세 페이지에서 조회 가능
- 홈 섹션에 DB 글을 다시 노출하려면 `index.astro`의 `load()` 로직을 수정해야 함
