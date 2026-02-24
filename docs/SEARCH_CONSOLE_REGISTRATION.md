# 검색 등록: Google Search Console · 네이버 서치어드바이저

사이트(holaphoto.com)를 **Google Search Console**과 **네이버 서치어드바이저**에 등록하는 절차 요약입니다.

---

## 1. Google Search Console

1. [Google Search Console](https://search.google.com/search-console) 접속 → Google 계정으로 로그인
2. **속성 추가** → **도메인** 또는 **URL 접두어** 선택
   - **도메인**: `holaphoto.com` (하위 경로·프로토콜 모두 포함). 소유 확인은 **DNS TXT 레코드**로 진행
   - **URL 접두어**: `https://holaphoto.com` (권장). 소유 확인은 HTML 태그·HTML 파일·Google Analytics 등 선택 가능
3. **소유권 확인**
   - **HTML 태그**: `<meta name="google-site-verification" content="…" />` 를 사이트 `<head>`에 넣고 배포 후 Search Console에서 "확인" 클릭
   - **HTML 파일**: 안내된 파일을 사이트 루트에 업로드 (예: `https://holaphoto.com/google123.html`)
   - **DNS**: 도메인 소유 시 TXT 레코드 추가
4. 확인 완료 후 **사이트맵 제출**: `https://holaphoto.com/sitemap-index.xml` 또는 `https://holaphoto.com/sitemap-0.xml` (사이트맵이 있는 경우)

---

## 2. 네이버 서치어드바이저

1. [네이버 서치어드바이저](https://searchadvisor.naver.com/) 접속 → 네이버 로그인
2. **사이트 등록** → 사이트 URL 입력: `https://holaphoto.com`
3. **소유 확인**
   - **HTML 메타 태그**: `<meta name="naver-site-verification" content="…" />` 를 사이트 `<head>`에 넣고 배포 후 "확인" 클릭
   - **HTML 파일 업로드**: 안내된 파일명으로 루트에 업로드
4. 확인 완료 후 **사이트맵 제출** (제공 시): 사이트맵 URL 입력  
   - **RSS 제출** (선택): 사이트 소유 RSS가 있으면 URL 입력. 본 사이트 피드: `https://holaphoto.com/feed.xml`

---

## 3. 소유 확인용 메타 태그 넣는 위치

두 검색엔진 모두 **메타 태그**로 확인할 경우, 레이아웃의 `<head>` 안에 한 번만 넣으면 됩니다.

- **Layout.astro** `<head>` 내에 예시:
  ```html
  <meta name="google-site-verification" content="검색콘솔에서_받은_값" />
  <meta name="naver-site-verification" content="서치어드바이저에서_받은_값" />
  ```
- 실제 `content` 값은 각 콘솔에서 "HTML 태그" 방식 선택 시 표시되는 문자열로 교체
- 배포 후 각 콘솔에서 "확인" 버튼 클릭

---

## 4. 사이트맵 · RSS · robots.txt

- **사이트맵**: 검색엔진이 페이지 목록을 수집하기 쉬움. Astro에 `@astrojs/sitemap` 사용 시 빌드 시점에 `/sitemap-index.xml` 등이 생성됨.
- **RSS 피드**: `https://holaphoto.com/feed.xml` — 메인 페이지(홈, 고객 후기, 후기 작성)를 RSS 2.0 형식으로 제공. 네이버 서치어드바이저·RSS 리더 제출용.
- **robots.txt**: `User-agent: *` 와 `Sitemap: https://holaphoto.com/sitemap-index.xml` 등을 넣어 두면 제출 URL로 활용 가능.

사이트맵·RSS·robots.txt가 없어도 등록·확인은 가능하고, 있으면 색인·제출에 유리합니다.
