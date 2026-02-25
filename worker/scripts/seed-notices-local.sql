-- 로컬 전용: notices 더미 데이터 1건
-- 실행: cd worker && npx wrangler d1 execute holaphotograph-db --local --file=./scripts/seed-notices-local.sql
INSERT INTO notices (title, content, created_at, updated_at) VALUES
  ('올라포토 공지사항 안내', '<p>공지사항 게시판에 오신 것을 환영합니다.</p><p>새 소식과 강의·이벤트 안내를 이곳에서 확인해 주세요.</p>', datetime('now'), datetime('now'));
