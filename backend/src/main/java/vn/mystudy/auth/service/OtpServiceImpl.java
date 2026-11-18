package vn.mystudy.auth.service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.mystudy.auth.entity.OtpToken;
import vn.mystudy.auth.repository.OtpTokenRepository;
import vn.mystudy.common.api.ErrorCode;
import vn.mystudy.common.exception.BusinessException;

@Service
class OtpServiceImpl implements OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpServiceImpl.class);
    private static final int OTP_TTL_MINUTES = 10;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final OtpTokenRepository otpTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;

    OtpServiceImpl(OtpTokenRepository otpTokenRepository, PasswordEncoder passwordEncoder, MailService mailService) {
        this.otpTokenRepository = otpTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailService = mailService;
    }

    @Override
    @Transactional
    public void generateAndSend(String email, String purpose) {
        // Xóa token cũ
        otpTokenRepository.deleteByEmailAndPurpose(email, purpose);

        // Tạo OTP 6 số
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        String hash = passwordEncoder.encode(code);

        Instant expiresAt = Instant.now().plus(OTP_TTL_MINUTES, ChronoUnit.MINUTES);
        OtpToken token = OtpToken.of(email, hash, purpose, expiresAt);
        otpTokenRepository.save(token);

        log.info("OTP generated for email={} purpose={}", email, purpose);
        mailService.sendOtpEmail(email, code, purpose);
    }

    @Override
    @Transactional
    public void verify(String email, String purpose, String code) {
        OtpToken token = otpTokenRepository
                .findFirstByEmailAndPurposeAndUsedAtIsNullAndExpiresAtAfterOrderByCreatedAtDesc(
                        email, purpose, Instant.now())
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST,
                        "Mã OTP không đúng hoặc đã hết hạn."));

        if (!passwordEncoder.matches(code, token.getCodeHash())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Mã OTP không đúng hoặc đã hết hạn.");
        }

        token.markUsed();
        otpTokenRepository.save(token);
        log.info("OTP verified for email={} purpose={}", email, purpose);
    }
}
