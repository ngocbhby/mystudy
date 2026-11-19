package vn.mystudy.study.mapper;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;
import vn.mystudy.study.StudyCatalog;
import vn.mystudy.study.dto.GoalResponse;
import vn.mystudy.study.dto.PlanResponse;
import vn.mystudy.study.dto.TaskResponse;
import vn.mystudy.study.entity.GoalSubject;
import vn.mystudy.study.entity.StudyGoal;
import vn.mystudy.study.entity.StudyPlan;
import vn.mystudy.study.entity.StudyTask;

@Component
public class StudyMapper {

    public GoalResponse toResponse(StudyGoal goal) {
        List<String> electives = goal.getSubjects().stream()
                .filter(s -> !StudyCatalog.REQUIRED.contains(s.subjectCode()))
                .sorted(Comparator.comparing(GoalSubject::electiveOrder, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(GoalSubject::subjectCode))
                .map(GoalSubject::subjectCode)
                .toList();
        Map<String, Double> scores = goal.getSubjects().stream()
                .collect(Collectors.toMap(GoalSubject::subjectCode, s -> s.targetScore().doubleValue()));
        Map<String, Double> currentScores = goal.getSubjects().stream()
                .filter(s -> s.currentScore() != null)
                .collect(Collectors.toMap(GoalSubject::subjectCode, s -> s.currentScore().doubleValue()));
        return new GoalResponse(goal.getPurpose(), electives, scores, currentScores, goal.getMonths(),
                goal.getDailyMinutes(),
                goal.getDays().stream().sorted().toList());
    }

    public PlanResponse toResponse(StudyPlan plan) {
        return new PlanResponse(plan.getId(), plan.getStartsOn().toString(), plan.getStrategy());
    }

    public TaskResponse toResponse(StudyTask task) {
        return new TaskResponse(task.getId(), task.getSubjectCode(), task.getTopic().getId(), task.getTopic().getName(),
                task.getScheduledOn().toString(), task.getPlannedMinutes(), task.getLearningContent(),
                task.isCompleted());
    }

    public List<TaskResponse> toTaskResponses(List<StudyTask> tasks) {
        return tasks.stream().map(this::toResponse).toList();
    }

}
