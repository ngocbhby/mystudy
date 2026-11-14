package vn.mystudy.exams.dto;

import java.util.UUID;

public record ExamSummaryResponse(
        UUID id,
        String title,
        String kind,
        String subjectCode,
        Integer year,
        int durationMinutes,
        String source,
        String paperUrl,
        String answerUrl,
        int questionCount) {
}
