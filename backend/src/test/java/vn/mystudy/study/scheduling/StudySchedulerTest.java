package vn.mystudy.study.scheduling;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import vn.mystudy.study.scheduling.StudyScheduler.Goal;
import vn.mystudy.study.scheduling.StudyScheduler.RetainedTask;
import vn.mystudy.study.scheduling.StudyScheduler.ScheduledTask;
import vn.mystudy.study.scheduling.StudyScheduler.TopicRef;

class StudySchedulerTest {

    private final StudyScheduler scheduler = new StudyScheduler();
    private final List<TopicRef> topics = topics("math", "literature", "physics", "english");

    private static List<TopicRef> topics(String... subjects) {
        List<TopicRef> result = new ArrayList<>();
        for (String subject : subjects) {
            for (int i = 1; i <= 4; i++) result.add(new TopicRef(UUID.randomUUID(), subject, subject + " chuyên đề " + i));
        }
        return result;
    }

    private static Goal goal(int months, int dailyMinutes, Integer... days) {
        return new Goal(List.of("physics", "english"),
                Map.of("math", 8.0, "literature", 7.5, "physics", 8.0, "english", 9.0), months, dailyMinutes, Set.of(days));
    }

    @Test
    void fillsDailyBudgetInChunksOfAtMost45MinutesAndOrdersByScore() {
        LocalDate monday = LocalDate.of(2026, 11, 16);
        // foundation_first ưu tiên môn điểm thấp trước (literature=7.5 < physics=math=8.0 < english=9.0)
        List<ScheduledTask> tasks = scheduler.schedule(goal(1, 100, 1), topics, List.of(), monday, "foundation_first");

        List<ScheduledTask> firstDay = tasks.stream().filter(t -> t.date().equals(monday)).toList();
        assertThat(firstDay).extracting(ScheduledTask::minutes).containsExactly(45, 45, 10);
        assertThat(firstDay).extracting(ScheduledTask::position).containsExactly(1, 2, 3);
        // foundation_first: môn điểm thấp nhất (literature 7.5) được xếp đầu
        assertThat(firstDay.get(0).subjectCode()).isEqualTo("literature");
    }

    @Test
    void onlyUsesSelectedWeekdaysWithinTheMonthWindow() {
        LocalDate monday = LocalDate.of(2026, 11, 16);
        List<ScheduledTask> tasks = scheduler.schedule(goal(1, 30, 1, 3), topics, List.of(), monday, "exam_focused");

        assertThat(tasks).allSatisfy(t -> {
            assertThat(t.date().getDayOfWeek().getValue()).isIn(1, 3);
            assertThat(t.date()).isBefore(LocalDate.of(2026, 12, 16));
        });
        assertThat(tasks).hasSize(9);
    }

    @Test
    void retainedTasksConsumeBudgetAndPositions() {
        LocalDate monday = LocalDate.of(2026, 11, 16);
        List<ScheduledTask> tasks = scheduler.schedule(goal(1, 60, 1), topics,
                List.of(new RetainedTask(monday, 2, 40)), monday, "exam_focused");

        List<ScheduledTask> firstDay = tasks.stream().filter(t -> t.date().equals(monday)).toList();
        assertThat(firstDay).hasSize(1);
        assertThat(firstDay.get(0).minutes()).isEqualTo(20);
        assertThat(firstDay.get(0).position()).isEqualTo(3);
    }

    @Test
    void strategiesPickDifferentTopicsAndWordings() {
        LocalDate monday = LocalDate.of(2026, 11, 16);
        ScheduledTask exam = scheduler.schedule(goal(1, 45, 1), topics, List.of(), monday, "exam_focused").get(0);
        ScheduledTask base = scheduler.schedule(goal(1, 45, 1), topics, List.of(), monday, "foundation_first").get(0);

        // Hai chiến lược ưu tiên môn theo hướng ngược nhau → môn đầu tiên khác nhau
        assertThat(exam.subjectCode()).isNotEqualTo(base.subjectCode());
        // exam_focused: luyện dạng bài / phân tích / bài nâng cao
        assertThat(exam.content()).containsAnyOf("Luyện dạng bài về", "Phân tích đề mẫu về", "Thử sức bài nâng cao về");
        // foundation_first: ôn lý thuyết / xem ví dụ / tự làm bài
        assertThat(base.content()).containsAnyOf("Ôn lý thuyết", "Xem ví dụ minh họa về", "Tự làm bài tập cơ bản về");
    }

    @Test
    void failsClearlyWhenASubjectHasNoTopics() {
        assertThatThrownBy(() -> scheduler.schedule(goal(1, 45, 1), topics("math"), List.of(),
                LocalDate.of(2026, 11, 16), "exam_focused"))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("Missing topics");
    }

    @Test
    void subjectsFurtherFromTheirTargetGetMoreTime() {
        LocalDate monday = LocalDate.of(2026, 11, 16);
        Goal goal = new Goal("university_admission", List.of("physics", "english"),
                Map.of("math", 9.0, "literature", 7.0, "physics", 7.0, "english", 7.0),
                Map.of("math", 5.0, "literature", 6.0, "physics", 6.0, "english", 6.0), 1, 90, Set.of(1, 2, 3, 4, 5),
                Map.of());
        Map<String, Integer> minutes = minutesBySubject(scheduler.schedule(goal, topics, List.of(), monday, "exam_focused"));

        // Toán thiếu 4 điểm, các môn khác thiếu 1 điểm: Toán được khoảng gấp 4 lần thời gian.
        assertThat(minutes.get("math")).isGreaterThan(3 * minutes.get("literature"));
        assertThat(minutes.get("literature")).isPositive();
    }

    @Test
    void graduationPurposePrioritisesSubjectsBelowFive() {
        LocalDate monday = LocalDate.of(2026, 11, 16);
        Map<String, Double> targets = Map.of("math", 6.0, "literature", 6.0, "physics", 6.0, "english", 6.0);
        Map<String, Double> current = Map.of("math", 4.0, "literature", 4.5, "physics", 5.0, "english", 5.0);
        Goal graduation = new Goal("graduation", List.of("physics", "english"), targets, current, 1, 90,
                Set.of(1, 2, 3, 4, 5), Map.of());
        Goal admission = new Goal("university_admission", List.of("physics", "english"), targets, current, 1, 90,
                Set.of(1, 2, 3, 4, 5), Map.of());

        int literatureForGraduation = minutesBySubject(
                scheduler.schedule(graduation, topics, List.of(), monday, "exam_focused")).get("literature");
        int literatureForAdmission = minutesBySubject(
                scheduler.schedule(admission, topics, List.of(), monday, "exam_focused")).get("literature");
        assertThat(literatureForGraduation).isGreaterThan(literatureForAdmission);
    }

    @Test
    void weakTopicsAppearMoreOftenInTheRotation() {
        List<TopicRef> math = topics.stream().filter(t -> t.subjectCode().equals("math")).toList();
        UUID weak = math.get(1).id();
        List<TopicRef> rotation = StudyScheduler.rotation(math, Map.of(weak, 3), false);

        assertThat(rotation).hasSize(6);
        assertThat(rotation.stream().filter(t -> t.id().equals(weak)).count()).isEqualTo(3);
        // Rải đều: không xếp chuyên đề yếu liền nhau ba lần.
        for (int i = 0; i + 2 < rotation.size(); i++) {
            assertThat(rotation.get(i).id().equals(weak) && rotation.get(i + 1).id().equals(weak)
                    && rotation.get(i + 2).id().equals(weak)).isFalse();
        }
    }

    @Test
    void neverExceedsTheDailyBudget() {
        LocalDate monday = LocalDate.of(2026, 11, 16);
        Goal goal = new Goal("graduation", List.of("physics", "english"),
                Map.of("math", 9.0, "literature", 7.0, "physics", 7.0, "english", 7.0),
                Map.of("math", 2.0), 2, 75, Set.of(1, 3, 5), Map.of(topics.get(0).id(), 4));
        List<ScheduledTask> tasks = scheduler.schedule(goal, topics, List.of(), monday, "foundation_first");
        Map<LocalDate, Integer> perDay = new java.util.HashMap<>();
        tasks.forEach(t -> perDay.merge(t.date(), t.minutes(), Integer::sum));
        assertThat(perDay.values()).allMatch(m -> m == 75);
        assertThat(tasks).allMatch(t -> t.minutes() <= 45);
    }

    private static Map<String, Integer> minutesBySubject(List<ScheduledTask> tasks) {
        Map<String, Integer> result = new java.util.HashMap<>();
        tasks.forEach(t -> result.merge(t.subjectCode(), t.minutes(), Integer::sum));
        return result;
    }
}
