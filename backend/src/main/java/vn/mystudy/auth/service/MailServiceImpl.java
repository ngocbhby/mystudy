package vn.mystudy.auth.service;

import jakarta.mail.internet.MimeMessage;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
class MailServiceImpl implements MailService {

    private static final Logger log = LoggerFactory.getLogger(MailServiceImpl.class);

    private final Optional<JavaMailSender> mailSender;

    MailServiceImpl(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = Optional.ofNullable(mailSender);
    }

    @Override
    public void sendOtpEmail(String to, String code, String purpose) {
        if (mailSender.isEmpty()) {
            log.warn("JavaMailSender not configured — skipping OTP email to={} purpose={}", to, purpose);
            return;
        }

        String subject = "RESET_PASSWORD".equalsIgnoreCase(purpose)
                ? "Đặt lại mật khẩu MyStudy"
                : "Mã xác nhận MyStudy";

        String html = """
                <html><body style="font-family:sans-serif;color:#222;">
                <p>Xin chào,</p>
                <p>Mã OTP của bạn là: <b style="font-size:1.4em;letter-spacing:4px;">%s</b></p>
                <p>Mã có hiệu lực trong <b>10 phút</b>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
                <p style="color:#888;font-size:0.9em;">— Đội ngũ MyStudy</p>
                </body></html>
                """.formatted(code);

        try {
            JavaMailSender sender = mailSender.get();
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            sender.send(message);
            log.info("OTP email sent to={} purpose={}", to, purpose);
        } catch (Exception e) {
            log.error("Failed to send OTP email to={} purpose={}: {}", to, purpose, e.getMessage(), e);
        }
    }
}
