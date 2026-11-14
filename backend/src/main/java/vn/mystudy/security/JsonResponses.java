package vn.mystudy.security;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import org.slf4j.MDC;
import vn.mystudy.common.api.ApiResponse;
import vn.mystudy.common.api.ErrorCode;

/** Ghi phản hồi lỗi theo đúng khung {@link ApiResponse} từ các filter, nơi chưa có message converter. */
public final class JsonResponses {

    private JsonResponses() {}

    public static void write(HttpServletResponse response, ErrorCode code) throws IOException {
        String requestId = MDC.get(ApiResponse.REQUEST_ID_KEY);
        String json = "{\"success\":false,\"code\":\"" + code.name() + "\",\"message\":\""
                + escape(code.defaultMessage()) + "\""
                + (requestId == null ? "" : ",\"requestId\":\"" + escape(requestId) + "\"")
                + ",\"timestamp\":\"" + Instant.now() + "\"}";
        byte[] body = json.getBytes(StandardCharsets.UTF_8);
        response.setStatus(code.status().value());
        response.setContentType("application/json;charset=UTF-8");
        response.setContentLength(body.length);
        response.getOutputStream().write(body);
    }

    private static String escape(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
