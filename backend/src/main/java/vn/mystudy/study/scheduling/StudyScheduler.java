package vn.mystudy.study.scheduling;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;
import vn.mystudy.study.StudyCatalog;

/**
 * Xếp lịch học: chia đều thời gian mỗi ngày học cho 4 môn (môn điểm mục tiêu cao xếp trước), mỗi nhiệm vụ tối đa
 * 45 phút, xoay vòng chuyên đề theo chiến lược. Thuần logic nên kiểm thử không cần CSDL.
 */
@Component
public class StudyScheduler {

    static final int MAX_TASK_MINUTES = 45;
    private static final Locale VIETNAMESE = Locale.forLanguageTag("vi-VN");

    public record Goal(List<String> electiveCodes, Map<String, Double> scores, int months, int dailyMinutes,
            Set<Integer> days) {
    }

    public record TopicRef(UUID id, String subjectCode, String name) {
    }

    /** Nhiệm vụ đã hoàn thành được giữ lại: chiếm quỹ giờ và vị trí trong ngày. */
    public record RetainedTask(LocalDate date, int position, int minutes) {
    }

    public record ScheduledTask(LocalDate date, int position, String subjectCode, UUID topicId, int minutes,
            String content) {
    }

    public List<ScheduledTask> schedule(Goal goal, List<TopicRef> topics, List<RetainedTask> retained,
            LocalDate startsOn, String strategy) {
        LocalDate end = startsOn.plusMonths(goal.months());
        List<String> codes = new ArrayList<>(StudyCatalog.REQUIRED);
        codes.addAll(goal.electiveCodes());
        codes.sort(Comparator.<String, Double>comparing(code -> goal.scores().get(code)).reversed());

        Map<String, List<TopicRef>> grouped = topics.stream().collect(Collectors.groupingBy(TopicRef::subjectCode));
        Map<LocalDate, List<RetainedTask>> retainedByDay = new HashMap<>();
        retained.forEach(task -> retainedByDay.computeIfAbsent(task.date(), d -> new ArrayList<>()).add(task));
        boolean examFocused = "exam_focused".equals(strategy);

        List<ScheduledTask> tasks = new ArrayList<>();
        int slot = 0;
        for (LocalDate day = startsOn; day.isBefore(end); day = day.plusDays(1)) {
            if (!goal.days().contains(day.getDayOfWeek().getValue())) continue;
            List<RetainedTask> kept = retainedByDay.getOrDefault(day, List.of());
            int remaining = goal.dailyMinutes() - kept.stream().mapToInt(RetainedTask::minutes).sum();
            int position = kept.stream().mapToInt(RetainedTask::position).max().orElse(0) + 1;
            while (remaining > 0) {
                String code = codes.get(slot % codes.size());
                int round = slot / codes.size();
                List<TopicRef> available = grouped.get(code);
                if (available == null || available.isEmpty()) {
                    throw new IllegalStateException("Missing topics for " + code);
                }
                TopicRef topic = available.get((round + (examFocused ? available.size() - 1 : 0)) % available.size());
                int minutes = Math.min(remaining, MAX_TASK_MINUTES);
                tasks.add(new ScheduledTask(day, position, code, topic.id(), minutes, content(topic, examFocused)));
                position++;
                slot++;
                remaining -= minutes;
            }
        }
        return tasks;
    }

    private static String content(TopicRef topic, boolean examFocused) {
        String name = topic.name().toLowerCase(VIETNAMESE);
        return examFocused
                ? "Luyện dạng bài về " + name + ". Làm bài có bấm giờ, sau đó ghi lại lỗi và cách sửa."
                : "Ôn kiến thức về " + name + ". Tóm tắt ý chính, xem một ví dụ rồi tự làm bài tương tự.";
    }
}
