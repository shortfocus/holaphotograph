# 관리자 한 번 로그인 (admin 단일 로그인)

관리자 화면(/admin) 접속 시 **구글 로그인 한 번**만으로 화면과 API 데이터를 모두 사용할 수 있도록 한 조치를 정리한 문서입니다.

---

## 1. 문제가 뭐였나요?

- **holaphoto.com/admin** 들어가서 → 구글 로그인 하면 → **화면만** 보이고, 고객 후기·강의 신청 목록 같은 **데이터는 안 나오고** CORS / 401 오류가 났습니다.
- 이유:
  - **화면** = holaphoto.com (Pages) → 여기 로그인 = "화면용 쿠키"
  - **데이터** = api.holaphoto.com (Worker API) → "API용 쿠키"가 따로 필요
  - 도메인이 둘로 갈라져 있어서 **로그인이 두 번** 필요한 구조였습니다.

---

## 2. 그래서 뭘 한 건가요? (한 줄 요약)

**"관리자 화면도 api.holaphoto.com에서 띄우자"**  
→ 화면과 API가 **같은 주소(api.holaphoto.com)**가 되니까, **구글 로그인 한 번**이면 화면 + 데이터 둘 다 됩니다.

---

## 3. 구체적으로 뭘 바꿨나요?

### ① 관리자 화면을 API 서버(Worker)에서 같이 서빙

- **예전**: 관리자 화면 HTML → **Pages(holaphoto.com)** / API 요청 → **Worker(api.holaphoto.com)** → 도메인이 둘이라 로그인 두 번.
- **지금**: 관리자 화면 HTML도 **Worker(api.holaphoto.com)**에서 줍니다.  
  - 경로: **api.holaphoto.com/admin**, **api.holaphoto.com/admin/lecture-signups** 등.  
  - HTML/JS/CSS 파일은 **R2 버킷**에 `admin-ui/` 아래로 올려두고, Worker가 그걸 읽어서 응답합니다.
- 그래서 **api.holaphoto.com** 하나만 로그인하면, "화면 받는 요청"이랑 "데이터 받는 요청"이 **같은 도메인**이라 **쿠키 한 번**으로 둘 다 됩니다.

### ② holaphoto.com/admin 들어가면 자동으로 api로 넘기기

- **예전**: 주소창에 **holaphoto.com/admin** 치면 → Pages에서 화면만 주고, API는 api.holaphoto.com이라 로그인 두 번 필요.
- **지금**: **holaphoto.com/admin** (또는 www.holaphoto.com/admin)으로 들어오면, 레이아웃에 넣어 둔 스크립트가 **바로 api.holaphoto.com/admin** 으로 주소를 바꿔 줍니다(리다이렉트).
- 그래서 **holaphoto.com/admin**으로 들어가도 곧바로 **api.holaphoto.com/admin**으로 넘어가서, **실제로 쓰는 건 항상 api.holaphoto.com** 이고, 로그인도 **한 번**만 하면 됩니다.

### ③ 관리자용 파일을 R2에 올리는 방법 추가

- 관리자 화면은 **빌드하면** `dist/admin/`, `dist/_astro/` 안에 HTML·JS·CSS가 생깁니다.
- 이걸 **R2 버킷(camera-review-images)** 안에 **admin-ui/** 라는 이름으로 올려두고, Worker는 "/admin, /admin/..., /_astro/..." 요청이 오면 이 R2 객체를 읽어서 응답하도록 했습니다.
- 그래서:
  - **스크립트**: `scripts/upload-admin-ui.mjs` → `npm run build` 한 뒤 `npm run upload-admin-ui` 하면 dist/admin, dist/_astro 를 R2 `admin-ui/` 로 업로드.
  - **배포 시 자동**: GitHub Actions(deploy.yml)에서 "빌드" 다음에 "admin UI R2 업로드" 단계를 넣어서, main에 푸시하면 **빌드 + R2 업로드**까지 같이 되게 했습니다.

### ④ Access / 문서 정리

- Access 쪽에서는 **api.holaphoto.com** 에 대해 **/api/admin/*** 뿐 아니라 **/admin**, **/admin/*** 도 보호 경로에 넣어 두라고 문서에 적어 두었습니다.  
  → 그래야 **api.holaphoto.com/admin** 들어갈 때 구글 로그인 창이 뜨고, 그 한 번이 화면+API에 공통으로 쓰입니다.
- ACCESS_API_SETUP, CLOUDFLARE_SETUP 같은 문서에 "관리자는 api.holaphoto.com/admin 쓰면 한 번 로그인으로 끝" 이라고 쉽게 설명해 두었습니다.

---

## 4. 사용자 입장에서 어떻게 쓰면 되나요?

1. **주소**: **api.holaphoto.com/admin** 으로 들어가거나, **holaphoto.com/admin** 으로 들어가도 됩니다(자동으로 api.holaphoto.com/admin으로 넘어감).
2. **로그인**: 처음 한 번만 **구글 로그인** 하면 됩니다. 그 다음부터는 고객 후기 관리, 강의 신청 목록 등 **데이터가 그대로** 불러와집니다.
3. **설정할 일**: Zero Trust에서 api.holaphoto.com 앱의 **보호 경로**에 **/admin**, **/admin/*** 를 추가해 두기. 최초 1회 **R2에 관리자 파일 올리기** (`npm run build && npm run upload-admin-ui` 하거나, main 푸시해서 CI가 하게 두기).

---

## 5. 한 문장으로 정리

**"관리자 화면도 api.holaphoto.com에서 주고, holaphoto.com/admin은 그쪽으로 넘겨버리니까, 이제 /admin 들어가서 구글 로그인 한 번만 하면 화면이랑 API 데이터 둘 다 쓸 수 있게 만든 거예요."**

---

## 관련 문서

- [ACCESS_API_SETUP.md](./ACCESS_API_SETUP.md) — api.holaphoto.com Access 등록, 경로(/admin, /api/admin/*) 설정
- [CLOUDFLARE_SETUP.md](./CLOUDFLARE_SETUP.md) — R2 admin-ui 업로드, Access 앱 구성 요약
