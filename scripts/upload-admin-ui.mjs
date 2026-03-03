#!/usr/bin/env node
/**
 * dist/admin, dist/_astro 를 R2 버킷 camera-review-images 의 admin-ui/ 프리픽스로 업로드.
 * Worker에서 /admin, /_astro 요청 시 이 객체들을 서빙.
 * 실행: npm run build && node scripts/upload-admin-ui.mjs
 * (worker 디렉터리에서 wrangler가 인식하므로 worker에서 실행하거나, --config worker/wrangler.toml 사용)
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const bucket = "camera-review-images";
const prefix = "admin-ui";

function walkDir(dir, baseDir, list = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = path.relative(baseDir, full).replace(/\\/g, "/");
    if (e.isDirectory()) walkDir(full, baseDir, list);
    else list.push(rel);
  }
  return list;
}

const adminFiles = walkDir(path.join(dist, "admin"), dist);
const astroFiles = walkDir(path.join(dist, "_astro"), dist);
const all = [...adminFiles, ...astroFiles].filter(Boolean);

if (all.length === 0) {
  console.error("dist/admin or dist/_astro not found. Run npm run build first.");
  process.exit(1);
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function uploadOne(workerDir, bucket, key, fileArg) {
  execSync(
    `npx wrangler r2 object put ${bucket}/${key} --file="${fileArg}" --remote`,
    { cwd: workerDir, stdio: "inherit" }
  );
}

const workerDir = path.join(root, "worker");

(async () => {
  console.log(`Uploading ${all.length} files to R2 ${bucket}/${prefix}/ ...`);
  for (const rel of all) {
    const key = `${prefix}/${rel}`;
    const filePath = path.join(dist, rel);
    const fileArg = path.relative(workerDir, filePath);
    let lastErr;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        uploadOne(workerDir, bucket, key, fileArg);
        lastErr = null;
        break;
      } catch (err) {
        lastErr = err;
        if (attempt < MAX_RETRIES) {
          console.warn(`Retry ${attempt}/${MAX_RETRIES} in ${RETRY_DELAY_MS / 1000}s: ${key}`);
          await sleep(RETRY_DELAY_MS);
        }
      }
    }
    if (lastErr) {
      console.error(`Failed after ${MAX_RETRIES} attempts: ${key}`);
      process.exit(1);
    }
  }
  console.log("Done.");
})();
