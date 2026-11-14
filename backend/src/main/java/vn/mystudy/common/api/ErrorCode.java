package vn.mystudy.common.api;

import org.springframework.http.HttpStatus;

/** Mã lỗi nghiệp vụ ổn định để frontend xử lý, tách khỏi thông điệp hiển thị. */
public enum ErrorCode {
    BAD_REQUEST(HttpStatus.BAD_REQUEST, "Yêu cầu không hợp lệ."),
    VALIDATION_FAILED(HttpStatus.BAD_REQUEST, "Kiểm tra lại các trường được đánh dấu."),
    UNAUTHENTICATED(HttpStatus.UNAUTHORIZED, "Phiên đã hết hạn. Hãy đăng nhập lại để tiếp tục."),
    BAD_CREDENTIALS(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không đúng."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "Nguồn yêu cầu không hợp lệ."),
    NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy tài nguyên."),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "Phương thức không được hỗ trợ."),
    CONFLICT(HttpStatus.CONFLICT, "Dữ liệu bị xung đột."),
    RATE_LIMITED(HttpStatus.TOO_MANY_REQUESTS, "Có quá nhiều yêu cầu. Vui lòng thử lại sau."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Đã xảy ra lỗi. Vui lòng thử lại."),
    SERVICE_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "Dịch vụ tạm thời gián đoạn. Vui lòng thử lại.");

    private final HttpStatus status;
    private final String defaultMessage;

    ErrorCode(HttpStatus status, String defaultMessage) {
        this.status = status;
        this.defaultMessage = defaultMessage;
    }

    public HttpStatus status() {
        return status;
    }

    public String defaultMessage() {
        return defaultMessage;
    }
}
