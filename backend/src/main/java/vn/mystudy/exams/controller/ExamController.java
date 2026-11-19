package vn.mystudy.exams.controller;

import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.mystudy.common.api.ApiResponse;
import vn.mystudy.exams.dto.AttemptDetailResponse;
import vn.mystudy.exams.dto.AttemptSummaryResponse;
import vn.mystudy.exams.dto.ExamDetailResponse;
import vn.mystudy.exams.dto.ExamListResponse;
import vn.mystudy.exams.dto.StartAttemptResponse;
import vn.mystudy.exams.dto.SubmitAttemptRequest;
import vn.mystudy.exams.service.ExamService;
import vn.mystudy.security.ProfilePrincipal;

@RestController
@RequestMapping("/api/exams")
class ExamController {

    /** Token lượt thi của khách (không đăng nhập), cấp khi bắt đầu thi. */
    static final String ATTEMPT_TOKEN = "X-Attempt-Token";

    private final ExamService service;

    ExamController(ExamService service) {
        this.service = service;
    }

    @GetMapping
    ApiResponse<ExamListResponse> list(@RequestParam(required = false) String subject,
            @RequestParam(required = false) String year) {
        return ApiResponse.ok(service.list(subject, year));
    }

    @GetMapping("/{id}")
    ApiResponse<ExamDetailResponse> detail(@PathVariable UUID id) {
        return ApiResponse.ok(service.detail(id, false));
    }

    @GetMapping("/{id}/answers")
    ApiResponse<ExamDetailResponse> answers(@PathVariable UUID id) {
        return ApiResponse.ok(service.detail(id, true));
    }

    @PostMapping("/{id}/attempts/start")
    ApiResponse<StartAttemptResponse> startAttempt(
            @PathVariable UUID id,
            @AuthenticationPrincipal ProfilePrincipal user) {
        return ApiResponse.ok(service.startAttempt(id, user != null ? user.profileId() : null));
    }

    @PostMapping("/{id}/attempts/{attemptId}/submit")
    ApiResponse<AttemptDetailResponse> submitAttempt(
            @PathVariable UUID id,
            @PathVariable UUID attemptId,
            @RequestBody SubmitAttemptRequest request,
            @RequestHeader(value = ATTEMPT_TOKEN, required = false) String token,
            @AuthenticationPrincipal ProfilePrincipal user) {
        return ApiResponse.ok(service.submitAttempt(id, attemptId, request,
                user != null ? user.profileId() : null, token));
    }

    @GetMapping("/{id}/attempts/latest")
    ApiResponse<AttemptDetailResponse> latestAttempt(
            @PathVariable UUID id,
            @AuthenticationPrincipal ProfilePrincipal user) {
        UUID profileId = user != null ? user.profileId() : null;
        return ApiResponse.ok(service.getLatestAttempt(id, profileId).orElse(null));
    }

    @GetMapping("/{id}/attempts")
    ApiResponse<List<AttemptSummaryResponse>> listAttempts(
            @PathVariable UUID id,
            @AuthenticationPrincipal ProfilePrincipal user) {
        UUID profileId = user != null ? user.profileId() : null;
        return ApiResponse.ok(service.listAttempts(id, profileId));
    }

    @GetMapping("/{id}/attempts/{attemptId}")
    ApiResponse<AttemptDetailResponse> getAttempt(
            @PathVariable UUID id,
            @PathVariable UUID attemptId,
            @RequestHeader(value = ATTEMPT_TOKEN, required = false) String token,
            @AuthenticationPrincipal ProfilePrincipal user) {
        UUID profileId = user != null ? user.profileId() : null;
        return ApiResponse.ok(service.getAttempt(id, attemptId, profileId, token));
    }
}
