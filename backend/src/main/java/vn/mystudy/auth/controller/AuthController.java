package vn.mystudy.auth.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
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
import vn.mystudy.auth.dto.SessionResponse;
import vn.mystudy.auth.dto.UserResponse;
import vn.mystudy.auth.service.AuthService;
import vn.mystudy.common.api.ApiResponse;
import vn.mystudy.config.AppProperties;
import vn.mystudy.security.SessionAuthenticator;

@RestController
@RequestMapping("/api")
class AuthController {

    private final AuthService authService;
    private final SessionAuthenticator sessions;
    private final AppProperties properties;

    AuthController(AuthService authService, SessionAuthenticator sessions, AppProperties properties) {
        this.authService = authService;
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

    private UserResponse userOf(Authentication authentication) {
        return authService.currentUser(authentication).orElseThrow();
    }
}
