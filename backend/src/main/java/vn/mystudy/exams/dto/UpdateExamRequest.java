package vn.mystudy.exams.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record UpdateExamRequest(
        @NotBlank(message = "Tiêu đề đề thi không được để trống")
        String title,

        String subjectCode,

        Integer examYear,

        @Min(value = 1, message = "Thời gian làm bài tối thiểu 1 phút")
        Integer durationMinutes,

        String sourceName,
        String paperUrl,
        String answerGuideUrl
) {}
