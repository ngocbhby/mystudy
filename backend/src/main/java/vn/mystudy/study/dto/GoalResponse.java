package vn.mystudy.study.dto;

import java.util.List;
import java.util.Map;

public record GoalResponse(
        String purpose,
        List<String> electiveCodes,
        Map<String, Double> scores,
        Map<String, Double> currentScores,
        int months,
        int dailyMinutes,
        List<Integer> days) {
}
