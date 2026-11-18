package vn.mystudy.auth.service;

public interface MailService {

    /**
     * Gửi email HTML chứa mã OTP.
     * Nếu JavaMailSender không available, chỉ log warning và không throw.
     */
    void sendOtpEmail(String to, String code, String purpose);
}
