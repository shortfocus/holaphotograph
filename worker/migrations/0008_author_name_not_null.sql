-- author_name NOT NULL 적용 (기존 NULL은 빈 문자열로)
CREATE TABLE customer_reviews_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  thumbnail_url TEXT,
  author_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'approved',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

INSERT INTO customer_reviews_new (id, title, content, thumbnail_url, author_name, status, created_at, updated_at)
SELECT id, title, content, thumbnail_url, COALESCE(author_name, ''), status, created_at, updated_at
FROM customer_reviews;

DROP TABLE customer_reviews;

ALTER TABLE customer_reviews_new RENAME TO customer_reviews;

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON customer_reviews(created_at DESC);
