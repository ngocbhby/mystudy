-- Chuyển sang Spring Security: phiên và trạng thái OAuth do Spring Session quản lý (V7).
-- Mật khẩu băm bằng scrypt của bản Node.js được gắn nhãn để Spring Security nhận ra và
-- tự nâng cấp lên Argon2 ở lần đăng nhập thành công kế tiếp.
UPDATE profiles
SET password_hash = '{legacyscrypt}' || password_hash
WHERE password_hash LIKE 'scrypt:%';

ALTER TABLE profiles
    ADD CONSTRAINT profiles_password_hash_format
    CHECK (password_hash IS NULL OR password_hash ~ '^\{[A-Za-z0-9@_]+\}.+');

DROP TABLE IF EXISTS google_login_attempts;
DROP TABLE IF EXISTS auth_sessions;
