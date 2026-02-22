// @ts-check
/// <reference types="node" />
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';

// Cloudflare Pages: 대시보드 변수가 config 로드 시점이 아닌 빌드 단계에서만 주입될 수 있으므로,
// Vite 플러그인에서 process.env를 읽어 define에 넣음
function turnstileEnvPlugin() {
  const raw = (typeof process !== 'undefined' && process.env?.PUBLIC_TURNSTILE_SITE_KEY?.trim()) || '';
  let fromFile = '';
  try {
    const p = join(process.cwd(), '.env.production.local');
    if (existsSync(p)) {
      const content = readFileSync(p, 'utf8');
      const m = content.match(/PUBLIC_TURNSTILE_SITE_KEY\s*=\s*(.+)/m);
      if (m) fromFile = m[1].trim().replace(/^["']|["']$/g, '');
    }
  } catch (_) {}
  const siteKey = (raw || fromFile) || TURNSTILE_TEST_SITE_KEY;
  const isLive = siteKey !== TURNSTILE_TEST_SITE_KEY;
  return {
    name: 'turnstile-env-inject',
    config() {
      return {
        define: { 'import.meta.env.PUBLIC_TURNSTILE_SITE_KEY': JSON.stringify(siteKey) },
      };
    },
    closeBundle() {
      try {
        writeFileSync(
          join(process.cwd(), 'dist', 'turnstile-env-check.txt'),
          `mode=${isLive ? 'live' : 'test'}\nkey_prefix=${siteKey.slice(0, 8)}...`,
          'utf8'
        );
      } catch (_) {}
    },
  };
}

export default defineConfig({
  site: 'https://example.pages.dev',
  output: 'static',
  vite: {
    plugins: [
      // @ts-ignore - 플러그인 타입 불일치 (Astro/Vite 버전 차이)
      turnstileEnvPlugin(),
      // @ts-ignore - Astro 내부 Vite와 @tailwindcss/vite 플러그인 타입 불일치 (런타임 정상 동작)
      tailwindcss(),
      // /favicon.svg 요청 시 favicon.png 응답 (기존 참조 대응)
      {
        name: 'favicon-svg-to-png',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const r = /** @type {{ url?: string }} */ (req);
            if (r.url === '/favicon.svg' || r.url === '/favicon.svg?import') {
              r.url = '/favicon.png';
            }
            next();
          });
        },
      },
    ],
  },
});
