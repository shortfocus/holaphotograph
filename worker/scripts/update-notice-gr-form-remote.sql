-- 공지 id=4 (GR Collective) 본문에 신청 폼 링크 추가
-- 실행: cd worker && npx wrangler d1 execute holaphotograph-db --remote --file=./scripts/update-notice-gr-form-remote.sql

UPDATE notices
SET content = '<p><a href="https://docs.google.com/forms/d/1Le_H3U2MDN-oQTjrpg7ADuAL3DLde-X9xKLmf6sywLc/viewform" target="_blank" rel="noopener">신청 폼 링크</a></p><p><img src="/images/gr-collective-notice.png" alt="GR Collective : in Yongsan 모집 안내" style="max-width:100%;height:auto;" /></p>',
    updated_at = datetime('now')
WHERE id = 4;
