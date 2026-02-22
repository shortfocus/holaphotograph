// @ts-check
/// <reference types="node" />
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://example.pages.dev',
  output: 'static',
  vite: {
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
