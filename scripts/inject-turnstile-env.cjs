/**
 * Cloudflare Pages 빌드 시 대시보드 환경 변수를 .env.production.local에 씁니다.
 * Vite/Astro가 이 파일을 로드해 import.meta.env.PUBLIC_* 에 반영합니다.
 */
const fs = require('fs');
const path = require('path');
const key = process.env.PUBLIC_TURNSTILE_SITE_KEY;
if (key && typeof key === 'string' && key.trim()) {
  const content = `PUBLIC_TURNSTILE_SITE_KEY=${key.trim()}\n`;
  fs.writeFileSync(path.join(process.cwd(), '.env.production.local'), content, 'utf8');
}
