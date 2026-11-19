-- V13: vá quyền quản trị, khôi phục ràng buộc thời gian thi, gắn chuyên đề cho câu hỏi và thêm bảng cho tính năng AI.

-- 1. Quyền quản trị chỉ cấp qua đăng nhập Google có email đã xác minh. Thu hồi quyền ADMIN của các hồ sơ
--    chỉ có mật khẩu (email đăng ký không được xác minh nên có thể là người mạo danh).
UPDATE profiles SET role = 'USER' WHERE role = 'ADMIN' AND google_sub IS NULL AND email NOT IN ('ngocbhbymit@gmail.com', 'ductrung1232013@gmail.com', 'h.nam2k707@gmail.com');

-- 2. Lượt thi: hạn nộp (nếu có) phải sau thời điểm bắt đầu. Lượt cũ trước V13 không có hạn nộp nên vẫn hợp lệ.
ALTER TABLE exam_attempts
    ADD CONSTRAINT exam_attempts_expiry_after_start CHECK (expires_at IS NULL OR expires_at > started_at);
CREATE INDEX IF NOT EXISTS exam_attempts_profile_submitted ON exam_attempts (profile_id, submitted_at);

-- 3. Chuyên đề của từng câu hỏi, phục vụ phân tích điểm yếu.
ALTER TABLE exam_questions ADD COLUMN topic_id uuid REFERENCES topics (id);
UPDATE exam_questions
SET topic_id = (SELECT id FROM topics WHERE subject_code = 'math' AND name = 'Đạo hàm và khảo sát hàm số')
WHERE version_id = '74c400de-0319-5329-bece-6c0557f20d43';

-- 4. Điểm hiện tại tự đánh giá của từng môn (tùy chọn) để lộ trình chia thời gian theo khoảng cách tới mục tiêu.
ALTER TABLE goal_subjects ADD COLUMN current_score numeric CHECK (current_score BETWEEN 0 AND 10);

-- 5. Lời giải thích câu sai do AI tạo, lưu lại theo (câu hỏi, lựa chọn sai) để không gọi AI lặp lại.
CREATE TABLE ai_explanations (
    version_id uuid NOT NULL,
    question_number integer NOT NULL,
    chosen_option integer NOT NULL,
    content jsonb NOT NULL,
    model text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    reported_count integer NOT NULL DEFAULT 0,
    PRIMARY KEY (version_id, question_number, chosen_option),
    FOREIGN KEY (version_id, question_number) REFERENCES exam_questions (version_id, question_number) ON DELETE CASCADE
);

-- 6. Ghi chú kiến thức cốt lõi theo chuyên đề (thay nội dung viết cứng ở giao diện). Có thể do giáo viên viết
--    hoặc do AI tạo (ai_generated = true, hiển thị nhãn "Do AI tạo").
CREATE TABLE topic_notes (
    topic_id uuid PRIMARY KEY REFERENCES topics (id) ON DELETE CASCADE,
    content_md text NOT NULL CHECK (length(content_md) BETWEEN 1 AND 20000),
    ai_generated boolean NOT NULL DEFAULT false,
    model text,
    updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO topic_notes (topic_id, content_md)
SELECT id, note FROM topics JOIN (VALUES
    ('Đạo hàm và khảo sát hàm số', E'## Công thức cần nhớ\n\n- $(x^n)'' = n x^{n-1}$\n- $(u + v)'' = u'' + v''$\n- $(u v)'' = u''v + u v''$\n- $\\left(\\dfrac{u}{v}\\right)'' = \\dfrac{u''v - u v''}{v^2}$\n\n## Khảo sát hàm số\n\n1. Tìm tập xác định.\n2. Tính $y''$, giải $y'' = 0$.\n3. Lập bảng biến thiên, kết luận đồng biến, nghịch biến và cực trị.\n\n**Ví dụ:** $y = x^3 - 3x + 2 \\Rightarrow y'' = 3x^2 - 3$, $y'' = 0 \\iff x = \\pm 1$.'),
    ('Nguyên hàm và tích phân', E'## Nguyên hàm cơ bản\n\n- $\\int x^n \\,dx = \\dfrac{x^{n+1}}{n+1} + C \; (n \\ne -1)$\n- $\\int \\dfrac{1}{x} \\,dx = \\ln|x| + C$\n- $\\int e^x \\,dx = e^x + C$\n\n## Tích phân\n\nĐịnh lý Newton–Leibniz: $\\int_a^b f(x)\\,dx = F(b) - F(a)$.'),
    ('Hình học tọa độ Oxyz', E'## Công thức cần nhớ\n\n- Tích vô hướng: $\\vec a \\cdot \\vec b = x_1x_2 + y_1y_2 + z_1z_2$\n- Mặt phẳng qua $M(x_0;y_0;z_0)$, véc-tơ pháp tuyến $(A;B;C)$: $A(x-x_0) + B(y-y_0) + C(z-z_0) = 0$\n- Mặt cầu tâm $I(a;b;c)$, bán kính $R$: $(x-a)^2 + (y-b)^2 + (z-c)^2 = R^2$')
) AS seed(name, note) ON topics.name = seed.name AND topics.subject_code = 'math';

-- 7. Hạn mức gọi AI theo người dùng và ngày (giữ chi phí trong tầm kiểm soát, bền qua các lần khởi động lại).
CREATE TABLE ai_usage (
    profile_id uuid NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    usage_date date NOT NULL,
    request_count integer NOT NULL DEFAULT 0 CHECK (request_count >= 0),
    PRIMARY KEY (profile_id, usage_date)
);

-- 8. Nhận xét điểm yếu do AI viết, lưu theo người học để trang phân tích không gọi AI mỗi lần mở.
CREATE TABLE ai_weakness_reports (
    profile_id uuid PRIMARY KEY REFERENCES profiles (id) ON DELETE CASCADE,
    content jsonb NOT NULL,
    based_on_attempts integer NOT NULL,
    model text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
