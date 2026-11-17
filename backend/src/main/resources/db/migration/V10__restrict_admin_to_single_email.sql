-- 1. Đưa tất cả tài khoản về quyền người dùng thông thường (USER)
UPDATE profiles SET role = 'USER';

-- 2. Chỉ cấp quyền ADMIN cho tài khoản quản trị viên duy nhất
UPDATE profiles SET role = 'ADMIN' 
WHERE lower(email) = 'ngocbhbymit@gmail.com';
