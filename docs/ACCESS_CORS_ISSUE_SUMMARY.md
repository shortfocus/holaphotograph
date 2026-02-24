# 커스텀 도메인 + Access 적용 시 CORS/401 이슈 정리

**기간**: 2025년 2월  
**상태**: 해결 완료 (관리자 화면·API 정상 동작)

---

## 1. 배경

- **목표**: API를 workers.dev 대신 **api.holaphoto.com** 커스텀 도메인으로 제공하고, 관리자 API는 **Cloudflare Access**로 보호.
- **현상**: 개발(localhost)에서는 정상인데, 커스텀 도메인 연결 후 관리자 페이지(holaphoto.com/admin)에서 API 호출 시 **CORS 에러 / Failed to fetch / 401 Unauthorized** 발생.

---

## 2. 원인 정리

| 현상 | 원인 |
|------|------|
| CORS 에러, Failed to fetch | 요청이 **Access**에서 막히면 응답이 **Worker가 아니라 Cloudflare**에서 나감 → 우리가 넣은 CORS 헤더가 없음 → 브라우저가 CORS 에러로 표시. Worker CORS 수정만으로는 “Access에서 막힌 요청”에는 적용되지 않음. |
| OPTIONS(preflight) 실패 | credentials/커스텀 헤더 사용 시 브라우저가 먼저 OPTIONS 전송. OPTIONS에는 쿠키가 없어 Access가 인증 실패(403) → 그 응답에 CORS 헤더 없음 → CORS 에러. |
| Set-Cookie 경고, 쿠키 미전송 | holaphoto.com → api.holaphoto.com 은 **교차 출처**. CF_Session 쿠키가 제3자 쿠키로 취급되어, Chrome “제3자 쿠키 차단” 시 저장·전송이 막힐 수 있음. |
| 401 Unauthorized (Worker 도달 후) | Access는 통과했지만 Worker의 **ALLOWED_EMAILS**에 로그인 이메일이 없거나, 환경 변수 미설정. |

---

## 3. 우리가 한 작업

### 3.1 Worker (worker/src/index.ts)

- **관리자 전용 경로 통일**: `/api/admin/*` 로 라우팅 정리  
  - `GET /api/admin/posts`, `GET /api/admin/lecture-signups`, `POST /api/admin/upload`, `DELETE /api/admin/images/:path` 등.
- **CORS 보강**  
  - `ALLOWED_ORIGINS`에 holaphoto.com, holaphotograph.com 등 포함.  
  - Origin 없을 때 `Referer`로 fallback.  
  - `Access-Control-Allow-Headers`: `Content-Type, Authorization, Accept, Accept-Language` 추가.  
  - `Access-Control-Allow-Credentials`, `Vary: Origin` 반환.  
  - OPTIONS 요청에 대해 **204 + CORS 헤더 + Access-Control-Max-Age: 86400** 반환.
- **관리자 인증**: `isAllowedAdmin()` — `Cf-Access-Authenticated-User-Email` 헤더와 `ALLOWED_EMAILS` 환경 변수로 검증. 프로덕션에서 ALLOWED_EMAILS 미설정 시 401.

### 3.2 프론트 (src/lib/api.ts)

- 관리자 API 호출을 모두 **ADMIN_API_BASE + `/api/admin/...`** 로 통일 (예: `/api/admin/posts`, `/api/admin/lecture-signups`).
- `credentials: "include"` 유지 (Access 쿠키 전송).

### 3.3 Cloudflare Access (대시보드 설정)

- **api.holaphoto.com** (경로 `/api/admin/*`) Access 앱 등록.
- **고급 설정 → CORS**: **“옵션 요청을 원본으로 바이패스”(Bypass OPTIONS requests to origin)** 활성화 → OPTIONS가 Worker까지 가서 204 + CORS 헤더 반환.

### 3.4 Worker 환경 변수

- **ALLOWED_EMAILS**: Access 로그인에 쓰는 Google 이메일(들)을 쉼표로 설정.  
  - 미설정 시 프로덕션에서 모든 관리자 API 401.

### 3.5 문서

- **docs/ACCESS_API_SETUP.md**  
  - api.holaphoto.com Access 등록 절차.  
  - “왜 개발에서는 되고 커스텀 도메인에서만 문제인지” 설명.  
  - CORS 에러 시 확인 항목(호스트 일치, OPTIONS 204 여부, Set-Cookie/쿠키 경고).  
  - **“api.holaphoto.com을 먼저 열어서 Access 로그인”** 권장.  
  - Access 유지 vs Access 제거 선택지 정리.  
- **docs/ACCESS_CORS_ISSUE_SUMMARY.md** (본 문서): 이번 이슈 작업 정리.

---

## 4. 사용자 측에서 해결한 것 (운영/사용 방법)

- **api.holaphoto.com** 을 브라우저 탭에서 **먼저 열어 Access 로그인** 한 뒤, holaphoto.com/admin 사용 → 쿠키가 설정되어 이후 API 호출 정상.
- Access 앱에서 **“옵션 요청을 원본으로 바이패스”** 켜기 및 저장.
- Worker **Variables**에 **ALLOWED_EMAILS**에 관리자 이메일 설정 후 Save and Deploy.

---

## 5. 요약

- **개발(localhost)** 에서는 Access가 없어 요청이 Worker로 직행하고 CORS만 맞으면 됨.
- **커스텀 도메인 + Access** 구간에서는 “Access 통과 → Worker 도달”이 선행되어야 하고, 그 후에 Worker CORS/인증이 의미 있음.
- OPTIONS 바이패스, 먼저 api.holaphoto.com 로그인, ALLOWED_EMAILS 설정이 모두 맞아야 관리자 화면·API가 정상 동작함.
