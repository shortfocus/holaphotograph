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
    /** VOC 수신 이메일 (관리자 VOC 제출 시 이 주소로 발송). wrangler secret put VOC_TO_EMAIL */
    VOC_TO_EMAIL?: string;
    /** Resend API 키 (이메일 발송). wrangler secret put RESEND_API_KEY */
    RESEND_API_KEY?: string;
  }
}
