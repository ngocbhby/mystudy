package vn.mystudy.study.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

class StreakTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 11, 14);

    @Test
    void countsConsecutiveDaysEndingTodayOrYesterday() {
        assertThat(StudyTaskServiceImpl.streakDays(List.of(TODAY, TODAY.minusDays(1), TODAY.minusDays(2)), TODAY)).isEqualTo(3);
        assertThat(StudyTaskServiceImpl.streakDays(List.of(TODAY.minusDays(1), TODAY.minusDays(2)), TODAY)).isEqualTo(2);
    }

    @Test
    void brokenOrStaleStreaksAreZeroOrShort() {
        assertThat(StudyTaskServiceImpl.streakDays(List.of(TODAY, TODAY.minusDays(2)), TODAY)).isEqualTo(1);
        assertThat(StudyTaskServiceImpl.streakDays(List.of(TODAY.minusDays(2)), TODAY)).isZero();
        assertThat(StudyTaskServiceImpl.streakDays(List.of(), TODAY)).isZero();
        assertThat(StudyTaskServiceImpl.streakDays(List.of(TODAY.plusDays(1)), TODAY)).isZero();
    }
}
