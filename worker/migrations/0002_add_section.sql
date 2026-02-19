-- 섹션 구분: reviews(최신리뷰), guides(입문자가이드), models(카메라모델별), youtube(유튜브영상)
ALTER TABLE posts ADD COLUMN section TEXT DEFAULT 'reviews';

-- 기존 데이터 마이그레이션: 유튜브 전용 글이면 section=youtube
UPDATE posts SET section = 'youtube' WHERE youtube_url IS NOT NULL AND (content IS NULL OR trim(content) = '');
