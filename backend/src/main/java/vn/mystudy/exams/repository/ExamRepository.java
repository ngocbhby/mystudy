package vn.mystudy.exams.repository;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import vn.mystudy.exams.entity.Exam;

public interface ExamRepository extends JpaRepository<Exam, UUID>, JpaSpecificationExecutor<Exam> {
}
