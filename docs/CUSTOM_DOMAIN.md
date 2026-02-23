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

---

## 2. Pages에 커스텀 도메인 연결 (프론트엔드)

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

## 5. Worker에 커스텀 도메인 연결 (API, 선택)

API를 `api.holaphoto.com` 같은 주소로 쓰려면:

1. **Workers & Pages** → **holaphotograph-api** (Worker) 선택
2. **Settings** → **Domains & Routes** (또는 **Triggers** → **Custom Domains**)
3. **Add** → **Custom domain** 입력 (예: `api.holaphoto.com`)
4. 저장하면 Cloudflare가 해당 도메인을 이 Worker로 라우팅하고, DNS 레코드도 자동 추가됩니다.

연결 후 API 주소는 `https://api.holaphoto.com` 이 됩니다.

---

## 6. 연결 후 설정 정리

### 6.1 Pages 환경 변수 (API 주소)

Worker에 커스텀 도메인을 붙였다면, Pages에서 그 주소를 쓰도록 바꿉니다.

1. **Workers & Pages** → **holaphotograph** (Pages) → **Settings** → **Environment variables**
2. **Production** (및 필요 시 Preview)에서:
   - `PUBLIC_API_URL` = `https://api.holaphoto.com` (Worker 커스텀 도메인 사용 시)
   - `PUBLIC_ADMIN_API_URL` = 동일하거나, 관리자 전용 Worker를 쓴다면 그 URL
3. **Save** 후 필요하면 **Redeploy** 한 번 실행

### 6.2 Cloudflare Access (관리자 보호)

관리자 페이지·API를 Access로 보호하고 있다면, 커스텀 도메인을 적용해야 합니다.

1. **Zero Trust** (또는 **Access**) → **Applications**
2. **Holaphotograph Admin** (Pages용): **Application domain**을 `https://holaphoto.com` 또는 `https://www.holaphoto.com` 으로 변경
3. **Holaphotograph API** (Worker용, 사용 시): **Application domain**을 `https://api.holaphoto.com` 으로 변경

커스텀 도메인으로 접속해도 Access 로그인·허용이 동작합니다.

### 6.3 CORS (Worker)

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
| 5 | (선택) **Worker** → Custom domain → `api.holaphoto.com` 연결 |
| 6 | Pages 환경 변수, Access 도메인, CORS 등 정리 |

| 대상 | 커스텀 도메인 예시 | 설정 위치 |
|------|-------------------|-----------|
| 프론트 (Pages) | `holaphoto.com`, `www.holaphoto.com` | Pages → Custom domains |
| API (Worker) | `api.holaphoto.com` | Worker → Domains & Routes / Custom Domains |
| Access | 위와 동일한 URL | Zero Trust → Applications |
| 환경 변수 | `PUBLIC_API_URL` 등 | Pages → Environment variables |

도메인이 Cloudflare에 활성화되면, 위 순서대로 Pages/Worker에 연결하고 HTTPS까지 자동 적용됩니다.
