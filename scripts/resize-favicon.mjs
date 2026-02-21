import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const logoPath = join(root, 'public', 'logo.png');
const faviconPath = join(root, 'public', 'favicon.png');

await sharp(logoPath)
  .resize(32, 32)
  .png()
  .toFile(faviconPath);

console.log('Created public/favicon.png (32x32) from logo.png');
