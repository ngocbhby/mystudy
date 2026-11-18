package vn.mystudy.auth.service;

public interface OtpService {

    /**
     * Tạo OTP 6 số, hash BCrypt, lưu DB, gửi email.
     * Xóa token cũ của email+purpose trước khi tạo mới.
     */
    void generateAndSend(String email, String purpose);

    /**
     * Xác minh OTP. Đánh dấu used_at nếu hợp lệ.
     * Throws BusinessException(BAD_REQUEST) nếu OTP sai hoặc hết hạn.
     */
    void verify(String email, String purpose, String code);
}
