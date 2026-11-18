package vn.mystudy.auth.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.mystudy.auth.dto.LoginRequest;
import vn.mystudy.auth.dto.RegisterRequest;
import vn.mystudy.auth.dto.ResetPasswordRequest;
import vn.mystudy.auth.dto.SendOtpRequest;
import vn.mystudy.auth.dto.SessionResponse;
import vn.mystudy.auth.dto.UserResponse;
import vn.mystudy.auth.dto.VerifyOtpRegisterRequest;
import vn.mystudy.auth.dto.VerifyOtpResetRequest;
import vn.mystudy.auth.service.AuthService;
import vn.mystudy.auth.service.OtpService;
import vn.mystudy.common.api.ApiResponse;
import vn.mystudy.config.AppProperties;
import vn.mystudy.security.SessionAuthenticator;

@RestController
@RequestMapping("/api")
class AuthController {

    private final AuthService authService;
    private final OtpService otpService;
    private final SessionAuthenticator sessions;
    private final AppProperties properties;

    AuthController(AuthService authService, OtpService otpService, SessionAuthenticator sessions,
            AppProperties properties) {
        this.authService = authService;
        this.otpService = otpService;
        this.sessions = sessions;
        this.properties = properties;
    }

    @GetMapping("/session")
    ApiResponse<SessionResponse> session(Authentication authentication) {
        UserResponse user = authService.currentUser(authentication).orElse(null);
        return ApiResponse.ok(new SessionResponse(user, properties.googleConfigured()));
    }

    @PostMapping("/auth/login")
    ApiResponse<UserResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest http,
            HttpServletResponse response) {
        Authentication authentication = authService.login(request);
        sessions.establish(authentication, http, response);
        return ApiResponse.ok("Đăng nhập thành công.", userOf(authentication));
    }

    @PostMapping("/auth/register")
    ResponseEntity<ApiResponse<UserResponse>> register(@Valid @RequestBody RegisterRequest request,
            HttpServletRequest http, HttpServletResponse response) {
        Authentication authentication = authService.register(request);
        sessions.establish(authentication, http, response);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Tạo tài khoản thành công.", userOf(authentication)));
    }

    @PostMapping("/auth/reset-password")
    ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ApiResponse.ok("Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.", null);
    }

    // ── OTP endpoints ────────────────────────────────────────────────────────

    @PostMapping("/auth/send-otp")
    ApiResponse<Void> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        otpService.generateAndSend(normalize(request.email()), request.purpose().toUpperCase(Locale.ROOT));
        return ApiResponse.ok("Mã OTP đã được gửi đến email của bạn.", null);
    }

    @PostMapping("/auth/verify-register")
    ResponseEntity<ApiResponse<UserResponse>> verifyRegister(@Valid @RequestBody VerifyOtpRegisterRequest request,
            HttpServletRequest http, HttpServletResponse response) {
        String email = normalize(request.email());
        otpService.verify(email, "REGISTER", request.otp());
        RegisterRequest registerRequest = new RegisterRequest(email, request.password(), request.confirmPassword());
        Authentication authentication = authService.register(registerRequest);
        sessions.establish(authentication, http, response);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Tạo tài khoản thành công.", userOf(authentication)));
    }

    @PostMapping("/auth/verify-reset-password")
    ApiResponse<Void> verifyResetPassword(@Valid @RequestBody VerifyOtpResetRequest request) {
        String email = normalize(request.email());
        otpService.verify(email, "RESET_PASSWORD", request.otp());
        ResetPasswordRequest resetRequest = new ResetPasswordRequest(email, request.newPassword(),
                request.confirmPassword());
        authService.resetPassword(resetRequest);
        return ApiResponse.ok("Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.", null);
    }

    private UserResponse userOf(Authentication authentication) {
        return authService.currentUser(authentication).orElseThrow();
    }

    private static String normalize(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
