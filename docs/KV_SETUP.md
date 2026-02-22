# Workers KV 설정 (Rate Limiting)

이 프로젝트에서는 **Cloudflare Workers KV**를 고객 후기 제출·이미지 업로드의 **Rate Limiting**에 사용합니다.  
같은 IP가 짧은 시간에 과도하게 요청하는 것을 막기 위해, IP별 요청 횟수를 KV에 저장해 제한합니다.

---

## 1. KV 사용처

| 바인딩 이름   | 용도 | 제한 규칙 |
|---------------|------|-----------|
| `RATE_LIMIT_KV` | 후기 제출·이미지 업로드 제한 | 아래 참고 |

**적용 규칙**

- **POST /api/reviews** (고객 후기 제출): **60초당 5회** / IP
- **POST /api/reviews/upload** (이미지 업로드): **60초당 10회** / IP

초과 시 **429** 응답 + `"요청이 너무 많습니다. 잠시 후 다시 시도해 주세요."` 메시지를 반환합니다.

---

## 2. 네임스페이스 생성 (최초 1회)

Wrangler **v4**에서는 `kv:namespace`가 아니라 **`kv namespace`**(공백)를 사용합니다.  
반드시 **`worker` 디렉터리**에서 실행하고, **`npx wrangler`**로 호출합니다.

### 2.1 프로덕션용 (배포 환경)

```bash
cd worker
npx wrangler kv namespace create "RATE_LIMIT"
```

출력 예:

```
✨ Success!
[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "bb94378fd15d4ccb85444f63c41f7fa0"
```

여기서 나온 **`id`** 값을 복사합니다.

### 2.2 프리뷰용 (로컬 개발 / wrangler dev)

```bash
cd worker
npx wrangler kv namespace create "RATE_LIMIT" --preview
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
binding = "RATE_LIMIT_KV"
id = "프로덕션_네임스페이스_id"
preview_id = "프리뷰_네임스페이스_id"
```

- **binding**: Worker 코드에서 사용할 이름 (`env.RATE_LIMIT_KV`)
- **id**: 위 2.1에서 받은 프로덕션 id
- **preview_id**: 위 2.2에서 받은 프리뷰 id (로컬 `wrangler dev` 시 사용)

`id` / `preview_id`를 비워두거나 잘못 넣으면 KV 바인딩이 없어서, Worker는 **rate limit 없이** 동작합니다. (에러는 나지 않음)

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

Rate limit 데이터는 `rl:reviews:<IP>`, `rl:reviews_upload:<IP>` 형태의 키로 저장되며, TTL(약 2분) 후 자동 삭제됩니다.

---

## 6. 참고

- **Cloudflare 문서**: [Workers KV](https://developers.cloudflare.com/kv/)
- **이 프로젝트 설정**: [worker/wrangler.toml](../worker/wrangler.toml)  
- **Rate limit 로직**: [worker/src/index.ts](../worker/src/index.ts) 내 `checkRateLimit`, `getClientIp`
