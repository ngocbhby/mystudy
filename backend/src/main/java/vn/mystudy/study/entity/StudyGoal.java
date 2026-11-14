package vn.mystudy.study.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** Mục tiêu học tập bất biến: mỗi lần đổi mục tiêu tạo một bản ghi mới. */
@Entity
@Table(name = "study_goals")
public class StudyGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "profile_id")
    private UUID profileId;

    private String purpose;

    @Column(name = "months_remaining")
    private int months;

    @Column(name = "daily_minutes")
    private int dailyMinutes;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "goal_subjects", joinColumns = @JoinColumn(name = "goal_id"))
    private Set<GoalSubject> subjects = new HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "goal_study_days", joinColumns = @JoinColumn(name = "goal_id"))
    @Column(name = "iso_weekday")
    @JdbcTypeCode(SqlTypes.SMALLINT)
    private Set<Integer> days = new HashSet<>();

    protected StudyGoal() {}

    public StudyGoal(UUID profileId, String purpose, int months, int dailyMinutes, Set<GoalSubject> subjects,
            Set<Integer> days) {
        this.profileId = profileId;
        this.purpose = purpose;
        this.months = months;
        this.dailyMinutes = dailyMinutes;
        this.subjects = new HashSet<>(subjects);
        this.days = new HashSet<>(days);
    }

    public UUID getId() {
        return id;
    }

    public UUID getProfileId() {
        return profileId;
    }

    public String getPurpose() {
        return purpose;
    }

    public int getMonths() {
        return months;
    }

    public int getDailyMinutes() {
        return dailyMinutes;
    }

    public Set<GoalSubject> getSubjects() {
        return subjects;
    }

    public Set<Integer> getDays() {
        return days;
    }
}
