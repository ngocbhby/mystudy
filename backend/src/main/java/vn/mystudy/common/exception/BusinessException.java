package vn.mystudy.common.exception;

import java.util.Map;
import vn.mystudy.common.api.ErrorCode;

/** Lỗi nghiệp vụ có chủ đích; được {@link GlobalExceptionHandler} chuyển thành phản hồi chuẩn. */
public class BusinessException extends RuntimeException {

    private final ErrorCode code;
    private final transient Map<String, String> errors;

    public BusinessException(ErrorCode code) {
        this(code, code.defaultMessage(), Map.of());
    }

    public BusinessException(ErrorCode code, String message) {
        this(code, message, Map.of());
    }

    public BusinessException(ErrorCode code, String message, Map<String, String> errors) {
        super(message, null, false, false);
        this.code = code;
        this.errors = errors;
    }

    public ErrorCode code() {
        return code;
    }

    public Map<String, String> errors() {
        return errors;
    }

    public static BusinessException notFound(String message) {
        return new BusinessException(ErrorCode.NOT_FOUND, message);
    }

    public static BusinessException validation(Map<String, String> errors) {
        return new BusinessException(ErrorCode.VALIDATION_FAILED, ErrorCode.VALIDATION_FAILED.defaultMessage(), errors);
    }
}
