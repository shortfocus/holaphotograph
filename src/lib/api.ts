/**
 * API URL
 * - PUBLIC_API_URL: 메인 페이지용 (GET)
 * - PUBLIC_ADMIN_API_URL: 관리자용 (POST/PUT/DELETE/upload). 없으면 PUBLIC_API_URL 사용
 */
const env = typeof import.meta.env !== "undefined" ? import.meta.env : {};
const isProd = typeof window !== "undefined" && !window.location.hostname.includes("localhost");
const defaultUrl = isProd ? "https://camera-review-api.chs4413.workers.dev" : "http://localhost:8787";
const PUBLIC = env?.PUBLIC_API_URL || defaultUrl;
const ADMIN = env?.PUBLIC_ADMIN_API_URL || PUBLIC;

export const API_BASE = PUBLIC;
const ADMIN_API_BASE = ADMIN;

export type PostSection = 'reviews' | 'guides' | 'models' | 'youtube';

export interface Post {
  id: number;
  title: string;
  content: string;
  thumbnail_url: string | null;
  youtube_url: string | null;
  section?: PostSection;
  created_at: string;
  updated_at: string;
}

export async function fetchPosts(): Promise<Post[]> {
  const res = await fetch(`${API_BASE}/api/posts`);
  if (!res.ok) throw new Error("Failed to fetch posts");
  const data = await res.json();
  return data.posts ?? [];
}

export interface NaverRssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  category: string;
  thumbnail_url: string | null;
  /** 네이버 핫링크 차단 이미지용 프록시 URL (있으면 이걸 사용) */
  thumbnail_proxy_url?: string | null;
  section: string;
}

export interface NaverRssResponse {
  reviews: NaverRssItem[];
  guides: NaverRssItem[];
  models: NaverRssItem[];
}

export async function fetchNaverRss(): Promise<NaverRssResponse> {
  const res = await fetch(`${API_BASE}/api/naver-rss`);
  if (!res.ok) throw new Error("Failed to fetch Naver RSS");
  return res.json();
}

/** pstatic.net 썸네일은 핫링크 차단 → 프록시 URL 사용 */
export function getRssThumbnailUrl(item: NaverRssItem): string | null {
  if (item.thumbnail_proxy_url) return item.thumbnail_proxy_url;
  if (item.thumbnail_url?.includes("pstatic.net")) {
    return `${API_BASE}/api/image-proxy?url=${encodeURIComponent(item.thumbnail_url)}`;
  }
  return item.thumbnail_url;
}

export interface YoutubeVideoItem {
  title: string;
  link: string;
  thumbnail_url: string | null;
  publishedAt: string;
  viewCount?: string;
}

export interface YoutubeLatestResponse {
  videos: YoutubeVideoItem[];
  shorts: YoutubeVideoItem[];
  error?: string;
}

export async function fetchYoutubeLatest(): Promise<YoutubeLatestResponse> {
  const res = await fetch(`${API_BASE}/api/youtube-latest`);
  if (!res.ok) throw new Error("Failed to fetch YouTube");
  return res.json();
}

export interface ChannelStatsResponse {
  youtubeSubscribers: string | null;
  youtubeViewCount: string | null;
  naverBlogVisitors: string | null;
}

export async function fetchChannelStats(): Promise<ChannelStatsResponse> {
  const res = await fetch(`${API_BASE}/api/channel-stats`);
  if (!res.ok) throw new Error("Failed to fetch channel stats");
  return res.json();
}

export async function fetchPost(id: number): Promise<Post | null> {
  const res = await fetch(`${API_BASE}/api/posts/${id}`);
  if (!res.ok) return null;
  return res.json();
}

export async function createPost(body: Partial<Post>): Promise<Post> {
  const res = await fetch(`${ADMIN_API_BASE}/api/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create");
  }
  return res.json();
}

export async function updatePost(id: number, body: Partial<Post> & { thumbnail_url?: string | null }): Promise<Post> {
  const res = await fetch(`${ADMIN_API_BASE}/api/posts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to update");
  }
  return res.json();
}

export async function deletePost(id: number): Promise<void> {
  const res = await fetch(`${ADMIN_API_BASE}/api/posts/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to delete");
  }
}

export interface UploadResult {
  url: string;
  key: string;
}

export async function uploadImage(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${ADMIN_API_BASE}/api/upload`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Upload failed");
  }
  const data = await res.json();
  return { url: data.url, key: data.key };
}

export async function deleteImage(key: string): Promise<void> {
  const res = await fetch(`${ADMIN_API_BASE}/api/images/${key}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Delete failed");
  }
}
