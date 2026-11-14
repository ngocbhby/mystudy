package vn.mystudy.common.exception;

import jakarta.validation.ConstraintViolationException;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;
import vn.mystudy.common.api.ApiResponse;
import vn.mystudy.common.api.ErrorCode;

/** Nơi duy nhất chuyển ngoại lệ thành {@link ApiResponse}; chi tiết kỹ thuật chỉ ghi log, không trả cho client. */
@RestControllerAdvice
class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(TooManyRequestsException.class)
    ResponseEntity<ApiResponse<Void>> tooMany(TooManyRequestsException e) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header(HttpHeaders.RETRY_AFTER, String.valueOf(e.retryAfterSeconds()))
                .body(ApiResponse.failure(e.code(), e.getMessage(), null));
    }

    @ExceptionHandler(BusinessException.class)
    ResponseEntity<ApiResponse<Void>> business(BusinessException e) {
        log.debug("Business error {}: {}", e.code(), e.getMessage());
        return ResponseEntity.status(e.code().status()).body(ApiResponse.failure(e.code(), e.getMessage(), e.errors()));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    ResponseEntity<ApiResponse<Void>> constraint(ConstraintViolationException e) {
        Map<String, String> errors = new LinkedHashMap<>();
        e.getConstraintViolations().forEach(v -> errors.put(v.getPropertyPath().toString(), v.getMessage()));
        return validation(errors);
    }

    @ExceptionHandler(DataAccessException.class)
    ResponseEntity<ApiResponse<Void>> database(DataAccessException e) {
        log.error("Database error", e);
        return build(ErrorCode.SERVICE_UNAVAILABLE);
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiResponse<Void>> unexpected(Exception e) {
        log.error("Unhandled error", e);
        return build(ErrorCode.INTERNAL_ERROR);
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException e,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        Map<String, String> errors = new LinkedHashMap<>();
        for (FieldError error : e.getBindingResult().getFieldErrors()) {
            errors.putIfAbsent(error.getField(), error.getDefaultMessage());
        }
        return respond(validation(errors));
    }

    @Override
    protected ResponseEntity<Object> handleHandlerMethodValidationException(HandlerMethodValidationException e,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        return respond(build(ErrorCode.BAD_REQUEST));
    }

    @Override
    protected ResponseEntity<Object> handleExceptionInternal(Exception e, Object body, HttpHeaders headers,
            HttpStatusCode status, WebRequest request) {
        ErrorCode code = switch (status.value()) {
            case 404 -> ErrorCode.NOT_FOUND;
            case 405 -> ErrorCode.METHOD_NOT_ALLOWED;
            case 500, 503 -> ErrorCode.INTERNAL_ERROR;
            default -> ErrorCode.BAD_REQUEST;
        };
        if (status.is5xxServerError()) log.error("Framework error", e);
        return ResponseEntity.status(status).headers(headers)
                .body(ApiResponse.failure(code, null, null));
    }

    private ResponseEntity<ApiResponse<Void>> validation(Map<String, String> errors) {
        return ResponseEntity.status(ErrorCode.VALIDATION_FAILED.status())
                .body(ApiResponse.failure(ErrorCode.VALIDATION_FAILED, null, errors));
    }

    private ResponseEntity<ApiResponse<Void>> build(ErrorCode code) {
        return ResponseEntity.status(code.status()).body(ApiResponse.failure(code, null, null));
    }

    @SuppressWarnings("unchecked")
    private ResponseEntity<Object> respond(ResponseEntity<? extends ApiResponse<Void>> response) {
        return (ResponseEntity<Object>) (ResponseEntity<?>) response;
    }
}
