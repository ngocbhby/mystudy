package vn.mystudy.ai;

/**
 * Cổng gọi mô hình ngôn ngữ, trả về đối tượng có cấu trúc (JSON đúng schema của {@code type}). Tách thành interface
 * để kiểm thử dùng bản giả, không tốn tiền gọi API và không cần mạng.
 */
public interface AiGateway {

    boolean enabled();

    /** Tên mô hình, lưu kèm nội dung AI tạo để biết nội dung đến từ đâu. */
    String model();

    <T> T generate(String systemPrompt, String userPrompt, Class<T> type, long maxTokens);
}
