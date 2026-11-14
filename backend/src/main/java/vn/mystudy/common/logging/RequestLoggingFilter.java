package vn.mystudy.common.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import vn.mystudy.common.api.ApiResponse;

/**
 * Gán {@code requestId} vào MDC (cũng trả về qua header X-Request-Id) và ghi một dòng log truy cập cho mỗi yêu cầu.
 * Không ghi query string, header hay body để tránh lộ dữ liệu nhạy cảm.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger access = LoggerFactory.getLogger("ACCESS");
    private static final Pattern SAFE_ID = Pattern.compile("[A-Za-z0-9-]{8,64}");
    static final String HEADER = "X-Request-Id";

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/assets/") || path.startsWith("/actuator/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String incoming = request.getHeader(HEADER);
        String requestId = incoming != null && SAFE_ID.matcher(incoming).matches() ? incoming : UUID.randomUUID().toString();
        MDC.put(ApiResponse.REQUEST_ID_KEY, requestId);
        response.setHeader(HEADER, requestId);
        long start = System.nanoTime();
        try {
            chain.doFilter(request, response);
        } finally {
            long millis = (System.nanoTime() - start) / 1_000_000;
            int status = response.getStatus();
            String line = "{} {} -> {} ({} ms)";
            if (status >= 500) access.warn(line, request.getMethod(), request.getRequestURI(), status, millis);
            else access.info(line, request.getMethod(), request.getRequestURI(), status, millis);
            MDC.clear();
        }
    }
}
