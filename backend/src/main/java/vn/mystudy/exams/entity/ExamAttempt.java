package vn.mystudy.exams.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "exam_attempts")
public class ExamAttempt {

    @Id
    private UUID id;

    @Column(name = "version_id", nullable = false)
    private UUID versionId;

    @Column(name = "profile_id")
    private UUID profileId;

    @Column(name = "guest_token_hash")
    private byte[] guestTokenHash;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "question_count", nullable = false)
    private int questionCount;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "submission_reason")
    private String submissionReason;

    @Column(name = "correct_count")
    private Integer correctCount;

    @Column(name = "incorrect_count")
    private Integer incorrectCount;

    @Column(name = "blank_count")
    private Integer blankCount;

    @Column(name = "elapsed_seconds")
    private Integer elapsedSeconds;

    @Column(name = "score")
    private BigDecimal score;

    protected ExamAttempt() {}

    public ExamAttempt(UUID id, UUID versionId, UUID profileId, Instant startedAt, Instant expiresAt,
                       int questionCount, Instant submittedAt, String submissionReason,
                       Integer correctCount, Integer incorrectCount, Integer blankCount,
                       Integer elapsedSeconds, BigDecimal score) {
        this.id = id;
        this.versionId = versionId;
        this.profileId = profileId;
        this.startedAt = startedAt;
        this.expiresAt = expiresAt;
        this.questionCount = questionCount;
        this.submittedAt = submittedAt;
        this.submissionReason = submissionReason;
        this.correctCount = correctCount;
        this.incorrectCount = incorrectCount;
        this.blankCount = blankCount;
        this.elapsedSeconds = elapsedSeconds;
        this.score = score;
    }

    public static ExamAttempt start(UUID id, UUID versionId, UUID profileId, byte[] guestTokenHash,
            Instant startedAt, Instant expiresAt, int questionCount) {
        ExamAttempt attempt = new ExamAttempt(id, versionId, profileId, startedAt, expiresAt, questionCount,
                null, null, null, null, null, null, null);
        attempt.guestTokenHash = guestTokenHash;
        return attempt;
    }

    public void submit(Instant submittedAt, String reason, int correct, int incorrect, int blank, int elapsedSeconds,
            BigDecimal score) {
        this.submittedAt = submittedAt;
        this.submissionReason = reason;
        this.correctCount = correct;
        this.incorrectCount = incorrect;
        this.blankCount = blank;
        this.elapsedSeconds = elapsedSeconds;
        this.score = score;
    }

    public byte[] getGuestTokenHash() {
        return guestTokenHash;
    }

    public UUID getId() {
        return id;
    }

    public UUID getVersionId() {
        return versionId;
    }

    public UUID getProfileId() {
        return profileId;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public int getQuestionCount() {
        return questionCount;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }

    public String getSubmissionReason() {
        return submissionReason;
    }

    public Integer getCorrectCount() {
        return correctCount;
    }

    public Integer getIncorrectCount() {
        return incorrectCount;
    }

    public Integer getBlankCount() {
        return blankCount;
    }

    public Integer getElapsedSeconds() {
        return elapsedSeconds;
    }

    public BigDecimal getScore() {
        return score;
    }
}
