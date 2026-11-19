package vn.mystudy.ai;

import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import java.util.List;

/** Lời giải thích câu sai do AI tạo; schema JSON được suy ra từ record này (structured outputs). */
public record WrongAnswerExplanation(
        @JsonPropertyDescription("Học sinh có thể đã hiểu nhầm hoặc nhầm lẫn điều gì khi chọn đáp án này (1-2 câu)")
        String misconception,
        @JsonPropertyDescription("Các bước giải đúng, mỗi phần tử là một bước ngắn; công thức viết bằng LaTeX trong $...$")
        List<String> steps,
        @JsonPropertyDescription("Một mẹo ngắn để lần sau không mắc lại lỗi này")
        String tip,
        @JsonPropertyDescription("Tên phần kiến thức nên ôn lại")
        String reviewTopic) {
}
