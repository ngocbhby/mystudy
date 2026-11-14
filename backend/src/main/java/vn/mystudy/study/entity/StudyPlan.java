package vn.mystudy.study.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "study_plans")
public class StudyPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "profile_id")
    private UUID profileId;

    @Column(name = "goal_id")
    private UUID goalId;

    private String strategy;

    @Column(name = "starts_on")
    private LocalDate startsOn;

    @Column(name = "superseded_at")
    private Instant supersededAt;

    protected StudyPlan() {}

    public StudyPlan(UUID profileId, UUID goalId, String strategy, LocalDate startsOn) {
        this.profileId = profileId;
        this.goalId = goalId;
        this.strategy = strategy;
        this.startsOn = startsOn;
    }

    public void supersede(Instant at) {
        this.supersededAt = at;
    }

    public UUID getId() {
        return id;
    }

    public UUID getProfileId() {
        return profileId;
    }

    public UUID getGoalId() {
        return goalId;
    }

    public String getStrategy() {
        return strategy;
    }

    public LocalDate getStartsOn() {
        return startsOn;
    }
}
