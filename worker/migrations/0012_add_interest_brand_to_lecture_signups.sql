-- 강의 소식 신청: 관심 브랜드 (nullable enum)
ALTER TABLE lecture_signups ADD COLUMN interest_brand TEXT
  CHECK (interest_brand IS NULL OR interest_brand IN ('SONY', 'RICOH', 'FUJI'));
