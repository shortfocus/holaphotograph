// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://example.pages.dev',
  output: 'static',
  vite: {
    // @ts-expect-error - Astro 내부 Vite와 @tailwindcss/vite 플러그인 타입 불일치 (런타임 정상 동작)
    plugins: [tailwindcss()],
  },
});
