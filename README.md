TỔNG HỢP TOÀN BỘ THÔNG TIN VỀ HỆ THỐNG WEBSITE MYSTUDY

1. Giới thiệu tổng quan và mục tiêu dự án
- Tên hệ thống: MyStudy (Nền tảng tự học và luyện thi tốt nghiệp THPT Quốc gia thông minh).
- Mục tiêu: Giúp học sinh THPT xây dựng lộ trình học tập cá nhân hóa theo mục tiêu điểm số từng môn, quản lý thời gian học tập hàng ngày, duy trì động lực qua chuỗi học tập (Streak), luyện thi thử trắc nghiệm trực tuyến có chấm điểm tự động và nhận trợ giúp từ trí tuệ nhân tạo (AI).

2. Kiến trúc và ngăn xếp công nghệ
- Backend:
  + Ngôn ngữ & Framework: Java 21, Spring Boot 3.5, Spring Security, Spring Data JPA.
  + Cơ sở dữ liệu: PostgreSQL (sử dụng Flyway quản lý 18 phiên bản migration từ V1 đến V18).
  + Thư viện xử lý tài liệu: Apache PDFBox 3.0.4 (phục vụ trích xuất văn bản từ đề thi PDF).
  + Tích hợp AI: Kết nối Google Gemini API và Claude qua tầng trừu tượng AiGateway; có cơ chế Regex Parser dự phòng khi AI không khả dụng.
  + Kiểm thử: JUnit 5, Mockito, Spring MockMvc, Zonky Embedded PostgreSQL (76 bài kiểm thử tích hợp và kiểm thử đơn vị).
- Frontend:
  + Ngôn ngữ & Framework: TypeScript, React 19, React Router 7, Vite 8.
  + UI & Styling: Material UI (MUI v6), KaTeX (hiển thị công thức toán học và ký hiệu khoa học chuẩn xác).
  + Quản lý trạng thái & dữ liệu máy chủ: TanStack React Query v5.
  + Kiểm thử & Build: Vitest (36 bài kiểm thử giao diện và tiện ích), ESLint, TypeScript compiler.

3. Các phân hệ chức năng chính

3.1. Xác thực và quản lý tài khoản người dùng
- Đăng ký và đăng nhập bảo mật qua mã xác thực JWT và phiên làm việc (Session).
- Đăng nhập nhanh bằng tài khoản Google (Google OAuth2).
- Phân quyền người dùng rõ ràng:
  + Quyền USER: Học sinh sử dụng các tính năng học tập, làm bài thi, theo dõi lộ trình và chuỗi ngày học.
  + Quyền ADMIN: Quản trị viên hệ thống.
 
3.2. Lập lộ trình học tập cá nhân hóa và quản lý nhiệm vụ
- Thiết lập mục tiêu: Học sinh lựa chọn tổ hợp môn thi (Toán, Ngữ văn, Tiếng Anh, Vật lý, Hóa học, Sinh học, Lịch sử, Địa lý, GDKT & PL), đặt mục tiêu điểm số cho từng môn, số tháng ôn tập và thời gian học mỗi ngày.
- Tự động sinh lịch học: Hệ thống tự động phân bổ các chuyên đề kiến thức theo ngày dựa trên chiến lược học tập (Củng cố nền tảng trước hoặc Tập trung luyện đề).
- Quản lý nhiệm vụ hàng ngày: Học sinh theo dõi danh sách bài học trong ngày, đánh dấu hoàn thành hoặc hoàn tác, xem ghi chú kiến thức cốt lõi của từng bài học.

3.3. Cơ chế chuỗi học tập (Streak) và khôi phục chuỗi
- Duy trì chuỗi: Mỗi ngày học sinh hoàn thành ít nhất 1 nhiệm vụ học tập hoặc nộp 1 bài thi thử, chuỗi học tập sẽ tăng thêm 1 ngày.
- Đứt chuỗi: Nếu nghỉ học 1 ngày không có hoạt động học tập, chuỗi sẽ bị đứt.
- Khôi phục 1 ngày chuỗi bằng 2 bài thi thử:
  + Khi chuỗi bị đứt, hệ thống xác định chính xác ngày bị gián đoạn và hiển thị thẻ cảnh báo cùng tiến độ làm bù.
  + Học sinh cần hoàn thành và nộp 2 bài thi thử trực tuyến để làm bù cho 1 ngày nghỉ.
  + Khi đã tích lũy đủ 2 bài thi chưa dùng, nút "Khôi phục 1 ngày chuỗi ngay" sẽ kích hoạt để nối liền lại chuỗi ngày học.

3.4. Kho đề thi thử trực tuyến và đề PDF tải về
- Đề thi tương tác trực tuyến (MyStudy Practice):
  + Đồng hồ bấm giờ đếm ngược theo thời gian thực.
  + Giao diện chọn đáp án trắc nghiệm A, B, C, D trực quan, hỗ trợ công thức toán học KaTeX.
  + Tự động chấm điểm ngay khi nộp bài hoặc khi hết giờ làm bài.
  + Lưu trữ lịch sử toàn bộ các lượt thi (điểm số, số câu đúng/sai/bỏ trống, thời gian hoàn thành).
  + Xem lại chi tiết bài làm kèm đáp án đúng và lời giải chi tiết cho từng câu hỏi sau khi đã nộp bài.
- Đề thi tải về (Past Paper):
  + Cung cấp file đề thi PDF chính thức qua các năm của Bộ GD&ĐT và các trường chuyên.
  + Hỗ trợ xem trực tiếp tài liệu PDF và hướng dẫn giải trên trình duyệt hoặc tải về máy tính.
- Phân trang: Kho đề thi có tính năng phân trang tiện lợi, kết hợp bộ lọc theo môn học và năm thi, giúp tìm kiếm đề nhanh chóng mà không phải cuộn trang liên tục.

3.5. Trợ lý AI thông minh
- Trợ lý bóc tách đề thi PDF / văn bản: Quản trị viên chỉ cần tải lên file đề thi PDF hoặc dán văn bản thô, AI sẽ tự động phân tích và trích xuất toàn bộ câu hỏi, 4 phương án lựa chọn và đáp án đúng vào biểu mẫu tạo đề, tiết kiệm thời gian nhập liệu thủ công.
- Giải thích chi tiết câu hỏi: Cung cấp phương pháp giải và phân tích từng phương án cho học sinh sau khi làm bài.
- Phân tích điểm yếu & gợi ý ôn tập: Dựa vào lịch sử làm bài để thống kê các dạng bài học sinh hay làm sai và đề xuất nội dung cần ôn luyện bổ sung.

3.6. Kho bài tập mẫu (Worked Examples)
- Cung cấp các bài tập thực tế hoàn chỉnh có lời giải mẫu chi tiết cho từng môn học thay vì chỉ là khung lý thuyết.
- Chế độ hiển thị tối ưu: Khi người dùng bấm vào bài mẫu cụ thể thì nội dung chi tiết của bài đó mới mở ra, tránh việc hiển thị tràn lan gây rối mắt.
- Phân trang danh sách bài tập mẫu rõ ràng.
- Trang quản trị bài tập mẫu dành riêng cho Admin: Cho phép thêm môn học mới, tạo bài tập mẫu mới, cập nhật nội dung giải và xóa bài tập.

3.7. Bảng điều khiển quản trị viên 
- Quản lý kho đề thi:
  + Đăng đề thi mới (đề trắc nghiệm trực tuyến hoặc đề PDF tải về).
  + Tích hợp AI trích xuất câu hỏi từ file PDF hoặc văn bản thô.
  + Chỉnh sửa thông tin đề thi đã đăng (sửa tiêu đề, môn thi, năm thi, thời gian làm bài, nguồn đề, liên kết tài liệu) thay vì phải xóa đi tạo lại.
  + Xóa đề thi không còn phù hợp.
- Quản lý kho bài tập mẫu: Thêm môn học, đăng bài tập mẫu mới, chỉnh sửa và quản lý nội dung bài tập.
