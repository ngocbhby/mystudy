package vn.mystudy.study.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;
import vn.mystudy.study.StudyCatalog;
import vn.mystudy.study.dto.GoalRequest;

/** Quy tắc kiểm tra mục tiêu (cùng quy tắc với frontend); trả về lỗi theo tên trường. */
@Component
public class GoalValidator {

    public Map<String, String> validate(GoalRequest goal) {
        Map<String, String> errors = new LinkedHashMap<>();
        if (goal == null) {
            errors.put("purpose", "Hãy chọn mục đích ôn thi.");
            return errors;
        }
        if (goal.purpose() == null || !StudyCatalog.PURPOSES.contains(goal.purpose())) {
            errors.put("purpose", "Hãy chọn mục đích ôn thi.");
        }

        List<String> electives = goal.electiveCodes();
        boolean electivesValid = electives != null && electives.size() == 2
                && electives.stream().allMatch(c -> c != null && StudyCatalog.ELECTIVES.contains(c))
                && !electives.get(0).equals(electives.get(1));
        if (!electivesValid) errors.put("electives", "Hãy chọn hai môn tự chọn khác nhau.");

        List<String> codes = new java.util.ArrayList<>(StudyCatalog.REQUIRED);
        if (electivesValid) codes.addAll(electives);
        for (String code : codes) {
            Number score = goal.scores() == null ? null : goal.scores().get(code);
            if (score == null || !Double.isFinite(score.doubleValue()) || score.doubleValue() < 0
                    || score.doubleValue() > 10) {
                errors.put(code, "Nhập điểm từ 0 đến 10.");
            }
        }

        if (goal.currentScores() != null) {
            for (Map.Entry<String, Number> entry : goal.currentScores().entrySet()) {
                Number score = entry.getValue();
                if (!codes.contains(entry.getKey())) continue;
                if (score != null && (!Double.isFinite(score.doubleValue()) || score.doubleValue() < 0
                        || score.doubleValue() > 10)) {
                    errors.put("current_" + entry.getKey(), "Nhập điểm hiện tại từ 0 đến 10.");
                }
            }
        }

        if (!isInteger(goal.months()) || goal.months().intValue() < 1 || goal.months().intValue() > 24) {
            errors.put("months", "Nhập số tháng nguyên từ 1 đến 24.");
        }
        if (!isInteger(goal.dailyMinutes()) || goal.dailyMinutes().intValue() < 1
                || goal.dailyMinutes().intValue() > 1440) {
            errors.put("dailyMinutes", "Nhập số giờ tương ứng từ 1 phút đến 24 giờ.");
        }

        List<Number> days = goal.days();
        boolean daysValid = days != null && !days.isEmpty() && days.stream()
                .allMatch(d -> isInteger(d) && d.intValue() >= 1 && d.intValue() <= 7)
                && Set.copyOf(days.stream().map(Number::intValue).toList()).size() == days.size();
        if (!daysValid) errors.put("days", "Hãy chọn ít nhất một ngày học trong tuần.");

        if (goal.strategy() != null && !StudyCatalog.STRATEGIES.contains(goal.strategy())) {
            errors.put("strategy", "Cách ôn tập không hợp lệ.");
        }
        return errors;
    }

    private static boolean isInteger(Number value) {
        if (value == null) return false;
        if (value instanceof Integer || value instanceof Long || value instanceof Short) return true;
        double d = value.doubleValue();
        return Double.isFinite(d) && d == Math.rint(d);
    }
}
