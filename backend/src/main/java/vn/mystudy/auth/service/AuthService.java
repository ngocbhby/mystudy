package vn.mystudy.auth.service;

import java.util.Optional;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import vn.mystudy.auth.dto.LoginRequest;
import vn.mystudy.auth.dto.RegisterRequest;
import vn.mystudy.auth.dto.ResetPasswordRequest;
import vn.mystudy.auth.dto.UserResponse;

public interface AuthService {

    Authentication register(RegisterRequest request);

    Authentication login(LoginRequest request);

    void resetPassword(ResetPasswordRequest request);

    UUID linkGoogleAccount(String subject, String email, String displayName);

    Optional<UserResponse> currentUser(Authentication authentication);
}
