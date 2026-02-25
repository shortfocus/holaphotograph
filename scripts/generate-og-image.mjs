/**
 * public/logo.png 를 1200x630 OG 이미지로 변환해 public/og-image.png 로 저장
 * 로고는 비율 유지한 채 1200x630 안에 맞추고, 검정 배경 위에 가운데 배치
 */
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const logoPath = join(root, 'public', 'logo.png');
const outPath = join(root, 'public', 'og-image.png');

const W = 1200;
const H = 630;

const logoBuffer = readFileSync(logoPath);
const meta = await sharp(logoBuffer).metadata();
const logoW = meta.width || 1;
const logoH = meta.height || 1;

const scale = Math.min(W / logoW, H / logoH);
const scaledW = Math.round(logoW * scale);
const scaledH = Math.round(logoH * scale);
const left = Math.round((W - scaledW) / 2);
const top = Math.round((H - scaledH) / 2);

const resizedLogo = await sharp(logoBuffer)
  .resize(scaledW, scaledH, { fit: 'inside' })
  .toBuffer();

await sharp({
  create: {
    width: W,
    height: H,
    channels: 3,
    background: { r: 0, g: 0, b: 0 },
  },
})
  .composite([{ input: resizedLogo, left, top }])
  .png()
  .toFile(outPath);

console.log('Created public/og-image.png (1200x630)');
