-- Cấp quyền ADMIN cho tài khoản quản trị
UPDATE profiles 
SET role = 'ADMIN' 
WHERE lower(email) IN (
    'ngocbhbymit@gmail.com',
    'ductrung1232013@gmail.com',
    'h.nam2k707@gmail.com'
);
