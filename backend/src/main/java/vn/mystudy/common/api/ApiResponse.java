package vn.mystudy.common.api;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.Map;
import org.slf4j.MDC;

/**
 * Khung phản hồi chung của mọi API.
 *
 * <pre>
 * { "success": true,  "code": "OK", "message": "...", "data": {...}, "requestId": "...", "timestamp": "..." }
 * { "success": false, "code": "VALIDATION_FAILED", "message": "...", "errors": {"field": "..."}, ... }
 * </pre>
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
        boolean success,
        String code,
        String message,
        T data,
        Map<String, String> errors,
        String requestId,
        Instant timestamp) {

    public static final String REQUEST_ID_KEY = "requestId";

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, "OK", "Thành công", data, null, MDC.get(REQUEST_ID_KEY), Instant.now());
    }

    public static <T> ApiResponse<T> ok(String message, T data) {
        return new ApiResponse<>(true, "OK", message, data, null, MDC.get(REQUEST_ID_KEY), Instant.now());
    }

    public static ApiResponse<Void> failure(ErrorCode code, String message, Map<String, String> errors) {
        return new ApiResponse<>(false, code.name(), message == null ? code.defaultMessage() : message, null,
                errors == null || errors.isEmpty() ? null : errors, MDC.get(REQUEST_ID_KEY), Instant.now());
    }
}
