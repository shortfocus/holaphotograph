// @ts-check
/// <reference types="node" />
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://holaphoto.com',
  output: 'static',
  devToolbar: { enabled: false },
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
  },
  integrations: [
    sitemap({
      filter: (page) => {
        const pathname = new URL(page).pathname;
        const excludedPaths = new Set(['/post', '/reviews/new', '/feed.xml']);
        return !pathname.startsWith('/admin') && !excludedPaths.has(pathname);
      },
    }),
  ],
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
