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
 * Xếp lịch học. Mỗi ngày học được chia thành các nhiệm vụ tối đa 45 phút. Môn nào cũng có trọng số; mỗi lượt xếp
 * chọn môn đang "thiếu" thời gian nhiều nhất so với phần đáng được nhận (cân bằng có trọng số), nên:
 * <ul>
 *   <li>môn có khoảng cách lớn giữa điểm hiện tại và điểm mục tiêu được nhiều thời gian hơn;</li>
 *   <li>mục đích "chỉ tốt nghiệp" ưu tiên thêm môn đang dưới 5 điểm;</li>
 *   <li>trong một môn, chuyên đề yếu (trọng số cao, từ kết quả thi thử) xuất hiện thường xuyên hơn.</li>
 * </ul>
 * Khi không có điểm hiện tại và kết quả thi, mọi môn có trọng số bằng nhau (giống phiên bản cũ). Thuần logic nên
 * kiểm thử không cần CSDL.
 */
@Component
public class StudyScheduler {

    static final int MAX_TASK_MINUTES = 45;
    private static final double MIN_SUBJECT_WEIGHT = 0.5;
    private static final double AT_RISK_BONUS = 1.5;
    private static final Locale VIETNAMESE = Locale.forLanguageTag("vi-VN");

    /**
     * @param currentScores điểm hiện tại tự đánh giá (có thể thiếu môn, hoặc rỗng)
     * @param topicWeights  trọng số chuyên đề từ phân tích kết quả thi (1 = bình thường, cao hơn = cần ôn nhiều hơn)
     */
    public record Goal(String purpose, List<String> electiveCodes, Map<String, Double> scores,
            Map<String, Double> currentScores, int months, int dailyMinutes, Set<Integer> days,
            Map<UUID, Integer> topicWeights) {

        public Goal {
            currentScores = currentScores == null ? Map.of() : currentScores;
            topicWeights = topicWeights == null ? Map.of() : topicWeights;
        }

        /** Mục tiêu không có điểm hiện tại hay trọng số chuyên đề. */
        public Goal(List<String> electiveCodes, Map<String, Double> scores, int months, int dailyMinutes,
                Set<Integer> days) {
            this("university_admission", electiveCodes, scores, Map.of(), months, dailyMinutes, days, Map.of());
        }
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
        // Thứ tự ưu tiên khi hòa: điểm mục tiêu cao xếp trước.
        codes.sort(Comparator.<String, Double>comparing(code -> goal.scores().get(code)).reversed());

        Map<String, List<TopicRef>> grouped = topics.stream().collect(Collectors.groupingBy(TopicRef::subjectCode));
        boolean examFocused = "exam_focused".equals(strategy);
        Map<String, List<TopicRef>> rotations = new HashMap<>();
        for (String code : codes) {
            List<TopicRef> available = grouped.get(code);
            if (available == null || available.isEmpty()) {
                throw new IllegalStateException("Missing topics for " + code);
            }
            rotations.put(code, rotation(available, goal.topicWeights(), examFocused));
        }

        Map<String, Double> weights = new HashMap<>();
        codes.forEach(code -> weights.put(code, subjectWeight(code, goal)));
        Map<String, Integer> allocated = new HashMap<>();
        Map<String, Integer> topicCursor = new HashMap<>();

        Map<LocalDate, List<RetainedTask>> retainedByDay = new HashMap<>();
        retained.forEach(task -> retainedByDay.computeIfAbsent(task.date(), d -> new ArrayList<>()).add(task));

        List<ScheduledTask> tasks = new ArrayList<>();
        for (LocalDate day = startsOn; day.isBefore(end); day = day.plusDays(1)) {
            if (!goal.days().contains(day.getDayOfWeek().getValue())) continue;
            List<RetainedTask> kept = retainedByDay.getOrDefault(day, List.of());
            int remaining = goal.dailyMinutes() - kept.stream().mapToInt(RetainedTask::minutes).sum();
            int position = kept.stream().mapToInt(RetainedTask::position).max().orElse(0) + 1;
            while (remaining > 0) {
                String code = mostBehind(codes, weights, allocated);
                List<TopicRef> rotation = rotations.get(code);
                int cursor = topicCursor.merge(code, 1, Integer::sum) - 1;
                TopicRef topic = rotation.get(cursor % rotation.size());
                int minutes = Math.min(remaining, MAX_TASK_MINUTES);
                tasks.add(new ScheduledTask(day, position, code, topic.id(), minutes, content(topic, examFocused)));
                allocated.merge(code, minutes, Integer::sum);
                position++;
                remaining -= minutes;
            }
        }
        return tasks;
    }

    /** Trọng số môn: khoảng cách tới mục tiêu (nếu biết điểm hiện tại), cộng ưu tiên môn có nguy cơ khi chỉ cần tốt nghiệp. */
    static double subjectWeight(String code, Goal goal) {
        Double current = goal.currentScores().get(code);
        if (current == null) return 1.0;
        double target = goal.scores().getOrDefault(code, current);
        double weight = Math.max(MIN_SUBJECT_WEIGHT, target - current);
        if ("graduation".equals(goal.purpose()) && current < 5) weight *= AT_RISK_BONUS;
        return weight;
    }

    /** Môn có số phút đã xếp so với trọng số thấp nhất; hòa thì theo thứ tự ưu tiên. */
    private static String mostBehind(List<String> codes, Map<String, Double> weights, Map<String, Integer> allocated) {
        String best = codes.get(0);
        double bestRatio = Double.MAX_VALUE;
        for (String code : codes) {
            double ratio = allocated.getOrDefault(code, 0) / weights.get(code);
            if (ratio < bestRatio - 1e-9) {
                best = code;
                bestRatio = ratio;
            }
        }
        return best;
    }

    /**
     * Vòng chuyên đề của một môn: chuyên đề trọng số w xuất hiện w lần mỗi vòng, rải đều (cân bằng có trọng số).
     * "Sát đề" bắt đầu từ chuyên đề cuối (luyện dạng bài tổng hợp), "Nền tảng" bắt đầu từ chuyên đề đầu.
     */
    static List<TopicRef> rotation(List<TopicRef> topics, Map<UUID, Integer> topicWeights, boolean examFocused) {
        List<TopicRef> ordered = new ArrayList<>(topics);
        if (examFocused) {
            ordered.add(0, ordered.remove(ordered.size() - 1));
        }
        int[] weight = new int[ordered.size()];
        int total = 0;
        for (int i = 0; i < ordered.size(); i++) {
            weight[i] = Math.max(1, Math.min(4, topicWeights.getOrDefault(ordered.get(i).id(), 1)));
            total += weight[i];
        }
        int[] current = new int[ordered.size()];
        List<TopicRef> result = new ArrayList<>(total);
        for (int step = 0; step < total; step++) {
            int pick = 0;
            for (int i = 0; i < ordered.size(); i++) {
                current[i] += weight[i];
                if (current[i] > current[pick]) pick = i;
            }
            current[pick] -= total;
            result.add(ordered.get(pick));
        }
        return result;
    }

    private static String content(TopicRef topic, boolean examFocused) {
        String name = topic.name().toLowerCase(VIETNAMESE);
        return examFocused
                ? "Luyện dạng bài về " + name + ". Làm bài có bấm giờ, sau đó ghi lại lỗi và cách sửa."
                : "Ôn kiến thức về " + name + ". Tóm tắt ý chính, xem một ví dụ rồi tự làm bài tương tự.";
    }
}
