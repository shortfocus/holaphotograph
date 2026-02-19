/// <reference path="../worker-configuration.d.ts" />
export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  /** 허용 이메일 (쉼표 구분). 비어있으면 로컬 개발 모드로 모든 요청 허용 */
  ALLOWED_EMAILS?: string;
  /** YouTube Data API v3 키 */
  YOUTUBE_API_KEY?: string;
  /** 네이버 블로그 총 방문자 수 (수동 설정) */
  NAVER_BLOG_VISITORS?: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  thumbnail_url: string | null;
  youtube_url: string | null;
  section: string;
  created_at: string;
  updated_at: string;
}

function getCorsHeaders(request: Request) {
  const origin = request.headers.get("Origin");
  const allowOrigin =
    origin && (origin.includes("pages.dev") || origin.includes("localhost") || origin.includes("solidwebteam"))
      ? origin
      : "*";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  if (allowOrigin !== "*") headers["Access-Control-Allow-Credentials"] = "true";
  return headers;
}

function jsonResponse(data: unknown, status = 200, request?: Request) {
  const cors = request ? getCorsHeaders(request) : { "Access-Control-Allow-Origin": "*" };
  return Response.json(data, { status, headers: cors });
}

function errorResponse(message: string, status: number, request?: Request) {
  return jsonResponse({ error: message }, status, request);
}

/** Access가 추가하는 이메일 헤더. 허용 목록에 있으면 true */
function isAllowedAdmin(request: Request, env: Env): boolean {
  const allowed = env.ALLOWED_EMAILS?.trim();
  if (!allowed) return true; // 로컬 개발: 검증 생략
  const email = request.headers.get("Cf-Access-Authenticated-User-Email")?.trim().toLowerCase();
  if (!email) return false;
  const list = allowed.split(",").map((e) => e.trim().toLowerCase());
  return list.includes(email);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const cors = getCorsHeaders(request);
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    const url = new URL(request.url);

    // 루트 - API 정보
    if (url.pathname === "/" || url.pathname === "/api") {
      return jsonResponse({
        name: "camera-review-api",
        endpoints: {
          "GET /api/naver-rss": "네이버 블로그 RSS (섹션별 분류)",
          "GET /api/image-proxy?url=...": "네이버 썸네일 이미지 프록시",
          "GET /api/youtube-latest": "유튜브 채널 최신 영상 (롱폼 + Shorts 분리)",
          "GET /api/channel-stats": "채널 통계 (유튜브 구독자/조회수, 네이버 방문자)",
          "GET /api/posts": "리뷰 목록 (최신순)",
          "GET /api/posts/:id": "리뷰 상세",
          "POST /api/posts": "리뷰 작성 (관리자)",
          "PUT /api/posts/:id": "리뷰 수정 (관리자)",
          "DELETE /api/posts/:id": "리뷰 삭제 (관리자)",
          "POST /api/upload": "이미지 업로드 (관리자)",
          "GET /api/images/:path": "이미지 조회",
          "DELETE /api/images/:path": "이미지 삭제 (롤백용)",
        },
      }, 200, request);
    }

    // GET /api/naver-rss - 네이버 블로그 RSS 프록시 (CORS 회피)
    if (url.pathname === "/api/naver-rss" && request.method === "GET") {
      return handleNaverRss(request);
    }

    // GET /api/image-proxy?url=... - 네이버 썸네일 이미지 프록시 (핫링크 차단 회피)
    if (url.pathname === "/api/image-proxy" && request.method === "GET") {
      return handleImageProxy(request);
    }

    // GET /api/youtube-latest - 유튜브 채널 최신 영상
    if (url.pathname === "/api/youtube-latest" && request.method === "GET") {
      return handleYoutubeLatest(request, env);
    }

    // GET /api/channel-stats - 채널 통계 (협업/광고 섹션용)
    if (url.pathname === "/api/channel-stats" && request.method === "GET") {
      return handleChannelStats(request, env);
    }

    const pathMatch = url.pathname.match(/^\/api\/posts(?:\/(\d+))?$/);

    // POST /api/upload - 이미지 업로드 (관리자 전용)
    if (url.pathname === "/api/upload" && request.method === "POST") {
      if (!isAllowedAdmin(request, env)) return errorResponse("Unauthorized", 401, request);
      const contentType = request.headers.get("Content-Type") || "";
      if (!contentType.startsWith("multipart/form-data")) {
        return errorResponse("Expected multipart/form-data", 400, request);
      }

      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) return errorResponse("No file provided", 400, request);

      const ext = file.name.split(".").pop() || "jpg";
      const key = `uploads/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

      await env.BUCKET.put(key, file.stream(), {
        httpMetadata: { contentType: file.type },
      });

      // R2 public URL (Custom Domain 설정 시 해당 URL 사용)
      const baseUrl = url.origin.replace(/^https?:\/\//, "");
      const imageUrl = `https://${baseUrl}/api/images/${key}`;
      return jsonResponse({ url: imageUrl, key }, 200, request);
    }

    // GET /api/images/:path - R2 이미지 조회 (공개)
    // DELETE /api/images/:path - R2 이미지 삭제 (글 등록 실패 시 롤백용)
    if (url.pathname.startsWith("/api/images/")) {
      const key = url.pathname.replace("/api/images/", "");
      if (request.method === "DELETE") {
        if (!isAllowedAdmin(request, env)) return errorResponse("Unauthorized", 401, request);
        await env.BUCKET.delete(key);
        return jsonResponse({ success: true }, 200, request);
      }
      const object = await env.BUCKET.get(key);
      if (!object) return errorResponse("Not found", 404, request);
      return new Response(object.body, {
        headers: {
          "Content-Type": object.httpMetadata?.contentType || "image/jpeg",
          ...getCorsHeaders(request),
        },
      });
    }

    // /api/posts 라우팅
    if (pathMatch) {
      const id = pathMatch[1] ? parseInt(pathMatch[1], 10) : null;

      switch (request.method) {
        case "GET":
          if (id) return handleGetPost(request, env, id);
          return handleListPosts(request, env);

        case "POST":
          if (id) return errorResponse("Method not allowed", 405, request);
          return handleCreatePost(request, env);

        case "PUT":
          if (!id) return errorResponse("ID required", 400, request);
          return handleUpdatePost(request, env, id);

        case "DELETE":
          if (!id) return errorResponse("ID required", 400, request);
          return handleDeletePost(request, env, id);

        default:
          return errorResponse("Method not allowed", 405, request);
      }
    }

    return errorResponse("Not found", 404, request);
  },
};

const NAVER_RSS_URL = "https://rss.blog.naver.com/holaphotograph.xml";
const YOUTUBE_CHANNEL_ID = "UCsD5VP6TvRMt-sq0q25HlIA";

/** RSS item → section 매핑 (guides, models, reviews) */
function getRssSection(category: string): "reviews" | "guides" | "models" {
  const c = category.toLowerCase();
  if (/강의|예약|세미나|클래스|교육|weekly focus|카메라 소식/.test(c)) return "guides";
  if (/시그마|렌즈|삼양|빌트록스|accessory|피지테크|viltrox|sigm/.test(c)) return "models";
  return "reviews";
}

function parseRssItem(itemXml: string): { title: string; link: string; description: string; pubDate: string; category: string; thumbnail_url: string | null } | null {
  const getTag = (tag: string): string => {
    const m = itemXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
    if (!m) return "";
    let val = m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
    return val;
  };
  const title = getTag("title");
  if (!title) return null;
  const link = getTag("link");
  const description = getTag("description");
  const pubDate = getTag("pubDate");
  const category = getTag("category");
  let thumbnail_url: string | null = null;
  const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) thumbnail_url = imgMatch[1];
  return { title, link, description, pubDate, category, thumbnail_url };
}

/** 네이버 썸네일(pstatic.net) 등 핫링크 차단 이미지를 프록시로 서빙 */
function needsImageProxy(url: string | null): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.hostname.includes("pstatic.net") || u.hostname.includes("blogthumb");
  } catch {
    return false;
  }
}

async function handleImageProxy(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get("url");
  if (!targetUrl) return errorResponse("url parameter required", 400, request);
  if (!needsImageProxy(targetUrl)) return errorResponse("Only pstatic.net/blogthumb URLs allowed", 400, request);
  try {
    const res = await fetch(targetUrl, {
      referrerPolicy: "no-referrer",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://blog.naver.com/",
      },
    });
    if (!res.ok) return errorResponse("Image fetch failed", 502, request);
    const contentType = res.headers.get("Content-Type") || "image/jpeg";
    return new Response(res.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        ...getCorsHeaders(request),
      },
    });
  } catch (err) {
    console.error("image-proxy error:", err);
    return errorResponse("Image fetch failed", 502, request);
  }
}

async function handleNaverRss(request: Request): Promise<Response> {
  try {
    const res = await fetch(NAVER_RSS_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; camera-review/1.0)" },
    });
    if (!res.ok) return errorResponse("RSS fetch failed", 502, request);
    const xml = await res.text();
    const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/gi);
    const baseUrl = new URL(request.url).origin;
    const items: Array<{ title: string; link: string; description: string; pubDate: string; category: string; thumbnail_url: string | null; thumbnail_proxy_url: string | null; section: string }> = [];
    for (const m of itemMatches) {
      const parsed = parseRssItem(m[1]);
      if (parsed) {
        const section = getRssSection(parsed.category);
        const thumbnail_proxy_url = parsed.thumbnail_url && needsImageProxy(parsed.thumbnail_url)
          ? `${baseUrl}/api/image-proxy?url=${encodeURIComponent(parsed.thumbnail_url)}`
          : null;
        items.push({ ...parsed, thumbnail_proxy_url, section });
      }
    }
    const bySection = (s: string) => items.filter((i) => i.section === s);
    return jsonResponse({
      reviews: bySection("reviews"),
      guides: bySection("guides"),
      models: bySection("models"),
    }, 200, request);
  } catch (err) {
    console.error("naver-rss error:", err);
    return errorResponse("RSS fetch failed", 502, request);
  }
}

/** ISO 8601 duration (PT1H2M30S) → 초 단위 */
function parseDurationSeconds(duration: string | undefined): number {
  if (!duration) return 0;
  const m = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
  if (!m) return 0;
  const h = parseInt(m[1] || "0", 10);
  const min = parseInt(m[2] || "0", 10);
  const s = parseInt(m[3] || "0", 10);
  return h * 3600 + min * 60 + s;
}

/** 60초 이하 = Shorts */
const SHORTS_MAX_SECONDS = 60;

async function handleYoutubeLatest(request: Request, env: Env): Promise<Response> {
  const key = env.YOUTUBE_API_KEY;
  if (!key) return jsonResponse({ videos: [], shorts: [], error: "YOUTUBE_API_KEY not configured" }, 200, request);
  try {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${YOUTUBE_CHANNEL_ID}&maxResults=15&order=date&type=video&key=${key}`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) {
      const err = await searchRes.json();
      return errorResponse(err?.error?.message || "YouTube API error", searchRes.status, request);
    }
    const searchData = (await searchRes.json()) as { items?: Array<{ id?: { videoId?: string }; snippet?: { title?: string; publishedAt?: string; thumbnails?: { high?: { url?: string }; default?: { url?: string } } } }> };
    const videoIds = (searchData.items || []).map((it) => it.id?.videoId).filter(Boolean) as string[];
    if (videoIds.length === 0) return jsonResponse({ videos: [], shorts: [] }, 200, request);

    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(",")}&key=${key}`;
    const detailsRes = await fetch(detailsUrl);
    if (!detailsRes.ok) {
      const err = await detailsRes.json();
      return errorResponse(err?.error?.message || "YouTube API error", detailsRes.status, request);
    }
    const detailsData = (await detailsRes.json()) as { items?: Array<{ id?: string; snippet?: { title?: string; publishedAt?: string; thumbnails?: { high?: { url?: string }; default?: { url?: string } } }; contentDetails?: { duration?: string }; statistics?: { viewCount?: string } }> };
    const items = detailsData.items || [];

    const videos: Array<{ title: string; link: string; thumbnail_url: string | null; publishedAt: string; viewCount?: string }> = [];
    const shorts: Array<{ title: string; link: string; thumbnail_url: string | null; publishedAt: string; viewCount?: string }> = [];

    for (const it of items) {
      const vid = it.id;
      const sn = it.snippet;
      const durationSec = parseDurationSeconds(it.contentDetails?.duration);
      const isShort = durationSec > 0 && durationSec <= SHORTS_MAX_SECONDS;
      const item = {
        title: sn?.title || "",
        link: vid ? (isShort ? `https://www.youtube.com/shorts/${vid}` : `https://www.youtube.com/watch?v=${vid}`) : "",
        thumbnail_url: sn?.thumbnails?.high?.url || sn?.thumbnails?.default?.url || null,
        publishedAt: sn?.publishedAt || "",
        viewCount: it.statistics?.viewCount,
      };
      if (!item.link) continue;
      if (isShort) shorts.push(item);
      else videos.push(item);
    }

    return jsonResponse({ videos: videos.slice(0, 6), shorts: shorts.slice(0, 6) }, 200, request);
  } catch (err) {
    console.error("youtube-latest error:", err);
    return errorResponse("YouTube fetch failed", 502, request);
  }
}

async function handleChannelStats(request: Request, env: Env): Promise<Response> {
  const key = env.YOUTUBE_API_KEY;
  let youtubeSubscribers: string | null = null;
  let youtubeViewCount: string | null = null;

  if (key) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${YOUTUBE_CHANNEL_ID}&key=${key}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = (await res.json()) as { items?: Array<{ statistics?: { subscriberCount?: string; viewCount?: string } }> };
        const stats = data.items?.[0]?.statistics;
        if (stats) {
          youtubeSubscribers = stats.subscriberCount ?? null;
          youtubeViewCount = stats.viewCount ?? null;
        }
      }
    } catch (err) {
      console.error("channel-stats youtube error:", err);
    }
  }

  const naverBlogVisitors = env.NAVER_BLOG_VISITORS?.trim() || null;

  return jsonResponse({
    youtubeSubscribers,
    youtubeViewCount,
    naverBlogVisitors,
  }, 200, request);
}

async function handleListPosts(request: Request, env: Env): Promise<Response> {
  const { results } = await env.DB.prepare(
    "SELECT id, title, content, thumbnail_url, youtube_url, section, created_at, updated_at FROM posts ORDER BY created_at DESC"
  ).all<Post>();
  return jsonResponse({ posts: results }, 200, request);
}

async function handleGetPost(request: Request, env: Env, id: number): Promise<Response> {
  const post = await env.DB.prepare(
    "SELECT id, title, content, thumbnail_url, youtube_url, section, created_at, updated_at FROM posts WHERE id = ?"
  )
    .bind(id)
    .first<Post>();
  if (!post) return errorResponse("Not found", 404, request);
  return jsonResponse(post, 200, request);
}

async function handleCreatePost(request: Request, env: Env): Promise<Response> {
  if (!isAllowedAdmin(request, env)) return errorResponse("Unauthorized", 401, request);
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return errorResponse("Invalid JSON body", 400, request);
  }
  const title = String(body.title ?? "").trim();
  const content = String(body.content ?? "").trim();
  const thumbnailUrl = body.thumbnail_url != null && body.thumbnail_url !== "" ? String(body.thumbnail_url) : null;
  const youtubeUrl = body.youtube_url != null && body.youtube_url !== "" ? String(body.youtube_url) : null;
  const section = ["reviews", "guides", "models", "youtube"].includes(String(body.section ?? "reviews"))
    ? String(body.section)
    : "reviews";

  if (!title) return errorResponse("title required", 400, request);
  if (section === "youtube") {
    if (!youtubeUrl) return errorResponse("youtube_url required for 유튜브 영상", 400, request);
  } else {
    if (!content) return errorResponse("content required", 400, request);
  }

  try {
    const now = new Date().toISOString();
    const result = await env.DB.prepare(
      "INSERT INTO posts (title, content, thumbnail_url, youtube_url, section, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
      .bind(title, content, thumbnailUrl, youtubeUrl, section, now, now)
      .run();

    const id = result.meta.last_row_id;
    const post = await env.DB.prepare("SELECT * FROM posts WHERE id = ?").bind(id).first<Post>();
    if (!post) return errorResponse("Failed to fetch created post", 500, request);
    return jsonResponse(post, 201, request);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("createPost error:", msg, err);
    // no such table → 원격 DB에 마이그레이션 미적용
    if (msg.includes("no such table") || msg.includes("SQLITE_ERROR")) {
      return errorResponse(
        `Database error: ${msg}. Run: cd worker && npm run db:migrate:remote`,
        500,
        request
      );
    }
    return errorResponse("Failed to create post", 500, request);
  }
}

async function handleUpdatePost(request: Request, env: Env, id: number): Promise<Response> {
  if (!isAllowedAdmin(request, env)) return errorResponse("Unauthorized", 401, request);
  const body = await request.json() as Record<string, unknown>;
  const title = body.title != null ? String(body.title).trim() : null;
  const content = body.content != null ? String(body.content).trim() : null;
  const youtubeUrl = body.youtube_url !== undefined ? (body.youtube_url ? String(body.youtube_url) : null) : null;

  const existing = await env.DB.prepare("SELECT * FROM posts WHERE id = ?").bind(id).first<Post>();
  if (!existing) return errorResponse("Not found", 404, request);

  const finalTitle = title ?? existing.title;
  const finalContent = content ?? existing.content;
  const finalThumb = body.thumbnail_url !== undefined ? (body.thumbnail_url ? String(body.thumbnail_url) : null) : existing.thumbnail_url;
  const finalYoutube = youtubeUrl !== null ? youtubeUrl : existing.youtube_url;
  const finalSection = body.section != null && ["reviews", "guides", "models", "youtube"].includes(String(body.section))
    ? String(body.section)
    : (existing.section ?? "reviews");
  const now = new Date().toISOString();

  await env.DB.prepare(
    "UPDATE posts SET title = ?, content = ?, thumbnail_url = ?, youtube_url = ?, section = ?, updated_at = ? WHERE id = ?"
  )
    .bind(finalTitle, finalContent, finalThumb, finalYoutube, finalSection, now, id)
    .run();

  const post = await env.DB.prepare("SELECT * FROM posts WHERE id = ?").bind(id).first<Post>();
  return jsonResponse(post, 200, request);
}

async function handleDeletePost(request: Request, env: Env, id: number): Promise<Response> {
  if (!isAllowedAdmin(request, env)) return errorResponse("Unauthorized", 401, request);
  const result = await env.DB.prepare("DELETE FROM posts WHERE id = ?").bind(id).run();
  if (result.meta.changes === 0) return errorResponse("Not found", 404, request);
  return jsonResponse({ success: true }, 200, request);
}
