package vn.mystudy.exams.dto;

import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import java.util.List;

public record ConvertedExamQuestions(
        @JsonPropertyDescription("Danh sách toàn bộ các câu hỏi trắc nghiệm đã trích xuất từ đề thi")
        List<ConvertedQuestionItem> questions
) {
    public record ConvertedQuestionItem(
            @JsonPropertyDescription("Nội dung câu hỏi (ví dụ: 'Câu 1: Cho hàm số y = f(x)...')")
            String prompt,

            @JsonPropertyDescription("Danh sách đúng 4 phương án trắc nghiệm A, B, C, D (ví dụ: ['A. 1', 'B. 2', 'C. 3', 'D. 4'])")
            List<String> options,

            @JsonPropertyDescription("Số thứ tự phương án đúng từ 1 đến 4 (1 tương ứng A, 2 tương ứng B, 3 tương ứng C, 4 tương ứng D; nếu chưa rõ thì đặt là 1)")
            int correctOptionNumber,

            @JsonPropertyDescription("Lời giải thích chi tiết cho câu hỏi nếu có")
            String explanation
    ) {}
}
