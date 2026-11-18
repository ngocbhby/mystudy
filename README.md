# MyStudy — Nền tảng Ôn thi Tốt nghiệp THPT Thông minh

**MyStudy** là ứng dụng web ứng dụng AI hỗ trợ học sinh ôn thi tốt nghiệp THPT: gia sư AI giải thích câu làm sai, phân tích điểm yếu theo chuyên đề và lộ trình học tự điều chỉnh theo kết quả thi thử.

> 📘 **Sinh viên mới bắt đầu:** đọc [Hướng dẫn dành cho sinh viên](docs/HUONG_DAN_SINH_VIEN.md) — cài đặt, chạy, bật AI, demo, xử lý lỗi và bài tập phát triển tiếp.

**MyStudy** là ứng dụng web toàn diện hỗ trợ học sinh ôn thi tốt nghiệp THPT và xét tuyển đại học. Nền tảng kết hợp giữa lộ trình học tập cá nhân hóa hằng ngày, kho tài liệu bài mẫu chuẩn mực, hệ thống luyện thi trắc nghiệm trực tuyến có bấm giờ, và cổng quản trị (Admin Portal) cho phép giáo viên/quản trị viên đăng tải và biên soạn đề thi linh hoạt.

---

## 🤖 Tính năng AI

Nguyên tắc: **mã chương trình tính số liệu, AI viết lời.** Tỉ lệ đúng theo chuyên đề, phân bổ thời gian học và điểm số đều do mã tính (chính xác, kiểm chứng được); AI chỉ dùng số liệu đó để giải thích và gợi ý.

| Tính năng | Mô tả | Nơi dùng |
| --- | --- | --- |
| **Gia sư AI giải thích câu sai** | Sau khi nộp bài, bấm "Vì sao mình sai?" dưới câu làm sai: AI chỉ ra chỗ có thể đã nhầm, các bước giải đúng và mẹo ghi nhớ. Lời giải thích lưu theo (câu hỏi, lựa chọn sai) nên học sinh khác chọn cùng đáp án sai nhận ngay, không tốn thêm lượt gọi AI. Có nút "Báo giải thích sai" (3 lượt báo thì xóa để AI tạo lại). | Trang kết quả thi thử |
| **Phân tích điểm yếu** | Bảng tỉ lệ đúng theo chuyên đề (60 ngày gần nhất); AI đọc bảng số liệu và các câu sai tiêu biểu để nhận xét và đề xuất 2-3 nhiệm vụ cụ thể cho mỗi chuyên đề yếu. | `/phan-tich` |
| **Lộ trình thích ứng** | Bấm "Cập nhật lộ trình theo kết quả": chuyên đề đúng dưới 50% được xếp ôn gấp 3, dưới 70% gấp 2 (cần ít nhất 3 câu để kết luận). Buổi đã học được giữ nguyên. | `/phan-tich` |
| **Ghi chú kiến thức do AI soạn** | Chuyên đề chưa có ghi chú của giáo viên thì học sinh có thể nhờ AI soạn (Markdown + công thức LaTeX). Ghi chú lưu chung cho mọi người học, có nhãn "Do AI tạo". | Hộp thoại "Học ngay" ở Tổng quan |

**Kiểm soát chi phí và an toàn:** khóa API chỉ ở máy chủ; mỗi tài khoản tối đa `AI_DAILY_LIMIT` lượt gọi/ngày (kết quả đã lưu không tính lượt); AI dùng *structured outputs* nên luôn trả JSON đúng cấu trúc; *prompt caching* cho system prompt; dữ liệu gửi AI chỉ là nội dung bài tập (không gửi email, tên); nội dung trong prompt được bọc thẻ và đánh dấu là dữ liệu để giảm rủi ro prompt injection; mọi nội dung AI đều gắn nhãn "Do AI tạo". Khi chưa cấu hình khóa API, các tính năng không dùng AI vẫn chạy bình thường.

**Bật AI** (biến môi trường của backend, đặt trong `backend/.env.local` khi chạy local, KHÔNG commit). Hỗ trợ hai nhà cung cấp, các tính năng AI dùng chung một định nghĩa đầu ra:

| Nhà cung cấp | Biến cần đặt | Mô hình mặc định |
| --- | --- | --- |
| Google Gemini | `AI_ENABLED=true`, `AI_PROVIDER=gemini`, `GEMINI_API_KEY=...` | `gemini-3.5-flash-lite` — đo thực tế trả lời trong 1,5–2 giây (đổi bằng `GEMINI_MODEL`; `gemini-3.8-flash` chất lượng cao hơn nhưng có lúc chậm 5–60 giây) |
| Anthropic Claude | `AI_ENABLED=true`, `AI_PROVIDER=anthropic` (mặc định), `ANTHROPIC_API_KEY=...` | `claude-opus-5-5` (đổi bằng `AI_MODEL`) |

Với Gemini, đầu ra JSON được ràng buộc bằng `responseJsonSchema` sinh tự động từ các record Java; khóa gửi qua header `x-goog-api-key` (không nằm trong URL).

---

## Các tính năng chính hiện tại của Website

### 1. Xác thực & Quản lý Tài khoản (Auth & Identity)
- **Đa phương thức đăng nhập**: Hỗ trợ đăng ký/đăng nhập bằng **Email & Mật khẩu** hoặc đăng nhập 1 chạm với **Google OAuth 2.0 (PKCE)**.
- **Không tự gộp tài khoản chưa xác minh**: đăng nhập Google không gộp vào tài khoản email/mật khẩu cùng email (email đăng ký chưa được xác minh nên có thể do người khác tạo trước để chiếm tài khoản).
- **Bảo mật phiên đăng nhập**: Lưu phiên an toàn trong cơ sở dữ liệu qua Spring Session JDBC, cơ chế chống tấn công CSRF hai lớp và chống Session Fixation.

### 2. Thiết lập Mục tiêu & Lập Lộ trình Ôn thi Cá nhân hóa (Study Goal & Planner)
- **Cá nhân hóa mục tiêu**:
  - Chọn mục đích: *Chỉ tốt nghiệp* hoặc *Xét tuyển Đại học*.
  - Lựa chọn 2 môn tự chọn trong tổ hợp KHTN / KHXH (Vật lí, Hóa học, Sinh học, Lịch sử, Địa lí, GDCD, Tin học, Công nghệ, Tiếng Anh) bên cạnh Toán và Ngữ văn.
  - Thiết lập mục tiêu điểm số từng môn, thời gian ôn tập (tháng), số phút học mỗi ngày và các ngày học trong tuần.
  - Chọn chiến lược học: *Sát đề thi* hoặc *Nền tảng → Điểm cao*.
- **Điểm hiện tại (tùy chọn)**: môn càng cách xa mục tiêu càng được nhiều thời gian; mục đích "chỉ tốt nghiệp" ưu tiên thêm môn dưới 5 điểm.
- **Bộ lập lịch có trọng số (StudyScheduler)**: chia thời gian giữa các môn theo khoảng cách tới mục tiêu và xoay vòng chuyên đề theo trọng số (chuyên đề yếu xuất hiện thường xuyên hơn), không vượt quỹ giờ mỗi ngày.

### 3. Trang Tổng quan & Nhiệm vụ Học tập Hằng ngày (Daily Overview)
- **Lịch tuần tương tác**: Xem trực quan tiến độ học tập trong tuần (thứ 2 đến chủ nhật).
- **Quản lý nhiệm vụ hằng ngày**:
  - Bấm hoàn thành nhiệm vụ khi đã học xong.
  - Hỗ trợ **Hủy hoàn thành (Undo / Uncomplete)** nếu đánh dấu nhầm, cập nhật lại trạng thái tức thì.
- **Hộp thoại học kiến thức cốt lõi (Knowledge Dialog)**: ghi chú theo chuyên đề lưu trong CSDL (bảng `topic_notes`), hiển thị công thức bằng KaTeX; chuyên đề chưa có ghi chú có thể nhờ AI soạn.

### 4. Kho Bài mẫu & Phương pháp Giải (Worked Examples)
- Tuyển tập các bài toán và dạng bài trọng tâm theo từng môn học và chuyên đề.
- Cung cấp đề bài chi tiết, lời giải từng bước chuẩn mực và ghi chú phương pháp làm bài giúp học sinh nắm vững cách tư duy.

### 5. Kho Đề thi & Luyện thi Trắc nghiệm Trực tuyến (Exams & Practice)
- **Đề thi kèm đáp án (PDF)**: Xem và tải về các bộ đề thi thử, đề tham khảo chính thức của Bộ GD&ĐT kèm hướng dẫn chấm chi tiết.
- **Thi thử trực tuyến tương tác (`mystudy_practice`)**:
  - Làm bài trắc nghiệm với giao diện hiện đại, trực quan, phân bước làm bài khoa học.
  - **Đồng hồ do máy chủ quản lý**: khi bắt đầu, máy chủ ghi thời điểm bắt đầu và hạn nộp; thời gian làm bài do máy chủ tính; bài nộp quá hạn hơn 60 giây không được nhận đáp án. Khách (chưa đăng nhập) nhận token lượt thi, máy chủ chỉ lưu hash SHA-256.
  - **Đáp án không công khai trước khi thi**: khóa đáp án chỉ dành cho quản trị; học sinh xem đáp án và lời giải sau khi nộp bài.
  - **Tự động lưu tiến độ làm bài**: Sử dụng cơ chế lưu trữ cục bộ, học sinh thoải mái tải lại trang (F5) mà không lo bị mất bài làm hay thời gian đếm ngược.
  - **Lưu lịch sử bài thi & Xem lại kết quả bài trước**: Tự động lưu kết quả bài làm vào cơ sở dữ liệu (`exam_attempts`, `exam_attempt_answers`) và bộ nhớ trình duyệt; hiển thị thẻ "Kết quả bài làm gần nhất" kèm điểm số, thời gian nộp và nút "Xem lại kết quả & cách giải chi tiết" hoặc "Làm bài thi mới".
  - **Xem chi tiết câu sai/đúng & Cách giải**:
    - Thống kê điểm số theo thang 10, phân loại câu đúng, câu sai, câu bỏ trống và thời gian làm bài.
    - Bộ lọc câu hỏi thông minh: *Tất cả*, *Câu sai*, *Bỏ trống*, *Câu đúng*.
    - Đánh dấu trực quan đáp án người dùng đã chọn (xanh nếu đúng, đỏ nếu sai) song song với đáp án chính xác của đề thi.
    - Hộp **"Cách giải chi tiết"** hướng dẫn phương pháp giải từng bước cho từng câu hỏi.

### 6. Cổng Quản trị viên (Admin Portal — Mới ✨)
- **Phân quyền quản trị**:
  - Quyền quản trị chỉ được cấp khi đăng nhập **Google** bằng email trùng biến môi trường `ADMIN_EMAIL` và Google xác nhận email đã xác minh. Đăng ký bằng email/mật khẩu không bao giờ được quyền quản trị.
  - Toàn bộ người dùng thông thường bị ẩn nút quản trị và bị Spring Security chặn `403 Forbidden` nếu cố ý truy cập.
- **Trang Quản trị đề thi (`/quan-tri/de-thi`)**:
  - Thống kê tổng số đề, đề trắc nghiệm online và đề PDF.
  - Bộ lọc đề theo môn học, hình thức đề.
  - Xem trước và xóa đề thi (tự động xóa an toàn toàn bộ câu hỏi, đáp án và kết quả liên quan).
- **Trang Đăng đề thi mới (`/quan-tri/de-thi/tao-moi`)**:
  - **Tạo đề trắc nghiệm trực tuyến**: Nhập thông tin đề, thời gian làm bài, soạn câu hỏi và 4 phương án A-B-C-D linh hoạt, chọn nút radio để đánh dấu đáp án đúng, kèm ô nhập **Cách giải / Lời giải chi tiết** cho từng câu hỏi.
  - **Đăng đề thi PDF**: Hỗ trợ tải trực tiếp file PDF từ máy tính lên cơ sở dữ liệu PostgreSQL bytea (tối đa 20MB) hoặc dán liên kết file đề (Google Drive, Cloudflare CDN...). Máy chủ kiểm tra chữ ký `%PDF-` và luôn trả về `application/pdf`.
  - **Gắn chuyên đề cho câu hỏi** (`topicId`) để phân tích điểm yếu theo chuyên đề.

---

## 🛠 Công nghệ Sử dụng (Tech Stack)

| Tầng | Công nghệ / Thư viện |
| --- | --- |
| **Frontend** | React 19, TypeScript, Vite, Material UI, React Router v7, TanStack Query v5, Axios, React Hook Form, Zod, react-markdown + KaTeX, Vitest |
| **Backend** | Java 21, Spring Boot 4.1, Spring Security 7 (Method Security `@PreAuthorize`), OAuth2 Client, Spring Data JPA / Hibernate, Flyway Migration, Spring Session JDBC, Actuator |
| **AI** | Google Gemini (REST `generateContent`, JSON Schema) hoặc Claude API qua Anthropic Java SDK (structured outputs, prompt caching, server-side fallback), chọn bằng `AI_PROVIDER` |
| **Cơ sở dữ liệu** | PostgreSQL 16+ (hỗ trợ Neon Serverless Postgres) |
| **Bảo mật** | Argon2id Password Hashing, CSRF Cookie Filter, Rate Limiting (chống brute-force IP & email), Content Security Policy (CSP), Strict Reverse Proxy Forward Headers |
| **Triển khai & CI/CD** | Render (Web Service Docker, Postgres), Vercel (Frontend SPA & API Reverse Proxy), GitHub Actions |

---

## 📁 Cấu trúc Thư mục Dự án

```
MyStudy/
├── backend/                         # Ứng dụng Spring Boot (Maven Wrapper)
│   ├── src/main/java/vn/mystudy/
│   │   ├── ai/                      # Tính năng AI: gateway Claude, hạn mức, giải thích câu sai, ghi chú, phân tích điểm yếu
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
│       └── db/migration/            # Flyway SQL migrations (V1 -> V13)
│
├── frontend/                        # Ứng dụng React 19 SPA (Vite)
│   ├── src/
│   │   ├── app/                     # Layout, Theme (màu tím Lavender), Router & Route Guards
│   │   ├── features/
│   │   │   ├── ai/                  # Gia sư AI, trang Phân tích, ghi chú kiến thức
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
ADMIN_EMAIL=email-quan-tri@example.com   # quản trị viên đăng nhập bằng Google với email này
AI_ENABLED=true                          # tùy chọn: bật tính năng AI
AI_PROVIDER=gemini                       # gemini hoặc anthropic
GEMINI_API_KEY=...                       # khóa Google AI Studio, KHÔNG commit
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
# Kiểm thử toàn diện Backend (52 tests: Scheduler, Auth, Study, Exams, Admin, AI với mô hình giả)
cd backend && ./mvnw test

# Kiểm thử Frontend (Typecheck, Linter, Vitest 33 tests) — cần Node 22+
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
  * `ADMIN_EMAIL=<email quản trị>` *(quản trị viên phải đăng nhập bằng Google)*
  * `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` *(Tùy chọn cho Google OAuth)*
  * `AI_ENABLED=true`, `AI_PROVIDER` (`gemini` hoặc `anthropic`), `GEMINI_API_KEY` hoặc `ANTHROPIC_API_KEY` *(Tùy chọn, bật tính năng AI)*, `AI_DAILY_LIMIT` *(mặc định 30)*, `GEMINI_MODEL` / `AI_MODEL`

### 2. Frontend (Vercel)
* File `frontend/vercel.json` thiết lập rewrite toàn bộ `/api/:path*` về URL Render Backend, giúp xử lý triệt để bài toán CORS và SameSite Cookies giữa frontend và backend.

---

## 🔒 Cơ chế Bảo mật Nổi bật

* **Mật khẩu**: Băm bằng thuật toán **Argon2id** chuẩn khuyến nghị OWASP; tự động nâng cấp mã băm cũ khi đăng nhập.
* **Kiểm soát phiên**: Cookie `HttpOnly`, `SameSite=Lax`, `Secure`, cơ chế đổi Session ID chống Session Fixation, phiên lưu 7 ngày trong CSDL.
* **Bảo vệ CSRF**: Tự động cấp phát và kiểm tra token `X-XSRF-TOKEN` cho toàn bộ các phương thức ghi (`POST`, `PUT`, `DELETE`).
* **Giới hạn tốc độ (Rate Limiting)**: Chặn tấn công dò mật khẩu và spam đăng ký theo địa chỉ IP thật và theo từng email.
* **Content Security Policy (CSP)**: Khóa chặt thực thi script nội tuyến, chống tấn công XSS và clickjacking (`frame-ancestors 'none'`).
