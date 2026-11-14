-- Kho bài mẫu: thêm chuyên đề dùng để phân loại bài mẫu (không có curriculum_order nên không tham gia xếp lịch học)
-- và ba bài mẫu đầu tiên do MyStudy biên soạn.
INSERT INTO topics (subject_code, name) VALUES
    ('math', 'Hàm số'),
    ('literature', 'Nghị luận xã hội'),
    ('literature', 'Kĩ năng viết')
ON CONFLICT (subject_code, name) DO NOTHING;

INSERT INTO worked_examples (subject_code, topic_id, title, exercise_type, prompt, model_solution, solution_note, source_name)
SELECT 'literature', t.id, 'Sức mạnh của sự kiên trì', 'Đoạn văn 200 chữ',
       'Viết đoạn văn khoảng 200 chữ trình bày suy nghĩ về vai trò của sự kiên trì trong học tập.',
       E'Kiên trì là bền bỉ theo đuổi mục tiêu dù gặp khó khăn. Trong học tập, phẩm chất ấy giúp chúng ta không bỏ cuộc sau một điểm số chưa tốt, mà bình tĩnh tìm nguyên nhân và thử cách học phù hợp hơn. Một bài toán khó có thể cần nhiều lần làm lại; một đoạn văn hay cũng thường bắt đầu bằng bản nháp vụng về. Mỗi lần sửa sai là một cơ hội hiểu sâu hơn và rèn tính tự giác.\n\nChẳng hạn, một học sinh yếu ngoại ngữ có thể bắt đầu bằng mười từ mới mỗi ngày, ôn lại đều đặn và luyện nói từng câu ngắn. Thành quả không đến ngay, nhưng sự tích lũy lặng lẽ sẽ tạo thay đổi. Tuy vậy, kiên trì không đồng nghĩa với cố chấp: khi phương pháp chưa hiệu quả, ta cần hỏi thầy cô, điều chỉnh kế hoạch và nghỉ ngơi hợp lí. Với tôi, kiên trì bắt đầu từ việc hoàn thành nhiệm vụ nhỏ đã đặt ra hôm nay. Đi chậm nhưng đều đặn giúp mỗi người tiến gần hơn tới mục tiêu của mình.',
       'Giải thích → Phân tích → Dẫn chứng → Mở rộng → Bài học. Tránh kể chuyện dài, giữ một luận điểm xuyên suốt.',
       'MyStudy biên soạn'
FROM topics t WHERE t.subject_code = 'literature' AND t.name = 'Nghị luận xã hội';

INSERT INTO worked_examples (subject_code, topic_id, title, exercise_type, prompt, model_solution, solution_note, source_name)
SELECT 'math', t.id, 'Đạo hàm & khoảng đồng biến', 'Lời giải từng bước',
       'Cho y = x³ − 3x + 2. Tính đạo hàm và tìm các khoảng đồng biến của hàm số.',
       E'Tập xác định: D = ℝ.\ny′ = 3x² − 3 = 3(x − 1)(x + 1).\ny′ > 0 ⇔ x < −1 hoặc x > 1.\nVậy hàm số đồng biến trên (−∞; −1) và (1; +∞).',
       'Tính y′ → giải y′ = 0 → xét dấu → kết luận từng khoảng. Không gộp hai khoảng đồng biến thành một khoảng.',
       'MyStudy biên soạn'
FROM topics t WHERE t.subject_code = 'math' AND t.name = 'Hàm số';

INSERT INTO worked_examples (subject_code, topic_id, title, exercise_type, prompt, model_solution, solution_note, source_name)
SELECT 'literature', t.id, 'Lập dàn ý nghị luận xã hội', 'Khung triển khai',
       'Lập dàn ý cho bài nghị luận xã hội: "Ý nghĩa của việc dám thử và dám sai".',
       E'Mở bài: dẫn dắt vấn đề, nêu rõ ý kiến cần bàn luận.\nGiải thích: dám thử, dám sai nghĩa là gì?\nBàn luận: vì sao cần dám thử? Dám sai mang lại bài học gì? Nêu dẫn chứng từ đời sống, học tập.\nPhản biện: thử một cách liều lĩnh khác với thử có chuẩn bị như thế nào?\nKết bài: khẳng định ý nghĩa, liên hệ bản thân.',
       'Mỗi ý lớn ứng với một đoạn; luôn đi theo trình tự luận điểm → lí lẽ → dẫn chứng.',
       'MyStudy biên soạn'
FROM topics t WHERE t.subject_code = 'literature' AND t.name = 'Kĩ năng viết';
