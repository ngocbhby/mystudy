package vn.mystudy.study.dto;

import java.util.List;
import java.util.Map;

/**
 * Mục tiêu học tập do người dùng gửi lên. Dùng {@link Number} để phân biệt số nguyên và số thực khi kiểm tra
 * (ví dụ 6.5 tháng là không hợp lệ). Việc kiểm tra nằm ở {@code GoalValidator} để giữ nguyên khóa lỗi theo trường.
 */
public record GoalRequest(
        String purpose,
        List<String> electiveCodes,
        Map<String, Number> scores,
        Map<String, Number> currentScores,
        Number months,
        Number dailyMinutes,
        List<Number> days,
        String strategy) {
}
