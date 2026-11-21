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

    @Test
    void detectsRecoverableMissedDateWhenStreakBreaks() {
        // Hôm nay chưa học, hôm qua (TODAY-1) bị nghỉ, trước đó có chuỗi 3 ngày:
        // -> phát hiện ngày hôm qua là ngày đứt chuỗi cần khôi phục
        LocalDate yesterday = TODAY.minusDays(1);
        assertThat(StudyTaskServiceImpl.findRecoverableMissedDate(
                List.of(TODAY.minusDays(2), TODAY.minusDays(3), TODAY.minusDays(4)), TODAY))
                .isEqualTo(yesterday);

        // Đã học hôm nay, nhưng hôm qua bị lỡ, trước đó có học:
        // -> phát hiện ngày hôm qua là ngày cần khôi phục để nối lại chuỗi
        assertThat(StudyTaskServiceImpl.findRecoverableMissedDate(
                List.of(TODAY, TODAY.minusDays(2), TODAY.minusDays(3)), TODAY))
                .isEqualTo(yesterday);

        // Chuỗi đang duy trì bình thường (hôm qua có học):
        assertThat(StudyTaskServiceImpl.findRecoverableMissedDate(
                List.of(TODAY.minusDays(1), TODAY.minusDays(2)), TODAY))
                .isNull();

        // Chuỗi đang duy trì bình thường (hôm nay có học liên tiếp):
        assertThat(StudyTaskServiceImpl.findRecoverableMissedDate(
                List.of(TODAY, TODAY.minusDays(1)), TODAY))
                .isNull();

        // Không có dữ liệu:
        assertThat(StudyTaskServiceImpl.findRecoverableMissedDate(List.of(), TODAY))
                .isNull();
    }
}
