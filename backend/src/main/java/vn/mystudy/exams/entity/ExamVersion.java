package vn.mystudy.exams.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "exam_versions")
public class ExamVersion {

    @Id
    private UUID id;

    @Column(name = "exam_id")
    private UUID examId;

    @Column(name = "version_number")
    private int versionNumber;

    @Column(name = "published_at")
    private Instant publishedAt;

    protected ExamVersion() {}

    public ExamVersion(UUID id, UUID examId, int versionNumber, Instant publishedAt) {
        this.id = id;
        this.examId = examId;
        this.versionNumber = versionNumber;
        this.publishedAt = publishedAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getExamId() {
        return examId;
    }

    public int getVersionNumber() {
        return versionNumber;
    }

    public Instant getPublishedAt() {
        return publishedAt;
    }
}
