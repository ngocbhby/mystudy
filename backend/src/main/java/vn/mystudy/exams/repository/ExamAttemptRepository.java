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

    @Query(value = """
            SELECT ea.id FROM exam_attempts ea
            WHERE ea.profile_id = :profileId
              AND ea.submitted_at IS NOT NULL
              AND ea.id NOT IN (
                  SELECT attempt_id_1 FROM streak_recoveries WHERE profile_id = :profileId AND attempt_id_1 IS NOT NULL
                  UNION
                  SELECT attempt_id_2 FROM streak_recoveries WHERE profile_id = :profileId AND attempt_id_2 IS NOT NULL
              )
            ORDER BY ea.submitted_at ASC
            LIMIT :limit""", nativeQuery = true)
    List<UUID> findUnusedSubmittedAttemptIds(@Param("profileId") UUID profileId, @Param("limit") int limit);

    @Query(value = """
            SELECT count(ea.id) FROM exam_attempts ea
            WHERE ea.profile_id = :profileId
              AND ea.submitted_at IS NOT NULL
              AND ea.id NOT IN (
                  SELECT attempt_id_1 FROM streak_recoveries WHERE profile_id = :profileId AND attempt_id_1 IS NOT NULL
                  UNION
                  SELECT attempt_id_2 FROM streak_recoveries WHERE profile_id = :profileId AND attempt_id_2 IS NOT NULL
              )""", nativeQuery = true)
    int countUnusedSubmittedAttempts(@Param("profileId") UUID profileId);
}
