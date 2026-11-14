package vn.mystudy.exams.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.UUID;

@Embeddable
public record QuestionId(
        @Column(name = "version_id") UUID versionId,
        @Column(name = "question_number") int questionNumber) implements Serializable {
}
