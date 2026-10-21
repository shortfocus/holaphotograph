# Lighthouse 성능·접근성 개선 가이드

**작성일:** 2026-10-21  
**대상 URL:** https://www.holaphoto.com/  
**원본 리포트:** `docs/lighthouse-score-261021.json`  
**Lighthouse:** 13.4.1 · Chrome 155 (Desktop)

---

## 1. 현재 점수 요약

| 카테고리 | 점수 | 상태 |
|----------|------|------|
| Performance | **64** | 개선 필요 (LCP가 점수 대부분을 깎음) |
| Accessibility | **93** | 색상 대비·터치 영역만 수정하면 100 근접 |
| Best Practices | **77** | YouTube 서드파티 쿠키·Issues 영향 |
| SEO | **100** | 유지 |

### Core Web Vitals / 주요 메트릭

| 메트릭 | 측정값 | 점수 | 비고 |
|--------|--------|------|------|
| FCP | 1.2초 | 0.72 | 양호 쪽 |
| **LCP** | **18.4초** | **0** | 최우선 개선 대상 |
| TBT | 10ms | 1.00 | 문제 없음 |
| CLS | 0.004 | 1.00 | 문제 없음 |
| Speed Index | 3.2초 | 0.22 | 대용량 이미지와 연동 |
| TTI | 18.4초 | 0 | LCP와 동일하게 지연 |

### 네트워크 페이로드

| 유형 | 요청 수 | 전송량 |
|------|---------|--------|
| **합계** | 88 | **~18.8 MB** |
| 이미지 | 42 | ~12.6 MB |
| 글꼴 | 5 | ~3.0 MB |
| 타사(YouTube 등) | 55 | ~5.9 MB |
| 스크립트 | 12 | ~0.9 MB |

> **측정 주의:** `unused-javascript` / `unminified-*` 항목의 상당수가 `chrome-extension://` 리소스입니다.  
> 실제 사이트 점수는 **시크릿 모드(확장 프로그램 비활성)** 로 재측정하는 것이 정확합니다.

---

## 2. 원인 진단 (왜 LCP가 18초인가)

홈 진입 시 **팝업 PNG 3장(~6.2 MB)** + **블로그 썸네일 JPEG(~4.5 MB)** + **YouTube autoplay iframe** + **Pretendard 4 weights(~3 MB)** 가 동시에 다운로드됩니다.

모집 팝업(`#gr-promo-popup`)은 화면에 보이기 전에도 HTML에 `<img src="/images/gr_18~20.png">`가 있어 **eager 로드**됩니다.  
히어로 YouTube iframe은 `autoplay=1`이라 플레이어·스트리밍까지 즉시 끌어옵니다.

이 조합이 LCP/TTI 18.4초의 핵심 원인입니다.

---

## 3. 우선순위별 액션 플랜

### P0 — 즉시 (예상 효과: Performance 64 → 80대)

#### P0-1. 모집 팝업 이미지 최적화 + 지연 로드

**문제**

| 파일 | 크기 | 예상 낭비 |
|------|------|-----------|
| `gr_20.png` | 2.47 MB | ~2.39 MB |
| `gr_18.png` | 2.12 MB | ~2.05 MB |
| `gr_19.png` | 1.59 MB | ~1.52 MB |

표시 폭은 모바일 팝업(~max-w-sm)인데 원본 PNG가 그대로 로드됩니다.

**조치**

1. WebP(또는 AVIF)로 변환 + 가로 ~800px로 리사이즈  
   - 목표: 장당 **80~150 KB** 수준
2. `width` / `height` 속성 추가 (unsized-images 해결)
3. 팝업이 열릴 때까지 로드하지 않기
   - `loading="lazy"` + 초기에는 `data-src`만 두고, 오픈 시 `src` 주입  
   - 또는 닫힌 상태에서는 DOM에 img를 넣지 않음
4. 전시 팝업처럼 `display_07/*.webp` 패턴을 그대로 따름

**관련 코드:** `src/pages/index.astro` (`#gr-promo-popup`, 약 264~380행)

---

#### P0-2. 피처드 블로그 썸네일 리사이즈·WebP

**문제**

| 파일 | 크기 | 표시 대비 |
|------|------|-----------|
| `223554336299.jpg` | 1.34 MB | 카드 썸네일 |
| `223918535079.jpg` | 1.18 MB | 〃 |
| `223630921092.jpg` | 1.03 MB | 〃 |
| `223594532420.jpg` | 0.99 MB | 〃 |

카드에 ~209×314 정도로 보이는데 원본이 1MB급입니다.

**조치**

1. `public/images/featured-blog/` 이미지를 **400~600px 폭 WebP**로 재생성
2. `src/data/featured-blog.ts`의 `thumbnail_url`을 `.webp`로 교체
3. `<img>`에 `width`/`height`/`loading="lazy"`/`decoding="async"` 적용 (첫 화면 밖이면 lazy 필수)

**예상 절감:** image-delivery 전체 **~10.8 MB** 중 블로그 분량 상당

---

#### P0-3. YouTube 임베드 → Facade(클릭 시 로드)

**문제**

- 히어로 iframe: `youtube.com/embed/7BYd6RJp3RY?autoplay=1&mute=1`
- 페이지 로드와 동시에 YouTube 플레이어·광고·쿠키·영상 버퍼(~1 MB+) 로드
- Best Practices의 **서드파티 쿠키 18개**, DevTools Issues도 대부분 여기 기인

**조치 (Lite YouTube Embed 패턴)**

1. 초기에는 썸네일 이미지 + 재생 버튼만 표시  
   - 예: `https://i.ytimg.com/vi/7BYd6RJp3RY/hqdefault.jpg` 또는 `maxresdefault.jpg`
2. 클릭(또는 IntersectionObserver로 viewport 진입 후)에만 iframe 삽입
3. autoplay가 꼭 필요하면 facade 클릭 후에만 `autoplay=1`

**관련 코드:** `src/pages/index.astro` 히어로 iframe (약 528~533행)

**부수 효과:** Best Practices 77 → 개선, 타사 전송량 감소

---

### P1 — 단기 (예상 효과: FCP·SI 추가 개선, A11y 100 근접)

#### P1-1. Pretendard 폰트 로딩 최적화

**문제**

- JSDelivr에서 Pretendard **Bold / SemiBold / Medium / Regular** 등 ~3 MB 로드
- `pretendard.min.css`가 렌더링 차단 리소스로 잡힘
- (리포트상 Roboto `font-display` 경고 510ms는 YouTube 내부 — 사이트 직접 수정 불가, facade로 완화)

**조치**

1. 실제 쓰는 weight만 로드 (예: Regular 400 + SemiBold 600)
2. `font-display: swap`이 적용된 **subset / variable** 또는 로컬 `@font-face`로 전환
3. 가능하면 `cdn.jsdelivr.net` → **self-host** (`public/fonts/`) + `preload` 1~2개만
4. 렌더 차단 CSS는 critical만 인라인, 나머지는 `media="print" onload` 패턴 검토

**관련 코드:** `src/layouts/Layout.astro` 61행

---

#### P1-2. 히어로 배경 이미지 WebP

| 파일 | 현재 | 권장 |
|------|------|------|
| `hero-bg/gr_1.jpeg` ~ `gr_4.jpeg` | 88~149 KB JPEG | WebP + 적절한 해상도 |

절감량은 P0보다 작지만 SI·대역폭에 도움이 됩니다.  
비활성 슬라이드는 CSS `background-image`를 나중에 주입하거나 `content-visibility`로 지연 가능.

---

#### P1-3. 색상 대비 (Accessibility)

| 요소 | 전경 | 배경 | 대비 | 권장 |
|------|------|------|------|------|
| `#reviews-marquee` 「더보기 →」 | `#E11D48` | `#F8FAFC` | 4.48 | `#BE123C`(rose-700) 또는 `#C8102E` 등으로 **≥ 4.5** |
| Footer 저작권·파트너 링크 | `#62748e` (slate-500) | `#0F172A` | 3.74 | `text-slate-400` (`#94a3b8`) 이상 |

---

#### P1-4. 터치 타겟 크기 (Accessibility)

블로그 카드의 「블로그 보기 →」「유튜브 보기 →」 링크가 **높이 16px** (기준 24×24px).

**조치:** `text-xs` 유지하되 `inline-flex min-h-6 items-center py-1` 또는 `py-2`로 클릭 영역 확대.

---

#### P1-5. 이미지 width/height

unsized-images로 지적된 항목:

- 팝업 `gr_18.png` / `gr_19.png` / `gr_20.png`
- (로고 등 추가 지적 시 동일 적용)

명시적 크기로 CLS 예방 (현재 CLS는 양호하나 재발 방지).

---

### P2 — 중기 / 선택

| 항목 | 내용 | 비고 |
|------|------|------|
| Cloudflare Insights beacon | 레거시 JS ~10 KiB 지적 | 플랫폼 스크립트 — 우선순위 낮음 |
| YouTube 썸네일 캐시 | `i.ytimg.com` 캐시 TTL 짧음 | Google 측 — facade로 요청 수 자체를 줄이는 편이 유효 |
| CSP | 시행 모드 CSP 없음 | 별도 보안 작업 (`docs/TODO_SECURITY.md`와 연계) |
| ~~`poster_black.webp` 등 전시 잔여 이미지~~ | ~~~619 KB~~ | ✅ 2026-10-21: 비활성 전시·강의 팝업 DOM 제거 (에셋은 `public/` 유지) |
| ~~클래스 카드 PNG (`class-museum.png` 등)~~ | ~~150~175 KB~~ | ✅ 동일 — 홈에서 로드되지 않음 |

---

## 4. 권장 작업 순서 (체크리스트)

```
[x] 1. gr_18~20 → WebP 리사이즈 + width/height + 팝업 오픈 시 로드  (2026-10-21)
[x] 2. featured-blog/*.jpg → WebP 썸네일 + lazy  (2026-10-21)
[x] 3. 히어로 YouTube → facade (클릭 시 iframe)  (2026-10-21)
[x] 4. Pretendard weight 축소 / self-host / font-display  (2026-10-21)
[x] 5. 히어로 배경 JPEG → WebP  (2026-10-21)
[x] 6. 색상 대비 (#E11D48, footer slate-500)  (2026-10-21)
[x] 7. 블로그 카드 링크 min-height 24px  (2026-10-21)
[ ] 8. 시크릿 모드로 Lighthouse 재측정 → 문서에 Before/After 기록
```

### P0 적용 요약 (2026-10-21)

| 항목 | Before | After |
|------|--------|-------|
| `gr_18~20` | PNG 합 ~6.0 MB | WebP 합 ~263 KB + 팝업 오픈 시만 로드 |
| featured-blog 6장 | JPG 합 ~4.7 MB | WebP 합 ~279 KB |
| 히어로 YouTube | 즉시 iframe + autoplay | 썸네일 facade, 클릭 시 iframe |

### P1 적용 요약 (2026-10-21)

| 항목 | Before | After |
|------|--------|-------|
| Pretendard | JSDelivr static 4 weights ~3 MB, 렌더 차단 | self-host Variable dynamic-subset + 비동기 CSS |
| 히어로 배경 | JPEG 합 ~722 KB, 4장 동시 로드 | WebP 합 ~121 KB, 활성·다음만 로드 |
| 색상 대비 | `#E11D48` / footer `slate-500` | `#BE123C` / `slate-400` |
| 터치 타겟 | 블로그 링크 높이 16px | `min-h-6` (24px) |
| 로고 | width/height 없음 | `216×100` 명시 |

---

## 5. 예상 개선 목표

| 단계 | Performance | LCP | 총 페이로드 | Accessibility |
|------|-------------|-----|-------------|---------------|
| 현재 | 64 | 18.4초 | ~18.8 MB | 93 |
| P0 완료 후 | **80~90** | **~2.5초 이하** 목표 | **~5 MB 이하** | 93 |
| P0+P1 완료 후 | **90+** | **~2초 전후** | **~3~4 MB** | **98~100** |

> LCP 목표는 네트워크·기기 편차가 있으므로, Desktop + Mobile 각각 시크릿 모드로 2~3회 측정해 중앙값을 기록합니다.

---

## 6. 재측정 방법

```bash
# Chrome DevTools → Lighthouse
# - Mode: Navigation
# - Device: Desktop / Mobile 각각
# - 시크릿 창 (확장 프로그램 OFF)
# - Clear storage 후 측정
```

결과 JSON은 `docs/lighthouse-score-YYMMDD.json` 형식으로 보관하고, 이 문서 하단에 Before/After 표를 갱신합니다.

---

## 7. 파일·코드 매핑

| 개선 항목 | 주요 위치 |
|-----------|-----------|
| 모집 팝업 이미지 | `src/pages/index.astro` (`#gr-promo-popup`) |
| 히어로 YouTube | `src/pages/index.astro` (iframe `7BYd6RJp3RY`) |
| 히어로 배경 | `src/pages/index.astro` + `public/images/hero-bg/` |
| 블로그 썸네일 | `src/data/featured-blog.ts` + `public/images/featured-blog/` |
| Pretendard | `src/layouts/Layout.astro` |
| 후기 마퀴 대비 | `src/pages/index.astro` `#reviews-marquee` |
| Footer 대비 | `src/layouts/Layout.astro` footer |
| 블로그 터치 영역 | 홈 블로그 카드 링크 클래스 |

---

## 8. Before / After (재측정 후 기입)

| 일시 | Perf | A11y | BP | SEO | LCP | 총 크기 | 비고 |
|------|------|------|-----|-----|-----|---------|------|
| 2026-10-21 | 64 | 93 | 77 | 100 | 18.4초 | 18.8 MB | 기준 (`lighthouse-score-261021.json`) |
| _(배포 후)_ | | | | | | | |

---

## 참고

- 전시 팝업 WebP 전환 사례: `public/images/display_07/*.webp` (이미 적용됨)
- 이미지 최적화는 **콘텐츠 교체 주기**가 짧으므로, 팝업/블로그 이미지 업로드 시 WebP·리사이즈를 작업 루틴에 포함
