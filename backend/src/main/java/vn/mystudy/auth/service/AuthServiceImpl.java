package vn.mystudy.auth.service;

import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.mystudy.auth.dto.LoginRequest;
import vn.mystudy.auth.dto.RegisterRequest;
import vn.mystudy.auth.dto.ResetPasswordRequest;
import vn.mystudy.auth.dto.UserResponse;
import vn.mystudy.auth.entity.Profile;
import vn.mystudy.auth.mapper.UserMapper;
import vn.mystudy.auth.repository.ProfileRepository;
import vn.mystudy.common.api.ErrorCode;
import vn.mystudy.common.exception.BusinessException;
import vn.mystudy.common.exception.TooManyRequestsException;
import vn.mystudy.common.logging.AuditLog;
import vn.mystudy.security.AppUserDetails;
import vn.mystudy.security.HashingGuard;
import vn.mystudy.security.ProfilePrincipal;
import vn.mystudy.security.RateLimiter;

@Service
class AuthServiceImpl implements AuthService {

    private static final long FAILED_LOGIN_WINDOW_SECONDS = 15 * 60;

    private final ProfileRepository profiles;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final HashingGuard hashingGuard;
    private final UserMapper mapper;
    private final RateLimiter failedLogins;
    private final Set<String> adminEmails;

    AuthServiceImpl(ProfileRepository profiles, PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager, HashingGuard hashingGuard, UserMapper mapper,
            RateLimiter failedLoginLimiter,
            @Value("${app.admin-email:ngocbhbymit@gmail.com, h.nam2k707@gmail.com, ductrung1232013@gmail.com}") String adminEmail) {
        this.profiles = profiles;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.hashingGuard = hashingGuard;
        this.mapper = mapper;
        this.failedLogins = failedLoginLimiter;
        this.adminEmails = vn.mystudy.security.AdminSecurity.parseAdminEmails(adminEmail);
    }

    @Override
    public Authentication register(RegisterRequest request) {
        if (request.confirmPassword() != null && !request.confirmPassword().isBlank()
                && !request.confirmPassword().equals(request.password())) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Mật khẩu xác nhận không khớp.",
                    Map.of("confirmPassword", "Mật khẩu xác nhận không khớp."));
        }
        String email = normalize(request.email());
        String hash = hashingGuard.run(() -> passwordEncoder.encode(request.password()));
        Profile newProfile = Profile.withPassword(email, hash);
        // Email đăng ký chưa được xác minh nên không bao giờ được cấp quyền quản trị tại đây.
        newProfile.setRole("USER");
        Profile profile;
        try {
            // Không bọc trong giao dịch ngoài: vi phạm ràng buộc duy nhất chỉ làm hỏng giao dịch của repository.
            profile = profiles.saveAndFlush(newProfile);
        } catch (DataIntegrityViolationException e) {
            AuditLog.registerRejected(email);
            throw new BusinessException(ErrorCode.CONFLICT,
                    "Không thể đăng ký bằng email này. Bạn có thể thử đăng nhập.");
        }
        AuditLog.registered(email);
        return authenticated(new AppUserDetails(profile.getId(), email, null, profile.getRole()));
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Mật khẩu xác nhận không khớp.",
                    Map.of("confirmPassword", "Mật khẩu xác nhận không khớp."));
        }
        String email = normalize(request.email());
        Profile profile = profiles.findFirstByEmailIgnoreCase(email)
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy tài khoản với email này."));

        String hash = hashingGuard.run(() -> passwordEncoder.encode(request.newPassword()));
        profile.changePasswordHash(hash);
        profiles.saveAndFlush(profile);

        failedLogins.reset(email);
        AuditLog.passwordReset(email);
    }

    @Override
    public Authentication login(LoginRequest request) {
        String email = normalize(request.email());
        if (failedLogins.isBlocked(email)) {
            AuditLog.loginBlocked(email);
            throw new TooManyRequestsException(FAILED_LOGIN_WINDOW_SECONDS);
        }
        try {
            Authentication result = hashingGuard.run(() -> authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(email, request.password())));
            failedLogins.reset(email);
            AuditLog.loginSucceeded(email);
            return result;
        } catch (BadCredentialsException e) {
            failedLogins.record(email);
            AuditLog.loginFailed(email);
            throw new BusinessException(ErrorCode.BAD_CREDENTIALS);
        }
    }

    @Override
    @Transactional
    public UUID linkGoogleAccount(String subject, String verifiedEmail, String displayName) {
        String email = normalize(verifiedEmail);
        Profile profile = profiles.findByGoogleSub(subject).orElse(null);
        if (profile == null) {
            if (email != null && !email.isBlank()) {
                Profile existingByEmail = profiles.findFirstByEmailIgnoreCase(email).orElse(null);
                // Không gộp vào hồ sơ có mật khẩu: email đăng ký chưa được xác minh, người lạ có thể đã
                // đăng ký trước bằng email này để chờ chủ email đăng nhập Google rồi dùng chung tài khoản.
                if (existingByEmail != null && existingByEmail.getPasswordHash() == null) {
                    existingByEmail.linkGoogle(subject, email, displayName);
                    return existingByEmail.getId();
                }
            }
            return profiles.saveAndFlush(Profile.fromGoogle(subject, email, displayName)).getId();
        }
        profile.updateFromGoogle(email, displayName);
        return profile.getId();
    }

    @Override
    @Transactional
    public Optional<UserResponse> currentUser(Authentication authentication) {
        // Quyền lấy từ CSDL; chỉ đăng nhập Google với email đã xác minh mới cấp/thu hồi quyền quản trị.
        return ProfilePrincipal.idOf(authentication).flatMap(profiles::findById).map(mapper::toResponse);
    }

    private static Authentication authenticated(AppUserDetails principal) {
        return UsernamePasswordAuthenticationToken.authenticated(principal, null, principal.getAuthorities());
    }

    private static String normalize(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
