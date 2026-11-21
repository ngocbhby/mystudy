package vn.mystudy.study.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "streak_recoveries")
public class StreakRecovery {

    @Id
    private UUID id;

    @Column(name = "profile_id", nullable = false)
    private UUID profileId;

    @Column(name = "recovered_date", nullable = false)
    private LocalDate recoveredDate;

    @Column(name = "attempt_id_1")
    private UUID attemptId1;

    @Column(name = "attempt_id_2")
    private UUID attemptId2;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected StreakRecovery() {}

    public StreakRecovery(UUID id, UUID profileId, LocalDate recoveredDate, UUID attemptId1, UUID attemptId2, Instant createdAt) {
        this.id = id;
        this.profileId = profileId;
        this.recoveredDate = recoveredDate;
        this.attemptId1 = attemptId1;
        this.attemptId2 = attemptId2;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getProfileId() {
        return profileId;
    }

    public LocalDate getRecoveredDate() {
        return recoveredDate;
    }

    public UUID getAttemptId1() {
        return attemptId1;
    }

    public UUID getAttemptId2() {
        return attemptId2;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
