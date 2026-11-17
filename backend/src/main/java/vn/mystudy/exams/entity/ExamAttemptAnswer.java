package vn.mystudy.exams.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "exam_attempt_answers")
public class ExamAttemptAnswer {

    @EmbeddedId
    private ExamAttemptAnswerId id;

    @Column(name = "version_id", nullable = false)
    private UUID versionId;

    @Column(name = "option_number", nullable = false)
    private int optionNumber;

    protected ExamAttemptAnswer() {}

    public ExamAttemptAnswer(UUID attemptId, UUID versionId, int questionNumber, int optionNumber) {
        this.id = new ExamAttemptAnswerId(attemptId, questionNumber);
        this.versionId = versionId;
        this.optionNumber = optionNumber;
    }

    public ExamAttemptAnswerId getId() {
        return id;
    }

    public UUID getVersionId() {
        return versionId;
    }

    public int getOptionNumber() {
        return optionNumber;
    }
}
