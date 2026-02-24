# api.holaphoto.com Access 등록 가이드

관리자 페이지(holaphoto.com/admin)에서 API가 401이 나오거나 후기 5개인데 4개만 보이는 이유는 **api.holaphoto.com**을 Access에 등록하지 않아서입니다. 아래 순서대로 등록하면 됩니다.

---

## 왜 개발에서는 되고, 커스텀 도메인 연결 후에만 CORS/오류가 나는가

- **개발**: API를 `localhost:8787`로 쓰면 **Cloudflare Access가 없습니다.** 요청이 곧바로 Worker로 가고, Worker가 CORS 헤더를 붙여서 응답하므로 문제 없음.
- **커스텀 도메인(api.holaphoto.com) + Access**: 이 구간에 **Access를 붙이면** 요청이 **먼저 Access**를 통과합니다.  
  - 로그인된 쿠키가 없거나, preflight(OPTIONS)가 Access에서 막히면 → **응답은 Worker가 아니라 Cloudflare(Access)에서 나갑니다.**  
  - 그 응답(403, 리다이렉트, HTML 로그인 페이지)에는 **우리 Worker의 CORS 헤더가 없습니다.**  
  → 브라우저는 “교차 출처 응답에 CORS 헤더 없음” → **CORS 에러 / Failed to fetch**로 보여 줍니다.

즉, **CORS 수정 코드를 Worker에 아무리 해도**, “Access에서 막혀서 Worker까지 도달하지 못한 요청”에는 적용되지 않습니다. 그래서 배포해도 같은 오류가 반복되는 것입니다.

**선택지:**

| 방식 | 설명 |
|------|------|
| **A. Access 유지** | Access 로그인(쿠키)이 성공해야 Worker까지 도달 → CORS가 의미 있음. holaphoto.com에서 api.holaphoto.com 호출은 교차 출처라 쿠키가 제3자로 취급될 수 있어, “api.holaphoto.com 먼저 직접 열어서 로그인” 또는 **관리자 페이지를 api.holaphoto.com 아래로 이전**(예: api.holaphoto.com/admin)하면 같은 출처로 쿠키 문제가 줄어듦. |
| **B. Access 제거** | api.holaphoto.com(또는 /api/admin/*)을 Access 앱에서 **빼면** 요청이 Worker로 직행합니다. Worker의 ALLOWED_EMAILS·API 키 등만으로 관리자 인증하면, 개발할 때처럼 CORS만 맞추면 됨. Access 로그인 화면은 없어짐. |

아래는 **Access를 쓰기로 했을 때**의 등록 절차입니다. Access 없이 Worker만으로 관리자 API를 보호하려면 `docs/TODO_SECURITY.md` 등 참고.

---

## 참고: Cloudflare MCP

이 프로젝트에 연결된 Cloudflare MCP는 **문서 검색**(`search_cloudflare_documentation`)만 제공합니다. Access 앱/정책 생성·수정 도구는 없으므로, 설정은 **대시보드** 또는 [Cloudflare API](https://developers.cloudflare.com/api/)/Terraform으로 진행해야 합니다.  
공식 정책 문서: [Policies (Order of execution, Bypass)](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/), [Application paths](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/).

---

## 1. 응용 프로그램 추가 화면 들어가기

1. [Cloudflare 대시보드](https://dash.cloudflare.com) 로그인
2. 왼쪽에서 **Zero Trust** (제로 트러스트) 클릭
3. **Access** → **Applications** (응용 프로그램)
4. **Add an application** (응용 프로그램 추가) 클릭
5. **Self-hosted** 선택 후 **Next** (다음)
6. **응용 프로그램 구성** (Application Configuration) 단계로 넘어온 화면에서 아래를 진행합니다.

---

## 2. 기본 정보 (기본 정보)

### 2.1 응용 프로그램 이름

- **응용 프로그램 이름 입력** 칸에 예: `HOLA Photo API` 또는 `api.holaphoto.com` 입력  
  (나중에 목록에서 구분하기 쉬운 이름이면 됩니다.)

### 2.2 세션 기간

- **세션 기간** 드롭다운에서 **24 hours** (24시간) 선택  
  (원하면 12 hours, 1 week 등으로 변경 가능)

### 2.3 보호할 주소 추가 (필수)

- **+ 공개 호스트 이름 추가** (Add Public Hostname) 버튼 클릭
- 나오는 입력란에 **api.holaphoto.com** 입력  
  (프로토콜 `https://` 는 넣지 않고, **호스트 이름만** 입력)
- 서브도메인만 넣으면 됩니다. 저장/추가 후 목록에 `api.holaphoto.com` 이 보이면 됩니다.

---

## 3. Access 정책 (Access 정책)

“이 주소에 누가 접속할 수 있는지”를 정책으로 지정합니다.

### 3.1 관리자만 허용하는 경우 (가장 단순)

- **+ 기존 정책 선택** (Select existing policy) 클릭
- 이미 쓰는 **Admin Only** (또는 holaphoto.com/admin 에 쓴 것과 같은 정책) 선택
- 그러면 **api.holaphoto.com** 에 접속하는 모든 요청에 “로그인 → 허용된 이메일만 통과”가 적용됩니다.

### 3.2 공개 API는 막지 않게 하려면 (Application paths) — 권장

**이 프로젝트는 관리자 전용 API를 `/api/admin/*` 아래로 두고, 관리자 화면(HTML)도 api.holaphoto.com의 `/admin`, `/admin/*` 에서 서빙합니다.** Access에서는 공개 호스트 이름에 **경로 `/api/admin/*` 와 `/admin`, `/admin/*`** 를 등록하면 됩니다. 그러면 **api.holaphoto.com/admin** 접속 시 구글 로그인 한 번으로 화면과 API 데이터를 모두 사용할 수 있습니다. 공개용 `/api/posts`, `/api/images/*` 등은 Access를 타지 않아 일반 방문자도 정상 호출됩니다.

[Application paths](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/) 문서대로, 응용 프로그램에서 **특정 경로만** 보호할 수 있습니다. **공개 호스트 이름**에 경로를 넣으면 “그 경로만 이 앱으로 보호”되고, 나머지 경로는 Access를 타지 않아 일반 유저도 호출할 수 있습니다.

- **경로만 등록하는 경우**: 예) `/api/admin/*`, `/admin`, `/admin/*` (및 필요 시 `/api/upload`) 등록 → 공개용 GET `/api/posts`, GET `/api/images/*` 등은 Access를 거치지 않음 → 메인 사이트 정상. `/admin`을 넣으면 관리자 UI도 같은 Access 로그인으로 이용 가능.
- **한계**: `/api/posts` 를 넣으면 GET까지 막혀서 공개 후기 목록이 깨짐. 안 넣으면 POST/PUT/DELETE `/api/posts` 요청에 Access 헤더가 안 붙어 Worker가 401을 반환함. 정책에는 **URI Path / Request Method** 선택기가 없어 ([Policies Selectors](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/#selectors)) “같은 경로는 GET만 Bypass”를 정책만으로는 만들기 어렵습니다.
- **정리**: “관리자 전용 경로만” 보호하려면 `/api/admin/*`, `/api/upload` 만 경로로 등록하는 방식이 공식 문서와 맞습니다. `/api/posts` 쓰기(POST/PUT/DELETE)까지 Access로 보호하려면 **전체 호스트(api.holaphoto.com) 한 개 등록 + 관리자 로그인**이 필요하고, 공개 경로는 같은 문서상으로는 Bypass 정책에 “경로” 조건을 줄 수 있는 선택기가 없어, **API 키로 관리자 API만 보호**하는 방식이 대안입니다.

### 3.3 공개 경로 Bypass (선택, UI 제한 있음)

- 정책 선택기에 **URI Path** / **Request Method** 가 있다면:  
  **1번** Bypass(공개 경로), **2번** Admin Only 순서로 두면 됩니다.  
  (상세는 `docs/CUSTOM_DOMAIN.md` §7.3 참고.)
- 선택기에 경로/메서드가 없다면: 여기서는 **Admin Only 한 개만** 추가하고,  
  “공개 경로 Bypass”는 나중에 UI에서 지원되는 방식이 있으면 추가하는 식으로 하면 됩니다.

---

## 4. 로그인 방법 (로그인 방법)

- **사용 가능한 모든 ID 공급자 수락** 이 켜져 있으면 Google 등 기존에 쓰는 방식 그대로 사용 가능합니다.
- 관리자만 쓸 거면 **Google** 만 선택해 두어도 됩니다.
- **인스턴트 인증** 등은 필요 시에만 켜면 됩니다.

---

## 5. 저장 후 할 일

1. 화면 하단 **Save** (저장) 또는 **응용 프로그램 저장** 으로 저장
2. **Worker 환경 변수** 확인:  
   Workers & Pages → **holaphotograph-api** → Settings → Variables  
   - **ALLOWED_EMAILS** = 관리자 이메일(쉼표 구분) 이 있어야 Worker가 “관리자”로 인정합니다.
3. **관리자 사용**: **https://api.holaphoto.com/admin** 으로 접속해 Access(구글) 로그인 한 번 하면, 고객 후기·강의 신청 목록 등 데이터가 그대로 불러와집니다. holaphoto.com/admin 으로 들어가도 자동으로 api.holaphoto.com/admin 으로 넘어가므로, 같은 한 번 로그인으로 사용하면 됩니다.
4. (선택) 루트 **https://api.holaphoto.com/** 에서 로그인해 두어도, 같은 브라우저에서 /admin 사용 시 쿠키가 붙습니다. (관리자는 **api.holaphoto.com/admin** 접속을 권장.)

---

## 요약 체크리스트

| 단계 | 내용 |
|------|------|
| 1 | Zero Trust → Access → Applications → Add application → Self-hosted |
| 2 | 기본 정보: 이름 입력, 세션 24h, **+ 공개 호스트 이름 추가** → `api.holaphoto.com` |
| 3 | Access 정책: **기존 정책 선택** → Admin Only (또는 관리자용 정책) |
| 4 | 로그인 방법: Google 등 원하는 것 선택 |
| 5 | 저장 → Worker에 ALLOWED_EMAILS 설정 확인 → 브라우저에서 api.holaphoto.com 한 번 로그인 |

이렇게 등록하면 “api.holaphoto.com 은 Access 등록을 못했어” 때문에 생기던 401·목록 4개만 보이는 문제가 해결됩니다.

---

## 6. CORS 에러가 날 때 (preflight OPTIONS)

관리자 화면에서 API 호출 시 **CORS error**가 나고, Network 탭에서 **실제 요청은 200**인데도 에러가 난다면 **OPTIONS(preflight) 요청이 Access에서 막힌 것**일 가능성이 큽니다.  
브라우저는 credentials/커스텀 헤더가 있으면 먼저 **OPTIONS**를 보내는데, **OPTIONS에는 쿠키가 붙지 않기 때문에** Access가 인증 실패로 403을 돌리고, 그 응답에는 CORS 헤더가 없어 브라우저가 CORS 에러로 처리합니다.

**해결: Access 앱에서 OPTIONS를 origin(Worker)으로 보내기**

1. **Zero Trust** → **Access** → **Applications** → **api.holaphoto.com** 앱 선택
2. **고급 설정** (Advanced settings) 또는 **설정** 탭으로 이동
3. **Cross-Origin Resource Sharing (CORS) settings** / **CORS 설정** 찾기
4. **Bypass options requests to origin** (OPTIONS 요청을 origin으로 보내기) 를 **켜기**  
   → OPTIONS 요청이 Access 인증 없이 Worker까지 가고, Worker가 204 + CORS 헤더를 반환해 preflight가 성공합니다.
5. 저장

(대안: 같은 CORS 설정 화면에서 "Configure response to preflight requests"로 Cloudflare가 OPTIONS에 직접 CORS 헤더를 붙여 응답하도록 할 수 있습니다. 이 경우 Allow-Origin, Allow-Methods, Allow-Headers, Allow-Credentials를 Worker와 맞춰 설정해야 합니다.)

참고: [Cloudflare – Allow preflighted requests](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/cors/#allow-preflighted-requests)

**여전히 CORS 에러가 나면 확인할 것**

- **호스트 일치**: Access 앱의 **응용 프로그램 URL**이 실제로 호출하는 API 호스트와 같아야 합니다. 프론트가 `https://api.holaphoto.com` 으로 요청하면 Access 앱도 `api.holaphoto.com` (경로 `/api/admin/*` 등)으로 등록되어 있어야 합니다. `api.holaphotograph.com` 과 `api.holaphoto.com` 은 서로 다른 호스트이므로, 옵션을 켠 앱이 요청이 가는 쪽이어야 합니다.
- **Set-Cookie / 쿠키 경고 아이콘**: Network 탭에서 응답 헤더의 `Set-Cookie`(CF_Session) 옆에 경고가 뜨면, 교차 사이트(third-party) 쿠키 제한 때문일 수 있습니다. **api.holaphoto.com** 을 탭에서 먼저 열어 Access 로그인을 끝낸 뒤 **holaphoto.com/admin** 을 사용하고, Chrome 설정에서 "제3자 쿠키" 예외에 api.holaphoto.com을 넣어 보세요.
- **Network 탭**: 브라우저 개발자도구 → Network에서 실패한 요청 옆의 **OPTIONS** 요청을 확인하세요. OPTIONS가 **204**이고 응답 헤더에 `Access-Control-Allow-Origin`, `Access-Control-Allow-Credentials: true` 가 있으면 Worker까지 도달한 것입니다. OPTIONS가 **403**이면 아직 Access에서 막힌 것이므로, 해당 URL의 호스트와 동일한 Access 앱에서 "옵션 요청을 원본으로 바이패스"가 켜져 있는지 확인하세요.
