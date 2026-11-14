package vn.mystudy.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Set;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Giới hạn đăng nhập/đăng ký theo IP khách. {@code getRemoteAddr()} đã là IP thật vì Tomcat xử lý
 * X-Forwarded-For từ proxy tin cậy (server.forward-headers-strategy=native).
 */
final class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final Set<String> PROTECTED = Set.of("/api/auth/login", "/api/auth/register");

    private final RateLimiter limiter;

    AuthRateLimitFilter(RateLimiter limiter) {
        this.limiter = limiter;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !"POST".equals(request.getMethod()) || !PROTECTED.contains(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (limiter.tryAcquire(request.getRemoteAddr())) {
            chain.doFilter(request, response);
            return;
        }
        response.setHeader("Retry-After", String.valueOf(limiter.windowSeconds()));
        JsonResponses.write(response, vn.mystudy.common.api.ErrorCode.RATE_LIMITED);
    }
}
