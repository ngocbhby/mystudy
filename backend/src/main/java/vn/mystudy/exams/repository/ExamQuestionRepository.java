package vn.mystudy.exams.repository;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.UUID;
import vn.mystudy.exams.entity.ExamQuestion;
import vn.mystudy.exams.entity.QuestionId;

public interface ExamQuestionRepository extends JpaRepository<ExamQuestion, QuestionId> {

    List<ExamQuestion> findByIdVersionIdOrderByIdQuestionNumber(UUID versionId);

    void deleteByIdVersionId(UUID versionId);

    @Query("""
            select new vn.mystudy.exams.repository.VersionQuestionCount(q.id.versionId, count(q))
            from ExamQuestion q where q.id.versionId in :versionIds group by q.id.versionId""")
    List<VersionQuestionCount> countByVersion(@Param("versionIds") Collection<UUID> versionIds);
}
