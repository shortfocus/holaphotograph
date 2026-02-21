-- customer_reviews 테이블에서 youtube_url, section 컬럼 제거
ALTER TABLE customer_reviews DROP COLUMN youtube_url;
ALTER TABLE customer_reviews DROP COLUMN section;
