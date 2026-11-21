package vn.mystudy.study.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "topics")
public class Topic {

    @Id
    private UUID id;

    @Column(name = "subject_code")
    private String subjectCode;

    private String name;

    @Column(name = "curriculum_order")
    private Integer curriculumOrder;

    protected Topic() {}

    public static Topic create(UUID id, String subjectCode, String name, Integer curriculumOrder) {
        Topic topic = new Topic();
        topic.id = id != null ? id : UUID.randomUUID();
        topic.subjectCode = subjectCode;
        topic.name = name;
        topic.curriculumOrder = curriculumOrder;
        return topic;
    }

    public UUID getId() {
        return id;
    }

    public String getSubjectCode() {
        return subjectCode;
    }

    public String getName() {
        return name;
    }
}
