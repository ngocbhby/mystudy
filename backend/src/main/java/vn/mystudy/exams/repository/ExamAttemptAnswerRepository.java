package vn.mystudy.exams.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.mystudy.exams.entity.ExamAttemptAnswer;
import vn.mystudy.exams.entity.ExamAttemptAnswerId;

public interface ExamAttemptAnswerRepository extends JpaRepository<ExamAttemptAnswer, ExamAttemptAnswerId> {

    List<ExamAttemptAnswer> findByIdAttemptIdOrderByIdQuestionNumberAsc(UUID attemptId);
}
