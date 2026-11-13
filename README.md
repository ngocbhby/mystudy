# MyStudy

Ứng dụng ôn thi THPT tiếng Việt, gồm đăng nhập, thiết lập mục tiêu, tổng quan và lộ trình cá nhân. Frontend dùng React, JavaScript (JSX) và CSS. Vite chạy môi trường phát triển và đóng gói frontend. API Node.js xử lý Google OAuth và đăng ký, đăng nhập bằng email/mật khẩu. PostgreSQL lưu hồ sơ, phiên, mục tiêu, lộ trình và tiến độ.

## Cấu trúc mã nguồn

| Thư mục | Trách nhiệm |
| --- | --- |
| `frontend/` | React và Vite. `src/features/auth/` chứa giao diện đăng nhập; `src/features/study/` chứa thiết lập mục tiêu, tổng quan, lịch tuần và mã gọi API học tập. |
| `backend/` | API Node.js. `src/auth/` xử lý OAuth, email và phiên đăng nhập; `src/study/` kiểm tra yêu cầu, xếp lịch và ghi dữ liệu; `db/` chứa migration PostgreSQL. |
| `packages/shared/` | Quy tắc kiểm tra mục tiêu, danh mục môn và hàm xác định ngày theo giờ Việt Nam. Gói này dùng được ở cả trình duyệt và máy chủ. |

Frontend gọi các đường dẫn tương đối `/api/…`. Khi phát triển, Vite chuyển các yêu cầu này đến backend ở `127.0.0.1:3001`. Backend đọc cấu hình riêng, kiểm tra phiên và truy cập PostgreSQL.

## Chạy dự án

Cần Node.js 24+ và PostgreSQL 16+ cho luồng đăng nhập.

```sh
npm ci
npm run dev
```

Lệnh `npm run dev` chạy cả hai tiến trình. Nếu muốn chạy riêng, mở hai terminal ở thư mục dự án và dùng `npm run dev:backend` và `npm run dev:frontend`.

Mở `http://localhost:5173`. Thẻ tuần học hiển thị từ thứ Hai đến Chủ nhật và tô ngày hiện tại theo múi giờ Việt Nam.

## Cấu hình đăng nhập

1. Tạo cơ sở dữ liệu PostgreSQL và áp dụng [các migration](backend/db/README.md#áp-dụng-schema).
2. Nếu chưa có `backend/.env.local`, chạy `cp backend/.env.example backend/.env.local`. Điền `DATABASE_URL` rồi khởi động lại backend.
3. Chọn **Đăng ký** để tạo tài khoản email với mật khẩu ít nhất 12 ký tự. Mật khẩu được băm bằng scrypt. Tài khoản email có thể đăng nhập ngay sau khi tạo. Luồng này chưa gửi thư xác minh địa chỉ email.

### Google OAuth

1. Trong [Google Cloud Console](https://console.cloud.google.com/auth/clients), cấu hình màn hình đồng ý OAuth và tạo client loại **Web application**. Nếu ứng dụng ở chế độ Testing, thêm tài khoản dùng thử.
2. Thêm `http://localhost:5173/api/auth/google/callback` vào **Authorized redirect URIs**. [Tài liệu Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect)
3. Điền `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` trong `backend/.env.local`, rồi khởi động lại backend. Hai biến này chỉ được đọc ở máy chủ.

Cả hai cách đăng nhập dùng phiên 7 ngày với cookie HttpOnly. Đăng xuất xóa phiên hiện tại. Tài khoản Google được nhận diện bằng định danh `sub`. Hồ sơ Google và hồ sơ mật khẩu được tạo độc lập, kể cả khi email trùng nhau.

## Mục tiêu và lộ trình

Tài khoản mới mở màn **Thiết lập mục tiêu** sau khi đăng nhập. Chọn hai môn tự chọn khác nhau, nhập điểm của cả bốn môn và thời gian có thể học. Quỹ giờ cập nhật theo số ngày đã chọn; cảnh báo chỉ là ước tính và vẫn cho phép tạo lịch. Các giới hạn của biểu mẫu là 1–24 tháng, 1 phút–24 giờ mỗi ngày và 0–10 điểm.

**Lưu và tạo lộ trình** mở lịch tuần hiện tại theo giờ Việt Nam. Nhiệm vụ được xếp trên các ngày đã chọn, trong giới hạn giờ học mỗi ngày. Từ màn Lộ trình có thể sửa mục tiêu hoặc đổi cách ôn; lịch mới giữ nhiệm vụ đã hoàn thành. Migration 004 cung cấp danh mục môn và chuyên đề dùng để tạo lịch.

## Tổng quan

Màn Tổng quan hiển thị các nhiệm vụ theo ngày Việt Nam, tiến độ hôm nay và điểm mục tiêu. Chọn **Học ngay** để mở nội dung ngắn và **Đánh dấu đã học** để lưu tiến độ. Chuỗi ngày học đếm những ngày liên tiếp có ít nhất một nhiệm vụ được hoàn thành, dựa trên thời điểm đánh dấu. Vào ngày nghỉ, màn hình hiển thị ngày học gần nhất trong tương lai nếu có.

## Kho đề thi

Mở `/kho-de-thi` để lọc đề theo môn và năm; không cần đăng nhập. Migration 005 bổ sung ba PDF tham khảo 2025 của Bộ GD&ĐT (Toán, Ngữ văn, Tiếng Anh) và đề Toán luyện đạo hàm của MyStudy. Các PDF giữ nguyên bản có đáp án; nút **Xem đáp án** mở tại trang đáp án. Đề MyStudy hỗ trợ luyện có bấm giờ và chấm ngay trong tab, chưa lưu lượt thi vào tài khoản.

## Build và chạy bản production

```sh
npm run build
npm start
```

`npm start` phục vụ cả bản build trong `frontend/dist/` và API, mặc định ở cổng 3000. Nếu thử OAuth tại cổng này, chạy `APP_ORIGIN=http://localhost:3000 npm start` và thêm URI callback tương ứng trong Google Cloud. Khi triển khai, đặt `APP_ORIGIN` thành địa chỉ HTTPS của ứng dụng và đăng ký callback cho địa chỉ đó. Có thể đặt `HOST` và `PORT` để cấu hình địa chỉ lắng nghe của Node.js ở chế độ production.
