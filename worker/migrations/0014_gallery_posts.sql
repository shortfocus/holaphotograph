-- 갤러리: 글(post) 1개에 이미지 여러 장
CREATE TABLE IF NOT EXISTS gallery_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS gallery_images_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (post_id) REFERENCES gallery_posts(id) ON DELETE CASCADE
);

-- 기존 단일 이미지 행 → 글 1개 + 이미지 1장으로 이전
INSERT INTO gallery_posts (id, title, created_at, updated_at)
SELECT id, title, created_at, created_at FROM gallery_images;

INSERT INTO gallery_images_new (post_id, image_url, sort_order, created_at)
SELECT id, image_url, sort_order, created_at FROM gallery_images;

DROP TABLE gallery_images;
ALTER TABLE gallery_images_new RENAME TO gallery_images;

CREATE INDEX IF NOT EXISTS idx_gallery_images_post ON gallery_images(post_id, sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_gallery_posts_created ON gallery_posts(created_at DESC);
