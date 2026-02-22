-- 고객 후기 구분: 'snap'(스냅 촬영 후기), 'lecture'(강의 수강 후기)
ALTER TABLE customer_reviews ADD COLUMN review_type TEXT NOT NULL DEFAULT 'lecture';
