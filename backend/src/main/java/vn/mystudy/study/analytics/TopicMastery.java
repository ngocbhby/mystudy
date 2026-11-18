package vn.mystudy.study.analytics;

import java.util.UUID;

/** Kết quả làm bài theo một chuyên đề trong các lượt thi gần đây (câu bỏ trống tính là chưa đúng). */
public record TopicMastery(UUID topicId, String subjectCode, String topicName, int correct, int total) {

    /** Cần ít nhất ngần này câu mới đủ cơ sở để kết luận một chuyên đề là yếu. */
    public static final int MIN_QUESTIONS = 3;

    public double accuracy() {
        return total == 0 ? 0 : (double) correct / total;
    }

    public boolean hasEnoughData() {
        return total >= MIN_QUESTIONS;
    }

    /**
     * Trọng số chuyên đề cho bộ xếp lịch: dưới 50% → 3, dưới 70% → 2, còn lại → 1. Chuyên đề chưa đủ dữ liệu giữ 1.
     */
    public int scheduleWeight() {
        if (!hasEnoughData()) return 1;
        double a = accuracy();
        if (a < 0.5) return 3;
        if (a < 0.7) return 2;
        return 1;
    }
}
