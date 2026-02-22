# Postman으로 API 테스트하기

Worker API(base URL)를 Postman에서 테스트하는 방법입니다.  
**Base URL**은 배포된 Worker 주소로 바꿉니다. (예: `https://holaphotograph-api.xxx.workers.dev`)

---

## 1. 환경 변수 (선택)

Postman에서 **Environments** 또는 요청 URL에 직접 넣어도 됩니다.

| 변수명 | 예시 값 |
|--------|---------|
| `baseUrl` | `https://holaphotograph-api.xxx.workers.dev` |

로컬 Worker: `http://localhost:8787`

---

## 2. 고객 후기 제출 — POST /api/reviews

- **Method**: `POST`
- **URL**: `{{baseUrl}}/api/reviews`
- **Headers**:
  - `Content-Type`: `application/json`
- **Body** → **raw** → **JSON**:

```json
{
  "title": "포스트맨 테스트 제목",
  "content": "<p>테스트 내용입니다.</p>",
  "author_name": "테스터",
  "thumbnail_url": null
}
```

**성공**: `201` + `{ "success": true, "message": "등록되었습니다. 승인 후 게시됩니다." }`  
**실패 예**: `400` (필수값 누락), `429` (rate limit 초과)

---

## 3. 고객 후기 이미지 업로드 — POST /api/reviews/upload

- **Method**: `POST`
- **URL**: `{{baseUrl}}/api/reviews/upload`
- **Headers**: Postman이 자동으로 설정 (Content-Type 제거)
- **Body** → **form-data**:
  - Key: `file` (타입 **File** 선택)
  - Value: 이미지 파일 선택 (jpeg, png, gif, webp, 최대 5MB)

**성공**: `200` + `{ "url": "https://.../api/images/reviews/...", "key": "reviews/..." }`  
**실패 예**: `400` (No file / Invalid file type / File too large), `429` (rate limit)

---

## 4. 고객 후기 목록 (승인된 것만) — GET /api/reviews

- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/reviews`
- **Headers**: 없음

**성공**: `200` + `{ "posts": [ ... ] }`

---

## 5. Rate limit 테스트 (429 확인)

같은 IP에서 짧은 시간에 많이 보내면 429가 나와야 합니다.

1. **후기 제출**: `POST /api/reviews`를 **1분 안에 4번** 연속 Send  
   → 4번째 요청에서 `429` + `"요청이 너무 많습니다. 잠시 후 다시 시도해 주세요."`
2. **이미지 업로드**: `POST /api/reviews/upload`를 **1분 안에 6번** 연속 Send  
   → 6번째 요청에서 `429`

Postman **Runner**로 같은 요청을 반복 실행해도 됩니다.

---

## 6. CORS 참고

브라우저가 아닌 Postman에서는 CORS 제한이 없습니다.  
`Origin` 헤더를 비워두거나 아무 값이나 넣어도 동작합니다.
