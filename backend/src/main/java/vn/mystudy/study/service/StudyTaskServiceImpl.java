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
import vn.mystudy.exams.repository.ExamAttemptRepository;
import vn.mystudy.study.dto.OverviewResponse;
import vn.mystudy.study.dto.StreakInfoResponse;
import vn.mystudy.study.dto.TaskResponse;
import vn.mystudy.study.entity.StreakRecovery;
import vn.mystudy.study.mapper.StudyMapper;
import vn.mystudy.study.repository.StreakRecoveryRepository;
import vn.mystudy.study.repository.StudyTaskRepository;

@Service
class StudyTaskServiceImpl implements StudyTaskService {

    private static final long MAX_RANGE_DAYS = 7;

    private final StudyTaskRepository tasks;
    private final StudyMapper mapper;
    private final VietnamClock clock;
    private final ExamAttemptRepository attempts;
    private final StreakRecoveryRepository streakRecoveries;

    StudyTaskServiceImpl(StudyTaskRepository tasks, StudyMapper mapper, VietnamClock clock,
                         ExamAttemptRepository attempts, StreakRecoveryRepository streakRecoveries) {
        this.tasks = tasks;
        this.mapper = mapper;
        this.clock = clock;
        this.attempts = attempts;
        this.streakRecoveries = streakRecoveries;
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
        StreakInfoResponse streak = streakInfo(profileId);
        return new OverviewResponse(today.toString(), todayTasks, next == null ? null : next.toString(), streak.currentStreak(), streak);
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

    @Override
    @Transactional(readOnly = true)
    public StreakInfoResponse streakInfo(UUID profileId) {
        LocalDate today = clock.today();
        List<LocalDate> completedDays = tasks.findCompletedDays(profileId).stream().map(LocalDate::parse).toList();
        int currentStreak = streakDays(completedDays, today);
        LocalDate missedDate = findRecoverableMissedDate(completedDays, today);
        boolean isBroken = missedDate != null;
        int availableExamsCount = attempts.countUnusedSubmittedAttempts(profileId);
        int totalRecoveredDays = streakRecoveries.countByProfileId(profileId);
        boolean canRecover = isBroken && availableExamsCount >= 2;

        return new StreakInfoResponse(
                currentStreak,
                isBroken,
                missedDate != null ? missedDate.toString() : null,
                2,
                availableExamsCount,
                canRecover,
                totalRecoveredDays
        );
    }

    @Override
    @Transactional
    public StreakInfoResponse recoverStreak(UUID profileId, LocalDate targetDate) {
        LocalDate today = clock.today();
        List<LocalDate> completedDays = tasks.findCompletedDays(profileId).stream().map(LocalDate::parse).toList();

        if (targetDate == null) {
            targetDate = findRecoverableMissedDate(completedDays, today);
        }

        if (targetDate == null) {
            throw BusinessException.validation(Map.of("streak", "Hiện tại bạn không có ngày đứt chuỗi nào cần khôi phục."));
        }

        if (targetDate.isAfter(today)) {
            throw BusinessException.validation(Map.of("streak", "Không thể khôi phục chuỗi cho ngày trong tương lai."));
        }

        if (completedDays.contains(targetDate)) {
            throw BusinessException.validation(Map.of("streak", "Ngày này đã có lịch sử học tập hoặc đã được khôi phục."));
        }

        List<UUID> unusedAttemptIds = attempts.findUnusedSubmittedAttemptIds(profileId, 2);
        if (unusedAttemptIds.size() < 2) {
            throw BusinessException.validation(Map.of("streak",
                    "Bạn cần làm bù ít nhất 2 bài thi thử để khôi phục 1 ngày chuỗi (hiện có: " + unusedAttemptIds.size() + " bài)."));
        }

        StreakRecovery recovery = new StreakRecovery(
                UUID.randomUUID(),
                profileId,
                targetDate,
                unusedAttemptIds.get(0),
                unusedAttemptIds.get(1),
                clock.now()
        );
        streakRecoveries.save(recovery);

        return streakInfo(profileId);
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

    /**
     * Tìm ngày bị đứt chuỗi gần nhất có thể khôi phục để nối lại chuỗi học tập.
     */
    static LocalDate findRecoverableMissedDate(List<LocalDate> completedDays, LocalDate today) {
        TreeSet<LocalDate> days = new TreeSet<>(completedDays.stream().filter(d -> !d.isAfter(today)).toList());
        if (days.isEmpty()) return null;

        // Nếu hôm nay chưa học
        if (!days.contains(today)) {
            LocalDate yesterday = today.minusDays(1);
            // Nếu hôm qua đã học thì chuỗi vẫn còn hiệu lực (kết thúc hôm qua)
            if (days.contains(yesterday)) {
                return null;
            }
            // Hôm qua không học -> chuỗi bị đứt vào ngày hôm qua nếu trước đó có học
            LocalDate lastStudy = days.last();
            if (!lastStudy.isAfter(yesterday)) {
                return lastStudy.plusDays(1);
            }
            return null;
        }

        // Nếu hôm nay đã học, kiểm tra xem chuỗi hiện tại có bị đứt quãng về trước không
        LocalDate check = today;
        while (days.contains(check)) {
            check = check.minusDays(1);
        }
        if (!days.headSet(check).isEmpty()) {
            return check;
        }

        return null;
    }
}
