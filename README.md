# MyStudy

Ứng dụng ôn thi THPT bằng tiếng Việt: đăng nhập (email hoặc Google), thiết lập mục tiêu, lộ trình học theo tuần, tổng quan nhiệm vụ hằng ngày và kho đề thi.

## Techstack

| Tầng | Công nghệ |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, MUI, React Router, TanStack Query, Axios, React Hook Form + Zod, Vitest |
| Backend | Java 21, Spring Boot 4 (Web MVC, Security, OAuth2 Client, Data JPA/Hibernate, Validation, Actuator), Flyway, Spring Session JDBC |
| Dữ liệu | PostgreSQL 16+ |
| Triển khai | Docker nhiều giai đoạn, Render (`render.yaml`), GitHub Actions |

## Cấu trúc

```
backend/   Spring Boot (Maven wrapper: ./mvnw)
frontend/  React + TypeScript (Vite)
docs/      Thiết kế cơ sở dữ liệu
Dockerfile, render.yaml, .github/workflows/ci.yml
```

### Backend (`backend/src/main/java/vn/mystudy`)

Tổ chức theo **tính năng**, mỗi tính năng chia tầng rõ ràng:

```
<feature>/
  controller/   Nhận HTTP, kiểm tra đầu vào, trả ApiResponse. Không chứa nghiệp vụ.
  service/      Interface nghiệp vụ + <Name>ServiceImpl (giao dịch @Transactional).
  repository/   Spring Data JPA.
  entity/       Thực thể JPA ánh xạ schema Flyway.
  dto/          Record request/response; entity không bao giờ ra ngoài API.
  mapper/       Entity <-> DTO.
```

| Package | Vai trò |
| --- | --- |
| `auth` | Đăng ký, đăng nhập email, trạng thái phiên. |
| `study` | Mục tiêu, lộ trình, nhiệm vụ; `scheduling/StudyScheduler` là logic xếp lịch thuần (dễ test). |
| `exams` | Kho đề và đề trực tuyến. |
| `samples` | Kho bài mẫu (đề bài, lời giải, ghi chú cách làm). |
| `security` | Cấu hình Spring Security, CSRF, giới hạn tốc độ, OAuth2 Google, mã hóa mật khẩu. |
| `common` | `ApiResponse`, `ErrorCode`, ngoại lệ + `GlobalExceptionHandler`, log truy cập/audit, `VietnamClock`. |
| `config` | Thuộc tính cấu hình, kết nối CSDL, phục vụ frontend (SPA). |

**Khung phản hồi chung.** Mọi API (kể cả lỗi từ filter bảo mật) trả:

```json
{ "success": true,  "code": "OK", "message": "Thành công", "data": { }, "requestId": "…", "timestamp": "…" }
{ "success": false, "code": "VALIDATION_FAILED", "message": "…", "errors": { "months": "…" }, "requestId": "…", "timestamp": "…" }
```

`code` là `ErrorCode` ổn định để frontend xử lý; `requestId` khớp với log và header `X-Request-Id`.

**Log.** `logback-spring.xml`: dev là dòng dễ đọc kèm `[requestId]`; production (`prod`) là JSON một dòng trên stdout. Logger `ACCESS` ghi mỗi yêu cầu (method, đường dẫn, status, thời gian; không ghi query/body), logger `AUDIT` ghi đăng nhập/đăng ký (email được che). Lỗi bất ngờ chỉ ghi ở `GlobalExceptionHandler`, client nhận thông điệp chung.

### Frontend (`frontend/src`)

```
app/        Khởi tạo: providers (Query, Theme), router (paths.ts, guards, lazy routes), layout, theme
config/     env.ts — đọc và kiểm tra biến môi trường (Zod); nơi duy nhất dùng import.meta.env
lib/        Hạ tầng dùng chung: http (Axios client, ApiError, CSRF), query (QueryClient, thời gian cache), date, format
shared/     Component và hook dùng chung không thuộc tính năng nào
features/   auth | study | exams | samples — mỗi tính năng có api/ hooks/ components/ pages/ model/
```

- **Một cổng gọi API** (`lib/http/client.ts`): tự gỡ `ApiResponse`, chuyển mọi lỗi thành `ApiError`, tự thêm header CSRF, báo phiên hết hạn để xóa cache.
- **Cache** bằng TanStack Query: khóa tập trung trong `features/*/api/keys.ts`, thời gian cache theo độ biến động (`staleTimes`), mutation tự invalidate dữ liệu liên quan.
- **Route** khai báo ở `app/router/paths.ts`; trang tải theo yêu cầu (code splitting); `RequireAuth` bảo vệ trang cần đăng nhập.
- **Stage/môi trường**: `.env.development`, `.env.staging`, `.env.production` (chỉ biến công khai `VITE_*`); `npm run dev`, `npm run build:staging`, `npm run build`.

## Chạy dự án

Cần Java 21+, Node 22+ (khuyến nghị 24). Backend dùng Maven wrapper nên không cần cài Maven.

**1. Cơ sở dữ liệu** — dùng PostgreSQL của bạn, hoặc chạy bản nhúng (không cần cài gì):

```bash
cd backend && ./mvnw -q test-compile exec:java -Dexec.mainClass=vn.mystudy.support.DevDatabase -Dexec.classpathScope=test
```

Lệnh in `DATABASE_URL=postgresql://postgres@localhost:54329/postgres`.

**2. Cấu hình backend** — sao chép `backend/.env.example` thành `backend/.env.local` rồi điền `DATABASE_URL` (Google là tùy chọn).

```bash
cp backend/.env.example backend/.env.local
```

**3. Chạy** (hai terminal):

```bash
cd backend && ./mvnw spring-boot:run
```

```bash
cd frontend && npm ci && npm run dev
```

Mở `http://localhost:5173`. Vite chuyển tiếp `/api` sang Spring Boot ở `localhost:8080`, nên trình duyệt chỉ thấy một origin (cookie phiên, CSRF và OAuth hoạt động giống production). Flyway tự tạo schema khi backend khởi động.

### Đăng nhập Google (tùy chọn)

1. Trong [Google Cloud Console](https://console.cloud.google.com/auth/clients) tạo OAuth client loại **Web application**.
2. Thêm `http://localhost:5173/api/auth/google/callback` vào **Authorized redirect URIs** (production: `https://<miền>/api/auth/google/callback`).
3. Điền `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` vào `backend/.env.local` rồi khởi động lại backend. Thiếu hai biến này thì nút Google bị tắt, đăng nhập email vẫn hoạt động.

## Kiểm thử và chất lượng

```bash
cd backend && ./mvnw verify          # unit + tích hợp (PostgreSQL nhúng, Flyway, HTTP đầy đủ)
cd frontend && npm run lint && npm run typecheck && npm test
```

CI (`.github/workflows/ci.yml`) chạy cả hai trên mỗi pull request.

## Triển khai

`Dockerfile` build frontend, nhúng vào jar Spring Boot rồi chạy bằng JRE tối giản dưới người dùng không phải root. `render.yaml` mô tả web service và PostgreSQL trên Render.

Biến môi trường production:

| Biến | Ý nghĩa |
| --- | --- |
| `SPRING_PROFILES_ACTIVE=prod` | Bật log JSON, cookie `__Host-` + Secure, kiểm tra cấu hình khi khởi động. |
| `APP_ORIGIN` | Địa chỉ **HTTPS** công khai. Backend từ chối khởi động nếu không phải HTTPS. |
| `DATABASE_URL` | `postgresql://…`; máy chủ ngoài localhost tự dùng `sslmode=require`. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Tùy chọn. |

Health check: `GET /actuator/health`. Phía sau reverse proxy, backend tin `X-Forwarded-*` chỉ từ địa chỉ proxy nội bộ (`server.forward-headers-strategy=native`); nếu proxy của bạn nằm ngoài dải riêng tư mặc định, đặt `server.tomcat.remoteip.internal-proxies`.

### Nâng cấp từ bản Node.js

CSDL cũ dùng được nguyên trạng: Flyway nhận V1–V5 làm điểm xuất phát rồi chạy V6–V7 (xem [docs/database.md](docs/database.md)). Mật khẩu email cũ vẫn đăng nhập được và tự nâng cấp lên Argon2. Phiên đăng nhập cũ bị hủy, người dùng đăng nhập lại một lần. Callback Google giữ nguyên `/api/auth/google/callback` nên không cần đổi cấu hình Google.

## Bảo mật

- Mật khẩu: Argon2id (OWASP), giới hạn băm đồng thời để chống cạn RAM; scrypt cũ được nâng cấp khi đăng nhập.
- Phiên: cookie HttpOnly, SameSite=Lax, `__Host-` + Secure ở production, đổi ID khi đăng nhập (chống session fixation), lưu ở PostgreSQL, hết hạn sau 7 ngày.
- CSRF: token trong cookie + header `X-XSRF-TOKEN` cho mọi yêu cầu ghi.
- Giới hạn tốc độ: theo IP (đọc đúng IP thật qua proxy tin cậy) và theo email khi đăng nhập sai; phản hồi 429 + `Retry-After`.
- Google: Authorization Code + PKCE, `state`, `nonce`, kiểm tra ID token; chỉ lưu email đã được Google xác minh.
- Header: CSP (script chỉ `'self'`), HSTS, `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP; API luôn `Cache-Control: no-store`.
- Mặc định từ chối: API không khai báo quyền thì bị chặn; chỉ `/api/exams` và `/api/samples` (GET), phiên và đăng nhập là công khai.

**Hạn chế đã biết:** đăng ký chưa xác minh email, và thông báo "email đã tồn tại" cho phép dò email (được giảm nhẹ bằng giới hạn tốc độ). Khắc phục triệt để cần gửi email xác minh (SMTP).
