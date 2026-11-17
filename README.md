# MyStudy — Nền tảng Ôn thi Tốt nghiệp THPT Thông minh

**MyStudy** là ứng dụng web toàn diện hỗ trợ học sinh ôn thi tốt nghiệp THPT và xét tuyển đại học. Nền tảng kết hợp giữa lộ trình học tập cá nhân hóa hằng ngày, kho tài liệu bài mẫu chuẩn mực, hệ thống luyện thi trắc nghiệm trực tuyến có bấm giờ, và cổng quản trị (Admin Portal) cho phép giáo viên/quản trị viên đăng tải và biên soạn đề thi linh hoạt.

---

## Các tính năng chính hiện tại của Website

### 1. Xác thực & Quản lý Tài khoản (Auth & Identity)
- **Đa phương thức đăng nhập**: Hỗ trợ đăng ký/đăng nhập bằng **Email & Mật khẩu** hoặc đăng nhập 1 chạm với **Google OAuth 2.0 (PKCE)**.
- **Tự động liên kết tài khoản**: Tài khoản tạo bằng email có thể liên kết mượt mà với tài khoản Google nếu trùng email đã xác minh, tránh nhân đôi dữ liệu.
- **Bảo mật phiên đăng nhập**: Lưu phiên an toàn trong cơ sở dữ liệu qua Spring Session JDBC, cơ chế chống tấn công CSRF hai lớp và chống Session Fixation.

### 2. Thiết lập Mục tiêu & Lập Lộ trình Ôn thi Cá nhân hóa (Study Goal & Planner)
- **Cá nhân hóa mục tiêu**:
  - Chọn mục đích: *Chỉ tốt nghiệp* hoặc *Xét tuyển Đại học*.
  - Lựa chọn 2 môn tự chọn trong tổ hợp KHTN / KHXH (Vật lí, Hóa học, Sinh học, Lịch sử, Địa lí, GDCD, Tin học, Công nghệ, Tiếng Anh) bên cạnh Toán và Ngữ văn.
  - Thiết lập mục tiêu điểm số từng môn, thời gian ôn tập (tháng), số phút học mỗi ngày và các ngày học trong tuần.
  - Chọn chiến lược học: *Sát đề thi* hoặc *Nền tảng → Điểm cao*.
- **Bộ lập lịch thông minh (StudyScheduler)**: Tự động phân bổ đều các chủ đề ôn tập xuyên suốt các tuần theo thời gian biểu của học sinh.

### 3. Trang Tổng quan & Nhiệm vụ Học tập Hằng ngày (Daily Overview)
- **Lịch tuần tương tác**: Xem trực quan tiến độ học tập trong tuần (thứ 2 đến chủ nhật).
- **Quản lý nhiệm vụ hằng ngày**:
  - Bấm hoàn thành nhiệm vụ khi đã học xong.
  - Hỗ trợ **Hủy hoàn thành (Undo / Uncomplete)** nếu đánh dấu nhầm, cập nhật lại trạng thái tức thì.
- **Hộp thoại học kiến thức cốt lõi (Knowledge Dialog)**: Xem tóm tắt công thức, mẹo giải nhanh và lý thuyết trọng tâm của từng chuyên đề ngay trên giao diện mà không cần rời màn hình.

### 4. Kho Bài mẫu & Phương pháp Giải (Worked Examples)
- Tuyển tập các bài toán và dạng bài trọng tâm theo từng môn học và chuyên đề.
- Cung cấp đề bài chi tiết, lời giải từng bước chuẩn mực và ghi chú phương pháp làm bài giúp học sinh nắm vững cách tư duy.

### 5. Kho Đề thi & Luyện thi Trắc nghiệm Trực tuyến (Exams & Practice)
- **Đề thi kèm đáp án (PDF)**: Xem và tải về các bộ đề thi thử, đề tham khảo chính thức của Bộ GD&ĐT kèm hướng dẫn chấm chi tiết.
- **Thi thử trực tuyến tương tác (`mystudy_practice`)**:
  - Làm bài trắc nghiệm với giao diện hiện đại, trực quan, phân bước làm bài khoa học.
  - **Đồng hồ đếm ngược** tự động nộp bài khi hết giờ.
  - **Tự động lưu tiến độ làm bài**: Sử dụng cơ chế lưu trữ cục bộ, học sinh thoải mái tải lại trang (F5) mà không lo bị mất bài làm hay thời gian đếm ngược.
  - **Lưu lịch sử bài thi & Xem lại kết quả bài trước**: Tự động lưu kết quả bài làm vào cơ sở dữ liệu (`exam_attempts`, `exam_attempt_answers`) và bộ nhớ trình duyệt; hiển thị thẻ "Kết quả bài làm gần nhất" kèm điểm số, thời gian nộp và nút "Xem lại kết quả & cách giải chi tiết" hoặc "Làm bài thi mới".
  - **Xem chi tiết câu sai/đúng & Cách giải**:
    - Thống kê điểm số theo thang 10, phân loại câu đúng, câu sai, câu bỏ trống và thời gian làm bài.
    - Bộ lọc câu hỏi thông minh: *Tất cả*, *Câu sai*, *Bỏ trống*, *Câu đúng*.
    - Đánh dấu trực quan đáp án người dùng đã chọn (xanh nếu đúng, đỏ nếu sai) song song với đáp án chính xác của đề thi.
    - Hộp **"Cách giải chi tiết"** hướng dẫn phương pháp giải từng bước cho từng câu hỏi.

### 6. Cổng Quản trị viên (Admin Portal — Mới ✨)
- **Phân quyền độc quyền (Single Admin Access)**:
  - Chỉ duy nhất tài khoản quản trị được chỉ định (`ngocbhbymit@gmail.com` hoặc qua biến môi trường `ADMIN_EMAIL`) có quyền truy cập.
  - Toàn bộ người dùng thông thường bị ẩn nút quản trị và bị Spring Security chặn `403 Forbidden` nếu cố ý truy cập.
- **Trang Quản trị đề thi (`/quan-tri/de-thi`)**:
  - Thống kê tổng số đề, đề trắc nghiệm online và đề PDF.
  - Bộ lọc đề theo môn học, hình thức đề.
  - Xem trước và xóa đề thi (tự động xóa an toàn toàn bộ câu hỏi, đáp án và kết quả liên quan).
- **Trang Đăng đề thi mới (`/quan-tri/de-thi/tao-moi`)**:
  - **Tạo đề trắc nghiệm trực tuyến**: Nhập thông tin đề, thời gian làm bài, soạn câu hỏi và 4 phương án A-B-C-D linh hoạt, chọn nút radio để đánh dấu đáp án đúng, kèm ô nhập **Cách giải / Lời giải chi tiết** cho từng câu hỏi.
  - **Đăng đề thi PDF**: Hỗ trợ tải trực tiếp file PDF từ máy tính lên cơ sở dữ liệu PostgreSQL bytea (tối đa 20MB) hoặc dán liên kết file đề (Google Drive, Cloudflare CDN...).

---

## 🛠 Công nghệ Sử dụng (Tech Stack)

| Tầng | Công nghệ / Thư viện |
| --- | --- |
| **Frontend** | React 19, TypeScript, Vite, Material UI (MUI v6/v9), React Router v7, TanStack Query v5, Axios, React Hook Form, Zod, Vitest |
| **Backend** | Java 21, Spring Boot 4, Spring Security 6 (Method Security `@PreAuthorize`), OAuth2 Client, Spring Data JPA / Hibernate 6, Flyway Migration, Spring Session JDBC, Actuator |
| **Cơ sở dữ liệu** | PostgreSQL 16+ (hỗ trợ Neon Serverless Postgres) |
| **Bảo mật** | Argon2id Password Hashing, CSRF Cookie Filter, Rate Limiting (chống brute-force IP & email), Content Security Policy (CSP), Strict Reverse Proxy Forward Headers |
| **Triển khai & CI/CD** | Render (Web Service Docker, Postgres), Vercel (Frontend SPA & API Reverse Proxy), GitHub Actions |

---

## 📁 Cấu trúc Thư mục Dự án

```
MyStudy/
├── backend/                         # Ứng dụng Spring Boot (Maven Wrapper)
│   ├── src/main/java/vn/mystudy/
│   │   ├── auth/                    # Xác thực, Profile, Session, OAuth2 Account Linking
│   │   ├── config/                  # Cấu hình WebMvc, Database, Resources
│   │   ├── exams/                   # Quản lý đề thi, câu hỏi, đáp án, và Cổng Quản trị (Admin)
│   │   │   ├── controller/          # ExamController, AdminExamController
│   │   │   ├── service/             # ExamService, AdminExamService
│   │   │   └── entity/ & dto/       # Thực thể JPA & Record DTO
│   │   ├── samples/                 # Kho bài mẫu (Worked Examples)
│   │   ├── study/                   # Quản lý mục tiêu, phân bổ lịch học, nhiệm vụ hằng ngày
│   │   └── security/                # Spring Security, AppUserDetails, RateLimiter, CSP
│   └── src/main/resources/
│       ├── application.yml          # Cấu hình chính (Session, Datasource, File upload, Admin email)
│       └── db/migration/            # Flyway SQL migrations (V1 -> V10)
│
├── frontend/                        # Ứng dụng React 19 SPA (Vite)
│   ├── src/
│   │   ├── app/                     # Layout, Theme (màu tím Lavender), Router & Route Guards
│   │   ├── features/
│   │   │   ├── admin/               # Quản trị: AdminExamListPage, AdminNewExamPage
│   │   │   ├── auth/                # Đăng nhập, Đăng ký, Quản lý phiên
│   │   │   ├── exams/               # Thư viện đề thi, Giao diện làm bài trực tuyến (PracticeSheet)
│   │   │   ├── samples/             # Xem bài mẫu và ghi chú giải
│   │   │   └── study/               # Tổng quan nhiệm vụ, Lộ trình, Hộp thoại học kiến thức
│   │   └── lib/http/                # Axios Client, Interceptors, CSRF handling, ApiError
│   └── vercel.json                  # Cấu hình Proxy chuyển tiếp /api/* về Render
│
├── docs/                            # Tài liệu phân tích & Thiết kế cơ sở dữ liệu
├── Dockerfile                       # Docker build đa giai đoạn (Node.js build -> Temurin JRE 21)
└── render.yaml                      # Cấu hình Infrastructure-as-Code trên Render
```

---

## 🚀 Hướng dẫn Cài đặt & Chạy dưới Local

### Yêu cầu hệ thống:
* **Java 21+**
* **Node.js 22+** (khuyên dùng Node 22 hoặc 24 LTS)
* PostgreSQL (hoặc dùng Database nhúng chạy thử sẵn có)

### 1. Khởi chạy Cơ sở dữ liệu
Bạn có thể sử dụng PostgreSQL có sẵn trên máy, hoặc chạy cơ sở dữ liệu nhúng tiện lợi:
```bash
cd backend && ./mvnw -q test-compile exec:java -Dexec.mainClass=vn.mystudy.support.DevDatabase -Dexec.classpathScope=test
```
*(Lệnh sẽ in ra đường dẫn kết nối `DATABASE_URL=postgresql://postgres@localhost:54329/postgres`)*

### 2. Cấu hình Backend
Sao chép file mẫu và điền cấu hình:
```bash
cp backend/.env.example backend/.env.local
```
Chỉnh sửa file `backend/.env.local` với thông tin kết nối CSDL và email Admin:
```properties
DATABASE_URL=postgresql://postgres@localhost:54329/postgres
ADMIN_EMAIL=ngocbhbymit@gmail.com
```

### 3. Chạy Ứng dụng
Mở 2 cửa sổ terminal riêng biệt:

**Terminal 1 — Backend (Spring Boot 8080):**
```bash
cd backend
./mvnw spring-boot:run
```

**Terminal 2 — Frontend (Vite 5173):**
```bash
cd frontend
npm install
npm run dev
```

Truy cập trình duyệt tại: `http://localhost:5173`.
*(Vite tự động proxy các request `/api` sang `http://localhost:8080`)*

---

## 🧪 Kiểm thử (Testing)

```bash
# Kiểm thử toàn diện Backend (36/36 tests: Scheduler, Auth, Study, Exams, Admin)
cd backend && ./mvnw test

# Kiểm thử Frontend (Typecheck, Linter, Vitest 28/28 tests)
cd frontend
npm run typecheck
npm run lint
npm test
```

---

## 🌐 Triển khai Production (Deployment)

Dự án hiện được cấu hình triển khai tự động mỗi khi đẩy mã nguồn lên nhánh `main`:

### 1. Backend & CSDL (Render)
* Chạy dưới dạng Docker Container với image `eclipse-temurin:21-jre` tối ưu dung lượng và tài nguyên RAM.
* Cơ sở dữ liệu PostgreSQL lưu trữ bền vững.
* **Biến môi trường cần thiết trên Render**:
  * `SPRING_PROFILES_ACTIVE=prod`
  * `APP_ORIGIN=https://<domain-frontend-cua-ban>`
  * `DATABASE_URL=postgresql://...`
  * `ADMIN_EMAIL=ngocbhbymit@gmail.com`
  * `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` *(Tùy chọn cho Google OAuth)*

### 2. Frontend (Vercel)
* File `frontend/vercel.json` thiết lập rewrite toàn bộ `/api/:path*` về URL Render Backend, giúp xử lý triệt để bài toán CORS và SameSite Cookies giữa frontend và backend.

---

## 🔒 Cơ chế Bảo mật Nổi bật

* **Mật khẩu**: Băm bằng thuật toán **Argon2id** chuẩn khuyến nghị OWASP; tự động nâng cấp mã băm cũ khi đăng nhập.
* **Kiểm soát phiên**: Cookie `HttpOnly`, `SameSite=Lax`, `Secure`, cơ chế đổi Session ID chống Session Fixation, phiên lưu 7 ngày trong CSDL.
* **Bảo vệ CSRF**: Tự động cấp phát và kiểm tra token `X-XSRF-TOKEN` cho toàn bộ các phương thức ghi (`POST`, `PUT`, `DELETE`).
* **Giới hạn tốc độ (Rate Limiting)**: Chặn tấn công dò mật khẩu và spam đăng ký theo địa chỉ IP thật và theo từng email.
* **Content Security Policy (CSP)**: Khóa chặt thực thi script nội tuyến, chống tấn công XSS và clickjacking (`frame-ancestors 'none'`).
