# Workers KV 설정 (Rate Limiting + YouTube 캐시)

이 프로젝트에서는 **Cloudflare Workers KV** 하나를 두 가지 용도로 사용합니다.

- **Rate limiting**: 고객 후기 제출·이미지 업로드 시 IP별 요청 횟수 제한
- **YouTube 캐시**: `GET /api/youtube-latest` 응답을 10분간 캐시 (유튜브 API 호출 절감)

---

## 1. KV 사용처

| 바인딩 이름 | 용도 | 비고 |
|-------------|------|------|
| `APP_KV` | Rate limit + YouTube 캐시 | 아래 참고 |

**Rate limit 규칙**

- **POST /api/reviews** (고객 후기 제출): **60초당 3회** / IP
- **POST /api/reviews/upload** (이미지 업로드): **60초당 5회** / IP

초과 시 **429** 응답 + `"요청이 너무 많습니다. 잠시 후 다시 시도해 주세요."` 메시지를 반환합니다.

**캐시**

- 키 `ytcache:latest`: 유튜브 최신 영상 API 응답 (TTL 10분)

---

## 2. 네임스페이스 생성 (최초 1회)

Wrangler **v4**에서는 `kv:namespace`가 아니라 **`kv namespace`**(공백)를 사용합니다.  
반드시 **`worker` 디렉터리**에서 실행하고, **`npx wrangler`**로 호출합니다.

### 2.1 프로덕션용 (배포 환경)

```bash
cd worker
npx wrangler kv namespace create "APP_KV"
```

출력 예:

```
✨ Success!
[[kv_namespaces]]
binding = "APP_KV"
id = "bb94378fd15d4ccb85444f63c41f7fa0"
```

여기서 나온 **`id`** 값을 복사합니다.

### 2.2 프리뷰용 (로컬 개발 / wrangler dev)

```bash
cd worker
npx wrangler kv namespace create "APP_KV" --preview
```

출력 예:

```
✨ Success!
preview_id = "f7f176a5728142329e3e568d2b0a1fde"
```

여기서 나온 **`preview_id`** 값을 복사합니다.

---

## 3. wrangler.toml 설정

`worker/wrangler.toml`에 KV 네임스페이스를 바인딩합니다.

```toml
[[kv_namespaces]]
binding = "APP_KV"
id = "프로덕션_네임스페이스_id"
preview_id = "프리뷰_네임스페이스_id"
```

- **binding**: Worker 코드에서 사용할 이름 (`env.APP_KV`)
- **id**: 위 2.1에서 받은 프로덕션 id
- **preview_id**: 위 2.2에서 받은 프리뷰 id (로컬 `wrangler dev` 시 사용)

`id` / `preview_id`를 비워두거나 잘못 넣으면 KV 바인딩이 없어서, Worker는 **rate limit·YouTube 캐시 없이** 동작합니다. (에러는 나지 않음)

---

## 4. 배포·로컬 실행 순서

1. **KV 네임스페이스 생성** (2.1, 2.2)
2. **wrangler.toml**에 `id`, `preview_id` 반영 (3)
3. **배포**: `cd worker && npm run deploy`
4. **(선택)** 로컬 테스트: `cd worker && npm run dev` → 프리뷰 KV 사용

---

## 5. 유용한 Wrangler KV 명령어 (v4)

모두 `worker` 디렉터리에서 `npx wrangler`로 실행합니다.

| 목적 | 명령어 |
|------|--------|
| 네임스페이스 목록 보기 | `npx wrangler kv namespace list` |
| 네임스페이스 삭제 | `npx wrangler kv namespace delete <namespace_id>` |
| 키 목록 (프로덕션) | `npx wrangler kv key list --namespace-id=<id>` |
| 키 목록 (프리뷰) | `npx wrangler kv key list --namespace-id=<preview_id> --preview` |

- **Rate limit**: `rl:reviews:<IP>:<window>`, `rl:reviews_upload:<IP>:<window>` 형태의 키, TTL(약 2분) 후 자동 삭제
- **YouTube 캐시**: `ytcache:latest` 한 개, TTL 10분

---

## 6. 참고

- **Cloudflare 문서**: [Workers KV](https://developers.cloudflare.com/kv/)
- **이 프로젝트 설정**: [worker/wrangler.toml](../worker/wrangler.toml)  
- **Rate limit 로직**: [worker/src/index.ts](../worker/src/index.ts) 내 `checkRateLimit`, `getClientIp`
