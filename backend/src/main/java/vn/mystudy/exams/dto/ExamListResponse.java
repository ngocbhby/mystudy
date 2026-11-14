package vn.mystudy.exams.dto;

import java.util.List;

/** Danh sách đề đã lọc cùng các giá trị bộ lọc khả dụng (môn, năm). */
public record ExamListResponse(List<ExamSummaryResponse> exams, List<String> subjects, List<Integer> years) {
}
