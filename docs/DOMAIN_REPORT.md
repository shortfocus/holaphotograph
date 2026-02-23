# 도메인 연동 작업 리포트

**작성일**: 2026년 2월  
**대상**: holaphoto.com 커스텀 도메인 연결 및 서비스 전환

---

## 1. 개요

기존 **workers.dev / pages.dev** 주소 대신, 고객 도메인 **holaphoto.com**으로 서비스를 제공할 수 있도록 도메인 연동 작업을 진행했습니다.

| 구분 | 이전 | 현재 |
|------|------|------|
| 웹사이트(프론트) | \*.pages.dev | **https://holaphoto.com**, **https://www.holaphoto.com** |
| API 서버 | \*.workers.dev | **https://api.holaphoto.com** |

---

## 2. 진행한 작업

### 2.1 도메인·인프라

- **호스팅.kr**에서 구매한 도메인 **holaphoto.com**을 **Cloudflare**에 연결
- 네임서버를 Cloudflare 안내 주소로 변경 후 전파 확인
- Cloudflare에서 도메인 **활성** 상태 확인

### 2.2 웹사이트(프론트엔드)

- **Cloudflare Pages** 프로젝트에 커스텀 도메인 연결  
  - **holaphoto.com** (루트)  
  - **www.holaphoto.com** (서브도메인)
- HTTPS(SSL)는 Cloudflare에서 자동 발급·갱신
- 환경 변수 **PUBLIC_API_URL**, **PUBLIC_ADMIN_API_URL**을 **https://api.holaphoto.com** 으로 변경하여, 프론트에서 새 API 주소로 요청하도록 반영

### 2.3 API 서버

- **Cloudflare Worker**에 커스텀 도메인 **api.holaphoto.com** 연결
- workers.dev 주소는 비활성화하여, API는 **api.holaphoto.com** 으로만 제공
- CORS 설정에 **holaphoto.com** Origin 허용 추가

### 2.4 관리자·보안

- **Cloudflare Access**로 관리자 페이지(**holaphoto.com/admin**) 접근 제한 (기존 설정 유지)
- API 관리자 호출 보호를 위해 **api.holaphoto.com** 도메인을 Access 응용 프로그램으로 추가
- Worker 측에서 관리자 API 호출 시 허용 이메일 목록(**ALLOWED_EMAILS**)으로 검증하도록 구성

---

## 3. 현재 서비스 주소

| 용도 | URL |
|------|-----|
| 메인 사이트 | https://holaphoto.com, https://www.holaphoto.com |
| 관리자 페이지 | https://holaphoto.com/admin (Access 로그인 필요) |
| API | https://api.holaphoto.com |

---

## 4. 고객 측 확인 사항

- **holaphoto.com**, **www.holaphoto.com** 접속 시 기존과 동일한 웹사이트가 정상 노출되는지 확인해 주시면 됩니다.
- 관리자 페이지(**/admin**)는 기존처럼 Access 로그인 후 이용 가능합니다.
- 문의·예약 등 공개 기능이 **api.holaphoto.com** 을 사용하도록 되어 있으며, 도메인 전환 후에도 동일하게 동작합니다.

---

## 5. 참고 문서

- 상세 설정·재작업 시: **docs/CUSTOM_DOMAIN.md** (도메인 연결 절차, Access, 환경 변수 등)
