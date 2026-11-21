package vn.mystudy.study.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.mystudy.study.entity.StreakRecovery;

public interface StreakRecoveryRepository extends JpaRepository<StreakRecovery, UUID> {

    List<StreakRecovery> findByProfileIdOrderByRecoveredDateDesc(UUID profileId);

    Optional<StreakRecovery> findByProfileIdAndRecoveredDate(UUID profileId, LocalDate recoveredDate);

    int countByProfileId(UUID profileId);
}
