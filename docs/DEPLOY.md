# 배포 명령어

## 전체 배포 (프론트엔드 + Worker)

```bash
npm run build && cd worker && npx wrangler deploy && cd .. && npx wrangler pages deploy dist --project-name=camera-review
```

---

## 단계별 배포

```bash
# 1. 프론트엔드 빌드
npm run build

# 2. Worker 배포
cd worker && npx wrangler deploy

# 3. 프론트엔드 배포 (Cloudflare Pages)
cd .. && npx wrangler pages deploy dist --project-name=camera-review
```

---

## 개별 배포

**Worker만 배포할 때:**
```bash
cd worker
npx wrangler deploy
```

**프론트엔드만 배포할 때:**
```bash
npm run build
npx wrangler pages deploy dist --project-name=camera-review
```
