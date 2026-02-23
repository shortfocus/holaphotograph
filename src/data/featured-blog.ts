/**
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
  {
    title: "'올라포토 렌즈 리뷰' 시그마 30mm F1.4 DC DN Contemporary",
    link: "https://blog.naver.com/holaphotograph/223554336299",
    description: "👨🎨 이 포스팅은 세기 P&amp;C로부터 렌즈를 대여 받아 직접 사용해 본 내용을 바탕으로 작성하였습...",
    thumbnail_url: "/images/featured-blog/223554336299.jpg",
    youtube_url: "https://youtu.be/GBRSgYPD_v8?si=4Rhhrm2Eu9ojgDDD",
  },
  {
    title: "'올라포토 렌즈 리뷰' 시그마 18-50mm F2.8 DC DN Contemporary (for 후지필름 X-마운트)",
    link: "https://blog.naver.com/holaphotograph/223630921092",
    description: "👨🎨 이 포스팅은 세기 P&amp;C로부터 렌즈를 대여 받아 직접 사용해 본 내용을 바탕으로 작성하였습...",
    thumbnail_url: "/images/featured-blog/223630921092.jpg",
    youtube_url: "https://youtu.be/4W-6_M39Jr4?si=z5G76lXho02zYvPc",
  },
  {
    title: "'올라포토 렌즈 리뷰' 빌트록스 AF 50mm F2 Air (소니 FE 마운트)",
    link: "https://blog.naver.com/holaphotograph/223918535079",
    description: "👨🎨 이 포스팅은 코리아포토프로덕츠로부터 렌즈를 제공받아 직접 사용해 본 내용을 바탕으로 작성하...",
    thumbnail_url: "/images/featured-blog/223918535079.jpg",
    youtube_url: "https://youtu.be/Q9_ootsvDgQ?si=OIgX9Bao6dx3pZG5",
  },
  {
    title: "'올라포토 렌즈 리뷰' 빌트록스 AF 35mm F1.7 Air (후지 X마운트)",
    link: "https://blog.naver.com/holaphotograph/223723467910",
    description: "👨🎨 이 포스팅은 빌트록스 렌즈 체험단에 선정되어 직접 사용해본 내용을 바탕으로 작성하였습니다. ...",
    thumbnail_url: "/images/featured-blog/223723467910.jpg",
    youtube_url: "https://youtu.be/daabLwDGO7g?si=zDZE6rch9fiDDc0G",
  },
  {
    title: "'올라포토 렌즈 리뷰' 삼양 AF 35mm F1.4 P FE",
    link: "https://blog.naver.com/holaphotograph/223715629379",
    description: "👨🎨 이 포스팅은 삼양렌즈 글로벌 크레에이터로 선정되어 직접 사용해본 내용을 바탕으로 작성하였습...",
    thumbnail_url: "/images/featured-blog/223715629379.jpg",
    youtube_url: "https://youtu.be/oQXueYPPoSg?si=iwYOidkc31MQV99Q",
  },
  {
    title: "'올라포토 렌즈 리뷰' 시그마 10-18mm F2.8 DC DN Contemporary",
    link: "https://blog.naver.com/holaphotograph/223594532420",
    description: "👨🎨 이 포스팅은 세기 P&amp;C로부터 렌즈를 대여 받아 직접 사용해 본 내용을 바탕으로 작성하였습...",
    thumbnail_url: "/images/featured-blog/223594532420.jpg",
    youtube_url: "https://youtu.be/FsObBG1YIEA?si=PU24l0WbCn9RZaF9",
  },
];
