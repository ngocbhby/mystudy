package vn.mystudy.exams.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "exam_answer_keys")
public class ExamAnswerKey {

    @EmbeddedId
    private QuestionId id;

    @Column(name = "correct_option_number")
    private int correctOptionNumber;

    protected ExamAnswerKey() {}

    public ExamAnswerKey(QuestionId id, int correctOptionNumber) {
        this.id = id;
        this.correctOptionNumber = correctOptionNumber;
    }

    public QuestionId getId() {
        return id;
    }

    public int getCorrectOptionNumber() {
        return correctOptionNumber;
    }
}
