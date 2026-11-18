package vn.mystudy.ai;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.mystudy.common.api.ApiResponse;
import vn.mystudy.security.ProfilePrincipal;

/** API các tính năng AI; yêu cầu đăng nhập (giới hạn lượt gọi theo tài khoản). */
@RestController
@RequestMapping("/api/ai")
class AiController {

    record Status(boolean enabled, int remainingToday, int dailyLimit) {
    }

    record ExplainRequest(@NotNull UUID examId, @NotNull UUID attemptId, @Min(1) int questionNumber) {
    }

    private final AiGateway ai;
    private final AiQuotaService quota;
    private final ExplanationService explanations;
    private final TopicNoteService notes;
    private final WeaknessService weakness;

    AiController(AiGateway ai, AiQuotaService quota, ExplanationService explanations, TopicNoteService notes,
            WeaknessService weakness) {
        this.ai = ai;
        this.quota = quota;
        this.explanations = explanations;
        this.notes = notes;
        this.weakness = weakness;
    }

    @GetMapping("/status")
    ApiResponse<Status> status(@AuthenticationPrincipal ProfilePrincipal user) {
        return ApiResponse.ok(new Status(ai.enabled(), quota.remaining(user.profileId()), quota.dailyLimit()));
    }

    @PostMapping("/explanations")
    ApiResponse<ExplanationService.Result> explain(@AuthenticationPrincipal ProfilePrincipal user,
            @Valid @RequestBody ExplainRequest request) {
        return ApiResponse.ok(explanations.explain(user.profileId(), request.examId(), request.attemptId(),
                request.questionNumber()));
    }

    @PostMapping("/explanations/report")
    ApiResponse<Void> report(@AuthenticationPrincipal ProfilePrincipal user,
            @Valid @RequestBody ExplainRequest request) {
        explanations.report(user.profileId(), request.examId(), request.attemptId(), request.questionNumber());
        return ApiResponse.ok("Cảm ơn bạn đã báo lỗi. Chúng tôi sẽ xem xét lời giải thích này.", null);
    }

    @PostMapping("/topics/{topicId}/note")
    ApiResponse<TopicNoteService.TopicNote> generateNote(@AuthenticationPrincipal ProfilePrincipal user,
            @PathVariable UUID topicId) {
        return ApiResponse.ok(notes.generate(user.profileId(), topicId));
    }

    @GetMapping("/weakness")
    ApiResponse<WeaknessService.Analysis> weakness(@AuthenticationPrincipal ProfilePrincipal user) {
        return ApiResponse.ok(weakness.analysis(user.profileId()));
    }

    @PostMapping("/weakness/report")
    ApiResponse<WeaknessService.Analysis> generateReport(@AuthenticationPrincipal ProfilePrincipal user) {
        return ApiResponse.ok(weakness.generateReport(user.profileId()));
    }
}
