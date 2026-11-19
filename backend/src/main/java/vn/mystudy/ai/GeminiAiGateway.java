package vn.mystudy.ai;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import vn.mystudy.common.api.ErrorCode;
import vn.mystudy.common.exception.BusinessException;

/**
 * Gọi Gemini qua REST API {@code models/{model}:generateContent}. Đầu ra JSON được ràng buộc bằng
 * {@code responseJsonSchema} sinh từ record Java (cùng record với nhà cung cấp Claude), nên các tính năng AI không cần
 * biết đang dùng nhà cung cấp nào. Khóa API gửi ở header {@code x-goog-api-key}, không đặt trong URL để không lọt vào
 * log truy cập.
 */
class GeminiAiGateway implements AiGateway {

    private static final Logger log = LoggerFactory.getLogger(GeminiAiGateway.class);
    private static final Set<String> BLOCKED = Set.of("SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST", "SPII",
            "RECITATION", "IMAGE_SAFETY");

    private final HttpClient http;
    private final ObjectMapper json;
    private final String baseUrl;
    private final String apiKey;
    private final String model;

    GeminiAiGateway(ObjectMapper json, String baseUrl, String apiKey, String model) {
        this(HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build(), json, baseUrl, apiKey, model);
    }

    GeminiAiGateway(HttpClient http, ObjectMapper json, String baseUrl, String apiKey, String model) {
        this.http = http;
        this.json = json;
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.apiKey = apiKey;
        this.model = model;
    }

    @Override
    public boolean enabled() {
        return true;
    }

    @Override
    public String model() {
        return model;
    }

    @Override
    public <T> T generate(String systemPrompt, String userPrompt, Class<T> type, long maxTokens) {
        Map<String, Object> body = Map.of(
                "systemInstruction", Map.of("parts", List.of(Map.of("text", systemPrompt))),
                "contents", List.of(Map.of("role", "user", "parts", List.of(Map.of("text", userPrompt)))),
                "generationConfig", Map.of(
                        "responseMimeType", "application/json",
                        "responseJsonSchema", JsonSchemas.of(type),
                        "maxOutputTokens", maxTokens));
        HttpRequest request = HttpRequest.newBuilder(URI.create(baseUrl + "/models/" + model + ":generateContent"))
                .timeout(Duration.ofSeconds(90))
                .header("Content-Type", "application/json")
                .header("x-goog-api-key", apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body), StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = send(request);
        JsonNode root = json.readTree(response.body());

        String blockReason = root.path("promptFeedback").path("blockReason").asString("");
        if (!blockReason.isEmpty()) {
            log.warn("Gemini blocked prompt: {}", blockReason);
            throw refused();
        }
        JsonNode candidate = root.path("candidates").path(0);
        String finishReason = candidate.path("finishReason").asString("");
        if ("MAX_TOKENS".equals(finishReason)) {
            log.warn("Gemini response truncated (maxOutputTokens={}) for {}", maxTokens, type.getSimpleName());
            throw new BusinessException(ErrorCode.SERVICE_UNAVAILABLE, "AI trả lời bị ngắt quãng. Vui lòng thử lại.");
        }
        if (BLOCKED.contains(finishReason)) {
            log.warn("Gemini stopped with finishReason={}", finishReason);
            throw refused();
        }
        StringBuilder text = new StringBuilder();
        for (JsonNode part : candidate.path("content").path("parts")) {
            if (part.path("thought").asBoolean(false)) continue; // bỏ phần "suy nghĩ" nếu mô hình trả về
            text.append(part.path("text").asString(""));
        }
        if (text.isEmpty()) {
            log.warn("Gemini returned no text (finishReason={})", finishReason);
            throw new BusinessException(ErrorCode.SERVICE_UNAVAILABLE, "AI chưa trả lời. Vui lòng thử lại.");
        }
        try {
            return json.readValue(text.toString(), type);
        } catch (RuntimeException e) {
            log.warn("Gemini returned JSON not matching {}: {}", type.getSimpleName(), e.getMessage());
            throw new BusinessException(ErrorCode.SERVICE_UNAVAILABLE, "AI trả lời sai định dạng. Vui lòng thử lại.");
        }
    }

    /** Gửi yêu cầu; thử lại một lần khi máy chủ Gemini quá tải tạm thời (503) hoặc lỗi mạng. */
    private HttpResponse<String> send(HttpRequest request) {
        for (int attempt = 1; ; attempt++) {
            try {
                HttpResponse<String> response = http.send(request,
                        HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
                int status = response.statusCode();
                if (status == 200) return response;
                if ((status == 503 || status == 500) && attempt == 1) {
                    sleep();
                    continue;
                }
                // Thân lỗi của Google không chứa khóa API; chỉ ghi phần đầu để chẩn đoán.
                String detail = response.body() == null ? "" : response.body();
                log.error("Gemini API error status={} body={}", status,
                        detail.substring(0, Math.min(500, detail.length())));
                if (status == 429) {
                    throw new BusinessException(ErrorCode.RATE_LIMITED,
                            "Đã hết hạn mức gọi AI của khóa Gemini. Vui lòng thử lại sau ít phút.");
                }
                if (status == 400 || status == 401 || status == 403) {
                    throw new BusinessException(ErrorCode.SERVICE_UNAVAILABLE,
                            "Không gọi được Gemini: khóa API hoặc tên mô hình không hợp lệ. Hãy báo quản trị viên.");
                }
                throw new BusinessException(ErrorCode.SERVICE_UNAVAILABLE,
                        "Dịch vụ AI tạm thời gián đoạn. Vui lòng thử lại.");
            } catch (IOException e) {
                if (attempt == 1) {
                    sleep();
                    continue;
                }
                log.error("Gemini network error", e);
                throw new BusinessException(ErrorCode.SERVICE_UNAVAILABLE, "Không kết nối được dịch vụ AI.");
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new BusinessException(ErrorCode.SERVICE_UNAVAILABLE, "Yêu cầu AI bị hủy.");
            }
        }
    }

    private static void sleep() {
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private static BusinessException refused() {
        return new BusinessException(ErrorCode.BAD_REQUEST,
                "AI không thể trả lời yêu cầu này. Hãy xem lời giải có sẵn hoặc hỏi giáo viên.");
    }
}
