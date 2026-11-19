package vn.mystudy.study.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.math.BigDecimal;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** Điểm mục tiêu của một môn trong một mục tiêu học tập (bảng goal_subjects). */
@Embeddable
public record GoalSubject(
        @Column(name = "subject_code") String subjectCode,
        @Column(name = "target_score") BigDecimal targetScore,
        @Column(name = "current_score") BigDecimal currentScore,
        @Column(name = "elective_order") @JdbcTypeCode(SqlTypes.SMALLINT) Integer electiveOrder) {
}
