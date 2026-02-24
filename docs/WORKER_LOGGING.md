# Worker 로그 시스템

`holaphotograph-api` Worker에서 사용하는 로깅 방식과 로그 확인 방법입니다.

---

## 1. 구조

- **로거 모듈**: `worker/src/logger.ts`
  - `logger.info(msg, data?)` / `logger.warn` / `logger.error` / `logger.debug`
  - `logger.request(request, response, durationMs)` — 요청/응답 한 줄 로그 (매 요청마다 자동 호출)
- **출력 형식**
  - **json** (기본): JSON 한 줄 — Logpush·파싱용
  - **readable**: 사람이 보기 좋은 한 줄 — `wrangler tail` 보기 좋음
- **readable 켜기**: 환경 변수 `LOG_FORMAT=readable` 설정 시 적용
  - 로컬/프리뷰: `wrangler.toml`의 `[vars]`에 `LOG_FORMAT = "readable"` 추가
  - 프로덕션: 대시보드 Workers → holaphotograph-api → Settings → Variables 에서 추가 (tail 볼 때만 쓰려면 선택)
- **적용 위치**: `index.ts` fetch 진입부에서 모든 요청에 대해 `logger.request()` 호출, 기존 `console.error`는 `logger.error()`로 교체

---

## 2. 로그 보는 방법

### 2.1 실시간 (터미널)

```bash
cd worker
npx wrangler tail
```

배포된 Worker로 들어오는 요청과 `console.log` / `console.error` 출력이 실시간으로 스트리밍됩니다.

- **readable** 포맷이면 예: `[INFO ]  GET /api/reviews  200  12ms  ip=1.2.3.4  user=admin@example.com`
- **json** 포맷이면 `jq`로 필터링 가능: `npx wrangler tail | jq 'select(.logs)'`

### 2.2 대시보드 (Real-time Logs)

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **holaphotograph-api**
2. **Logs** 탭 → **Real-time Logs** (유료 플랜에서 사용 가능)

여기서도 요청·예외·커스텀 로그를 볼 수 있습니다.

### 2.3 영구 저장 (Logpush, 유료)

Workers **유료 플랜** 이상이면 **Workers Logpush**로 로그를 외부로 보낼 수 있습니다.

- **대상**: R2, Datadog, Splunk 등
- **설정**: [Workers Logpush 문서](https://developers.cloudflare.com/workers/observability/logs/logpush/) 참고
- `wrangler.toml`에 `logpush = true` 추가 후 대시보드/API로 Logpush job 생성

---

## 3. 코드에서 로그 남기기

```ts
import { logger } from "./logger";

// 에러 (기존 console.error 대체)
logger.error("naver-rss", { err: err instanceof Error ? err.message : String(err) });

// 경고
logger.warn("rate-limit", { ip: getClientIp(request), key: "reviews" });

// 정보 (디버깅용 등)
logger.info("cache-miss", { key: YOUTUBE_CACHE_KV_KEY });
```

요청/응답 로그는 이미 fetch 래퍼에서 자동으로 남기므로, 별도 호출 없이 `method`, `path`, `status`, `duration_ms`가 한 줄에 포함됩니다.
