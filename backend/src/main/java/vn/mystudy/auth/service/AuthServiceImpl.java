package vn.mystudy.auth.service;

import java.util.Locale;
import java.util.Optional;
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
    private final String adminEmail;

    AuthServiceImpl(ProfileRepository profiles, PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager, HashingGuard hashingGuard, UserMapper mapper,
            RateLimiter failedLoginLimiter,
            @Value("${app.admin-email:ngocbhbymit@gmail.com}") String adminEmail) {
        this.profiles = profiles;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.hashingGuard = hashingGuard;
        this.mapper = mapper;
        this.failedLogins = failedLoginLimiter;
        this.adminEmail = adminEmail != null ? adminEmail.trim().toLowerCase(Locale.ROOT) : "";
    }

    @Override
    public Authentication register(RegisterRequest request) {
        String email = normalize(request.email());
        String hash = hashingGuard.run(() -> passwordEncoder.encode(request.password()));
        Profile newProfile = Profile.withPassword(email, hash);
        boolean isAdmin = !adminEmail.isBlank() && email != null && email.equals(adminEmail);
        newProfile.setRole(isAdmin ? "ADMIN" : "USER");
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
                if (existingByEmail != null) {
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
        return ProfilePrincipal.idOf(authentication).flatMap(profiles::findById).map(profile -> {
            if (profile.getEmail() != null) {
                String norm = profile.getEmail().trim().toLowerCase(Locale.ROOT);
                boolean isAdmin = !adminEmail.isBlank() && norm.equals(adminEmail);
                String expected = isAdmin ? "ADMIN" : "USER";
                if (!expected.equalsIgnoreCase(profile.getRole())) {
                    profile.setRole(expected);
                    profiles.saveAndFlush(profile);
                }
            }
            return mapper.toResponse(profile);
        });
    }

    private static Authentication authenticated(AppUserDetails principal) {
        return UsernamePasswordAuthenticationToken.authenticated(principal, null, principal.getAuthorities());
    }

    private static String normalize(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
