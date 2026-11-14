package vn.mystudy.study.repository;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.mystudy.study.entity.StudyPlan;

public interface StudyPlanRepository extends JpaRepository<StudyPlan, UUID> {

    /** Mỗi tài khoản có tối đa một lộ trình hiện hành (ràng buộc duy nhất có điều kiện ở CSDL). */
    Optional<StudyPlan> findByProfileIdAndSupersededAtIsNull(UUID profileId);
}
