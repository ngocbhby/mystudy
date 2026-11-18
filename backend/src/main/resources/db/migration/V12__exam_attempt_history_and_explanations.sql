-- V12: Thêm lời giải chi tiết cho câu hỏi và hỗ trợ lưu lịch sử bài làm thi thử (exam attempts)

-- 1. Thêm cột explanation vào exam_questions
ALTER TABLE exam_questions ADD COLUMN IF NOT EXISTS explanation text;

-- Cập nhật lời giải chi tiết cho các câu hỏi mẫu có sẵn trong đề thi trực tuyến (version 74c400de-0319-5329-bece-6c0557f20d43)
UPDATE exam_questions
SET explanation = 'Áp dụng công thức đạo hàm hàm lũy thừa: (xⁿ)′ = n·xⁿ⁻¹. Với n = 3, ta có (x³)′ = 3x².'
WHERE version_id = '74c400de-0319-5329-bece-6c0557f20d43' AND question_number = 1;

UPDATE exam_questions
SET explanation = 'Áp dụng công thức đạo hàm hàm bậc nhất: (ax + b)′ = a. Do đó (5x − 7)′ = 5.'
WHERE version_id = '74c400de-0319-5329-bece-6c0557f20d43' AND question_number = 2;

UPDATE exam_questions
SET explanation = 'Đạo hàm của y = x² + 4x là y′ = 2x + 4. Thay x = 1 vào y′, ta được y′(1) = 2(1) + 4 = 6.'
WHERE version_id = '74c400de-0319-5329-bece-6c0557f20d43' AND question_number = 3;

UPDATE exam_questions
SET explanation = 'Áp dụng quy tắc đạo hàm của hàm hợp: (u³)′ = 3u²·u′. Với u = 2x + 1 (u′ = 2), ta có y′ = 3(2x + 1)²·2 = 6(2x + 1)².'
WHERE version_id = '74c400de-0319-5329-bece-6c0557f20d43' AND question_number = 4;

UPDATE exam_questions
SET explanation = 'Áp dụng quy tắc đạo hàm tích: (u·v)′ = u′v + uv′. Với u = x (u′ = 1) và v = sin x (v′ = cos x), ta có y′ = 1·sin x + x·cos x = sin x + x·cos x.'
WHERE version_id = '74c400de-0319-5329-bece-6c0557f20d43' AND question_number = 5;

UPDATE exam_questions
SET explanation = 'Áp dụng công thức đạo hàm hàm phân thức cơ bản: (1/x)′ = −1/x² với mọi x ≠ 0.'
WHERE version_id = '74c400de-0319-5329-bece-6c0557f20d43' AND question_number = 6;

UPDATE exam_questions
SET explanation = 'Hệ số góc của tiếp tuyến đồ thị hàm số y = f(x) tại điểm x₀ là k = f′(x₀). Ta có y′ = 2x − 3. Tại x = 2, k = y′(2) = 2(2) − 3 = 1.'
WHERE version_id = '74c400de-0319-5329-bece-6c0557f20d43' AND question_number = 7;

UPDATE exam_questions
SET explanation = 'Đạo hàm y′ = 2x − 4. Cho y′ > 0 ⇔ 2x − 4 > 0 ⇔ x > 2. Do đó hàm số đồng biến trên khoảng (2; +∞).'
WHERE version_id = '74c400de-0319-5329-bece-6c0557f20d43' AND question_number = 8;

UPDATE exam_questions
SET explanation = 'Đạo hàm từng số hạng: (eˣ)′ = eˣ và (ln x)′ = 1/x (với x > 0). Vậy y′ = eˣ + 1/x.'
WHERE version_id = '74c400de-0319-5329-bece-6c0557f20d43' AND question_number = 9;

UPDATE exam_questions
SET explanation = 'Đạo hàm y′ = 3x² − 3 = 3(x² − 1). y′ = 0 ⇔ x = ±1. Ta có y″ = 6x. Tại x = −1, y″(−1) = −6 < 0 nên hàm số đạt cực đại tại x = −1.'
WHERE version_id = '74c400de-0319-5329-bece-6c0557f20d43' AND question_number = 10;

-- 2. Cập nhật bảng exam_attempts để linh hoạt lưu trữ lịch sử thi thử
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'exam_attempts'::regclass AND contype = 'c'
    ) LOOP
        EXECUTE 'ALTER TABLE exam_attempts DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
END $$;

ALTER TABLE exam_attempts ALTER COLUMN expires_at DROP NOT NULL;
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS elapsed_seconds integer;
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS score numeric(4,2);

ALTER TABLE exam_attempts ADD CONSTRAINT exam_attempts_question_count_check CHECK (question_count > 0);
ALTER TABLE exam_attempts ADD CONSTRAINT exam_attempts_counts_check CHECK (
    correct_count IS NULL OR (correct_count >= 0 AND incorrect_count >= 0 AND blank_count >= 0)
);
