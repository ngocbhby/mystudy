package vn.mystudy.study.dto;

/** Mục tiêu và lộ trình hiện hành; cả hai là {@code null} khi người dùng chưa thiết lập. */
public record StudyGoalResponse(GoalResponse goal, PlanResponse plan) {

    public static StudyGoalResponse empty() {
        return new StudyGoalResponse(null, null);
    }
}
