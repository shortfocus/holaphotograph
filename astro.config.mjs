// @ts-check
/// <reference types="node" />
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Cloudflare Pages 빌드에서 대시보드 환경 변수가 import.meta.env로 전달되지 않는 경우 대비:
// 빌드 시 process.env에서 읽어 Vite define으로 주입 (없으면 테스트 키로 fallback)
const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';
const turnstileSiteKey = typeof process !== 'undefined' && process.env?.PUBLIC_TURNSTILE_SITE_KEY?.trim()
  ? process.env.PUBLIC_TURNSTILE_SITE_KEY.trim()
  : TURNSTILE_TEST_SITE_KEY;

export default defineConfig({
  site: 'https://example.pages.dev',
  output: 'static',
  vite: {
    define: {
      // 후기 등록 페이지에서 사용하는 Turnstile Site Key (빌드 시점에 치환)
      'import.meta.env.PUBLIC_TURNSTILE_SITE_KEY': JSON.stringify(turnstileSiteKey),
    },
    plugins: [
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
