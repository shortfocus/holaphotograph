-- 강의 소식 수신 신청 이메일
CREATE TABLE IF NOT EXISTS lecture_signups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_lecture_signups_email ON lecture_signups(email);
CREATE INDEX IF NOT EXISTS idx_lecture_signups_created_at ON lecture_signups(created_at DESC);
