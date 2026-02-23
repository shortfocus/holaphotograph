/**
 * 네이버 블로그 URL + 매핑할 유튜브 URL 을 넣으면 title, description, thumbnail_url 을 뽑아서
 * 썸네일을 다운로드하고 src/data/featured-blog.ts 를 갱신합니다.
 *
 * 사용법:
 *   node scripts/download-blog-thumbnails.mjs {네이버블로그URL} {유튜브URL} [네이버2 유튜브2 ...]
 *   node scripts/download-blog-thumbnails.mjs --from=urls.txt
 *
 * 예:
 *   node scripts/download-blog-thumbnails.mjs "https://blog.naver.com/holaphotograph/223554336299" "https://youtu.be/GBRSgYPD_v8"
 *   node scripts/download-blog-thumbnails.mjs --from=scripts/featured-urls.txt
 *
 * --from= 파일: 한 줄에 "네이버URL  유튜브URL" (공백/탭 구분). 유튜브 생략 시 기존 데이터 또는 빈 문자열.
 */
import { readFile, writeFile } from "fs/promises";
import { mkdir } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "public", "images", "featured-blog");
const DATA_TS = join(ROOT, "src", "data", "featured-blog.ts");
const THUMB_BASE = "/images/featured-blog";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const NAVER_BLOG_RE = /^https?:\/\/blog\.naver\.com\/[^/]+\/\d+/i;
const YOUTUBE_URL_RE = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i;

function isYoutubeUrl(s) {
  return typeof s === "string" && YOUTUBE_URL_RE.test(s.trim());
}

function parseNaverBlogUrl(urlStr) {
  let u;
  try {
    u = new URL(urlStr.trim());
  } catch {
    return null;
  }
  if (!NAVER_BLOG_RE.test(u.href)) return null;
  const parts = u.pathname.split("/").filter(Boolean);
  const blogId = parts[0];
  const logNo = (parts[1] || "").split("?")[0];
  if (!blogId || !logNo) return null;
  return {
    blogId,
    logNo,
    link: `https://blog.naver.com/${blogId}/${logNo}`,
  };
}

function collectUrls(args) {
  const urls = [];
  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg.startsWith("--from=")) {
      const path = arg.slice("--from=".length).trim();
      if (path) urls.push({ type: "file", path });
      i += 1;
      continue;
    }
    if (arg.startsWith("--")) {
      i += 1;
      continue;
    }
    const parsed = parseNaverBlogUrl(arg);
    if (parsed) {
      const next = args[i + 1];
      const youtube_url = isYoutubeUrl(next) ? next.trim() : "";
      if (youtube_url) i += 1;
      urls.push({ type: "url", ...parsed, youtube_url });
    }
    i += 1;
  }
  return urls;
}

async function readUrlsFromFile(filePath) {
  const abs = join(ROOT, filePath);
  const text = await readFile(abs, "utf8");
  const lines = text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const out = [];
  for (const line of lines) {
    if (line.startsWith("#")) continue;
    const parts = line.split(/\s+/);
    const naverStr = parts[0];
    const youtubeStr = parts[1] != null && isYoutubeUrl(parts[1]) ? parts[1] : "";
    const parsed = parseNaverBlogUrl(naverStr);
    if (parsed) out.push({ ...parsed, youtube_url: youtubeStr });
  }
  return out;
}

async function resolveUrlList(urlList) {
  const resolved = [];
  for (const item of urlList) {
    if (item.type === "url") {
      resolved.push({ blogId: item.blogId, logNo: item.logNo, link: item.link, youtube_url: item.youtube_url ?? "" });
      continue;
    }
    if (item.type === "file") {
      const fromFile = await readUrlsFromFile(item.path);
      resolved.push(...fromFile);
    }
  }
  return resolved;
}

function decodeHtmlEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extract(html, property) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\:/g, ":");
  const re = new RegExp(
    `<meta\\s+property="${escaped}"\\s+content="([^"]*)"`,
    "i"
  );
  const m = html.match(re);
  if (m) return decodeHtmlEntities(m[1]).trim();
  return "";
}

function extractOgImage(html) {
  const m = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
  return m ? m[1].trim() : null;
}

function escapeTsString(s) {
  if (s == null || s === "") return '""';
  return (
    '"' +
    String(s)
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n") +
    '"'
  );
}

async function fetchPostView(blogId, logNo) {
  const url = `https://blog.naver.com/PostView.naver?blogId=${encodeURIComponent(blogId)}&logNo=${encodeURIComponent(logNo)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`PostView HTTP ${res.status}`);
  return res.text();
}

async function downloadImage(url, logNo) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Referer: "https://blog.naver.com/",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Image HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const outPath = join(OUT_DIR, `${logNo}.jpg`);
  await writeFile(outPath, buf);
  return outPath;
}

function parseExistingYoutubeByLink(tsContent) {
  const map = {};
  const blockRe = /link:\s*["']([^"']+)["'][\s\S]*?youtube_url:\s*["']([^"']*)["']/g;
  let m;
  while ((m = blockRe.exec(tsContent)) !== null) {
    map[m[1]] = m[2];
  }
  return map;
}

async function main() {
  const args = process.argv.slice(2);
  const urlList = collectUrls(args);
  const resolved = await resolveUrlList(urlList);

  if (resolved.length === 0) {
    console.error(`
사용법: 네이버 블로그 URL 과 매핑할 유튜브 URL 을 짝으로 넣으세요.

  node scripts/download-blog-thumbnails.mjs {네이버블로그URL} {유튜브URL} [네이버2 유튜브2 ...]
  node scripts/download-blog-thumbnails.mjs --from=경로/urls.txt

예:
  node scripts/download-blog-thumbnails.mjs "https://blog.naver.com/holaphotograph/223554336299" "https://youtu.be/GBRSgYPD_v8"
  node scripts/download-blog-thumbnails.mjs --from=scripts/featured-urls.txt

--from= 파일: 한 줄에 "네이버URL  유튜브URL" (공백/탭 구분). # 시작 줄은 무시.
`);
    process.exit(1);
  }

  let youtubeByLink = {};
  try {
    const existing = await readFile(DATA_TS, "utf8");
    youtubeByLink = parseExistingYoutubeByLink(existing);
  } catch {
    // no existing file
  }

  await mkdir(OUT_DIR, { recursive: true });

  const items = [];

  for (const { blogId, logNo, link, youtube_url: inputYoutube } of resolved) {
    try {
      console.log(`Fetching ${link}...`);
      const html = await fetchPostView(blogId, logNo);
      const title = extract(html, "og:title") || "";
      const description = extract(html, "og:description") || "";
      const thumbUrl = extractOgImage(html);

      if (thumbUrl) {
        await downloadImage(thumbUrl, logNo);
        console.log(`  Saved: ${logNo}.jpg`);
      } else {
        console.warn(`  No og:image for ${logNo}`);
      }

      const youtube_url = inputYoutube || youtubeByLink[link] || "";
      items.push({
        link,
        title: title || "올라포토 카메라/렌즈 리뷰",
        description,
        thumbnail_url: `${THUMB_BASE}/${logNo}.jpg`,
        youtube_url,
      });
    } catch (e) {
      console.warn(`Failed ${link}:`, e.message);
      const youtube_url = inputYoutube || youtubeByLink[link] || "";
      items.push({
        link,
        title: "올라포토 카메라/렌즈 리뷰",
        description: "",
        thumbnail_url: `${THUMB_BASE}/${logNo}.jpg`,
        youtube_url,
      });
    }
  }

  const tsContent = `/**
 * 메인 페이지 "카메라/렌즈 리뷰" 섹션용 정적 데이터.
 * node scripts/download-blog-thumbnails.mjs <네이버블로그URL...> 로 갱신 가능.
 */
const THUMB_BASE = "/images/featured-blog";

export interface FeaturedBlogItem {
  /** 제목 */
  title: string;
  /** 네이버 블로그 글 URL */
  link: string;
  /** 짧은 설명 (카드에 표시, 생략 시 빈 문자열) */
  description?: string;
  /** 썸네일 이미지 URL (없으면 null) */
  thumbnail_url?: string | null;
  /** 해당 리뷰 영상 유튜브 URL */
  youtube_url: string;
}

export const FEATURED_BLOG: FeaturedBlogItem[] = [
${items
  .map(
    (it) =>
      `  {
    title: ${escapeTsString(it.title)},
    link: ${escapeTsString(it.link)},
    description: ${escapeTsString(it.description)},
    thumbnail_url: ${escapeTsString(it.thumbnail_url)},
    youtube_url: ${escapeTsString(it.youtube_url)},
  }`
  )
  .join(",\n")},
];
`;
  await writeFile(DATA_TS, tsContent, "utf8");
  console.log("Wrote:", DATA_TS);
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
