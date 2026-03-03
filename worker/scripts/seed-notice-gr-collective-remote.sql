-- GR Collective : in Yongsan 공지 1건 등록 (첨부 이미지 1장)
-- 이미지: public/images/gr-collective-notice.png (배포 후 https://holaphoto.com/images/gr-collective-notice.png)
-- 실행: cd worker && npx wrangler d1 execute holaphotograph-db --remote --file=./scripts/seed-notice-gr-collective-remote.sql

INSERT INTO notices (title, content, created_at, updated_at)
VALUES (
  'GR Collective : in Yongsan',
  '<p><a href="https://docs.google.com/forms/d/1Le_H3U2MDN-oQTjrpg7ADuAL3DLde-X9xKLmf6sywLc/viewform" target="_blank" rel="noopener">신청 폼 링크</a></p><p><img src="/images/gr-collective-notice.png" alt="GR Collective : in Yongsan 모집 안내" style="max-width:100%;height:auto;" /></p>',
  datetime('now'),
  datetime('now')
);
