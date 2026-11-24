import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const logoPath = join(root, 'public', 'images', 'new_logo_1.png');
const faviconPath = join(root, 'public', 'favicon.png');
const faviconIcoPath = join(root, 'public', 'favicon.ico');

const size = 32;
const pad = 2;
const logo = await sharp(logoPath)
  .trim()
  .resize(size - pad * 2, size - pad * 2, { fit: 'inside' })
  .png()
  .toBuffer();

await sharp({
  create: {
    width: size,
    height: size,
    channels: 4,
    background: { r: 44, g: 50, b: 66, alpha: 1 },
  },
})
  .composite([{ input: logo, gravity: 'centre' }])
  .png()
  .toFile(faviconPath);

const png = readFileSync(faviconPath);
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
const entry = Buffer.alloc(16);
entry[0] = size;
entry[1] = size;
entry.writeUInt16LE(1, 4);
entry.writeUInt16LE(32, 6);
entry.writeUInt32LE(png.length, 8);
entry.writeUInt32LE(22, 12);
writeFileSync(faviconIcoPath, Buffer.concat([header, entry, png]));

console.log('Created public/favicon.png and public/favicon.ico (32x32) from new_logo_1.png');
