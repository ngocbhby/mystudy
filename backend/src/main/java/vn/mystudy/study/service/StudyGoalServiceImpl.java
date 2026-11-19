package vn.mystudy.study.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.mystudy.auth.repository.ProfileRepository;
import vn.mystudy.common.api.ErrorCode;
import vn.mystudy.common.exception.BusinessException;
import vn.mystudy.common.time.VietnamClock;
import vn.mystudy.study.StudyCatalog;
import vn.mystudy.study.analytics.TopicMasteryService;
import vn.mystudy.study.dto.GoalRequest;
import vn.mystudy.study.dto.StudyGoalResponse;
import vn.mystudy.study.entity.GoalSubject;
import vn.mystudy.study.entity.StudyGoal;
import vn.mystudy.study.entity.StudyPlan;
import vn.mystudy.study.entity.StudyTask;
import vn.mystudy.study.entity.Topic;
import vn.mystudy.study.mapper.StudyMapper;
import vn.mystudy.study.repository.StudyGoalRepository;
import vn.mystudy.study.repository.StudyPlanRepository;
import vn.mystudy.study.repository.StudyTaskRepository;
import vn.mystudy.study.repository.TopicRepository;
import vn.mystudy.study.scheduling.StudyScheduler;
import vn.mystudy.study.scheduling.StudyScheduler.RetainedTask;
import vn.mystudy.study.scheduling.StudyScheduler.ScheduledTask;
import vn.mystudy.study.scheduling.StudyScheduler.TopicRef;

@Service
class StudyGoalServiceImpl implements StudyGoalService {

    private static final Logger log = LoggerFactory.getLogger(StudyGoalServiceImpl.class);

    private final ProfileRepository profiles;
    private final StudyGoalRepository goals;
    private final StudyPlanRepository plans;
    private final StudyTaskRepository tasks;
    private final TopicRepository topics;
    private final StudyScheduler scheduler;
    private final GoalValidator validator;
    private final StudyMapper mapper;
    private final VietnamClock clock;
    private final TopicMasteryService mastery;

    StudyGoalServiceImpl(ProfileRepository profiles, StudyGoalRepository goals, StudyPlanRepository plans,
            StudyTaskRepository tasks, TopicRepository topics, StudyScheduler scheduler, GoalValidator validator,
            StudyMapper mapper, VietnamClock clock, TopicMasteryService mastery) {
        this.profiles = profiles;
        this.goals = goals;
        this.plans = plans;
        this.tasks = tasks;
        this.topics = topics;
        this.scheduler = scheduler;
        this.validator = validator;
        this.mapper = mapper;
        this.clock = clock;
        this.mastery = mastery;
    }

    @Override
    @Transactional(readOnly = true)
    public StudyGoalResponse getCurrent(UUID profileId) {
        return plans.findByProfileIdAndSupersededAtIsNull(profileId)
                .flatMap(plan -> goals.findById(plan.getGoalId())
                        .map(goal -> new StudyGoalResponse(mapper.toResponse(goal), mapper.toResponse(plan))))
                .orElseGet(StudyGoalResponse::empty);
    }

    @Override
    @Transactional
    public StudyGoalResponse save(UUID profileId, GoalRequest request) {
        Map<String, String> errors = validator.validate(request);
        if (!errors.isEmpty()) throw BusinessException.validation(errors);

        // Tuần tự hóa các lần lưu của cùng tài khoản để chỉ còn một lộ trình hiện hành.
        profiles.lockById(profileId).orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHENTICATED));

        LocalDate startsOn = clock.today();
        Instant now = clock.now();

        Optional<StudyPlan> previous = plans.findByProfileIdAndSupersededAtIsNull(profileId);
        previous.ifPresent(plan -> plan.supersede(now));
        plans.flush();
        String strategy = request.strategy() != null ? request.strategy()
                : previous.map(StudyPlan::getStrategy).orElse(StudyCatalog.DEFAULT_STRATEGY);

        tasks.cancelPendingFrom(profileId, startsOn, now);

        List<String> codes = new ArrayList<>(StudyCatalog.REQUIRED);
        codes.addAll(request.electiveCodes());
        Set<Integer> days = new HashSet<>();
        request.days().forEach(d -> days.add(d.intValue()));
        StudyGoal goal = goals.saveAndFlush(new StudyGoal(profileId, request.purpose(), request.months().intValue(),
                request.dailyMinutes().intValue(), subjectsOf(request, codes), days));

        StudyPlan plan = plans.saveAndFlush(new StudyPlan(profileId, goal.getId(), strategy, startsOn));

        List<Topic> curriculum = topics.findCurriculum(codes);
        Map<UUID, Topic> topicById = curriculum.stream().collect(Collectors.toMap(Topic::getId, Function.identity()));
        List<RetainedTask> retained = tasks.findCompletedFrom(profileId, startsOn).stream()
                .map(t -> new RetainedTask(t.getScheduledOn(), t.getPosition(), t.getPlannedMinutes())).toList();
        Map<String, Double> scores = codes.stream()
                .collect(Collectors.toMap(Function.identity(), c -> request.scores().get(c).doubleValue()));
        Map<String, Double> currentScores = currentScoresOf(request, codes);
        // Chuyên đề làm sai nhiều trong các lượt thi gần đây được xếp ôn thường xuyên hơn (lộ trình thích ứng).
        Map<UUID, Integer> topicWeights = mastery.scheduleWeights(profileId);
        List<ScheduledTask> schedule = scheduler.schedule(
                new StudyScheduler.Goal(request.purpose(), request.electiveCodes(), scores, currentScores,
                        goal.getMonths(), goal.getDailyMinutes(), days, topicWeights),
                curriculum.stream().map(t -> new TopicRef(t.getId(), t.getSubjectCode(), t.getName())).toList(),
                retained, startsOn, strategy);

        tasks.saveAll(schedule.stream().map(s -> new StudyTask(plan.getId(), profileId, goal.getId(), s.subjectCode(),
                topicById.get(s.topicId()), s.date(), s.position(), s.minutes(), s.content())).toList());
        log.info("Study plan created tasks={} strategy={} months={}", schedule.size(), strategy, goal.getMonths());
        return new StudyGoalResponse(mapper.toResponse(goal), mapper.toResponse(plan));
    }

    private static Map<String, Double> currentScoresOf(GoalRequest request, List<String> codes) {
        Map<String, Double> result = new HashMap<>();
        if (request.currentScores() == null) return result;
        for (String code : codes) {
            Number value = request.currentScores().get(code);
            if (value != null) result.put(code, value.doubleValue());
        }
        return result;
    }

    private static Set<GoalSubject> subjectsOf(GoalRequest request, List<String> codes) {
        Set<GoalSubject> subjects = new HashSet<>();
        Map<String, Double> current = currentScoresOf(request, codes);
        for (String code : codes) {
            int electiveIndex = request.electiveCodes().indexOf(code);
            subjects.add(new GoalSubject(code, BigDecimal.valueOf(request.scores().get(code).doubleValue()),
                    current.containsKey(code) ? BigDecimal.valueOf(current.get(code)) : null,
                    electiveIndex < 0 ? null : electiveIndex + 1));
        }
        return subjects;
    }

    @Override
    @Transactional
    public StudyGoalResponse rebuild(UUID profileId) {
        StudyGoalResponse current = getCurrent(profileId);
        if (current.goal() == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Hãy thiết lập mục tiêu trước khi cập nhật lộ trình.");
        }
        var goal = current.goal();
        Map<String, Number> scores = new HashMap<>(goal.scores());
        Map<String, Number> currentScores = new HashMap<>(goal.currentScores());
        List<Number> days = new ArrayList<>(goal.days());
        return save(profileId, new GoalRequest(goal.purpose(), goal.electiveCodes(), scores, currentScores,
                goal.months(), goal.dailyMinutes(), days, current.plan().strategy()));
    }
}
