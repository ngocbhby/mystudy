### 1. Giới thiệu chung
MyStudy là nền tảng luyện thi trực tuyến, hỗ trợ học sinh thực hiện các bài thi trắc nghiệm theo chuẩn cấu trúc kỳ thi tốt nghiệp THPT và các kỳ thi đánh giá năng lực. Hệ thống cung cấp công cụ làm bài bấm giờ, chấm điểm tự động, xem lời giải chi tiết và tích hợp trí tuệ nhân tạo (AI) để phân tích, giải thích các câu làm sai.

---

### 2. Kiến trúc công nghệ (TechStack)
- **Backend**: Java 21, Spring Boot 3, Spring Security (JWT), Spring Data JPA, PostgreSQL.
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router.
- **Tích hợp AI**: Google Gemini API hỗ trợ giải thích phương pháp giải, phân tích lỗi sai trong bài làm, phân tích lộ trình phù hợp với người dùng.
- **Quy trình triển khai (CI/CD)**: 
  - GitHub Actions tự động kiểm thử tự động (Unit Test, Integration Test, Typecheck, Lint) khi có mã nguồn mới.
  - Vercel phụ trách lưu trữ và triển khai Frontend.
  - Render phụ trách chạy dịch vụ Backend và kết nối cơ sở dữ liệu.

---

### 3. Các phân hệ và tính năng dành cho học sinh (Người dùng)

#### a. Xác thực và tài khoản cá nhân
- Đăng ký tài khoản mới và đăng nhập thông qua mã xác thực JWT.
- Khôi phục và đặt lại mật khẩu qua email.
- Trang cá nhân: Quản lý thông tin tài khoản, cập nhật hồ sơ và đổi mật khẩu.
- Xem lại lịch sử các lượt thi đã làm, tiến độ ôn tập và điểm số trung bình.

#### b. Tìm kiếm và chọn đề thi
- Danh mục môn học đa dạng: Toán, Ngữ Văn, Vật lí, Hóa học, Sinh học, Lịch sử, Địa lí, Tiếng Anh, Giáo dục công dân.
- Bộ lọc nâng cao: Tìm kiếm theo tên đề, lọc theo môn học, năm phát hành, đơn vị ra đề (trường THPT, sở giáo dục).
- Phân trang hiển thị đề thi rõ ràng, tải nhanh.

#### c. Phòng thi trực tuyến và nộp bài
- Giao diện làm bài chuyên nghiệp với đồng hồ đếm ngược theo thời lượng quy định của đề (ví dụ: 50 phút, 90 phút).
- Xem trước tài liệu đề thi gốc định dạng PDF song song với bảng chọn đáp án.
- Bảng câu hỏi trực quan: Cho phép học sinh chọn đáp án, đánh dấu câu hỏi chưa chắc chắn để xem lại trước khi nộp.
- Tự động thu bài khi hết thời gian quy định hoặc học sinh chủ động bấm nộp bài.

#### d. Chấm điểm và phân tích kết quả
- Hệ thống chấm điểm tự động ngay sau khi nộp bài: Hiển thị tổng điểm, số câu làm đúng, số câu làm sai và số câu chưa trả lời.
- Bảng đối chiếu đáp án chi tiết: Xem lại bài làm của mình so với đáp án chính xác của từng câu hỏi.
- Hướng dẫn giải: Cung cấp tài liệu lời giải chi tiết định dạng PDF hoặc lời giải từng bước.
- Hỗ trợ AI giải thích: Đối với các câu làm sai, học sinh có thể yêu cầu AI phân tích lý do sai, tóm tắt công thức hoặc kiến thức trọng tâm cần nhớ và hướng dẫn phương pháp giải đúng.

---

### 4. Phân hệ dành cho Quản trị viên (Admin Portal)

#### a. Quản lý danh mục đề thi
- **Đăng mới đề thi**: Nhập tên đề, chọn môn học, năm thi, thời gian làm bài, nguồn gốc đề thi, đính kèm liên kết file đề bài PDF và file đáp án.
- **Chỉnh sửa đề thi**: Cho phép quản trị viên chỉnh sửa trực tiếp thông tin các đề đã đăng (sửa tên đề khi nhập sai, sửa thời gian làm bài, năm thi, môn học, cập nhật lại link tài liệu) mà không cần phải xóa đề để tạo lại.
- **Xóa đề thi**: Xóa bỏ các đề thi đã cũ hoặc không còn phù hợp khỏi danh sách hiển thị.

#### b. Quản lý câu hỏi và đáp án
- Thiết lập bộ đáp án chuẩn cho từng mã đề để hệ thống tự động đối chiếu chấm điểm khi học sinh nộp bài.

#### c. Quản lý người dùng và hệ thống
- Phân quyền tài khoản theo vai trò (Người dùng bình thường / Quản trị viên).
- Giám sát tình trạng vận hành của hệ thống và lưu lượng làm bài thi.
