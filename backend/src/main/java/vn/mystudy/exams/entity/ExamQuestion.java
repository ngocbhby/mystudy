package vn.mystudy.exams.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "exam_questions")
public class ExamQuestion {

    @EmbeddedId
    private QuestionId id;

    private String prompt;

    @Column(name = "explanation", columnDefinition = "text")
    private String explanation;

    protected ExamQuestion() {}

    public ExamQuestion(QuestionId id, String prompt) {
        this(id, prompt, null);
    }

    public ExamQuestion(QuestionId id, String prompt, String explanation) {
        this.id = id;
        this.prompt = prompt;
        this.explanation = explanation;
    }

    public QuestionId getId() {
        return id;
    }

    public String getPrompt() {
        return prompt;
    }

    public String getExplanation() {
        return explanation;
    }
}
