package vn.mystudy.exams.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record CreateExamRequest(
        @NotBlank(message = "Mã môn học không được để trống")
        String subjectCode,

        @NotBlank(message = "Tiêu đề đề thi không được để trống")
        String title,

        @NotBlank(message = "Loại đề thi không được để trống")
        String kind,

        Integer examYear,

        @Min(value = 1, message = "Thời gian làm bài tối thiểu 1 phút")
        int durationMinutes,

        String sourceName,
        String paperUrl,
        String answerGuideUrl,
        List<CreateQuestionRequest> questions
) {
    public record CreateQuestionRequest(
            String prompt,
            List<String> options,
            int correctOptionNumber,
            String explanation,
            java.util.UUID topicId
    ) {}
}
