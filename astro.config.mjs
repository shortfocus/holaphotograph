// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://example.pages.dev',
  output: 'static',
  vite: {
    // @ts-expect-error - Astro 내부 Vite와 @tailwindcss/vite 플러그인 타입 불일치 (런타임 정상 동작)
    plugins: [
      tailwindcss(),
      // /favicon.svg 요청 시 favicon.png 응답 (기존 참조 대응)
      {
        name: 'favicon-svg-to-png',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url === '/favicon.svg' || req.url === '/favicon.svg?import') {
              req.url = '/favicon.png';
            }
            next();
          });
        },
      },
    ],
  },
});
