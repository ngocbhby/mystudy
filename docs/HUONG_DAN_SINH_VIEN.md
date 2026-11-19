# Hướng dẫn dành cho sinh viên — MyStudy

Tài liệu này giúp bạn cài đặt, chạy, hiểu và phát triển tiếp dự án MyStudy: ứng dụng web hỗ trợ học sinh lớp 12 ôn thi tốt nghiệp THPT, có ứng dụng AI trong học tập.

**Mục lục**
1. [Dự án đã được cải thiện những gì](#1-dự-án-đã-được-cải-thiện-những-gì)
2. [Cài đặt công cụ](#2-cài-đặt-công-cụ)
3. [Chạy dự án trên máy](#3-chạy-dự-án-trên-máy)
4. [Bật tính năng AI](#4-bật-tính-năng-ai)
5. [Sử dụng ứng dụng](#5-sử-dụng-ứng-dụng)
6. [Các phần ứng dụng AI](#6-các-phần-ứng-dụng-ai)
7. [Cấu trúc mã nguồn](#7-cấu-trúc-mã-nguồn)
8. [Kiểm thử](#8-kiểm-thử)
9. [Kịch bản demo](#9-kịch-bản-demo)
10. [Xử lý lỗi thường gặp](#10-xử-lý-lỗi-thường-gặp)
11. [Bài tập phát triển tiếp](#11-bài-tập-phát-triển-tiếp)

---

## 1. Dự án đã được cải thiện những gì

Commit đầu tiên của repo là bản gốc của nhóm sinh viên. Các commit sau là phần hoàn thiện. Xem toàn bộ thay đổi bằng:

```bash
git log --oneline
git diff <mã-commit-đầu-tiên> --stat
```

| Tiêu chí | Bản gốc | Bản hiện tại |
|---|---|---|
| Ứng dụng AI | Không có | Gia sư AI giải thích câu sai, phân tích điểm yếu, AI soạn ghi chú kiến thức (Gemini hoặc Claude) |
| Quyền quản trị | Ai đăng ký bằng email admin cũng thành admin | Chỉ cấp qua đăng nhập Google với email đã xác minh |
| Liên kết tài khoản Google | Người lạ có thể đăng ký trước bằng email của người khác để chiếm tài khoản | Không tự gộp vào tài khoản email chưa xác minh |
| Đáp án đề thi | Ai cũng xem được trước khi thi | Chỉ hiện sau khi nộp bài |
| Tính giờ làm bài | Trình duyệt tự gửi số giây | Máy chủ ghi giờ bắt đầu, hạn nộp và tự tính |
| Upload PDF | Chỉ kiểm tra đuôi file | Kiểm tra nội dung đúng là PDF |
| Lộ trình học | Chia đều thời gian giữa các môn | Chia theo khoảng cách tới mục tiêu; tự ưu tiên chuyên đề làm sai nhiều |
| Ghi chú kiến thức | Viết cứng trong giao diện, chỉ 3 chuyên đề Toán | Lưu trong CSDL, hiển thị công thức bằng KaTeX, AI soạn cho chuyên đề còn thiếu |
| Kết quả thi trên máy dùng chung | Tài khoản sau thấy kết quả của tài khoản trước | Tách theo tài khoản, xóa khi đăng xuất |
| Test tự động | 36 backend, 28 frontend | 68 backend, 35 frontend |

---

## 2. Cài đặt công cụ

| Công cụ | Phiên bản | Ghi chú |
|---|---|---|
| Java (JDK) | 21 trở lên | Tải tại [adoptium.net](https://adoptium.net). Không cần cài Maven vì dự án có sẵn `mvnw` |
| Node.js | 22 trở lên | Tải tại [nodejs.org](https://nodejs.org) (bản LTS) |
| Git | bất kỳ | Để tải mã nguồn |
| VS Code | bất kỳ | Khuyên dùng; cài thêm *Extension Pack for Java* và *ESLint* |

Không cần cài PostgreSQL: dự án có sẵn cơ sở dữ liệu nhúng để chạy trên máy.

Kiểm tra lại sau khi cài:

```bash
java -version
node -v
git --version
```

---

## 3. Chạy dự án trên máy

### Bước 1. Tải mã nguồn

```bash
git clone <địa-chỉ-repo-GitHub>
cd mystudy
```

### Bước 2. Tạo file cấu hình backend

Tạo file `backend/.env.local`. File này đã nằm trong `.gitignore`, **không bao giờ commit file này**. Nội dung:

```properties
DATABASE_URL=postgresql://postgres@localhost:54329/postgres
APP_ORIGIN=http://localhost:5173

# Tính năng AI (xem mục 4). Để false nếu chưa có khóa.
AI_ENABLED=false
AI_PROVIDER=gemini
GEMINI_API_KEY=
AI_DAILY_LIMIT=30
```

Có thể sao chép từ file mẫu `backend/.env.example` rồi sửa lại.

### Bước 3. Cài thư viện frontend (chỉ làm lần đầu)

```bash
cd frontend
npm install
cd ..
```

### Bước 4. Chạy 3 phần, mỗi phần trong một cửa sổ terminal riêng

Trong VS Code: menu **Terminal → New Terminal**, rồi bấm nút **Split** để mở thêm terminal.

**Terminal 1 — Cơ sở dữ liệu.** Chờ đến khi thấy dòng `DATABASE_URL=...`:

```bash
cd backend
./mvnw -q test-compile exec:java -Dexec.mainClass=vn.mystudy.support.DevDatabase -Dexec.classpathScope=test
```

**Terminal 2 — Backend.** Chờ đến khi thấy `Started MyStudyApplication`:

```bash
cd backend
./mvnw spring-boot:run
```

**Terminal 3 — Frontend:**

```bash
cd frontend
npm run dev
```

> Trên **Windows** (Command Prompt hoặc PowerShell), thay `./mvnw` bằng `mvnw.cmd`.

### Bước 5. Mở ứng dụng

Mở trình duyệt tại **http://localhost:5173**, bấm **Đăng ký** để tạo tài khoản.

Tắt ứng dụng: bấm `Ctrl + C` ở từng terminal. Lần chạy đầu tiên chậm vì Maven phải tải thư viện; những lần sau sẽ nhanh hơn.

---

## 4. Bật tính năng AI

Dự án hỗ trợ hai nhà cung cấp AI. Chọn một:

### Cách A. Google Gemini (có gói miễn phí, khuyên dùng khi học)
1. Vào [aistudio.google.com](https://aistudio.google.com), chọn **Get API key**, rồi **Create API key**.
2. Sửa `backend/.env.local`:
   ```properties
   AI_ENABLED=true
   AI_PROVIDER=gemini
   GEMINI_API_KEY=khóa-của-bạn
   ```
3. Khởi động lại backend. Log phải có dòng `AI features enabled with Gemini model gemini-3.5-flash-lite`.

Mô hình mặc định `gemini-3.5-flash-lite` trả lời trong khoảng 2 giây. Muốn đổi, thêm dòng `GEMINI_MODEL=...`. Chúng tôi đã đo thử: `gemini-3.8-flash` có lúc chậm hơn 60 giây.

### Cách B. Anthropic Claude
```properties
AI_ENABLED=true
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
```
Tạo khóa tại [console.anthropic.com](https://console.anthropic.com). Mô hình mặc định là `claude-opus-5-5`, đổi bằng `AI_MODEL=...`.

### Quy tắc an toàn với khóa API
- **Không** dán khóa vào mã nguồn, README, chat hay ảnh chụp màn hình.
- **Không** commit file `.env.local`.
- Lỡ để lộ khóa thì **xóa khóa đó ngay** trong trang quản lý khóa rồi tạo khóa mới.
- Khóa chỉ nằm ở backend. Frontend không bao giờ biết khóa.

---

## 5. Sử dụng ứng dụng

| Trang | Đường dẫn | Chức năng chính |
|---|---|---|
| Đăng nhập | `/` | Đăng ký, đăng nhập bằng email; đăng nhập Google khi đã cấu hình |
| Thiết lập mục tiêu | `/thiet-lap-muc-tieu` | Mục đích (tốt nghiệp hoặc xét tuyển), 2 môn tự chọn, điểm mục tiêu, **điểm hiện tại**, số tháng, giờ học mỗi ngày, ngày học, cách ôn |
| Tổng quan | `/tong-quan` | Nhiệm vụ hôm nay, nút **Học ngay** (mở ghi chú kiến thức), đánh dấu đã học, chuỗi ngày học liên tiếp |
| Lộ trình | `/lo-trinh` | Lịch theo tuần, chuyển tuần, đổi cách ôn |
| Phân tích | `/phan-tich` | Tỉ lệ đúng theo chuyên đề, **Nhờ AI nhận xét**, **Cập nhật lộ trình theo kết quả** |
| Kho đề thi | `/kho-de-thi` | Lọc đề theo môn và năm, xem file PDF |
| Thi thử | `/thi-thu/<mã-đề>` | Làm bài có tính giờ, nộp bài, xem lại từng câu, **Vì sao mình sai?** |
| Kho bài mẫu | `/kho-bai-mau` | Bài mẫu có lời giải từng bước |
| Quản trị | `/quan-tri/de-thi` | Chỉ dành cho admin: đăng đề trắc nghiệm, upload PDF, xóa đề |

### Muốn vào trang Quản trị
Cần bật đăng nhập Google:
1. Vào [Google Cloud Console](https://console.cloud.google.com), chọn **APIs & Services → Credentials → OAuth client ID** (loại Web application).
2. Thêm Authorized redirect URI: `http://localhost:5173/api/auth/google/callback`.
3. Thêm vào `backend/.env.local`:
   ```properties
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ADMIN_EMAIL=email-google-của-bạn@gmail.com
   ```
4. Khởi động lại backend, rồi đăng nhập Google bằng đúng email trong `ADMIN_EMAIL`.

---

## 6. Các phần ứng dụng AI

**Nguyên tắc thiết kế: mã chương trình tính số liệu, AI viết lời.** Điểm số, tỉ lệ đúng và lịch học do thuật toán tính, kiểm chứng được bằng test. AI chỉ giải thích và gợi ý bằng ngôn ngữ tự nhiên.

| Tính năng AI | Ở đâu | AI nhận vào | AI trả ra | Mã nguồn |
|---|---|---|---|---|
| Gia sư giải thích câu sai | Kết quả thi thử → **Vì sao mình sai?** | Đề, lựa chọn, đáp án đúng, đáp án học sinh chọn, lời giải gốc | Chỗ có thể đã nhầm, các bước giải, mẹo ghi nhớ, phần nên ôn | `ai/ExplanationService.java`, `AiExplainBox.tsx` |
| Nhận xét điểm yếu | Phân tích → **Nhờ AI nhận xét** | Bảng tỉ lệ đúng theo chuyên đề, các câu sai gần đây | Nhận xét chung, tối đa 3 chuyên đề ưu tiên, nhiệm vụ cụ thể | `ai/WeaknessService.java`, `AnalysisPage.tsx` |
| Soạn ghi chú kiến thức | Tổng quan → Học ngay → **Nhờ AI soạn ghi chú** | Tên môn, tên chuyên đề | Ghi chú Markdown có công thức LaTeX | `ai/TopicNoteService.java`, `TopicNoteView.tsx` |

**Những phần KHÔNG dùng AI:** tỉ lệ đúng theo chuyên đề (`TopicMasteryService`), chia thời gian học (`StudyScheduler`), lộ trình thích ứng (đúng dưới 50% thì ôn gấp 3, dưới 70% thì gấp 2), chấm điểm và tính giờ.

**Các kỹ thuật đáng học trong phần AI:**
- **Structured output:** AI bắt buộc trả JSON đúng cấu trúc của một `record` Java. Khuôn JSON được tạo tự động từ record (`JsonSchemas.java`).
- **Interface chung `AiGateway`:** đổi nhà cung cấp AI mà không sửa tính năng. Khi test thì thay bằng bản giả.
- **Lưu kết quả để dùng lại:** câu sai giống nhau chỉ gọi AI một lần (bảng `ai_explanations`, `topic_notes`).
- **Hạn mức theo ngày** (`AiQuotaService`); AI lỗi thì hoàn lại lượt.
- **Giảm rủi ro prompt injection:** dữ liệu được bọc trong thẻ `<...>` và prompt nói rõ đó là dữ liệu, không phải chỉ dẫn.
- **Nhãn "Do AI tạo"** và nút **Báo giải thích sai**: bị báo 3 lần thì lời giải thích bị xóa để AI tạo lại.

---

## 7. Cấu trúc mã nguồn

```
backend/src/main/java/vn/mystudy/
├── ai/            # Tính năng AI: gateway Gemini/Claude, hạn mức, 3 dịch vụ AI, controller
├── auth/          # Đăng ký, đăng nhập, liên kết Google
├── exams/         # Kho đề, lượt thi (bắt đầu/nộp bài), quản trị đề
├── samples/       # Kho bài mẫu
├── security/      # Spring Security, CSRF, CSP, giới hạn tần suất
└── study/         # Mục tiêu, bộ xếp lịch (scheduling/), phân tích tỉ lệ đúng (analytics/)
backend/src/main/resources/db/migration/   # Flyway V1 → V13 (KHÔNG sửa file đã chạy, thêm V14...)

frontend/src/
├── app/           # Router, layout, theme
├── features/      # ai, auth, admin, exams, samples, study — mỗi phần có api, hooks, model, pages
├── shared/        # Component dùng chung (MathText hiển thị công thức)
└── lib/http/      # Axios client, xử lý lỗi, CSRF
```

Tài liệu khác: `README.md` (tổng quan và triển khai), `docs/database.md` (thiết kế CSDL).

---

## 8. Kiểm thử

```bash
# Backend: 68 test (cơ sở dữ liệu nhúng, AI dùng mô hình giả nên không tốn tiền)
cd backend && ./mvnw verify

# Frontend
cd frontend
npm run typecheck
npm run lint
npm test
```

**Test gọi Gemini thật** (tốn hạn mức, mặc định bị bỏ qua):

```bash
cd backend && GEMINI_LIVE_KEY=khóa-của-bạn ./mvnw test -Dtest=GeminiLiveTest
```

---

## 9. Kịch bản demo (khoảng 7 phút)

1. **Đặt mục tiêu:** chọn "Chỉ cần tốt nghiệp", điểm hiện tại Toán là 4. Xem Lộ trình: Toán được nhiều thời gian nhất.
2. **Thi thử** đề "Khởi động cùng đạo hàm", cố ý làm sai vài câu. Đáp án đúng câu 1–10 lần lượt là: A C D B C A D B A C.
3. Bấm **Vì sao mình sai?**. Chỉ cho người xem nhãn "Do AI tạo" và nút báo sai.
4. Vào **Phân tích**: tỉ lệ đúng do hệ thống tính. Bấm **Nhờ AI nhận xét**, rồi **Cập nhật lộ trình theo kết quả**.
5. Vào **Tổng quan**, bấm **Học ngay**: công thức hiển thị bằng KaTeX; chuyên đề chưa có ghi chú thì bấm **Nhờ AI soạn ghi chú**.
6. **Bảo mật:** mở `/thi-thu/<mã-đề>/dap-an` khi chưa nộp bài, trang báo "Đáp án hiển thị sau khi nộp bài".

Mẹo: chạy thử toàn bộ kịch bản một lần trước buổi demo. Các lời giải thích AI được lưu lại, nên nếu mạng chập chờn lúc demo vẫn có kết quả hiện ngay.

---

## 10. Xử lý lỗi thường gặp

| Hiện tượng | Nguyên nhân | Cách xử lý |
|---|---|---|
| Backend báo `Failed to determine a suitable driver class` | Thiếu `backend/.env.local` hoặc thiếu `DATABASE_URL` | Tạo file theo mục 3 |
| `Port 8080 / 5173 already in use` | Còn tiến trình cũ đang chạy | Tắt terminal cũ (`Ctrl + C`) |
| Trang Phân tích báo "Tính năng AI chưa được bật" | `AI_ENABLED=false` hoặc chưa có khóa | Sửa `.env.local`, khởi động lại backend |
| "Không gọi được Gemini: khóa API hoặc tên mô hình không hợp lệ" | Khóa sai hoặc bị chép thiếu | Tạo khóa mới, dán đủ, không có dấu ngoặc kép |
| "Đã hết hạn mức gọi AI của khóa Gemini" | Hết lượt của gói miễn phí | Chờ hoặc kiểm tra hạn mức trong AI Studio |
| AI trả lời rất chậm | Mô hình nặng hoặc Google đang quá tải | Dùng `GEMINI_MODEL=gemini-3.5-flash-lite` |
| `npm install` báo lỗi phiên bản Node | Node cũ hơn 22 | Cài Node 22 LTS |
| Nút "Tiếp tục với Google" bị mờ | Chưa cấu hình Google OAuth | Đăng ký bằng email, hoặc làm theo mục 5 |

---

## 11. Bài tập phát triển tiếp

Các phần dưới đây **chưa làm**. Mỗi phần là một bài tập tốt; nên làm trên nhánh git riêng và viết test kèm theo.

| # | Bài tập | Độ khó | Gợi ý |
|---|---|---|---|
| 1 | Hỗ trợ đủ **3 dạng câu hỏi của đề thi 2025**: trắc nghiệm, đúng/sai (4 ý), trả lời ngắn; chấm điểm đúng quy định | Khó | Thêm cột `question_type` và `part`; bảng `exam_statements` cho câu đúng/sai; tách việc chấm điểm thành interface `QuestionScorer` |
| 2 | **AI trích xuất đề từ PDF** cho admin, có bước xem trước để giáo viên duyệt | Khó | Gửi PDF cho AI, nhận JSON theo cấu trúc của `CreateExamRequest` |
| 3 | **Quên mật khẩu và xác minh email** | Trung bình | Bảng `email_tokens`, chỉ lưu hash của token, token sống 30 phút; gửi mail bằng `spring-boot-starter-mail` |
| 4 | **Sửa đề đã đăng** bằng phiên bản đề mới | Trung bình | Tạo `exam_versions` mới, giữ nguyên bản cũ cho các lượt thi trước |
| 5 | **Tự nộp lượt thi bị bỏ dở** khi hết giờ | Trung bình | Tác vụ `@Scheduled` quét các lượt quá hạn |
| 6 | **Bổ sung nội dung**: mỗi môn 10–15 chuyên đề, nhiều đề và bài mẫu hơn | Dễ, cần nhiều công | Thêm bằng migration mới (V14...) |
| 7 | **Đánh giá chất lượng AI**: bộ 20–30 câu mẫu, chấm xem lời giải thích có đúng không | Trung bình | Viết test tương tự `GeminiLiveTest`, ghi kết quả ra bảng |
| 8 | Hoàn thiện **trang Quản trị**: quản lý bài mẫu, ghi chú kiến thức, vai trò giáo viên | Trung bình | Thêm các API CRUD dưới `/api/admin/...` |

**Quy tắc khi đóng góp:**
- Không sửa migration đã có; luôn thêm file migration mới.
- Chạy `./mvnw verify` và `npm test` trước khi commit.
- Không commit khóa API hay file `.env.local`.
