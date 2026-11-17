package vn.mystudy.exams.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "exam_questions")
public class ExamQuestion {

    @EmbeddedId
    private QuestionId id;

    private String prompt;

    protected ExamQuestion() {}

    public ExamQuestion(QuestionId id, String prompt) {
        this.id = id;
        this.prompt = prompt;
    }

    public QuestionId getId() {
        return id;
    }

    public String getPrompt() {
        return prompt;
    }
}
