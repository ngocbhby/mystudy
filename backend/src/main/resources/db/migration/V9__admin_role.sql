-- Thêm cột phân quyền role cho tài khoản người dùng
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'USER';

-- Cấp quyền ADMIN cho toàn bộ tài khoản hiện tại để quản trị ngay
UPDATE profiles SET role = 'ADMIN';

-- Tạo bảng lưu vết nếu cần, và đảm bảo cascade khi xóa đề thi
DO $$
BEGIN
    -- Cập nhật ràng buộc khóa ngoại để cascade xóa an toàn
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'exam_versions_exam_id_fkey'
    ) THEN
        ALTER TABLE exam_versions DROP CONSTRAINT exam_versions_exam_id_fkey;
        ALTER TABLE exam_versions ADD CONSTRAINT exam_versions_exam_id_fkey 
            FOREIGN KEY (exam_id) REFERENCES exams (id) ON DELETE CASCADE;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'exam_questions_version_id_fkey'
    ) THEN
        ALTER TABLE exam_questions DROP CONSTRAINT exam_questions_version_id_fkey;
        ALTER TABLE exam_questions ADD CONSTRAINT exam_questions_version_id_fkey 
            FOREIGN KEY (version_id) REFERENCES exam_versions (id) ON DELETE CASCADE;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'exam_options_version_id_question_number_fkey'
    ) THEN
        ALTER TABLE exam_options DROP CONSTRAINT exam_options_version_id_question_number_fkey;
        ALTER TABLE exam_options ADD CONSTRAINT exam_options_version_id_question_number_fkey 
            FOREIGN KEY (version_id, question_number) REFERENCES exam_questions (version_id, question_number) ON DELETE CASCADE;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'exam_attempts_version_id_fkey'
    ) THEN
        ALTER TABLE exam_attempts DROP CONSTRAINT exam_attempts_version_id_fkey;
        ALTER TABLE exam_attempts ADD CONSTRAINT exam_attempts_version_id_fkey 
            FOREIGN KEY (version_id) REFERENCES exam_versions (id) ON DELETE CASCADE;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'exam_attempt_answers_attempt_id_fkey'
    ) THEN
        ALTER TABLE exam_attempt_answers DROP CONSTRAINT exam_attempt_answers_attempt_id_fkey;
        ALTER TABLE exam_attempt_answers ADD CONSTRAINT exam_attempt_answers_attempt_id_fkey 
            FOREIGN KEY (attempt_id) REFERENCES exam_attempts (id) ON DELETE CASCADE;
    END IF;
END $$;
