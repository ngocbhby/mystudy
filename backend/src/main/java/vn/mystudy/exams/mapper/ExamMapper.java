package vn.mystudy.exams.mapper;

import org.springframework.stereotype.Component;
import vn.mystudy.exams.dto.ExamSummaryResponse;
import vn.mystudy.exams.entity.Exam;

@Component
public class ExamMapper {

    public ExamSummaryResponse toSummary(Exam exam, int questionCount) {
        return new ExamSummaryResponse(exam.getId(), exam.getTitle(), exam.getKind(), exam.getSubjectCode(),
                exam.getExamYear(), exam.getDurationMinutes(), exam.getSourceName(), exam.getPaperUrl(),
                exam.getAnswerGuideUrl(), questionCount);
    }
}
