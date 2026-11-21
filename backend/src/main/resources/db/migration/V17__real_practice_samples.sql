-- Bổ sung các chuyên đề phục vụ kho bài mẫu thực tế
INSERT INTO topics (subject_code, name) VALUES
    ('physics', 'Dao động cơ'),
    ('physics', 'Dòng điện xoay chiều'),
    ('chemistry', 'Kim loại và dung dịch axit'),
    ('english', 'Ngữ pháp và cấu trúc câu')
ON CONFLICT (subject_code, name) DO NOTHING;

-- Xóa bỏ các bài mẫu dạng khung sơ sài cũ để thay thế bằng bài tập thực tế hoàn chỉnh
DELETE FROM worked_examples WHERE title IN ('Lập dàn ý nghị luận xã hội');

-- 1. TOÁN HỌC: Bài toán tối ưu hóa thực tế
INSERT INTO worked_examples (subject_code, topic_id, title, exercise_type, prompt, model_solution, solution_note, source_name)
SELECT 'math', t.id,
       'Bài toán tối ưu chi phí làm thùng chứa',
       'Lời giải từng bước',
       E'Một xưởng cơ khí cần làm một thùng chứa hình hộp chữ nhật không nắp có thể tích V = 500 m³. Đáy thùng là hình chữ nhật có chiều dài gấp đôi chiều rộng. Giá vật liệu làm đáy là 150.000 đ/m², giá vật liệu làm thành xung quanh là 100.000 đ/m². Tìm kích thước các cạnh của thùng để tổng chi phí làm thùng là nhỏ nhất.',
       E'Gọi chiều rộng đáy thùng là x (m, x > 0).\nChiều dài đáy thùng là 2x (m).\nDiện tích đáy thùng: S_đáy = x * 2x = 2x² (m²).\nTừ công thức thể tích V = S_đáy * h = 2x² * h = 500 (m³), suy ra chiều cao: h = 500 / (2x²) = 250 / x² (m).\nDiện tích thành xung quanh: S_xq = 2 * (x + 2x) * h = 6x * (250 / x²) = 1500 / x (m²).\nTổng chi phí sản xuất: C(x) = 150.000 * S_đáy + 100.000 * S_xq = 150.000 * (2x²) + 100.000 * (1500 / x) = 300.000x² + 150.000.000 / x (đồng).\nXét hàm số f(x) = 300.000x² + 150.000.000 / x trên (0; +∞):\nĐạo hàm: f''(x) = 600.000x - 150.000.000 / x².\nCho f''(x) = 0 <=> 600.000x³ = 150.000.000 <=> x³ = 250 <=> x = ∛250 = 5∛2 (m).\nLập bảng biến thiên: f''(x) đổi dấu từ âm sang dương qua x = 5∛2, do đó hàm số đạt cực tiểu tại x = 5∛2.\nKết luận: Kích thước thùng tối ưu là: Chiều rộng đáy x = 5∛2 m, chiều dài đáy 2x = 10∛2 m, chiều cao h = 250 / (5∛2)² = 5 * ∛2 m.',
       'Phương pháp: Đặt ẩn kích thước đáy -> biểu diễn chiều cao h qua thể tích V -> lập hàm chi phí theo một biến x -> khảo sát đạo hàm tìm giá trị nhỏ nhất.',
       'MyStudy biên soạn'
FROM topics t WHERE t.subject_code = 'math' AND t.name = 'Hàm số' LIMIT 1;

-- 2. TOÁN HỌC: Ứng dụng tích phân tính diện tích hình phẳng
INSERT INTO worked_examples (subject_code, topic_id, title, exercise_type, prompt, model_solution, solution_note, source_name)
SELECT 'math', t.id,
       'Tính diện tích hình phẳng giới hạn bởi Parabol và đường thẳng',
       'Lời giải từng bước',
       E'Tính diện tích S của hình phẳng giới hạn bởi parabol (P): y = x² - 2x và đường thẳng d: y = x + 4.',
       E'Phương trình hoành độ giao điểm của (P) và d:\nx² - 2x = x + 4 <=> x² - 3x - 4 = 0 <=> x = -1 hoặc x = 4.\nTrên đoạn [-1; 4], xét hiệu: (x + 4) - (x² - 2x) = -x² + 3x + 4 >= 0 (đường thẳng nằm phía trên parabol).\nDiện tích hình phẳng cần tìm là:\nS = ∫[-1 to 4] |(x² - 2x) - (x + 4)| dx = ∫[-1 to 4] (-x² + 3x + 4) dx.\nNguyên hàm: F(x) = -x³/3 + 3x²/2 + 4x.\nThay cận: S = F(4) - F(-1) = (-64/3 + 24 + 16) - (1/3 + 3/2 - 4) = (56/3) - (-13/6) = 112/6 + 13/6 = 125/6 (đvdt).\nKết luận: Diện tích S = 125/6.',
       'Phương pháp: Tìm hoành độ giao điểm -> xác định vị trí đồ thị trên khoảng lấy tích phân -> tính tích phân hiệu hai hàm số.',
       'Đề thi thử THPT Quốc gia'
FROM topics t WHERE t.subject_code = 'math' AND t.name = 'Nguyên hàm và tích phân' LIMIT 1;

-- 3. TOÁN HỌC: Hình học không gian Oxyz
INSERT INTO worked_examples (subject_code, topic_id, title, exercise_type, prompt, model_solution, solution_note, source_name)
SELECT 'math', t.id,
       'Phương trình mặt phẳng đi qua 1 điểm và vuông góc đường thẳng',
       'Lời giải từng bước',
       E'Trong không gian Oxyz, cho điểm A(1; -2; 3) và đường thẳng d: (x - 2)/1 = (y + 1)/(-2) = (z - 1)/3. Viết phương trình mặt phẳng (P) đi qua A và vuông góc với đường thẳng d. Tìm tọa độ giao điểm H của d và (P).',
       E'Đường thẳng d có véc-tơ chỉ phương: u_d = (1; -2; 3).\nVì mặt phẳng (P) vuông góc với đường thẳng d nên véc-tơ pháp tuyến của (P) là n_P = u_d = (1; -2; 3).\nMặt phẳng (P) đi qua A(1; -2; 3) có phương trình:\n1*(x - 1) - 2*(y + 2) + 3*(z - 3) = 0 <=> x - 2y + 3z - 14 = 0.\nPhương trình tham số của đường thẳng d: x = 2 + t, y = -1 - 2t, z = 1 + 3t (t ∈ ℝ).\nĐiểm H thuộc d nên H(2 + t; -1 - 2t; 1 + 3t). Vì H thuộc (P) nên thay vào phương trình (P):\n(2 + t) - 2(-1 - 2t) + 3(1 + 3t) - 14 = 0 <=> 14t - 7 = 0 <=> t = 1/2.\nThay t = 1/2 vào tọa độ của H: x = 2 + 1/2 = 5/2; y = -1 - 1 = -2; z = 1 + 3/2 = 5/2.\nKết luận: Phương trình (P) là x - 2y + 3z - 14 = 0 và hình chiếu vuông góc H(5/2; -2; 5/2).',
       'Lưu ý: Mặt phẳng vuông góc với đường thẳng thì nhận véc-tơ chỉ phương của đường thẳng làm véc-tơ pháp tuyến. Chuyển đường thẳng về dạng tham số để tìm giao điểm.',
       'MyStudy biên soạn'
FROM topics t WHERE t.subject_code = 'math' AND t.name = 'Hình học tọa độ Oxyz' LIMIT 1;

-- 4. VẬT LÍ: Dao động cơ học (Con lắc lò xo)
INSERT INTO worked_examples (subject_code, topic_id, title, exercise_type, prompt, model_solution, solution_note, source_name)
SELECT 'physics', t.id,
       'Phương trình dao động và năng lượng con lắc lò xo',
       'Lời giải từng bước',
       E'Một con lắc lò xo nằm ngang gồm vật nhỏ m = 200 g và lò xo có độ cứng k = 50 N/m. Kéo vật ra khỏi vị trí cân bằng theo chiều dương một đoạn 4 cm rồi buông nhẹ tại thời điểm t = 0. Bỏ qua mọi ma sát. Lấy π² = 10. Viết phương trình dao động của vật và tính cơ năng của con lắc.',
       E'Đổi đơn vị: m = 200 g = 0,2 kg; k = 50 N/m; biên độ A = 4 cm = 0,04 m (do buông nhẹ nên vận tốc ban đầu v0 = 0).\nTần số góc của dao động: ω = √(k / m) = √(50 / 0,2) = √250 = √(25 * 10) = 5π (rad/s).\nTại t = 0: x = A * cos(φ) = 4 * cos(φ) = 4 <=> cos(φ) = 1 <=> pha ban đầu φ = 0 (rad).\nPhương trình dao động điều hòa của vật: x = 4 cos(5πt) (cm).\nCơ năng dao động của con lắc: W = 1/2 * k * A² = 1/2 * 50 * (0,04)² = 25 * 0,0016 = 0,04 (J) = 40 mJ.\nKết luận: Phương trình x = 4 cos(5πt) (cm) và cơ năng W = 40 mJ.',
       'Công thức cốt lõi: ω = √(k/m); thả nhẹ tại vị trí nào thì độ dời đó chính là biên độ A; W = 1/2 k A².',
       'Đề thi thử chuyên KHTN'
FROM topics t WHERE t.subject_code = 'physics' AND t.name = 'Dao động cơ' LIMIT 1;

-- 5. VẬT LÍ: Mạch điện xoay chiều RLC nối tiếp
INSERT INTO worked_examples (subject_code, topic_id, title, exercise_type, prompt, model_solution, solution_note, source_name)
SELECT 'physics', t.id,
       'Tính tổng trở, cường độ dòng điện và hệ số công suất mạch RLC',
       'Lời giải từng bước',
       E'Đặt điện áp xoay chiều u = 120√2 cos(100πt) (V) vào hai đầu đoạn mạch RLC nối tiếp gồm điện trở thuần R = 40 Ω, cuộn cảm thuần có L = 0,8/π H và tụ điện có điện dung C = 10⁻⁴/π F. Tính tổng trở của đoạn mạch, cường độ dòng điện hiệu dụng và hệ số công suất cosφ.',
       E'Tần số góc: ω = 100π (rad/s). Điện áp hiệu dụng: U = 120 V.\nCảm kháng của cuộn dây: ZL = ω * L = 100π * (0,8 / π) = 80 (Ω).\nDung kháng của tụ điện: ZC = 1 / (ω * C) = 1 / (100π * 10⁻⁴ / π) = 1 / 10⁻² = 100 (Ω).\nTổng trở của toàn mạch: Z = √[R² + (ZL - ZC)²] = √[40² + (80 - 100)²] = √[1600 + 400] = √2000 = 20√5 ≈ 44,72 (Ω).\nCường độ dòng điện hiệu dụng trong mạch: I = U / Z = 120 / (20√5) = 6 / √5 = 1,2√5 ≈ 2,68 (A).\nHệ số công suất của đoạn mạch: cosφ = R / Z = 40 / (20√5) = 2 / √5 ≈ 0,894.\nKết luận: Tổng trở Z = 20√5 Ω, cường độ dòng điện I = 1,2√5 A và hệ số công suất cosφ ≈ 0,894.',
       'Công thức cần nhớ: ZL = ωL, ZC = 1/(ωC), Z = √[R² + (ZL - ZC)²], I = U/Z, cosφ = R/Z. Do ZC > ZL nên mạch có tính dung kháng, dòng điện sớm pha hơn điện áp.',
       'MyStudy biên soạn'
FROM topics t WHERE t.subject_code = 'physics' AND t.name = 'Dòng điện xoay chiều' LIMIT 1;

-- 6. HÓA HỌC: Bài toán kim loại tác dụng axit loãng
INSERT INTO worked_examples (subject_code, topic_id, title, exercise_type, prompt, model_solution, solution_note, source_name)
SELECT 'chemistry', t.id,
       'Xác định thành phần phần trăm kim loại trong hỗn hợp Fe và Cu',
       'Lời giải từng bước',
       E'Hòa tan hoàn toàn 11,2 gam hỗn hợp gồm bột Fe và Cu vào một lượng dư dung dịch H2SO4 loãng. Sau khi phản ứng kết thúc, thu được 3,36 lít khí H2 (ở đktc) và m gam chất rắn không tan. Tính phần trăm khối lượng của từng kim loại trong hỗn hợp ban đầu và giá trị m.',
       E'Cu đứng sau hiđro trong dãy hoạt động hóa học nên Cu không phản ứng với dung dịch H2SO4 loãng. Chỉ có Fe phản ứng.\nPhương trình hóa học: Fe + H2SO4 -> FeSO4 + H2 ↑.\nSố mol khí H2 thu được: n_H2 = 3,36 / 22,4 = 0,15 (mol).\nTheo phương trình phản ứng: n_Fe = n_H2 = 0,15 (mol).\nKhối lượng của Fe trong hỗn hợp: m_Fe = 0,15 * 56 = 8,4 (gam).\nKhối lượng Cu không tan (chất rắn m): m = m_Cu = m_hỗn_hợp - m_Fe = 11,2 - 8,4 = 2,8 (gam).\nPhần trăm khối lượng của Fe: %m_Fe = (8,4 / 11,2) * 100% = 75%.\nPhần trăm khối lượng của Cu: %m_Cu = 100% - 75% = 25%.\nKết luận: %m_Fe = 75%, %m_Cu = 25% và chất rắn không tan m = 2,8 gam.',
       'Phương pháp: Vận dụng dãy hoạt động hóa học kim loại: chỉ các kim loại đứng trước H mới giải phóng khí H2 với axit loãng HCl, H2SO4.',
       'Đề thi tuyển sinh THPT'
FROM topics t WHERE t.subject_code = 'chemistry' AND t.name = 'Kim loại và dung dịch axit' LIMIT 1;

-- 7. SINH HỌC: Quy luật phân ly độc lập Men-đen
INSERT INTO worked_examples (subject_code, topic_id, title, exercise_type, prompt, model_solution, solution_note, source_name)
SELECT 'biology', t.id,
       'Tính tỉ lệ kiểu gen và kiểu hình ở đời con trong quy luật Men-đen',
       'Lời giải từng bước',
       E'Ở đậu Hà Lan, alen A quy định thân cao trội hoàn toàn so với alen a quy định thân thấp; alen B quy định hoa đỏ trội hoàn toàn so với alen b quy định hoa trắng. Hai cặp gen này nằm trên hai cặp nhiễm sắc thể tương đồng khác nhau. Cho cây dị hợp tử hai cặp gen (AaBb) tự thụ phấn. Xác định: 1. Tỉ lệ kiểu hình thân cao, hoa trắng ở F1. 2. Tỉ lệ kiểu gen đồng hợp tử lặn về cả hai tính trạng ở F1.',
       E'Xét riêng từng cặp tính trạng trong phép lai AaBb x AaBb:\n1. Phép lai Aa x Aa:\n- Tỉ lệ kiểu gen: 1/4 AA : 2/4 Aa : 1/4 aa.\n- Tỉ lệ kiểu hình: 3/4 thân cao (A-) : 1/4 thân thấp (aa).\n2. Phép lai Bb x Bb:\n- Tỉ lệ kiểu gen: 1/4 BB : 2/4 Bb : 1/4 bb.\n- Tỉ lệ kiểu hình: 3/4 hoa đỏ (B-) : 1/4 hoa trắng (bb).\n3. Do hai cặp gen phân ly độc lập, tỉ lệ chung ở F1 là tích tỉ lệ các cặp:\n- Tỉ lệ kiểu hình thân cao, hoa trắng (A-bb) = (tỉ lệ thân cao) * (tỉ lệ hoa trắng) = 3/4 * 1/4 = 3/16 (18,75%).\n- Tỉ lệ kiểu gen đồng hợp tử lặn (aabb) = (tỉ lệ aa) * (tỉ lệ bb) = 1/4 * 1/4 = 1/16 (6,25%).\nKết luận: Tỉ lệ thân cao, hoa trắng là 3/16; tỉ lệ đồng hợp tử lặn là 1/16.',
       'Quy tắc vàng: Khi các cặp gen phân ly độc lập, hãy tách riêng từng cặp tính trạng để tính tỉ lệ, sau đó nhân các xác suất độc lập lại với nhau.',
       'MyStudy biên soạn'
FROM topics t WHERE t.subject_code = 'biology' AND t.name = 'Quy luật di truyền' LIMIT 1;

-- 8. TIẾNG ANH: Rút gọn mệnh đề quan hệ
INSERT INTO worked_examples (subject_code, topic_id, title, exercise_type, prompt, model_solution, solution_note, source_name)
SELECT 'english', t.id,
       'Phương pháp giải dạng bài rút gọn mệnh đề quan hệ',
       'Phân tích từng bước',
       E'Chọn đáp án đúng và giải thích chi tiết:\n"The students _______ in the competition were awarded scholarships."\nA. participated\nB. participating\nC. participate\nD. were participating',
       E'Bước 1: Phân tích cấu trúc câu:\n- Chủ ngữ chính của câu: "The students".\n- Vị ngữ chính của câu: "were awarded scholarships" (thì quá khứ đơn, thể bị động).\n- Vì câu đã có động từ chính hoàn chỉnh ("were awarded"), nên phần đứng giữa chủ ngữ và vị ngữ phải là một mệnh đề quan hệ bổ nghĩa cho "The students".\n\nBước 2: Viết lại ở dạng mệnh đề quan hệ đầy đủ:\n"The students WHO PARTICIPATED in the competition were awarded scholarships."\n\nBước 3: Áp dụng quy tắc rút gọn mệnh đề quan hệ:\n- Chủ thể ("The students") chủ động thực hiện hành động tham gia ("participated") -> Mệnh đề ở thể CHỦ ĐỘNG.\n- Khi rút gọn mệnh đề quan hệ chủ động, ta lược bỏ đại từ quan hệ ("who") và chuyển động từ chính về dạng V-ing ("participating").\n- Do đó, câu rút gọn chuẩn xác là: "The students participating in the competition were awarded scholarships."\n\nKết luận: Đáp án đúng là B. participating.',
       'Quy tắc rút gọn mệnh đề quan hệ:\n1. Chủ động: Rút gọn thành V-ing.\n2. Bị động: Rút gọn thành V3/V-ed.\n3. Có từ bổ nghĩa thứ tự (the first, the only, the best...): Rút gọn thành to-V.',
       'Đề thi tốt nghiệp THPT Tiếng Anh'
FROM topics t WHERE t.subject_code = 'english' AND t.name = 'Ngữ pháp và cấu trúc câu' LIMIT 1;

-- 9. NGỮ VĂN: Bài văn nghị luận xã hội hoàn chỉnh
INSERT INTO worked_examples (subject_code, topic_id, title, exercise_type, prompt, model_solution, solution_note, source_name)
SELECT 'literature', t.id,
       'Tinh thần chủ động thích ứng của người trẻ trong thời đại AI',
       'Đoạn văn 200 chữ',
       E'Viết một đoạn văn khoảng 200 chữ trình bày suy nghĩ của bạn về sự cần thiết của tinh thần chủ động thích ứng đối với thế hệ trẻ trước sự phát triển bùng nổ của trí tuệ nhân tạo (AI).',
       E'Trong kỷ nguyên cách mạng số, sự phát triển bùng nổ của trí tuệ nhân tạo không chỉ mở ra những tiềm năng vô hạn mà còn đặt thế hệ trẻ trước yêu cầu cấp thiết: phải chủ động thích ứng để không bị tụt lại phía sau. Chủ động thích ứng không phải là chạy theo công nghệ một cách mù quáng, mà là năng lực tự học, làm chủ tri thức và sẵn sàng thay đổi tư duy để đón nhận cái mới. Khi AI có thể thay thế con người thực hiện các tác vụ tính toán, tổng hợp dữ liệu trong tích tắc, giá trị độc bản của mỗi người nằm ở tư duy phản biện, óc sáng tạo và lòng thấu cảm sâu sắc. Một bạn trẻ biết tận dụng AI như công cụ trợ lực sẽ giải quyết bài toán học tập nhanh gấp nhiều lần, từ đó dành thời gian nghiên cứu sâu và trau dồi các kỹ năng mềm thiết yếu. Ngược lại, nếu lười biếng ỷ lại, chúng ta sẽ dần đánh mất khả năng tư duy độc lập và trở thành "nô lệ" của thuật toán. Sự thích ứng bền vững phải bắt đầu từ lòng tự giác mỗi ngày: không ngừng cập nhật hiểu biết công nghệ, rèn luyện đạo đức số và kiên định với những giá trị nhân văn cốt lõi. Như một định luật tự nhiên, trong dòng chảy xiết của thời đại, chỉ những ai chủ động giương buồm mới có thể biến ngọn gió công nghệ thành lực đẩy đưa bản thân cập bến tương lai.',
       'Cấu trúc đoạn văn 200 chữ: Mở đoạn trực tiếp nêu vấn đề -> Giải thích ngắn gọn tinh thần thích ứng -> Bàn luận vì sao cần thích ứng (nêu mặt tích cực khi ứng dụng AI và rủi ro khi ỷ lại) -> Phản biện (thích ứng có chọn lọc, giữ gìn đạo đức số) -> Bài học hành động thiết thực.',
       'MyStudy biên soạn'
FROM topics t WHERE t.subject_code = 'literature' AND t.name = 'Nghị luận xã hội' LIMIT 1;
