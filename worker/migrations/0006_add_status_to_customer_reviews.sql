-- 고객 후기 상태: pending(대기), approved(승인 후 노출). 기존 행은 approved 유지
ALTER TABLE customer_reviews ADD COLUMN status TEXT NOT NULL DEFAULT 'approved';
