package vn.mystudy.exams.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.mystudy.exams.entity.ExamVersion;

public interface ExamVersionRepository extends JpaRepository<ExamVersion, UUID> {

    List<ExamVersion> findByPublishedAtLessThanEqual(Instant now);

    List<ExamVersion> findByExamId(UUID examId);

    Optional<ExamVersion> findFirstByExamIdAndPublishedAtLessThanEqualOrderByVersionNumberDesc(UUID examId, Instant now);
}
