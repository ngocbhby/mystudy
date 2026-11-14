package vn.mystudy.auth.service;

import java.util.Optional;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import vn.mystudy.auth.dto.LoginRequest;
import vn.mystudy.auth.dto.RegisterRequest;
import vn.mystudy.auth.dto.UserResponse;

public interface AuthService {

    /** Tạo tài khoản email/mật khẩu; ném CONFLICT nếu email đã dùng. */
    Authentication register(RegisterRequest request);

    /** Xác thực email/mật khẩu; ném BAD_CREDENTIALS hoặc RATE_LIMITED. */
    Authentication login(LoginRequest request);

    /** Tạo hoặc cập nhật hồ sơ theo định danh Google; chỉ lưu email đã được Google xác minh. */
    UUID linkGoogleAccount(String subject, String verifiedEmail, String displayName);

    Optional<UserResponse> currentUser(Authentication authentication);
}
