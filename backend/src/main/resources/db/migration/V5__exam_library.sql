
-- Bộ đề tham khảo do Bộ GD&ĐT công bố:
-- https://vqa.moet.gov.vn/vi/news/tin-tuc-su-kien/de-thi-tham-khao-ky-thi-tot-nghiep-thpt-tu-nam-2025-159.html
-- Bản PDF kèm đáp án lưu từ cổng tuyển sinh Trường ĐH Ngoại ngữ, Đại học Huế:
-- https://tuyensinh.huflis.edu.vn/tin-tuc/de-thi-tham-khao-tot-nghiep-thpt-tu-nam-2025-kem-dap-an_20250207215943
INSERT INTO exams (id, subject_code, title, kind, exam_year, duration_minutes, source_name, paper_url, answer_guide_url)
VALUES
    ('d20da322-56e4-53ee-82ee-6ff0cc471cf3', 'math', 'Khởi động cùng đạo hàm', 'mystudy_practice', 2026, 20, 'MyStudy biên soạn', '/thi-thu/d20da322-56e4-53ee-82ee-6ff0cc471cf3/de', '/thi-thu/d20da322-56e4-53ee-82ee-6ff0cc471cf3/dap-an'),
    ('9147f250-3ed8-511a-9ff1-41349c7a7258', 'math', 'Đề tham khảo tốt nghiệp THPT', 'past_paper', 2025, 90, 'Bộ GD&ĐT', '/tai-lieu/toan-tham-khao-2025.pdf', '/tai-lieu/toan-tham-khao-2025.pdf#page=5'),
    ('e5767abd-9880-5609-974a-7f63b3f8e375', 'literature', 'Đề tham khảo tốt nghiệp THPT', 'past_paper', 2025, 120, 'Bộ GD&ĐT', '/tai-lieu/ngu-van-tham-khao-2025.pdf', '/tai-lieu/ngu-van-tham-khao-2025.pdf#page=2'),
    ('a2ea4478-45b3-5b06-93a6-e93aea304b83', 'english', 'Đề tham khảo tốt nghiệp THPT', 'past_paper', 2025, 50, 'Bộ GD&ĐT', '/tai-lieu/tieng-anh-tham-khao-2025.pdf', '/tai-lieu/tieng-anh-tham-khao-2025.pdf#page=5');

INSERT INTO exam_versions (id, exam_id, version_number, published_at)
VALUES ('74c400de-0319-5329-bece-6c0557f20d43', 'd20da322-56e4-53ee-82ee-6ff0cc471cf3', 1, now());

INSERT INTO exam_questions (version_id, question_number, prompt)
VALUES
    ('74c400de-0319-5329-bece-6c0557f20d43', 1, 'Đạo hàm của y = x³ là gì?'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 2, 'Đạo hàm của y = 5x − 7 là gì?'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 3, 'Với y = x² + 4x, giá trị y′ tại x = 1 bằng bao nhiêu?'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 4, 'Đạo hàm của y = (2x + 1)³ là gì?'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 5, 'Đạo hàm của y = x·sin x là gì?'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 6, 'Đạo hàm của y = 1/x với x ≠ 0 là gì?'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 7, 'Với y = x² − 3x, hệ số góc tiếp tuyến tại x = 2 bằng bao nhiêu?'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 8, 'Hàm số y = x² − 4x đồng biến trên khoảng nào?'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 9, 'Đạo hàm của y = eˣ + ln x với x > 0 là gì?'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 10, 'Hàm số y = x³ − 3x đạt cực đại tại điểm có hoành độ nào?');

INSERT INTO exam_options (version_id, question_number, option_number, content)
VALUES
    ('74c400de-0319-5329-bece-6c0557f20d43', 1, 1, '3x²'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 1, 2, 'x²'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 1, 3, '3x'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 1, 4, 'x⁴/4'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 2, 1, '5x'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 2, 2, '−7'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 2, 3, '5'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 2, 4, '0'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 3, 1, '2'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 3, 2, '4'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 3, 3, '5'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 3, 4, '6'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 4, 1, '3(2x + 1)²'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 4, 2, '6(2x + 1)²'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 4, 3, '6(2x + 1)'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 4, 4, '(2x + 1)²'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 5, 1, 'x·cos x'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 5, 2, 'sin x + cos x'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 5, 3, 'sin x + x·cos x'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 5, 4, 'cos x − x·sin x'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 6, 1, '−1/x²'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 6, 2, '1/x²'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 6, 3, '−1/x'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 6, 4, 'ln |x|'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 7, 1, '−1'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 7, 2, '0'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 7, 3, '2'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 7, 4, '1'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 8, 1, '(−∞; 2)'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 8, 2, '(2; +∞)'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 8, 3, '(−∞; 0)'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 8, 4, '(0; 2)'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 9, 1, 'eˣ + 1/x'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 9, 2, 'eˣ − 1/x'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 9, 3, 'eˣ + x'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 9, 4, '1 + 1/x'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 10, 1, '1'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 10, 2, '0'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 10, 3, '−1'),
    ('74c400de-0319-5329-bece-6c0557f20d43', 10, 4, '3');

INSERT INTO exam_answer_keys (version_id, question_number, correct_option_number)
VALUES
    ('74c400de-0319-5329-bece-6c0557f20d43', 1, 1),
    ('74c400de-0319-5329-bece-6c0557f20d43', 2, 3),
    ('74c400de-0319-5329-bece-6c0557f20d43', 3, 4),
    ('74c400de-0319-5329-bece-6c0557f20d43', 4, 2),
    ('74c400de-0319-5329-bece-6c0557f20d43', 5, 3),
    ('74c400de-0319-5329-bece-6c0557f20d43', 6, 1),
    ('74c400de-0319-5329-bece-6c0557f20d43', 7, 4),
    ('74c400de-0319-5329-bece-6c0557f20d43', 8, 2),
    ('74c400de-0319-5329-bece-6c0557f20d43', 9, 1),
    ('74c400de-0319-5329-bece-6c0557f20d43', 10, 3);

