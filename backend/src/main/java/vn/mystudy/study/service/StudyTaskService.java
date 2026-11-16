package vn.mystudy.study.service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import vn.mystudy.study.dto.OverviewResponse;
import vn.mystudy.study.dto.TaskResponse;

public interface StudyTaskService {

    List<TaskResponse> list(UUID profileId, LocalDate from, LocalDate to);

    OverviewResponse overview(UUID profileId);

    /** Đánh dấu đã học; ném NOT_FOUND nếu nhiệm vụ không thuộc người dùng, chưa tới ngày học hoặc đã hủy. */
    void complete(UUID profileId, UUID taskId);

    /** Hủy đánh dấu hoàn thành nhiệm vụ nếu người dùng bấm nhầm. */
    void uncomplete(UUID profileId, UUID taskId);
}
