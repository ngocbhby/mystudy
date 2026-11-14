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
        List<ScheduledTask> tasks = scheduler.schedule(goal(1, 100, 1), topics, List.of(), monday, "foundation_first");

        List<ScheduledTask> firstDay = tasks.stream().filter(t -> t.date().equals(monday)).toList();
        assertThat(firstDay).extracting(ScheduledTask::minutes).containsExactly(45, 45, 10);
        assertThat(firstDay).extracting(ScheduledTask::position).containsExactly(1, 2, 3);
        assertThat(firstDay.get(0).subjectCode()).isEqualTo("english");
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

        assertThat(exam.topicId()).isNotEqualTo(base.topicId());
        assertThat(exam.content()).startsWith("Luyện dạng bài về");
        assertThat(base.content()).startsWith("Ôn kiến thức về");
    }

    @Test
    void failsClearlyWhenASubjectHasNoTopics() {
        assertThatThrownBy(() -> scheduler.schedule(goal(1, 45, 1), topics("math"), List.of(),
                LocalDate.of(2026, 11, 16), "exam_focused"))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("Missing topics");
    }
}
