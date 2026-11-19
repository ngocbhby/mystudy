package vn.mystudy.ai;

import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import java.util.List;

/** Nhận xét điểm yếu do AI viết dựa trên số liệu tỉ lệ đúng theo chuyên đề (số liệu do mã chương trình tính). */
public record WeaknessReport(
        @JsonPropertyDescription("Nhận xét tổng quan 2-3 câu, giọng khích lệ, nêu rõ chuyên đề mạnh và yếu")
        String summary,
        @JsonPropertyDescription("Tối đa 3 chuyên đề cần ưu tiên, yếu nhất trước")
        List<TopicAdvice> priorities,
        @JsonPropertyDescription("Một câu động viên ngắn")
        String encouragement) {

    public record TopicAdvice(
            @JsonPropertyDescription("Tên chuyên đề, giữ nguyên như trong dữ liệu đầu vào")
            String topicName,
            @JsonPropertyDescription("Vì sao chuyên đề này yếu, dựa trên tỉ lệ đúng và các câu sai tiêu biểu (1-2 câu)")
            String diagnosis,
            @JsonPropertyDescription("2-3 nhiệm vụ học cụ thể, mỗi nhiệm vụ làm được trong 30-45 phút")
            List<String> nextTasks) {
    }
}
