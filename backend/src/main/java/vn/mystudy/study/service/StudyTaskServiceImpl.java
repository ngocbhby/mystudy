package vn.mystudy.study.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.mystudy.common.exception.BusinessException;
import vn.mystudy.common.time.VietnamClock;
import vn.mystudy.study.dto.OverviewResponse;
import vn.mystudy.study.dto.TaskResponse;
import vn.mystudy.study.mapper.StudyMapper;
import vn.mystudy.study.repository.StudyTaskRepository;

@Service
class StudyTaskServiceImpl implements StudyTaskService {

    private static final long MAX_RANGE_DAYS = 7;

    private final StudyTaskRepository tasks;
    private final StudyMapper mapper;
    private final VietnamClock clock;

    StudyTaskServiceImpl(StudyTaskRepository tasks, StudyMapper mapper, VietnamClock clock) {
        this.tasks = tasks;
        this.mapper = mapper;
        this.clock = clock;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> list(UUID profileId, LocalDate from, LocalDate to) {
        if (from.isAfter(to) || to.toEpochDay() - from.toEpochDay() > MAX_RANGE_DAYS) {
            throw BusinessException.validation(Map.of("range", "Khoảng ngày không hợp lệ."));
        }
        return mapper.toTaskResponses(tasks.findVisible(profileId, from, to));
    }

    @Override
    @Transactional(readOnly = true)
    public OverviewResponse overview(UUID profileId) {
        LocalDate today = clock.today();
        List<TaskResponse> todayTasks = mapper.toTaskResponses(tasks.findVisible(profileId, today, today));
        LocalDate next = tasks.findNextStudyDate(profileId, today);
        int streak = streakDays(tasks.findCompletedDays(profileId).stream().map(LocalDate::parse).toList(), today);
        return new OverviewResponse(today.toString(), todayTasks, next == null ? null : next.toString(), streak);
    }

    @Override
    @Transactional
    public void complete(UUID profileId, UUID taskId) {
        if (tasks.markCompleted(taskId, profileId, clock.today(), clock.now()) == 0) {
            throw BusinessException.notFound("Không thể đánh dấu nhiệm vụ này.");
        }
    }

    @Override
    @Transactional
    public void uncomplete(UUID profileId, UUID taskId) {
        if (tasks.unmarkCompleted(taskId, profileId) == 0) {
            throw BusinessException.notFound("Không thể hủy đánh dấu nhiệm vụ này.");
        }
    }

    /** Số ngày liên tiếp kết thúc hôm nay hoặc hôm qua có ít nhất một nhiệm vụ hoàn thành. */
    static int streakDays(List<LocalDate> completedDays, LocalDate today) {
        TreeSet<LocalDate> days = new TreeSet<>(completedDays.stream().filter(d -> !d.isAfter(today)).toList());
        if (days.isEmpty() || days.last().isBefore(today.minusDays(1))) return 0;
        int streak = 0;
        LocalDate expected = days.last();
        for (LocalDate day : days.descendingSet()) {
            if (!day.equals(expected)) break;
            streak++;
            expected = expected.minusDays(1);
        }
        return streak;
    }
}
