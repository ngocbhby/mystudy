-- Cấp quyền ADMIN cho tài khoản quản trị
UPDATE profiles 
SET role = 'ADMIN' 
WHERE lower(email) IN (
    'email_admin_moi@gmail.com'
);