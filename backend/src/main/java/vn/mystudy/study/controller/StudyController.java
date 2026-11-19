package vn.mystudy.study.controller;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.mystudy.common.api.ApiResponse;
import vn.mystudy.security.ProfilePrincipal;
import vn.mystudy.study.dto.CompleteTaskRequest;
import vn.mystudy.study.dto.GoalRequest;
import vn.mystudy.study.dto.OverviewResponse;
import vn.mystudy.study.dto.StudyGoalResponse;
import vn.mystudy.study.dto.TaskListResponse;
import vn.mystudy.study.service.StudyGoalService;
import vn.mystudy.study.service.StudyTaskService;

@RestController
@RequestMapping("/api/study")
class StudyController {

    private final StudyGoalService goalService;
    private final StudyTaskService taskService;

    StudyController(StudyGoalService goalService, StudyTaskService taskService) {
        this.goalService = goalService;
        this.taskService = taskService;
    }

    @GetMapping("/goal")
    ApiResponse<StudyGoalResponse> goal(@AuthenticationPrincipal ProfilePrincipal user) {
        return ApiResponse.ok(goalService.getCurrent(user.profileId()));
    }

    @PostMapping("/goal")
    ResponseEntity<ApiResponse<StudyGoalResponse>> saveGoal(@AuthenticationPrincipal ProfilePrincipal user,
            @RequestBody GoalRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Đã lưu mục tiêu và tạo lộ trình.", goalService.save(user.profileId(), request)));
    }

    @PostMapping("/plan/rebuild")
    ApiResponse<StudyGoalResponse> rebuildPlan(@AuthenticationPrincipal ProfilePrincipal user) {
        return ApiResponse.ok("Đã cập nhật lộ trình theo kết quả thi gần đây.", goalService.rebuild(user.profileId()));
    }

    @GetMapping("/overview")
    ApiResponse<OverviewResponse> overview(@AuthenticationPrincipal ProfilePrincipal user) {
        return ApiResponse.ok(taskService.overview(user.profileId()));
    }

    @GetMapping("/tasks")
    ApiResponse<TaskListResponse> tasks(@AuthenticationPrincipal ProfilePrincipal user,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ApiResponse.ok(new TaskListResponse(taskService.list(user.profileId(), from, to)));
    }

    @PostMapping("/tasks")
    ApiResponse<Void> complete(@AuthenticationPrincipal ProfilePrincipal user,
            @Valid @RequestBody CompleteTaskRequest request) {
        taskService.complete(user.profileId(), request.id());
        return ApiResponse.ok("Đã đánh dấu đã học.", null);
    }

    @PostMapping("/tasks/uncomplete")
    ApiResponse<Void> uncompletePost(@AuthenticationPrincipal ProfilePrincipal user,
            @Valid @RequestBody CompleteTaskRequest request) {
        taskService.uncomplete(user.profileId(), request.id());
        return ApiResponse.ok("Đã hủy đánh dấu đã học.", null);
    }

    @DeleteMapping("/tasks/{id}")
    ApiResponse<Void> uncomplete(@AuthenticationPrincipal ProfilePrincipal user, @PathVariable UUID id) {
        taskService.uncomplete(user.profileId(), id);
        return ApiResponse.ok("Đã hủy đánh dấu đã học.", null);
    }
}
