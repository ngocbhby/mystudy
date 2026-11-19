package vn.mystudy.ai;

import vn.mystudy.common.api.ErrorCode;
import vn.mystudy.common.exception.BusinessException;

/** Dùng khi chưa cấu hình khóa API: các tính năng không dùng AI vẫn chạy bình thường. */
class DisabledAiGateway implements AiGateway {

    @Override
    public boolean enabled() {
        return false;
    }

    @Override
    public String model() {
        return "disabled";
    }

    @Override
    public <T> T generate(String systemPrompt, String userPrompt, Class<T> type, long maxTokens) {
        throw new BusinessException(ErrorCode.SERVICE_UNAVAILABLE,
                "Tính năng AI chưa được bật trên máy chủ này (thiếu khóa API).");
    }
}
