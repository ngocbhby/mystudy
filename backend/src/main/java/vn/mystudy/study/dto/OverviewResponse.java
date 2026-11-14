package vn.mystudy.study.dto;

import java.util.List;

public record OverviewResponse(String today, List<TaskResponse> tasks, String nextStudyDate, int streakDays) {
}
