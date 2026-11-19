package vn.mystudy.ai;

import com.anthropic.client.AnthropicClient;
import com.anthropic.errors.AnthropicServiceException;
import com.anthropic.errors.RateLimitException;
import com.anthropic.models.beta.messages.BetaCacheControlEphemeral;
import com.anthropic.models.beta.messages.BetaFallbacksParam;
import com.anthropic.models.beta.messages.BetaStopReason;
import com.anthropic.models.beta.messages.BetaTextBlockParam;
import com.anthropic.models.beta.messages.MessageCreateParams;
import com.anthropic.models.beta.messages.StructuredMessage;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import vn.mystudy.common.api.ErrorCode;
import vn.mystudy.common.exception.BusinessException;

/**
 * Gọi Claude qua SDK chính thức. Dùng structured outputs để nhận JSON đúng schema của record Java, prompt caching cho
 * system prompt, và fallback phía máy chủ khi mô hình chính từ chối một yêu cầu hợp lệ.
 */
class ClaudeAiGateway implements AiGateway {

    private static final Logger log = LoggerFactory.getLogger(ClaudeAiGateway.class);
    private static final String FALLBACK_BETA = "server-side-fallback-2026-07-01";

    private final AnthropicClient client;
    private final String model;

    ClaudeAiGateway(AnthropicClient client, String model) {
        this.client = client;
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
        try {
            StructuredMessage<T> message = client.beta().messages().create(MessageCreateParams.builder()
                    .model(model)
                    .maxTokens(maxTokens)
                    .addBeta(FALLBACK_BETA)
                    .fallbacks(BetaFallbacksParam.ofDefault())
                    .systemOfBetaTextBlockParams(List.of(BetaTextBlockParam.builder()
                            .text(systemPrompt)
                            .cacheControl(BetaCacheControlEphemeral.builder().build())
                            .build()))
                    .addUserMessage(userPrompt)
                    .outputConfig(type)
                    .build());

            BetaStopReason stop = message.stopReason().orElse(null);
            if (BetaStopReason.REFUSAL.equals(stop)) {
                throw new BusinessException(ErrorCode.BAD_REQUEST,
                        "AI không thể trả lời yêu cầu này. Hãy xem lời giải có sẵn hoặc hỏi giáo viên.");
            }
            if (BetaStopReason.MAX_TOKENS.equals(stop)) {
                log.warn("AI response truncated (max_tokens={}) for {}", maxTokens, type.getSimpleName());
                throw new BusinessException(ErrorCode.SERVICE_UNAVAILABLE, "AI trả lời bị ngắt quãng. Vui lòng thử lại.");
            }
            return message.content().stream()
                    .flatMap(block -> block.text().stream())
                    .map(text -> text.text())
                    .findFirst()
                    .orElseThrow(() -> new BusinessException(ErrorCode.SERVICE_UNAVAILABLE,
                            "AI chưa trả lời. Vui lòng thử lại."));
        } catch (RateLimitException e) {
            log.warn("AI rate limited: {}", e.getMessage());
            throw new BusinessException(ErrorCode.RATE_LIMITED, "Hệ thống AI đang bận. Vui lòng thử lại sau ít phút.");
        } catch (AnthropicServiceException e) {
            log.error("AI service error status={}", e.statusCode(), e);
            throw new BusinessException(ErrorCode.SERVICE_UNAVAILABLE, "Dịch vụ AI tạm thời gián đoạn. Vui lòng thử lại.");
        }
    }
}
