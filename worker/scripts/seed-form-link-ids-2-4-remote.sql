-- 원격: id=2(강의), id=4(GR Collective) 공지에 form_link 설정 (마이그레이션 후 1회 실행)
-- 실행: cd worker && npx wrangler d1 execute holaphotograph-db --remote --file=./scripts/seed-form-link-ids-2-4-remote.sql

UPDATE notices SET form_link = 'https://forms.gle/aKXZjYLwgDGMd8qX6', updated_at = datetime('now') WHERE id = 2;
UPDATE notices SET form_link = 'https://docs.google.com/forms/d/1Le_H3U2MDN-oQTjrpg7ADuAL3DLde-X9xKLmf6sywLc/viewform', updated_at = datetime('now') WHERE id = 4;
