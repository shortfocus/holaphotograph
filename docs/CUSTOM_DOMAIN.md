# 커스텀 도메인 연결

현재 서비스는 **Cloudflare Pages**(프론트)와 **Cloudflare Workers**(API)에 배포되어 있습니다.  
도메인을 **호스팅.kr** 등에서 구매했다면, Cloudflare에 연결한 뒤 Pages/Worker에 붙이면 됩니다.

---

## 호스팅.kr에서 구매한 도메인 → Cloudflare 연결 (요약)

1. **Cloudflare에서 사이트 추가** (아래 1단계)
2. **호스팅.kr에서 네임서버를 Cloudflare 주소로 변경** (아래 2단계)
3. **Cloudflare에서 활성화 확인** 후, **Pages/Worker에 커스텀 도메인 연결** (아래 3·4단계)

---

## 1. Cloudflare에 도메인 추가 (사이트의 속도 및 보안 향상)

1. [Cloudflare 대시보드](https://dash.cloudflare.com) → **도메인** (또는 **Websites**) → **사이트 추가** (Add a site)
2. **기존 도메인 입력** 란에 구매한 도메인 입력 (예: `holaphoto.com`) → **계속**
3. **플랜 선택**: **무료** 선택 → **계속**
4. **"사이트의 속도 및 보안 향상"** 화면에서:
   - **DNS 레코드**: **"DNS 레코드 빠른 스캔" (권장)** 그대로 두면 됩니다.  
     Cloudflare가 기존 DNS 레코드를 스캔해서 가져옵니다. (호스팅.kr에 있던 레코드가 있다면 이후 단계에서 확인 가능)
   - **AI 크롤러**:  
     - **"모든 페이지에서 차단"** 또는 **"차단 안 함"** 중 원하는 것 선택  
     - **robots.txt로 AI 봇 지시** 토글은 필요 시에만 사용
5. **계속** 클릭
6. 다음 화면에서 **DNS 레코드 스캔 결과**를 확인하고 **계속**
7. **네임서버 안내** 화면이 나옵니다.  
   여기에 표시되는 **2개의 네임서버 주소**를 복사해 둡니다.  
   예: `xxx.ns.cloudflare.com`, `yyy.ns.cloudflare.com`

---

## 2. 호스팅.kr에서 네임서버 변경

도메인을 **호스팅.kr**에서 구매했다면, 여기서 네임서버만 Cloudflare로 바꿔야 합니다.

1. [호스팅.kr](https://hosting.kr) 로그인
2. **마이페이지** 또는 **도메인 관리**로 이동
3. 연결할 도메인(예: `holaphoto.com`) 선택
4. **네임서버 변경** / **NS 설정** 메뉴 진입
5. 기존 네임서버를 **삭제**하고, Cloudflare에서 복사한 **2개 네임서버**를 입력  
   - 1차: `xxx.ns.cloudflare.com`  
   - 2차: `yyy.ns.cloudflare.com`  
   (실제 값은 Cloudflare 화면에 표시된 그대로 입력)
6. **저장** 또는 **적용**

전파에는 **수분~최대 24~48시간** 걸릴 수 있습니다. 보통 10~30분 내에 활성화되는 경우가 많습니다.

### 전파 여부 확인 (전파 중에도 가능)

- **온라인 도구**
  - [whatsmydns.net](https://www.whatsmydns.net) → 도메인에 `holaphoto.com` 입력, **NS** 선택 → 여러 지역에서 조회되는 **네임서버**가 Cloudflare 주소(예: `*.ns.cloudflare.com`)로 나오면 전파된 것입니다.
  - [dnschecker.org](https://dnschecker.org) → 같은 방식으로 **NS** 레코드 확인.
- **터미널 (로컬)**  
  `dig NS holaphoto.com +short`  
  또는  
  `nslookup -type=NS holaphoto.com`  
  결과에 Cloudflare 네임서버(예: `xxx.ns.cloudflare.com`)가 보이면, 사용 중인 네트워크에서는 전파 완료입니다.

---

## 3. Cloudflare에서 활성화 확인

1. Cloudflare 대시보드로 돌아가서 해당 도메인(예: `holaphoto.com`) 선택
2. **상태가 "활성"** 이 되면 네임서버 전환이 완료된 것입니다.  
   "네임서버를 변경해 주세요" 메시지가 사라질 때까지 기다리면 됩니다.
3. **DNS** 메뉴에서 레코드가 보이면, 이후 단계에서 Pages/Worker에 도메인을 붙일 수 있습니다.

---

## 4. Pages에 커스텀 도메인 연결 (프론트엔드)

1. **Workers & Pages** → **holaphotograph** (Pages 프로젝트) 선택
2. **Custom domains** 탭 → **Set up a custom domain**
3. 연결할 도메인 입력 (본인 도메인으로 변경):
   - **루트 도메인**: `holaphoto.com`  
     → Cloudflare가 자동으로 DNS 레코드 생성
   - **서브도메인**: `www.holaphoto.com`  
     → 필요하면 추가로 연결
4. **Continue** → **Activate domain**  
   (도메인이 이미 Cloudflare에 있으면 DNS는 자동 설정됩니다.)
5. SSL은 Cloudflare가 자동 발급·갱신합니다.

이후 `https://holaphoto.com` (또는 `https://www.holaphoto.com`) 으로 접속하면 Pages 사이트가 열립니다.

---

## 5. Worker에 커스텀 도메인 연결 (API) — workers.dev 대신 쓰기

기본 배포 주소는 `holaphotograph-api.계정이름.workers.dev` 입니다.  
이걸 **사용하지 않고** `api.holaphoto.com` 같은 커스텀 도메인만 쓰려면 아래 순서대로 하면 됩니다.

### 5.1 Worker에 커스텀 도메인 추가

1. [Cloudflare 대시보드](https://dash.cloudflare.com) → **Workers & Pages** → **holaphotograph-api** (Worker) 선택
2. **Settings** 탭 → **Domains & Routes** (또는 **Triggers** → **Custom Domains**) 이동
3. **Add** → **Custom domain** 선택 후 `api.holaphoto.com` 입력
4. **Add domain** / **Save**  
   → Cloudflare가 해당 도메인을 이 Worker로 라우팅하고, DNS 레코드도 자동 추가합니다.

연결이 끝나면 **API 주소는 `https://api.holaphoto.com`** 이 됩니다.  
(workers.dev 주소는 그대로 남아 있지만, 트래픽은 커스텀 도메인으로만 받을 수 있습니다.)

### 5.2 workers.dev 주소를 완전히 끄고 싶을 때 (선택)

- **Workers & Pages** → **holaphotograph-api** → **Settings** → **Domains & Routes**
- **workers.dev** 항목이 있으면 **Remove** 하면 해당 workers.dev URL로는 더 이상 접근되지 않습니다.  
  (커스텀 도메인만 사용할 때 선택 사항입니다.)

---

## 6. 배포 후 API 호출 확인

Worker를 배포(또는 커스텀 도메인 연결)한 뒤 API가 동작하는지 확인하려면:

- **헬스/정보 엔드포인트** (인증 없음):  
  `curl https://api.holaphoto.com/` 또는  
  `curl https://holaphotograph-api.계정이름.workers.dev/`
- **보호된 API** (Access 사용 시): 브라우저에서 `https://holaphoto.com/admin` 로그인 후, 관리자 기능에서 API 호출이 되는지 확인 (또는 동일 쿠키로 `curl`에 쿠키 전달).

CORS는 이미 `holaphoto.com` / `holaphotograph.com` Origin을 허용하므로, 해당 도메인에서 띄운 프론트에서 API 호출이 가능해야 합니다.

---

## 7. 연결 후 설정 정리

### 7.1 Pages 환경 변수 (API 주소)

Worker에 커스텀 도메인을 붙였다면, Pages에서 그 주소를 쓰도록 바꿉니다.

1. **Workers & Pages** → **holaphotograph** (Pages) → **Settings** → **Environment variables**
2. **Production** (및 필요 시 Preview)에서:
   - `PUBLIC_API_URL` = `https://api.holaphoto.com` (Worker 커스텀 도메인 사용 시)
   - `PUBLIC_ADMIN_API_URL` = 동일하거나, 관리자 전용 Worker를 쓴다면 그 URL
3. **Save** 후 필요하면 **Redeploy** 한 번 실행

### 7.2 Cloudflare Access (관리자 보호)

관리자 페이지·API를 Access로 보호하고 있다면, 커스텀 도메인을 적용해야 합니다.

1. **Zero Trust** (또는 **Access**) → **Applications**
2. **Holaphotograph Admin** (Pages용): **Application domain**을 `https://holaphoto.com` 또는 `https://www.holaphoto.com` 으로 변경
3. **Holaphotograph API** (Worker용, 사용 시): **Application domain**을 `https://api.holaphoto.com` 으로 변경

커스텀 도메인으로 접속해도 Access 로그인·허용이 동작합니다.

### 7.3 관리자 API 보호 (필수)

관리자 전용 API(POST/PUT/DELETE, 업로드, 강의 신청 목록 등)는 **함부로 호출되지 않도록** 반드시 막아야 합니다. 이 프로젝트는 다음 두 가지를 함께 사용합니다.

1. **Worker 환경 변수 `ALLOWED_EMAILS`**  
   허용할 관리자 이메일을 쉼표로 구분해 둡니다.  
   - **Cloudflare 대시보드**: Workers & Pages → **holaphotograph-api** → **Settings** → **Variables** → **Add** → `ALLOWED_EMAILS` = `본인이메일@example.com`  
   - 또는 로컬에서: `cd worker && npx wrangler secret put ALLOWED_EMAILS` 후 값 입력 (또는 `wrangler.toml`의 `[vars]`에 추가)

2. **api.holaphoto.com을 Cloudflare Access로 보호**  
   브라우저가 `api.holaphoto.com`을 호출할 때 Access 로그인을 거치게 하면, 통과한 요청에만 `Cf-Access-Authenticated-User-Email` 헤더가 붙습니다. Worker는 이 헤더 값이 `ALLOWED_EMAILS` 목록에 있을 때만 관리자 API를 허용합니다.  
   - **Zero Trust** → **Applications** → **Add an application** → **Self-hosted**  
   - **Application domain**: `api.holaphoto.com` (서브도메인만 입력)  
   - **Policy**: 해당 이메일(들)만 허용하는 정책 연결  
   - (선택) **Bypass** 규칙을 추가해 공개용 경로(예: `GET /api/posts`, `GET /api/naver-rss` 등)는 로그인 없이 통과시키면, 메인 사이트가 비로그인 상태에서도 공개 API를 호출할 수 있습니다.

**주의**: `ALLOWED_EMAILS`를 설정하지 않고 프로덕션(api.holaphoto.com 등)에 배포하면, Worker는 관리자 API를 **모두 401로 차단**합니다. 로컬(localhost)에서는 설정이 없어도 개발 편의를 위해 관리자 호출을 허용합니다.

### 7.4 CORS (Worker)

이 프로젝트 Worker에는 **holaphotograph.com** 과 **holaphoto.com** 이 오는 요청을 허용하는 CORS 설정이 들어가 있습니다.  
다른 도메인을 쓰려면 `worker/src/index.ts` 의 `getCorsHeaders` 에 해당 도메인을 추가하세요.

---

## 요약

| 단계 | 내용 |
|------|------|
| 1 | Cloudflare **사이트 추가** → 도메인 입력, DNS 빠른 스캔(권장), **계속** |
| 2 | **호스팅.kr**에서 해당 도메인 네임서버를 Cloudflare에서 안내한 2개 주소로 변경 |
| 3 | Cloudflare에서 도메인 **활성** 확인 |
| 4 | **Pages** → Custom domains → `holaphoto.com`, `www.holaphoto.com` 연결 |
| 5 | **Worker** → Custom domain → `api.holaphoto.com` (workers.dev 대신 사용) |
| 6 | 배포 후 `https://api.holaphoto.com/` 로 API 호출 확인 |
| 7 | Pages 환경 변수, Access 도메인, CORS 등 정리 |

| 대상 | 커스텀 도메인 예시 | 설정 위치 |
|------|-------------------|-----------|
| 프론트 (Pages) | `holaphoto.com`, `www.holaphoto.com` | Pages → Custom domains |
| API (Worker) | `api.holaphoto.com` | Worker → Domains & Routes / Custom Domains |
| Access | 위와 동일한 URL | Zero Trust → Applications |
| 환경 변수 | `PUBLIC_API_URL` 등 | Pages → Environment variables |

도메인이 Cloudflare에 활성화되면, 위 순서대로 Pages/Worker에 연결하고 HTTPS까지 자동 적용됩니다.
