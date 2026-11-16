package vn.mystudy.study.repository;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.mystudy.study.entity.StudyTask;

public interface StudyTaskRepository extends JpaRepository<StudyTask, UUID> {

    @Query("""
            select t from StudyTask t join fetch t.topic
            where t.profileId = :profileId and t.scheduledOn between :from and :to and t.cancelledAt is null
            order by t.scheduledOn, t.position""")
    List<StudyTask> findVisible(@Param("profileId") UUID profileId, @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    /** Nhiệm vụ đã hoàn thành từ ngày {@code from}, được giữ lại khi xếp lại lịch. */
    @Query("select t from StudyTask t where t.profileId = :profileId and t.scheduledOn >= :from and t.completedAt is not null")
    List<StudyTask> findCompletedFrom(@Param("profileId") UUID profileId, @Param("from") LocalDate from);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            update StudyTask t set t.cancelledAt = :now
            where t.profileId = :profileId and t.scheduledOn >= :from and t.completedAt is null and t.cancelledAt is null""")
    int cancelPendingFrom(@Param("profileId") UUID profileId, @Param("from") LocalDate from, @Param("now") Instant now);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            update StudyTask t set t.completedAt = coalesce(t.completedAt, :now)
            where t.id = :id and t.profileId = :profileId and t.scheduledOn <= :today and t.cancelledAt is null""")
    int markCompleted(@Param("id") UUID id, @Param("profileId") UUID profileId, @Param("today") LocalDate today,
            @Param("now") Instant now);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            update StudyTask t set t.completedAt = null
            where t.id = :id and t.profileId = :profileId and t.completedAt is not null and t.cancelledAt is null""")
    int unmarkCompleted(@Param("id") UUID id, @Param("profileId") UUID profileId);

    @Query("select min(t.scheduledOn) from StudyTask t where t.profileId = :profileId and t.scheduledOn > :today and t.cancelledAt is null")
    LocalDate findNextStudyDate(@Param("profileId") UUID profileId, @Param("today") LocalDate today);

    /** Các ngày (giờ Việt Nam) có ít nhất một nhiệm vụ được đánh dấu hoàn thành. */
    @Query(value = """
            select distinct cast(cast(completed_at at time zone 'Asia/Ho_Chi_Minh' as date) as text)
            from study_tasks
            where profile_id = :profileId and completed_at is not null and cancelled_at is null""", nativeQuery = true)
    List<String> findCompletedDays(@Param("profileId") UUID profileId);
}
