package vn.mystudy.exams.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "exam_options")
public class ExamOption {

    @EmbeddedId
    private OptionId id;

    private String content;

    protected ExamOption() {}

    public OptionId getId() {
        return id;
    }

    public String getContent() {
        return content;
    }
}
