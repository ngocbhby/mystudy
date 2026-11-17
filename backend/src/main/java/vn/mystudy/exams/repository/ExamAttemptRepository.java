package vn.mystudy.exams.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.mystudy.exams.entity.ExamAttempt;

public interface ExamAttemptRepository extends JpaRepository<ExamAttempt, UUID> {

    Optional<ExamAttempt> findFirstByProfileIdAndVersionIdOrderBySubmittedAtDesc(UUID profileId, UUID versionId);

    List<ExamAttempt> findByProfileIdAndVersionIdOrderBySubmittedAtDesc(UUID profileId, UUID versionId);

    List<ExamAttempt> findByProfileIdOrderBySubmittedAtDesc(UUID profileId);
}
