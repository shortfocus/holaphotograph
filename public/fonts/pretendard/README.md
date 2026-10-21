# Pretendard Variable (dynamic subset)

Self-hosted from [orioncactus/pretendard](https://github.com/orioncactus/pretendard) v1.3.9.

- `pretendard-variable.css` — `@font-face` with `font-display: swap` + unicode-range
- `woff2-dynamic-subset/` — 브라우저가 필요한 글리프 청크만 요청

갱신 시:

```bash
npm install pretendard@1.3.9 --no-save
cp node_modules/pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css public/fonts/pretendard/pretendard-variable.css
cp node_modules/pretendard/dist/web/variable/woff2-dynamic-subset/*.woff2 public/fonts/pretendard/woff2-dynamic-subset/
```
