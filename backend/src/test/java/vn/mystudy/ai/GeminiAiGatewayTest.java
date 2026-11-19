package vn.mystudy.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;
import vn.mystudy.common.api.ErrorCode;
import vn.mystudy.common.exception.BusinessException;

/** Gọi Gemini qua một máy chủ HTTP giả chạy cục bộ: kiểm tra yêu cầu gửi đi và cách xử lý từng loại phản hồi. */
class GeminiAiGatewayTest {

    private final ObjectMapper json = JsonMapper.builder().build();
    private HttpServer server;
    private final List<Integer> statuses = new ArrayList<>();
    private final List<String> bodies = new ArrayList<>();
    private final AtomicReference<String> lastRequest = new AtomicReference<>();
    private final AtomicReference<String> lastKey = new AtomicReference<>();
    private final AtomicReference<String> lastPath = new AtomicReference<>();
    private final AtomicInteger calls = new AtomicInteger();
    private GeminiAiGateway gateway;

    @BeforeEach
    void start() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/", exchange -> {
            int call = calls.getAndIncrement();
            lastPath.set(exchange.getRequestURI().toString());
            lastKey.set(exchange.getRequestHeaders().getFirst("x-goog-api-key"));
            lastRequest.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            int index = Math.min(call, statuses.size() - 1);
            byte[] body = bodies.get(index).getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(statuses.get(index), body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        });
        server.start();
        gateway = new GeminiAiGateway(json, "http://127.0.0.1:" + server.getAddress().getPort() + "/v1beta",
                "test-key", "gemini-test-model");
    }

    @AfterEach
    void stop() {
        server.stop(0);
    }

    private void respond(int status, String body) {
        statuses.add(status);
        bodies.add(body);
    }

    private static String candidate(String finishReason, String text) {
        String escaped = text.replace("\\", "\\\\").replace("\"", "\\\"");
        return """
                {"candidates":[{"content":{"role":"model","parts":[{"text":"%s"}]},"finishReason":"%s"}]}
                """.formatted(escaped, finishReason);
    }

    @Test
    void sendsSchemaSystemPromptAndKeyHeaderAndParsesTheRecord() {
        respond(200, candidate("STOP", """
                {"misconception":"Nhầm công thức","steps":["Bước 1","Bước 2"],"tip":"Mẹo","reviewTopic":"Đạo hàm"}"""));

        WrongAnswerExplanation result = gateway.generate("Hệ thống", "Câu hỏi", WrongAnswerExplanation.class, 4000);

        assertThat(result.steps()).containsExactly("Bước 1", "Bước 2");
        assertThat(result.reviewTopic()).isEqualTo("Đạo hàm");
        assertThat(lastPath.get()).isEqualTo("/v1beta/models/gemini-test-model:generateContent");
        assertThat(lastPath.get()).doesNotContain("test-key"); // khóa không nằm trong URL
        assertThat(lastKey.get()).isEqualTo("test-key");

        JsonNode request = json.readTree(lastRequest.get());
        assertThat(request.path("systemInstruction").path("parts").path(0).path("text").asString()).isEqualTo("Hệ thống");
        assertThat(request.path("contents").path(0).path("parts").path(0).path("text").asString()).isEqualTo("Câu hỏi");
        JsonNode config = request.path("generationConfig");
        assertThat(config.path("responseMimeType").asString()).isEqualTo("application/json");
        assertThat(config.path("maxOutputTokens").asInt()).isEqualTo(4000);
        JsonNode schema = config.path("responseJsonSchema");
        assertThat(schema.path("type").asString()).isEqualTo("object");
        assertThat(schema.path("properties").path("steps").path("type").asString()).isEqualTo("array");
        assertThat(schema.path("properties").path("steps").path("items").path("type").asString()).isEqualTo("string");
        assertThat(schema.path("properties").path("misconception").path("description").asString()).isNotBlank();
        assertThat(schema.path("required")).hasSize(4);
    }

    @Test
    void buildsNestedSchemasForRecordsInsideLists() {
        respond(200, candidate("STOP", """
                {"summary":"S","priorities":[{"topicName":"T","diagnosis":"D","nextTasks":["a"]}],"encouragement":"E"}"""));

        WeaknessReport report = gateway.generate("s", "u", WeaknessReport.class, 6000);

        assertThat(report.priorities().get(0).nextTasks()).containsExactly("a");
        JsonNode items = json.readTree(lastRequest.get())
                .path("generationConfig").path("responseJsonSchema").path("properties").path("priorities").path("items");
        assertThat(items.path("type").asString()).isEqualTo("object");
        assertThat(items.path("properties").path("nextTasks").path("type").asString()).isEqualTo("array");
    }

    @Test
    void skipsThoughtPartsAndJoinsTextParts() {
        respond(200, """
                {"candidates":[{"content":{"parts":[
                  {"text":"đang suy nghĩ...","thought":true},
                  {"text":"{\\"markdown\\":"},{"text":"\\"## Kiến thức\\"}"}]},"finishReason":"STOP"}]}""");

        assertThat(gateway.generate("s", "u", TopicNoteDraft.class, 4000).markdown()).isEqualTo("## Kiến thức");
    }

    @Test
    void reportsTruncatedAnswers() {
        respond(200, candidate("MAX_TOKENS", "{\"markdown\":\"## Kiến"));
        assertThatThrownBy(() -> gateway.generate("s", "u", TopicNoteDraft.class, 10))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.code()).isEqualTo(ErrorCode.SERVICE_UNAVAILABLE));
    }

    @Test
    void treatsSafetyBlocksAsRefusals() {
        respond(200, "{\"promptFeedback\":{\"blockReason\":\"SAFETY\"}}");
        assertThatThrownBy(() -> gateway.generate("s", "u", TopicNoteDraft.class, 100))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.code()).isEqualTo(ErrorCode.BAD_REQUEST));

        respond(200, candidate("SAFETY", ""));
        assertThatThrownBy(() -> gateway.generate("s", "u", TopicNoteDraft.class, 100))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.code()).isEqualTo(ErrorCode.BAD_REQUEST));
    }

    @Test
    void mapsQuotaAndBadKeyErrors() {
        respond(429, "{\"error\":{\"code\":429,\"status\":\"RESOURCE_EXHAUSTED\"}}");
        assertThatThrownBy(() -> gateway.generate("s", "u", TopicNoteDraft.class, 100))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.code()).isEqualTo(ErrorCode.RATE_LIMITED));
    }

    @Test
    void invalidKeyGivesAClearMessage() {
        respond(401, "{\"error\":{\"code\":401,\"status\":\"UNAUTHENTICATED\"}}");
        assertThatThrownBy(() -> gateway.generate("s", "u", TopicNoteDraft.class, 100))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.getMessage()).contains("khóa API"));
    }

    @Test
    void retriesOnceWhenGeminiIsOverloaded() {
        respond(503, "{\"error\":{\"code\":503}}");
        respond(200, candidate("STOP", "{\"markdown\":\"ok\"}"));

        assertThat(gateway.generate("s", "u", TopicNoteDraft.class, 100).markdown()).isEqualTo("ok");
        assertThat(calls.get()).isEqualTo(2);
    }

    @Test
    void rejectsJsonThatDoesNotMatchTheRecord() {
        respond(200, candidate("STOP", "không phải JSON"));
        assertThatThrownBy(() -> gateway.generate("s", "u", TopicNoteDraft.class, 100))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("sai định dạng");
    }
}
