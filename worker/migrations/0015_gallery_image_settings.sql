-- 갤러리 이미지별 사진 설정 (태그 형식: saturation -1, hue +1, key +1)
ALTER TABLE gallery_images ADD COLUMN photo_settings TEXT;
