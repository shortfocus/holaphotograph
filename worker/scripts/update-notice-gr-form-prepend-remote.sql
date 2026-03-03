-- 공지 id=4 본문 맨 앞에 신청 폼 링크만 추가 (기존 내용 유지, 재업로드 이미지 그대로)
-- 실행: cd worker && npx wrangler d1 execute holaphotograph-db --remote --file=./scripts/update-notice-gr-form-prepend-remote.sql

UPDATE notices
SET content = '<p><a href="https://docs.google.com/forms/d/1Le_H3U2MDN-oQTjrpg7ADuAL3DLde-X9xKLmf6sywLc/viewform" target="_blank" rel="noopener">신청 폼 링크</a></p>' || content,
    updated_at = datetime('now')
WHERE id = 4;
