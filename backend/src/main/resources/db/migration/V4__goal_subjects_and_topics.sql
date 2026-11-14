
INSERT INTO subjects (code, name) VALUES
    ('physics', 'Vật lí'),
    ('chemistry', 'Hóa học'),
    ('biology', 'Sinh học'),
    ('history', 'Lịch sử'),
    ('geography', 'Địa lí'),
    ('civics', 'Giáo dục kinh tế và pháp luật'),
    ('informatics', 'Tin học'),
    ('technology', 'Công nghệ'),
    ('english', 'Tiếng Anh')
ON CONFLICT (code) DO NOTHING;

-- Preserve the order of the learner's two elective choices on reload.
ALTER TABLE goal_subjects
    ADD COLUMN elective_order smallint CHECK (elective_order IN (1, 2)),
    ADD UNIQUE (goal_id, elective_order);

ALTER TABLE topics ADD COLUMN curriculum_order integer CHECK (curriculum_order > 0);

INSERT INTO topics (subject_code, name, curriculum_order)
SELECT subject_code, name, ordinality
FROM (VALUES
    ('math', ARRAY['Đạo hàm và khảo sát hàm số', 'Nguyên hàm và tích phân', 'Hình học tọa độ Oxyz', 'Xác suất có điều kiện và thống kê']),
    ('literature', ARRAY['Đọc hiểu văn bản', 'Viết đoạn nghị luận văn học', 'Viết bài nghị luận xã hội', 'Luyện đề đọc hiểu và viết']),
    ('physics', ARRAY['Vật lí nhiệt', 'Khí lí tưởng', 'Từ trường', 'Vật lí hạt nhân']),
    ('chemistry', ARRAY['Ester và lipid', 'Carbohydrate', 'Hợp chất chứa nitrogen và polymer', 'Điện hóa học và kim loại']),
    ('biology', ARRAY['Di truyền phân tử', 'Quy luật di truyền', 'Tiến hóa', 'Sinh thái học']),
    ('history', ARRAY['Thế giới sau năm 1945', 'ASEAN và quan hệ quốc tế', 'Lịch sử Việt Nam hiện đại', 'Công cuộc Đổi mới']),
    ('geography', ARRAY['Địa lí tự nhiên Việt Nam', 'Dân cư và lao động', 'Các ngành kinh tế', 'Địa lí các vùng và kĩ năng đọc biểu đồ']),
    ('civics', ARRAY['Tăng trưởng và phát triển kinh tế', 'Bảo hiểm và an sinh xã hội', 'Lập kế hoạch kinh doanh', 'Quyền và nghĩa vụ của công dân']),
    ('informatics', ARRAY['Mạng máy tính', 'Dữ liệu và cơ sở dữ liệu', 'Thuật toán và lập trình', 'Ứng dụng tin học']),
    ('technology', ARRAY['Thiết kế và công nghệ', 'Công nghệ điện và điện tử', 'Công nghệ trồng trọt', 'Lâm nghiệp và thủy sản']),
    ('english', ARRAY['Đọc điền khuyết', 'Đọc hiểu và suy luận', 'Sắp xếp hội thoại và đoạn văn', 'Từ vựng trong ngữ cảnh'])
) AS curriculum(subject_code, names)
CROSS JOIN LATERAL unnest(names) WITH ORDINALITY AS entries(name, ordinality)
ON CONFLICT (subject_code, name) DO UPDATE SET curriculum_order = EXCLUDED.curriculum_order;

