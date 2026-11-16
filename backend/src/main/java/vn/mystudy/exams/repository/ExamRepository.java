package vn.mystudy.exams.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import vn.mystudy.exams.entity.Exam;

public interface ExamRepository extends JpaRepository<Exam, UUID>, JpaSpecificationExecutor<Exam> {

    @Query("select distinct e.subjectCode from Exam e")
    List<String> findDistinctSubjectCodes();

    @Query("select distinct e.examYear from Exam e where e.examYear is not null order by e.examYear desc")
    List<Integer> findDistinctExamYears();
}
