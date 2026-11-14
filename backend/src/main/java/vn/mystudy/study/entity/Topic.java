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
