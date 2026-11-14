package vn.mystudy.exams.dto;

import java.util.List;

public record ExamDetailResponse(ExamSummaryResponse exam, List<QuestionResponse> questions) {
}
