package vn.mystudy.study.scheduling;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Component;
import vn.mystudy.study.StudyCatalog;

/**
 * Xếp lịch học: chia đều thời gian mỗi ngày học cho các môn (môn điểm mục tiêu cao xếp trước),
 * mỗi nhiệm vụ tối đa 45 phút, xoay vòng chuyên đề theo chiến lược.
 *
 * <p><b>Hai chiến lược khác nhau rõ rệt:</b>
 * <ul>
 *   <li><b>exam_focused</b>: Học ngược từ chuyên đề cuối → đầu (đề thi thường ra phần sau/khó),
 *       luyện đề có bấm giờ, lặp lại chuyên đề yếu nhiều lần trước khi sang chuyên đề mới.</li>
 *   <li><b>foundation_first</b>: Học theo đúng thứ tự chương trình (đầu → cuối),
 *       ôn kiến thức cốt lõi, hiểu kỹ từng phần trước khi tiến.</li>
 * </ul>
 * Thuần logic nên kiểm thử không cần CSDL.
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
        // exam_focused: ưu tiên môn điểm mục tiêu cao (cần cải thiện nhiều nhất)
        // foundation_first: ưu tiên môn điểm thấp (nền tảng yếu cần củng cố trước)
        boolean examFocused = "exam_focused".equals(strategy);
        if (examFocused) {
            codes.sort(Comparator.<String, Double>comparing(code -> goal.scores().get(code)).reversed());
        } else {
            codes.sort(Comparator.<String, Double>comparing(code -> goal.scores().get(code)));
        }

        // Sắp xếp danh sách chuyên đề theo chiến lược
        Map<String, List<TopicRef>> grouped = new HashMap<>();
        for (TopicRef t : topics) {
            grouped.computeIfAbsent(t.subjectCode(), k -> new ArrayList<>()).add(t);
        }
        // exam_focused: học từ chuyên đề cuối (phức tạp) → đầu (cơ bản), lặp lại nhiều lần
        // foundation_first: học theo đúng thứ tự chương trình (đầu → cuối)
        for (Map.Entry<String, List<TopicRef>> entry : grouped.entrySet()) {
            if (examFocused) {
                // Đảo ngược thứ tự: chuyên đề cuối chương trình (thường ra đề nhiều) học trước
                java.util.Collections.reverse(entry.getValue());
            }
            // foundation_first giữ nguyên thứ tự curriculum_order từ DB (đầu → cuối)
        }

        Map<LocalDate, List<RetainedTask>> retainedByDay = new HashMap<>();
        retained.forEach(task -> retainedByDay.computeIfAbsent(task.date(), d -> new ArrayList<>()).add(task));

        List<ScheduledTask> tasks = new ArrayList<>();
        // Mỗi môn có con trỏ chuyên đề riêng để xoay vòng độc lập
        Map<String, Integer> topicPointer = new HashMap<>();
        codes.forEach(code -> topicPointer.put(code, 0));

        int slot = 0;
        for (LocalDate day = startsOn; day.isBefore(end); day = day.plusDays(1)) {
            if (!goal.days().contains(day.getDayOfWeek().getValue())) continue;
            List<RetainedTask> kept = retainedByDay.getOrDefault(day, List.of());
            int remaining = goal.dailyMinutes() - kept.stream().mapToInt(RetainedTask::minutes).sum();
            int position = kept.stream().mapToInt(RetainedTask::position).max().orElse(0) + 1;
            while (remaining > 0) {
                String code = codes.get(slot % codes.size());
                List<TopicRef> available = grouped.get(code);
                if (available == null || available.isEmpty()) {
                    throw new IllegalStateException("Missing topics for " + code);
                }
                // exam_focused: mỗi lần hết vòng một môn, chuyển sang chuyên đề tiếp theo
                // foundation_first: tiến tuần tự, chỉ lặp lại chuyên đề hiện tại thêm 1 lần trước khi sang tiếp
                int pointer = topicPointer.get(code);
                TopicRef topic = available.get(pointer % available.size());
                int minutes = Math.min(remaining, MAX_TASK_MINUTES);
                tasks.add(new ScheduledTask(day, position, code, topic.id(), minutes,
                        content(topic, examFocused, pointer, available.size())));
                // Tăng pointer: exam_focused mỗi slot tăng 1 (xoay nhanh), foundation_first tăng mỗi 2 slot (học kỹ hơn)
                if (examFocused || (slot / codes.size()) % 2 == 1) {
                    topicPointer.put(code, pointer + 1);
                }
                position++;
                slot++;
                remaining -= minutes;
            }
        }
        return tasks;
    }

    private static String content(TopicRef topic, boolean examFocused, int pointer, int total) {
        String name = topic.name().toLowerCase(VIETNAMESE);
        int topicIndex = pointer % total;
        if (examFocused) {
            // Xoay vòng giữa các loại bài luyện: luyện đề → phân tích lỗi → làm thêm bài khó
            return switch (topicIndex % 3) {
                case 0 -> "Luyện dạng bài về " + name + ". Làm bài có bấm giờ, ghi lại lỗi và cách sửa.";
                case 1 -> "Phân tích đề mẫu về " + name + ". Hiểu cách ra đề, nhận dạng bẫy thường gặp.";
                default -> "Thử sức bài nâng cao về " + name + ". Làm không xem gợi ý, kiểm tra lại sau.";
            };
        } else {
            // Xoay vòng giữa các bước học nền tảng: đọc lý thuyết → ví dụ → tự làm
            return switch (topicIndex % 3) {
                case 0 -> "Ôn lý thuyết " + name + ". Tóm tắt ý chính bằng sơ đồ hoặc ghi chú ngắn.";
                case 1 -> "Xem ví dụ minh họa về " + name + ". Hiểu từng bước, tự giải thích lại bằng lời.";
                default -> "Tự làm bài tập cơ bản về " + name + ". Không xem tài liệu, kiểm tra lại sau khi làm xong.";
            };
        }
    }
}
