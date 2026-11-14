package vn.mystudy.study.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.mystudy.study.entity.Topic;

public interface TopicRepository extends JpaRepository<Topic, UUID> {

    @Query("select t from Topic t where t.subjectCode in :codes and t.curriculumOrder is not null order by t.curriculumOrder")
    List<Topic> findCurriculum(@Param("codes") Collection<String> codes);
}
