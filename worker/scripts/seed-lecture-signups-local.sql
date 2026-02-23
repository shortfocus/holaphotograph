-- 로컬 전용: lecture_signups 더미 데이터 10건
-- 실행: cd worker && npx wrangler d1 execute holaphotograph-db --local --file=./scripts/seed-lecture-signups-local.sql
INSERT OR IGNORE INTO lecture_signups (email, created_at) VALUES
  ('kim.photo@example.com', datetime('now', '-9 days')),
  ('lee.studio@gmail.com', datetime('now', '-8 days')),
  ('park.camera@naver.com', datetime('now', '-7 days')),
  ('choi.lens@daum.net', datetime('now', '-6 days')),
  ('jung.workshop@example.com', datetime('now', '-5 days')),
  ('han.learn@gmail.com', datetime('now', '-4 days')),
  ('song.photo@naver.com', datetime('now', '-3 days')),
  ('hong.camera@gmail.com', datetime('now', '-2 days')),
  ('lim.studio@example.com', datetime('now', '-1 day')),
  ('yoon.lecture@gmail.com', datetime('now'));
