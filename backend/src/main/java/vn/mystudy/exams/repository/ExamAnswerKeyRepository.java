package vn.mystudy.exams.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.mystudy.exams.entity.ExamAnswerKey;
import vn.mystudy.exams.entity.QuestionId;

public interface ExamAnswerKeyRepository extends JpaRepository<ExamAnswerKey, QuestionId> {

    List<ExamAnswerKey> findByIdVersionId(UUID versionId);

    void deleteByIdVersionId(UUID versionId);
}
