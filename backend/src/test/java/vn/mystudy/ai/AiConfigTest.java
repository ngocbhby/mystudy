package vn.mystudy.ai;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

/** Chọn nhà cung cấp AI theo cấu hình; thiếu khóa thì tắt AI thay vì lỗi khi khởi động. */
class AiConfigTest {

    private final AiConfig config = new AiConfig();
    private final JsonMapper json = JsonMapper.builder().build();
    private static final String BASE = "https://generativelanguage.googleapis.com/v1beta";

    @Test
    void geminiProviderUsesTheGeminiKeyAndModel() {
        AiGateway ai = config.aiGateway(json, true, "gemini", "", "claude-opus-5-5", "k", "gemini-3.8-flash", BASE);
        assertThat(ai).isInstanceOf(GeminiAiGateway.class);
        assertThat(ai.model()).isEqualTo("gemini-3.8-flash");
    }

    @Test
    void missingKeyOrDisabledFlagTurnsAiOff() {
        assertThat(config.aiGateway(json, true, "gemini", "anthropic-key", "m", "", "g", BASE).enabled()).isFalse();
        assertThat(config.aiGateway(json, false, "gemini", "", "m", "k", "g", BASE).enabled()).isFalse();
        assertThat(config.aiGateway(json, true, "anthropic", "", "m", "gemini-key", "g", BASE).enabled()).isFalse();
    }

    @Test
    void anthropicIsTheDefaultProvider() {
        assertThat(config.aiGateway(json, true, "anthropic", "k", "claude-opus-5-5", "", "g", BASE))
                .isInstanceOf(ClaudeAiGateway.class);
    }
}
