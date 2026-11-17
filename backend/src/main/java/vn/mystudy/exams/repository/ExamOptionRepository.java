package vn.mystudy.exams.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.mystudy.exams.entity.ExamOption;
import vn.mystudy.exams.entity.OptionId;

public interface ExamOptionRepository extends JpaRepository<ExamOption, OptionId> {

    List<ExamOption> findByIdVersionIdOrderByIdQuestionNumberAscIdOptionNumberAsc(UUID versionId);

    void deleteByIdVersionId(UUID versionId);
}
