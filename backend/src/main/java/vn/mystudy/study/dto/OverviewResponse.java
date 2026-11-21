package vn.mystudy.study.dto;

import java.util.List;

public record OverviewResponse(
        String today,
        List<TaskResponse> tasks,
        String nextStudyDate,
        int streakDays,
        StreakInfoResponse streakInfo
) {
    public OverviewResponse(String today, List<TaskResponse> tasks, String nextStudyDate, int streakDays) {
        this(today, tasks, nextStudyDate, streakDays, null);
    }
}
