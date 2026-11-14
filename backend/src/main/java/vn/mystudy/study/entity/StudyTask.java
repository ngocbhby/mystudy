package vn.mystudy.study.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "study_tasks")
public class StudyTask {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "plan_id")
    private UUID planId;

    @Column(name = "profile_id")
    private UUID profileId;

    @Column(name = "goal_id")
    private UUID goalId;

    @Column(name = "subject_code")
    private String subjectCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "topic_id")
    private Topic topic;

    @Column(name = "scheduled_on")
    private LocalDate scheduledOn;

    private int position;

    @Column(name = "planned_minutes")
    private int plannedMinutes;

    @Column(name = "learning_content")
    private String learningContent;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    protected StudyTask() {}

    public StudyTask(UUID planId, UUID profileId, UUID goalId, String subjectCode, Topic topic, LocalDate scheduledOn,
            int position, int plannedMinutes, String learningContent) {
        this.planId = planId;
        this.profileId = profileId;
        this.goalId = goalId;
        this.subjectCode = subjectCode;
        this.topic = topic;
        this.scheduledOn = scheduledOn;
        this.position = position;
        this.plannedMinutes = plannedMinutes;
        this.learningContent = learningContent;
    }

    public UUID getId() {
        return id;
    }

    public String getSubjectCode() {
        return subjectCode;
    }

    public Topic getTopic() {
        return topic;
    }

    public LocalDate getScheduledOn() {
        return scheduledOn;
    }

    public int getPosition() {
        return position;
    }

    public int getPlannedMinutes() {
        return plannedMinutes;
    }

    public String getLearningContent() {
        return learningContent;
    }

    public boolean isCompleted() {
        return completedAt != null;
    }
}
