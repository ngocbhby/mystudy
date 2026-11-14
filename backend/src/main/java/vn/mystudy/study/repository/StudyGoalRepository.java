package vn.mystudy.study.repository;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.mystudy.study.entity.StudyGoal;

public interface StudyGoalRepository extends JpaRepository<StudyGoal, UUID> {
}
