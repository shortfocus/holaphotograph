# api.holaphoto.com Access 등록 가이드

관리자 페이지(holaphoto.com/admin)에서 API가 401이 나오거나 후기 5개인데 4개만 보이는 이유는 **api.holaphoto.com**을 Access에 등록하지 않아서입니다. 아래 순서대로 등록하면 됩니다.

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

**이 프로젝트는 관리자 전용 API를 모두 `/api/admin/*` 아래로 두었습니다.** Access에서는 공개 호스트 이름에 **경로 `/api/admin/*` 만** 등록하면 됩니다. 공개용 `/api/posts`, `/api/images/*` 등은 Access를 타지 않아 일반 방문자도 정상 호출됩니다.

[Application paths](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/) 문서대로, 응용 프로그램에서 **특정 경로만** 보호할 수 있습니다. **공개 호스트 이름**에 경로를 넣으면 “그 경로만 이 앱으로 보호”되고, 나머지 경로는 Access를 타지 않아 일반 유저도 호출할 수 있습니다.

- **경로만 등록하는 경우**: 예) `/api/admin/*`, `/api/upload` 만 등록 → 공개용 GET `/api/posts`, GET `/api/images/*` 등은 Access를 거치지 않음 → 메인 사이트 정상.
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
3. 브라우저에서 **https://api.holaphoto.com/** 한 번 열어서 Access 로그인  
   → 같은 브라우저에서 **holaphoto.com/admin** 사용 시 API 요청에 쿠키가 붙어 401이 사라지고, 후기 5개 전부 + 승인 되돌리기 버튼이 보입니다.

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
