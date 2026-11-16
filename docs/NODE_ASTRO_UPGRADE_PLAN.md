# Node.js 취약점 대응 · Astro 버전 업그레이드 계획

**작성일:** 2026-11-15  
**최종 수정:** 2026-11-16  
**상태:** Node **22.23.5 적용·로컬 빌드 통과** (커밋/푸시 전). Astro는 보류  
**목적:** 런타임 보안 패치와 Astro major 업그레이드를 안전하게 진행하기 위한 작업 순서·범위·검증 정리

**현재 결정**

| 항목 | 결정 | 이유 |
|------|------|------|
| Node 20 → 22+ | **진행 예정** | EOL. CI·로컬 빌드 보안 위생 |
| Astro 5 → 7 | **당장 안 함** | 정적 사이트 + Worker 이미지 경로라 프로덕션 긴급도 낮음. Node 이후 별도 |

---

## 0. 현재 상태 (기준 스냅샷)

| 항목 | 현재 | 비고 |
|------|------|------|
| 로컬 Node | `v20.11.0` | Node 20은 EOL. 2026-11 보안 패치 대상 아님 |
| CI Node | `20` (`actions/setup-node`) | `.github/workflows/deploy.yml`, `deploy-design.yml` |
| `engines` | 미지정 | `package.json`에 Node 범위 없음 |
| 패키지 매니저 | Yarn classic (`1.22.22`) | 프론트 `yarn.lock` |
| Astro (선언) | `^5.17.1` | `package.json` |
| Astro (잠금) | `5.18.1` | `yarn.lock` resolved |
| 관련 패키지 | `@astrojs/sitemap ^3.7.0`, `@astrojs/check ^0.9.11`, `@tailwindcss/vite ^4.1.18` | |
| 빌드 모드 | `output: 'static'` | Cloudflare Pages 배포 |
| Worker | 별도 `worker/` (Wrangler) | 프론트 Astro와 Node major를 공유하진 않음. CI에서 Worker 설치·배포 시에도 Node를 씀 |

**이 문서의 목표 버전 (권장)**

| 항목 | 목표 | 근거 |
|------|------|------|
| Node.js | **22.23.5 이상** (22 LTS 패치선) 또는 **24.22.3 이상** | 2026-11-11 보안 릴리스. Astro 6+ 최소 요구와 맞춤 |
| Astro | **최신 7.x** (작성 시점 `7.4.12`) | 공식 최신 major. 중간 경유: 5 → 6 → 7 |

> Astro 7.4부터 공식 최소 Node는 **22.22.0**. Node만 올리고 Astro를 5.x에 두는 것도 가능하지만, 이번 작업은 둘 다 진행하는 전제다.

---

## 1. Node.js 취약점 버전 업데이트

### 1.1 왜 하는가

2026-11-11 Node.js 보안 릴리스가 **22.x / 24.x / 26.x**에만 배포되었다.  
**Node 20은 EOL**이라 동일 계열 패치가 나오지 않는다. CI·로컬이 20이면 고위험 HTTP/2·TLS 계열 CVE에 대한 공식 픽스가 없다.

참고:

- [November 2026 Security Releases](https://nodejs.org/en/blog/vulnerability/november-2026-security-releases)
- 패치 예: 22 → **22.23.5**, 24 → **24.22.3**, 26 → **26.13.1**

이 프로젝트에서 Node가 쓰이는 곳:

1. **로컬 개발** (`astro dev` / `astro build`)
2. **GitHub Actions** (프론트 yarn install·build, admin UI 업로드, Worker `npm ci` / wrangler)
3. (해당 시) 개발자 머신·문서에 적힌 Node 가정

Cloudflare Pages/Worker 런타임 자체는 이 Node 버전과 별개지만, **빌드·CI·로컬**은 반드시 올려야 한다.

### 1.2 권장 타깃

| 선택 | 버전 | 추천 |
|------|------|------|
| **A (권장)** | Node **22.23.5+** (22 LTS) | Astro 6/7 최소 요구(22.12 / 22.22)와 맞고, 보안 패치선 |
| B | Node **24.22.3+** | 최신 LTS 쪽으로 한 번에. 도구 호환만 확인하면 OK |

문서·CI에는 **major만** (`22` / `24`) 적어도 Actions가 최신 패치를 받지만, 재현성을 위해 `.nvmrc`에는 **패치까지** 적는 것을 권장한다.

예:

```text
22.23.5
```

### 1.3 Node 올리기 전 — 사전 준비 체크리스트

업그레이드 커밋/PR을 만들기 **전에** 아래를 끝낸다. Astro는 건드리지 않는다.

#### A. 범위·결정 고정

- [ ] **타깃 major 확정:** 이번엔 **22 LTS** (권장) / 아니면 24
- [ ] **최소 패치 확인:** 22면 **≥ 22.23.5**, 24면 **≥ 24.22.3** ([보안 릴리스](https://nodejs.org/en/blog/vulnerability/november-2026-security-releases))
- [ ] **Astro는 이번 PR에 넣지 않음** (별도 이슈/브랜치)
- [ ] 브랜치명 예: `chore/node-22-security`
- [ ] 작업 직전 `main` pull / 워킹트리 클린 확인

#### B. 로컬 환경 준비

| 확인 | 이 머신 기준 (2026-11-16) | 할 일 |
|------|---------------------------|--------|
| Node 버전 매니저 | **nvm** 사용 중 (`~/.nvm/.../v20.11.0`) | `nvm install 22.23.5` 후 `nvm use` / `nvm alias default` 검토 |
| 현재 `node -v` | `v20.11.0` | 올리기 전·후 각각 기록 |
| `.nvmrc` | **없음** | 생성 예정 (`22.23.5`) |
| Yarn | classic `1.22.22` | Node 22에서도 yarn classic 유지 (이번엔 yarn major 변경 없음) |
| 디스크/네트워크 | — | `nvm install`·`yarn install` 가능 여부 |

로컬에서 미리 돌려볼 명령 (아직 레포 파일은 안 고쳐도 됨):

```bash
node -v
nvm install 22.23.5
nvm use 22.23.5
node -v   # v22.23.5 이상이어야 함
yarn -v
```

#### C. 베이스라인(올리기 전 그린 확인)

Node를 올리기 **전에** 현재 20으로도 빌드가 통과하는지 확인하면, 이후 실패가 “Node 때문인지 / 원래 깨져 있었는지” 구분된다.

- [ ] `yarn install --frozen-lockfile` (또는 평소 쓰던 install)
- [ ] `yarn build` 성공 → `dist/` 생성
- [ ] (선택) `yarn preview`로 홈 한 번 열기
- [ ] (선택) `cd worker && npm ci` — wrangler/타입 설치만 확인 (배포는 아직 X)

실패가 있으면 **먼저 고친 뒤** Node를 올린다.

#### D. 영향 받는 코드·설정 목록 (변경 예정)

실행 시 손댈 파일 — **사전에는 “어디를 고칠지”만 파악**:

| 파일 | 현재 | 변경 |
|------|------|------|
| `.github/workflows/deploy.yml` | `node-version: '20'` | `'22'` 또는 `'22.23.5'` |
| `.github/workflows/deploy-design.yml` | `node-version: '20'` | 동일 |
| `.nvmrc` | 없음 | `22.23.5` 신규 |
| `package.json` | `engines` 없음 | `"engines": { "node": ">=22.23.5" }` 추가 검토 |
| `docs/SETUP.md` / `DEPLOY.md` | Node 버전 명시 거의 없음 | 필요 시 한 줄 추가 |
| `yarn.lock` / `package.json` deps | Astro 5.x 유지 | **이번 PR에서 Astro 버전 올리지 않음** |

CI job이 Node에 의존하는 단계 (로그 볼 때):

1. `yarn install --frozen-lockfile`
2. `yarn build`
3. `yarn upload-admin-ui` (`node scripts/upload-admin-ui.mjs`)
4. `worker`에서 `npm ci` + `npx wrangler deploy` / Pages deploy

#### E. 호환·리스크 사전 점검 (이 레포)

| 항목 | 상태 | 확인 포인트 |
|------|------|-------------|
| Astro 5.18.x | Node 22에서 빌드 가능해야 함 | 공식 Astro 5는 Node 18+ 계열. **22는 보통 OK**. 로컬 `yarn build`로 확정 |
| `sharp` (`devDependencies`) | native 바이너리 | Node major 바꾸면 재다운로드. 빌드 중 sharp 관련 에러 시 `yarn install` 재실행 / `node_modules` 삭제 후 재설치 |
| `@types/node` | `^25.3.0` | 타입만 — Node 22 런타임과 무관. 이번엔 건드리지 않아도 됨 |
| `esbuild` override `0.27.3` | 있음 | Node 22에서 install/build만 통과하면 유지 |
| Worker (`wrangler`) | CI에서 Node로 CLI 실행 | Cloudflare 런타임 ≠ Actions Node. **CLI가 Node 22에서 뜨는지**만 보면 됨 |
| Cloudflare Pages | wrangler로 `dist` 업로드 | 대시보드 “Pages 빌드 Node”는 이 파이프라인에선 보통 비해당. **Actions Node가 기준** |
| 프로덕션 사이트 런타임 | Worker + 정적 HTML | Node 올려도 **라이브 요청 경로 변경 없음**. 깨지면 빌드 산출물/`dist` 문제 |

#### F. 올리기 직전 확인 질문 (짧게)

1. **지금 `main` 배포가 건강한가?** (최근 Actions 그린 / 사이트 정상)  
2. **로컬을 nvm으로 22.23.5에 맞출 준비가 됐는가?**  
3. **실패 시 롤백:** workflow `node-version`을 `20`으로 되돌리면 CI는 원복 가능. 로컬은 `nvm use 20`  
4. **배포 타이밍:** main push = 자동 deploy. 가능하면 **업무 한가한 시간** 또는 PR 머지 전 Actions만 먼저 확인  
5. **동료/다른 머신:** `.nvmrc` 추가 시 다른 개발자도 Node 22 필요 — 공유할지 한 줄 메모

#### G. 사전 준비 완료 기준 (이 섹션 통과 조건)

아래가 모두 Yes일 때만 실제 파일 수정·커밋으로 넘어간다.

- [ ] 타깃 = Node **22.23.5+**, Astro 변경 없음
- [ ] nvm으로 로컬 22 설치·전환 가능
- [ ] Node 20 기준 `yarn build` 베이스라인 성공
- [ ] 수정 파일 목록(workflows, `.nvmrc`, engines) 파악 완료
- [ ] 롤백 방법(`node-version: '20'`, `nvm use 20`) 인지
- [ ] (권장) PR 브랜치로 올려 Actions 확인 후 main 머지

---

### 1.4 변경 예정 파일·위치

| 위치 | 할 일 |
|------|--------|
| `.nvmrc` (신규 권장) | `22.23.5` (또는 선택한 패치) |
| `package.json` | `"engines": { "node": ">=22.23.5" }` 추가 검토 |
| `.github/workflows/deploy.yml` | `node-version: '20'` → `'22'` (또는 `'22.23.5'`) |
| `.github/workflows/deploy-design.yml` | 동일 |
| 로컬 | `nvm install` / `nvm use`로 동일 major·패치로 맞춤 |
| `docs/SETUP.md`, `docs/DEPLOY.md` | Node 버전 안내가 없으면 짧게 추가 |

### 1.5 작업 순서 (Node만 — 사전 준비 통과 후)

1. **§1.3 사전 준비 체크리스트 완료**
2. 브랜치 생성 (`chore/node-22-security`)
3. 로컬을 목표 Node로 올린 뒤 `node -v` 확인  
4. (권장) `rm -rf node_modules && yarn install` → `yarn build`  
5. `.nvmrc` / `engines` / workflow `node-version` 수정  
6. 커밋 → push → **PR에서 Actions 그린 확인**  
7. main 머지 후 배포·사이트 스모크 (홈 로드, 후기 목록)
8. (선택) Worker job 로그에 wrangler 에러 없는지 확인  

### 1.6 리스크·주의

- **Node 20 → 22**는 이 레포에서 대체로 무난할 가능성이 크다 (정적 Astro + Tailwind Vite + Worker 분리).
- native 모듈(`sharp` 등)은 Node major 변경 시 재빌드가 필요할 수 있다 → `yarn install` 후 이미지 관련 빌드가 깨지면 `node_modules` 삭제 후 재설치.
- Worker는 Cloudflare 런타임이지만, **CI 설치·wrangler CLI**는 Actions Node를 쓴다. Node만 올려도 Worker 배포 job이 깨질 수 있으니 Actions 로그를 본다.
- **Astro 5를 같이 올리지 말 것.** 문제 원인을 Node로 한정한다.
- main 직푸시보다 **PR + Actions 확인**을 권장 (자동 deploy 파이프라인).

### 1.7 완료 기준 (Node)

- [ ] 로컬·CI Node ≥ 보안 패치 버전 (22.23.5+ 또는 24.22.3+)
- [ ] `yarn build` 성공
- [ ] deploy workflow 성공 (또는 PR 체크 통과)
- [ ] SETUP/DEPLOY 또는 이 문서에 사용 Node 버전 기록
- [ ] 프로덕션 홈 스모크 OK

### 1.8 올리기 후 확인 포인트 (스모크)

| 확인 | 방법 |
|------|------|
| Node 버전 | 로컬 `node -v`, Actions “Setup Node.js” 로그 |
| 프론트 빌드 | `yarn build` / CI “Build frontend” |
| 정적 산출물 | `dist/` 존재, Pages deploy 성공 |
| 사이트 | 홈·`/reviews` 로드 |
| Worker | CI “Deploy Worker” 성공 (런타임이 아니라 CLI/배포 성공) |
| 회귀 아님 | Astro/lockfile major가 의도치 않게 바뀌지 않았는지 `git diff` |

---

## 2. Astro 버전 업그레이드

### 2.1 왜 하는가

- 현재 **Astro 5.18.1**. 공식 최신은 **7.x** (작성 시점 7.4.12).
- 보안·버그픽스·빌드 성능·공식 문서/지원은 최신 major 기준.
- Astro 6부터 **Node ≥ 22.12.0**, Astro 7.4부터 **Node ≥ 22.22.0** → **1번(Node)을 먼저 또는 함께** 해야 한다.

공식 참고:

- [Upgrade Astro](https://docs.astro.build/en/upgrade-astro/)
- [Upgrade to v6](https://docs.astro.build/en/guides/upgrade-to/v6/)
- [Upgrade to v7](https://docs.astro.build/en/guides/upgrade-to/v7/)

### 2.2 업그레이드 경로

```text
Astro 5.18.x  →  Astro 6.x  →  Astro 7.x (최신)
     ↑                ↑              ↑
  현재            Node 22.12+    Node 22.22+ (7.4+)
```

**권장 실행 방식**

```bash
# Node 22.23.5+ 확인 후
yarn dlx @astrojs/upgrade
```

한 번에 5→7이 되면 편하고, 실패 시 **5→6 커밋 후 6→7**로 쪼갠다.

함께 올라갈 가능성이 큰 패키지:

- `astro`
- `@astrojs/sitemap`
- `@astrojs/check`
- (내부) Vite major: v6에서 Vite 7, v7에서 **Vite 8**

### 2.3 이 프로젝트에서 특히 볼 포인트

| 영역 | 현재 | 업그레이드 시 |
|------|------|----------------|
| `astro.config.mjs` | `static`, sitemap filter, `@tailwindcss/vite`, favicon 미들웨어 | Vite 7/8 + Tailwind 플러그인 호환 확인. `@ts-ignore` 주석 재검토 |
| Content / MD | 커스텀 remark 파이프라인 거의 없음으로 보임 | Astro 7 기본 Markdown이 **Sätteri**. remark 플러그인 쓰면 `@astrojs/markdown-remark` + `unified()` 유지 옵션 |
| `src/fetch.ts` | 없음 | Astro 7에서 예약 파일명. 새로 만들지 말 것 |
| View Transitions / `@astrojs/db` | 미사용으로 보임 | v7 제거·deprecated 영향 낮음 |
| HTML 마크업 | 다수 `.astro` 페이지 | v7 **Rust compiler**: 미닫힘 태그·잘못된 중첩이 빌드 에러/레이아웃 변화로 드러날 수 있음 |
| `compressHTML` | 기본값 의존 | v7 기본이 `'jsx'` → 인라인 요소 사이 공백이 사라질 수 있음. 문제 시 `compressHTML: true`로 이전 동작 유지 가능 |
| 배포 | Wrangler Pages `dist` | `yarn build` 산출물 경로·사이트맵 URL 회귀 확인 |

### 2.4 작업 순서 (Astro)

1. **Node 22.23.5+ 적용·빌드 그린** (1장 완료 또는 동일 PR 선행 커밋)
2. 브랜치 생성 (예: `chore/astro-7-upgrade`)
3. `yarn dlx @astrojs/upgrade` (또는 단계적 `astro@6` → `astro@7`)
4. `yarn install` / lockfile 갱신
5. `yarn build` — 컴파일 에러(미닫힘 태그 등) 수정
6. `astro check` (또는 기존 타입체크) 실행
7. 로컬 `yarn preview`로 스모크:
   - 홈 / 후기(`/reviews` 더보기) / 공지·갤러리·강의 섹션
   - 관리자 진입·팝업·히어로 YouTube facade
   - `/sitemap-index.xml` (또는 사이트맵 URL) 존재
8. CI 통과 후 배포, 프로덕션 동일 스모크
9. 문제 시 `compressHTML`·Vite 플러그인·sitemap 옵션만 최소 수정

### 2.5 예상 깨짐 유형 (우선순위)

1. **빌드 실패** — Rust compiler의 엄격한 HTML  
2. **스타일/간격** — `compressHTML: 'jsx'` 공백  
3. **Vite 플러그인** — `@tailwindcss/vite` 또는 커스텀 favicon 미들웨어  
4. **사이트맵·정적 경로** — 필터/excluded paths 동작 변화 (가능성 낮음)

### 2.6 완료 기준 (Astro)

- [ ] `package.json` / `yarn.lock`이 Astro 7.x (+ 공식 integrations 호환 버전)
- [ ] `yarn build` 성공, CI 그린
- [ ] 주요 페이지 시각·기능 스모크 OK
- [ ] 사이트맵·정적 배포(`dist`) 정상

---

## 3. 권장 전체 순서 (한눈에)

```text
[P0] Node 20 → 22.23.5+ (로컬 + CI + engines/.nvmrc)
        ↓
[P0] yarn build / Actions 그린 확인
        ↓
[P1] Astro 5 → 7 (@astrojs/upgrade, 필요 시 6 경유)
        ↓
[P1] 빌드·스모크·배포 확인
        ↓
[문서] SETUP/DEPLOY Node·Astro 버전 갱신
```

**한 PR vs 두 PR**

| 방식 | 장점 | 단점 |
|------|------|------|
| **분리 (권장)** | Node 이슈와 Astro 이슈 분리, 롤백 쉬움 | PR 2개 |
| 한 PR | 한 번에 끝 | 실패 시 원인 분리 어려움 |

권장:  
1) `chore/node-22-security` → 2) `chore/astro-7-upgrade`

---

## 4. 이번 범위에서 하지 않는 것

- Dependabot/자동 머지 설정 변경
- Worker(Wrangler) major 업그레이드 (별도 이슈로 둔다)
- `xlsx` 등 Astro와 무관한 의존성 일괄 업데이트
- Cloudflare Pages 프로젝트 Node 설정이 대시보드에 있다면, **빌드 이미지 Node**는 CI에서 wrangler로 `dist`를 올리는 구조라 보통 Actions Node가 기준. 대시보드 빌드를 쓰는 경우에만 별도 확인

---

## 5. 실행 체크리스트 (복붙용)

### Node — 사전 (§1.3)

- [ ] 타깃 22.23.5+ 확정, Astro 제외
- [ ] nvm으로 22 설치·전환 가능
- [ ] Node 20에서 `yarn build` 베이스라인 OK
- [ ] 수정 파일·롤백 방법 인지

### Node — 실행

- [ ] 브랜치 `chore/node-22-security` (또는 동등)
- [ ] 로컬 `node -v` ≥ 22.23.5
- [ ] `yarn install && yarn build`
- [ ] `.nvmrc` = `22.23.5` (또는 선택 패치)
- [ ] `package.json` `engines.node` 반영
- [ ] `deploy.yml` / `deploy-design.yml` `node-version` 갱신
- [ ] PR → CI 통과 → main 머지
- [ ] 배포 후 홈·후기 스모크

### Astro (보류 — Node 완료 후)

- [ ] Node 선행 완료
- [ ] `yarn dlx @astrojs/upgrade`
- [ ] 빌드 에러·HTML 닫힘 태그 수정
- [ ] (필요) `compressHTML` / Vite·Tailwind 조정
- [ ] 홈·후기·관리·사이트맵 스모크
- [ ] 배포 후 프로덕션 확인

---

## 6. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-11-15 | 초안 작성 (현황 조사 + 미실행 계획) |
| 2026-11-16 | Node 우선·Astro 보류 결정. §1.3 사전 준비 체크리스트·§1.8 사후 스모크 추가 |
| 2026-11-16 | Node 22.23.5 적용: `.nvmrc`, `engines`, CI `node-version`. 로컬 `yarn build` OK |
|
