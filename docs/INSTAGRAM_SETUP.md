# Instagram Reels 연동 가이드

**작성일:** 2026년 7월 9일  
**상태:** 미구현 (P3) — 계정·Meta 앱 준비 후 Worker/홈 UI 작업  
**관련:** [SITE_IMPROVEMENT_PLAN_2026-07.md](./SITE_IMPROVEMENT_PLAN_2026-07.md) Phase 4-1, [RSS_YOUTUBE_SETUP.md](./RSS_YOUTUBE_SETUP.md)

---

## 1. 개요

[holaphoto.com](https://www.holaphoto.com/) 메인 **「빠르게 보는 장비 팁」** 섹션(`#youtube-shorts`)은 현재 **YouTube Shorts**(60초 이하)를 `GET /api/youtube-latest`로 불러옵니다.  
Instagram 계정(예: [snap.hola](https://www.instagram.com/snap.hola))의 **Reels(영상)** 을 같은 위치(또는 병행 섹션)에 노출하려면 **Instagram Graph API**가 필요합니다.

| 항목 | 현재 | 목표 |
|------|------|------|
| 데이터 소스 | YouTube Data API v3 (Shorts) | **병행:** YouTube Shorts 유지 + Instagram Graph API (Reels) |
| 노출 위치 | `#youtube-shorts` | Shorts 유지 + Instagram 전용 섹션 추가 |
| 권장 UX | Shorts 카드 → YouTube | Reels 카드 → Instagram `permalink` |

**권장 노출 방식:** 사이트 안에서 영상을 직접 재생하지 않고, **썸네일 + 캡션 일부 + Instagram 링크**.  
사이트 내 임베드·`<video>` 재생이 비권장인 이유는 [§2-1](#21-사이트-내-임베드재생이-비권장인-이유) 참고.

---

## 2. 사전 결정 사항

| # | 결정 | 선택 | 상태 |
|---|------|------|------|
| 1 | 섹션 구성 | YouTube Shorts **유지** + Instagram Reels 섹션 **병행** | ✅ 확정 (2026-07-09) |
| 2 | 계정 | 공식 계정 핸들 확정 (현재 사이트 링크: `snap.hola`) | ⏳ 확인 |
| 3 | 미디어 범위 | **Reels만** 노출 | ✅ 확정 (2026-07-09) |
| 4 | 재생 방식 | **permalink 이동(권장)** / 사이트 내 임베드·재생(비권장) | ⏳ 확인 중 |

병행 시: 기존 `#youtube-shorts`는 그대로 두고, Instagram용 섹션·API(`GET /api/instagram-latest`)를 **별도**로 추가한다. 한쪽 API가 실패해도 다른 섹션은 유지한다.

### 2-1. 사이트 내 임베드·재생이 비권장인 이유

「썸네일 클릭 → Instagram으로 이동」을 권장하는 이유는 기술·정책·UX가 겹칩니다.

| 이유 | 설명 |
|------|------|
| **`media_url` 만료** | Graph API가 주는 영상 파일 URL은 **일시적**입니다. 홈에 URL을 캐시해 두면 수 시간~수일 뒤 `<video src="...">`가 깨집니다. 재생하려면 요청마다(또는 짧게) API를 다시 치거나, 영상을 R2 등에 **재호스팅**해야 합니다. |
| **대역폭·비용** | 메인에서 여러 Reels를 자동/인라인 재생하면 트래픽이 큽니다. CDN에 다시 올리지 않으면 Meta URL에 의존하고, 올리면 저장·인코딩 운영이 생깁니다. |
| **정책·약관** | Instagram 콘텐츠를 자사 사이트에서 **자체 플레이어로 상시 재생**하는 것은 플랫폼 이용약관·브랜드 가이드와 충돌할 수 있습니다. 공식 권장에 가까운 패턴은 **oEmbed/공식 임베드** 또는 **permalink로 원본 앱·웹 열기**입니다. |
| **공식 임베드(oEmbed) 한계** | permalink 기반 임베드는 가능하지만, 카드 그리드·가로 스크롤 UI와 맞추기 어렵고, 스크립트·iframe이 무거우며 레이아웃 제어가 약합니다. |
| **모바일 UX** | 인라인 자동재생은 소리·데이터·스크롤 방해 이슈가 많고, Instagram 앱으로 보내는 편이 「좋아요·팔로우·전체 시청」 전환에도 유리합니다. |

**정리:** MVP는 **썸네일(`thumbnail_url`) + `permalink`**.  
나중에 「사이트 안에서 꼭 재생」이 필요하면 (1) oEmbed 소수 임베드, 또는 (2) 허용 범위 안에서 영상 재호스팅 + 자체 플레이어를 **별도 스펙**으로 검토합니다.

---

## 3. 전제 조건 (계정)

Instagram **개인 계정은 API 사용 불가**입니다.

1. **Instagram Professional 계정** (비즈니스 또는 크리에이터)  
   - Instagram 앱 → 설정 → 계정 유형 → 전문 계정으로 전환
2. **Facebook 페이지**와 연결  
   - Instagram 설정 → 계정 센터 / 연결된 계정 → Facebook 페이지 연결  
   - 올라포토 공식 IG가 해당 페이지에 연결돼 있어야 함
3. 페이지를 관리하는 **Meta(Facebook) 계정** + [Meta for Developers](https://developers.facebook.com/) 접근

위가 준비되지 않으면 코드 작업을 해도 `/media` 호출이 실패합니다.

공식 문서: [Instagram Platform](https://developers.facebook.com/docs/instagram-platform/)

### 3-1. 역할 분담 — 고객에게 토큰 발급을 맡기지 않는다

**비밀번호는 필요 없습니다.** 다만 고객(또는 계정 관리자)이 Meta/Instagram에 **직접 로그인해서 권한을 승인**해야 합니다.  
비개발 고객에게 Graph API Explorer로 장기 토큰을 뽑아 전달하라고 하면 **대부분 어렵습니다.** 토큰 발급·교환·Worker 등록은 **개발자 일**로 둡니다.

#### 무엇이 민감하고, 무엇이 아닌가

| 필요한가? | 내용 |
|-----------|------|
| ❌ | Instagram / Facebook **아이디·비밀번호**를 개발자가 알 필요 없음 |
| ✅ | 고객이 **본인 계정으로** 로그인 후 앱 권한 **「허용」** |
| ✅ | 그 결과로 나온 **액세스 토큰**을 Worker 시크릿에 저장 (개발자) |

토큰은 비밀번호 공유가 아니라, 「이 웹사이트용 앱이 미디어를 읽어도 된다」는 **위임 증명**에 가깝습니다. 그래도 토큰이 있으면 미디어 읽기가 가능하므로 **Git·슬랙 평문 금지**, `wrangler secret`만 사용합니다.

#### 방식 비교

| 방식 | 고객 부담 | 권장 |
|------|-----------|------|
| 고객이 혼자 토큰 발급·전달 | 큼 (콘솔·Explorer·장기 토큰) | ❌ 비권장 |
| 고객은 **로그인·허용만**, 나머지는 개발자 | 작음 (클릭 몇 번 + 가능하면 30분 콜) | ✅ **권장** |
| 비밀번호를 개발자에게 공유 | — | ❌ 금지 |

#### 권장 진행 (실무)

1. **개발자**가 Meta 앱 생성 (개발자 계정)
2. 고객 담당자를 앱/페이지에 **관리자 또는 테스터로 초대**
3. **화면 공유 또는 30분 콜**  
   - 고객: Instagram/Facebook 로그인 → 권한 **허용**만  
   - 개발자: 같은 세션에서 토큰 확보 → 장기 토큰 교환 → `wrangler secret` 등록
4. 이후 토큰 갱신(약 60일)도 개발자가 일정 관리. 필요 시 같은 방식으로 짧게 재진행

#### 고객에게 말할 때 (복붙용)

> 인스타·페이스북으로 로그인해서 「허용」만 눌러 주시면, 나머지는 저희가 설정합니다.  
> 비밀번호는 알려주지 않으셔도 됩니다.

고객에게 기대하는 것:

1. 인스타가 **비즈니스/크리에이터**인지 확인 (또는 전환)
2. **페이스북 페이지**와 연결
3. 개발자가 안내한 화면에서 **허용** 클릭 (가능하면 화상으로 함께)

#### API 연동이 당장 어려울 때

고객이 콜 일정을 못 잡거나 Professional 전환이 늦으면 → [§9 API 없이 가는 임시 대안](#9-api-없이-가는-임시-대안) (수동 큐레이션, Shorts만 유지).  
UI·병행 섹션을 먼저 만들고, 계정 준비가 되면 API를 붙이는 순서도 가능합니다.

---

## 4. Meta 앱 설정

### 4-1. 앱 생성

1. [Meta for Developers](https://developers.facebook.com/) 로그인  
2. **내 앱** → **앱 만들기** (비즈니스 유형 권장)  
3. 제품 추가: **Instagram**  
   - 콘솔 안내에 따라 **Instagram API with Instagram Login** 또는 **Facebook Login for Business** 경로 선택

### 4-2. 권한 (미디어 읽기 — 홈 노출용)

자기 계정 피드/릴스를 **읽어 웹에 표시**할 때 필요한 권한은 콘솔에 표시되는 **최신 스코프 이름**을 따릅니다. 일반적으로:

| 용도 | 권한 예시 (이름은 Meta 콘솔 기준) |
|------|----------------------------------|
| 기본 프로필·미디어 | `instagram_business_basic` 또는 구 `instagram_basic` |
| 페이지 연결 (Facebook Login 경로) | `pages_show_list`, `pages_read_engagement` 등 |

**게시(업로드)** 권한(`instagram_business_content_publish` 등)은 홈 썸네일 노출에는 **필요 없습니다.**

### 4-3. 개발 모드 vs 라이브

| 모드 | 의미 |
|------|------|
| **개발** | 앱에 역할이 있는 테스터만 — 로컬·내부 확인용 |
| **라이브** | 일반 방문자용 사이트에 안정적으로 쓰려면 해당 권한 **App Review** 통과가 필요할 수 있음 |

App Review에는 사용 목적 설명·스크린캐스트가 들어가며, **수일~수주** 걸릴 수 있습니다.  
검수 문구 예: 「자사 Instagram 비즈니스 계정의 Reels 썸네일을 자사 웹사이트 메인에 표시하고, 클릭 시 Instagram으로 이동합니다.」

---

## 5. 토큰·Instagram User ID

> **역할:** 아래 절차는 **개발자가 수행**한다. 고객에게 Explorer·장기 토큰 전달을 맡기지 않는다. 고객 협조 범위는 [§3-1](#3-1-역할-분담--고객에게-토큰-발급을-맡기지-않는다).

### 5-1. 액세스 토큰

1. 고객이 권한 허용한 뒤, 개발자가 Graph API Explorer 또는 OAuth로 권한 포함 토큰 발급  
2. **단기 토큰** → **장기 토큰**(약 60일)으로 교환  
3. Worker에는 장기 토큰만 **시크릿**으로 저장 (저장소·`wrangler.toml`·슬랙 평문 커밋/공유 금지)

```bash
cd worker
npx wrangler secret put INSTAGRAM_ACCESS_TOKEN
npx wrangler secret put INSTAGRAM_USER_ID
```

로컬 개발: `worker/.dev.vars`에 동일 키를 넣을 수 있음 (`.gitignore` 대상인지 확인).

### 5-2. Instagram User ID 확인

Facebook Page에 연결된 IG 계정 ID를 구합니다. (API 버전은 콘솔 권장 버전으로 교체)

```http
GET https://graph.facebook.com/v22.0/me/accounts?access_token={TOKEN}
```

각 `page_id`에 대해:

```http
GET https://graph.facebook.com/v22.0/{page-id}?fields=instagram_business_account&access_token={TOKEN}
```

응답의 `instagram_business_account.id` → **`INSTAGRAM_USER_ID`**.

### 5-3. 미디어 목록 조회 (검증용)

```http
GET https://graph.facebook.com/v22.0/{ig-user-id}/media
  ?fields=id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp
  &limit=12
  &access_token={TOKEN}
```

| 필드 | 용도 |
|------|------|
| `media_type` | `IMAGE` / `VIDEO` / `CAROUSEL_ALBUM` |
| `media_product_type` | `REELS` 등 — 릴스만 필터할 때 |
| `thumbnail_url` | 카드 썸네일 (영상) |
| `permalink` | Instagram 원본 URL (클릭 이동) |
| `media_url` | 직접 재생용 — **만료됨**, 장기 저장·인라인 재생 비권장 |
| `caption` | 카드 제목/설명 (길이 제한해 표시) |

Graph API Explorer에서 Reels·썸네일·permalink가 보이면 Phase 0 완료입니다.

---

## 6. 이 프로젝트 구현 설계

YouTube Shorts와 동일한 패턴을 권장합니다.

```
[홈 index.astro]
  → GET /api/instagram-latest  (신규)
       → Worker가 Graph API 호출
       → KV 캐시 (10~30분, YouTube와 유사)
  → 가로 스크롤 카드 (썸네일 + 캡션)
  → 클릭 시 permalink (Instagram 앱/웹)
```

### 6-1. Worker (`worker/src/index.ts`)

1. `GET /api/instagram-latest` (또는 `/api/instagram-reels`) 추가  
2. `env.INSTAGRAM_ACCESS_TOKEN`, `env.INSTAGRAM_USER_ID` 사용  
3. Graph `/media` 응답을 정규화:

```ts
type InstagramReelItem = {
  id: string;
  caption: string | null;
  thumbnail_url: string | null;
  permalink: string;
  timestamp: string;
};
```

4. Reels만 노출 시 `media_product_type === "REELS"` (또는 합의된 필터)  
5. KV 키 예: `instagram:reels:v1`, TTL 10~30분  
6. 토큰 만료·API 실패 시: 빈 배열 + 로그, 홈은 안내 문구 또는 YouTube fallback (병행 시)

### 6-2. 프론트

| 파일 | 작업 |
|------|------|
| `src/lib/api.ts` | `fetchInstagramLatest()` 추가 |
| `src/pages/index.astro` | 섹션 카피·그리드 렌더 (`#youtube-shorts` 대체 또는 신규 id) |
| `src/layouts/Layout.astro` | 메뉴 「장비 팁」 앵커가 바뀌면 링크 수정 |

기존 Shorts 카드 레이아웃(세로형 `aspect-[209/314]`, 가로 스크롤)을 재사용하면 UI 작업량이 줄어듭니다.

### 6-3. Env / 시크릿

| 이름 | 설명 |
|------|------|
| `INSTAGRAM_ACCESS_TOKEN` | 장기 액세스 토큰 |
| `INSTAGRAM_USER_ID` | Instagram Business/Creator 사용자 ID |

토큰은 **약 60일** 만료 가능 → 캘린더 알림 또는 갱신 스크립트 운영 필요.

---

## 7. 구현 체크리스트

### Phase 0 — 계정·앱 (코드 전)

- [ ] 공식 IG Professional 전환 (고객)  
- [ ] Facebook 페이지 연결 (고객)  
- [ ] Meta 앱 생성, 고객을 테스터/관리자로 초대 (개발자)  
- [ ] 화면 공유/콜: 고객 **허용** → 개발자 토큰 확보 ([§3-1](#3-1-역할-분담--고객에게-토큰-발급을-맡기지-않는다))  
- [ ] Graph API Explorer로 `/media` 성공 (Reels·thumbnail·permalink)  
- [x] 병행(Shorts 유지 + Reels 섹션) 확정  
- [x] 미디어 범위: Reels만  
- [ ] 노출 개수(예: 5~8개), 재생 방식(permalink vs 임베드) 최종 확인  

### Phase 1 — Worker MVP

- [ ] `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_USER_ID` secret 등록  
- [ ] `GET /api/instagram-latest` + KV 캐시  
- [ ] 로컬 `wrangler dev`로 JSON 확인  

### Phase 2 — 홈 UI

- [ ] Shorts 대체 또는 Instagram 섹션 추가  
- [ ] 카드 UI + 모바일 가로 스크롤  
- [ ] 실패 시 fallback UI  

### Phase 3 — 운영·배포

- [ ] 앱 라이브 + App Review (필요 시)  
- [ ] 프로덕션 secret 등록 후 Worker 배포  
- [ ] 토큰 갱신 일정 공유  
- [ ] Rate limit: 홈 트래픽이 Graph를 직접 치지 않도록 캐시 유지  

---

## 8. 자주 막히는 지점

| 문제 | 원인·대응 |
|------|-----------|
| `/media` 빈 배열·권한 오류 | 개인 계정, 페이지 미연결, 스코프 누락 |
| 로컬만 되고 배포 실패 | 개발 모드 제한, 프로덕션 secret 미설정 |
| 썸네일 후 영상만 깨짐 | `media_url` 만료 — `permalink`로 이동 |
| App Review 반려 | 자사 계정·자사 웹 표시 목적·스크린캐스트 명확화 |
| YouTube와 동시 유지 | API·섹션 분리, 한쪽 실패해도 다른 쪽 유지 |

---

## 9. API 없이 가는 임시 대안

계정·검수 전이거나, **고객 권한 승인 콜을 당장 잡기 어려울 때** UI만 보여줄 때:

| 방법 | 장단 |
|------|------|
| **수동 큐레이션** | 고객은 Reels 링크만 공유, 관리자가 URL·썸네일 등록 — API·토큰·검수 없음, 운영 부담 |
| **oEmbed** | `permalink`로 임베드 HTML — 레이아웃 제어 약함, 다수 카드에 무거움 |
| **YouTube Shorts 유지** | 현재 구조 그대로 (`docs/RSS_YOUTUBE_SETUP.md`), Instagram 섹션은 나중에 추가 |

권장: 검수·콜 전에는 Shorts 유지 또는 수동 카드 소수 → 고객 「허용」+ `/media` 검증 후 API 연동.  
병행 구성이므로 Shorts를 끄지 않은 채 Instagram만 나중에 붙여도 된다.

---

## 10. 예상 공수

| 구간 | 예상 |
|------|------|
| 계정·앱·토큰 (고객은 허용 클릭, 개발자가 토큰 처리) | 콜 30분 + 설정 반나절 (App Review 포함 시 수주) |
| Worker API + KV | 0.5~1일 |
| 홈 섹션 UI (병행) | 0.5~1일 |
| 문서·시크릿·배포 | 0.5일 |

---

## 11. 관련 코드·문서

| 경로 | 역할 |
|------|------|
| `src/pages/index.astro` | `#youtube-shorts` 섹션 |
| `worker/src/index.ts` | `GET /api/youtube-latest` (Shorts 분리 로직) |
| `src/lib/api.ts` | 프론트 API 클라이언트 |
| `docs/RSS_YOUTUBE_SETUP.md` | 유튜브·RSS 설정 |
| `docs/SITE_IMPROVEMENT_PLAN_2026-07.md` | P3 / Phase 4-1 |

---

## 12. 다음 액션

1. 고객 안내: 비밀번호 불필요, **로그인·허용만** 부탁 ([§3-1](#3-1-역할-분담--고객에게-토큰-발급을-맡기지-않는다) 복붙 문구)  
2. Professional + Facebook 페이지 연결 여부, 계정 핸들(`snap.hola` 등) 확인  
3. 개발자: Meta 앱 생성 → 고객 초대 → 콜에서 토큰 확보 → `/media` 성공  
4. Worker `/api/instagram-latest` + 홈 **병행** 섹션 → 배포·토큰 갱신 일정  
5. (콜이 늦으면) 수동 큐레이션 또는 Shorts만 유지로 임시 대응
