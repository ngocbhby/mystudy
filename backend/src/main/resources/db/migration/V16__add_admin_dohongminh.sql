-- Cấp quyền ADMIN cho tài khoản quản trị dohongminh2k7@gmail.com nếu đã tồn tại
UPDATE profiles 
SET role = 'ADMIN' 
WHERE lower(email) = 'dohongminh2k7@gmail.com';
