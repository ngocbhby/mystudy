package vn.mystudy.exams.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.mystudy.exams.entity.ExamAttempt;

public interface ExamAttemptRepository extends JpaRepository<ExamAttempt, UUID> {

    Optional<ExamAttempt> findFirstByProfileIdAndVersionIdAndSubmittedAtIsNotNullOrderBySubmittedAtDesc(
            UUID profileId, UUID versionId);

    List<ExamAttempt> findByProfileIdAndVersionIdAndSubmittedAtIsNotNullOrderBySubmittedAtDesc(
            UUID profileId, UUID versionId);

    /** Khóa dòng lượt thi (SELECT ... FOR UPDATE) để nộp bài đồng thời chỉ chốt điểm một lần. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from ExamAttempt a where a.id = :id")
    Optional<ExamAttempt> lockById(@Param("id") UUID id);

    List<ExamAttempt> findByProfileIdOrderBySubmittedAtDesc(UUID profileId);
}
