/// <reference types="@cloudflare/workers-types" />

declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    BUCKET: R2Bucket;
    ALLOWED_EMAILS?: string;
    /** YouTube Data API v3 키 (유튜브 최신 영상/통계 조회용) */
    YOUTUBE_API_KEY?: string;
    /** 네이버 블로그 총 방문자 수 (수동 설정, wrangler secret put NAVER_BLOG_VISITORS) */
    NAVER_BLOG_VISITORS?: string;
  }
}
