package vn.mystudy.exams.entity;

import java.util.UUID;

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

    /** Chuyên đề của câu hỏi; dùng để phân tích điểm yếu theo chuyên đề. */
    @Column(name = "topic_id")
    private UUID topicId;

    protected ExamQuestion() {}

    public ExamQuestion(QuestionId id, String prompt) {
        this(id, prompt, null);
    }

    public ExamQuestion(QuestionId id, String prompt, String explanation, UUID topicId) {
        this(id, prompt, explanation);
        this.topicId = topicId;
    }

    public UUID getTopicId() {
        return topicId;
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
