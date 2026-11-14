package vn.mystudy.study.service;

import java.util.UUID;
import vn.mystudy.study.dto.GoalRequest;
import vn.mystudy.study.dto.StudyGoalResponse;

public interface StudyGoalService {

    StudyGoalResponse getCurrent(UUID profileId);

    /** Lưu mục tiêu mới, thay lộ trình hiện hành và xếp lại lịch (giữ nhiệm vụ đã hoàn thành). */
    StudyGoalResponse save(UUID profileId, GoalRequest request);
}
