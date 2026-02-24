/**
 * 사이트 RSS 피드 (feed.xml)
 * - 네이버 서치어드바이저·구글 등 RSS 제출용
 * - 메인 정적 페이지 + (향후 확장 시 API 포스트 목록)
 */
const SITE = "https://holaphoto.com";

/** 피드에 넣을 메인 페이지 (경로, 제목, 설명) */
const PAGES: { path: string; title: string; description: string }[] = [
  { path: "/", title: "올라포토 - 카메라 리뷰", description: "카메라 선택부터 촬영 노하우까지 실전 기반 리뷰 플랫폼" },
  { path: "/reviews", title: "고객 후기", description: "올라포토 고객 후기 목록" },
  { path: "/reviews/new", title: "후기 작성", description: "고객 후기 작성" },
];

function escapeXml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildRssXml(): string {
  const now = new Date();
  const lastBuildDate = now.toUTCString();

  const items = PAGES.map(
    (p) =>
      `  <item>
    <title>${escapeXml(p.title)}</title>
    <link>${SITE}${p.path}</link>
    <description>${escapeXml(p.description)}</description>
    <pubDate>${lastBuildDate}</pubDate>
    <guid isPermaLink="true">${SITE}${p.path}</guid>
  </item>`
  ).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>올라포토</title>
    <link>${SITE}</link>
    <description>카메라 선택부터 촬영 노하우까지 실전 기반 리뷰 플랫폼</description>
    <language>ko</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;
}

export const prerender = true;

export function GET() {
  return new Response(buildRssXml(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
