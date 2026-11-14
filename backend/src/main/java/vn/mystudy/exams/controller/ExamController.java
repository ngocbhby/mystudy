package vn.mystudy.exams.controller;

import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.mystudy.common.api.ApiResponse;
import vn.mystudy.exams.dto.ExamDetailResponse;
import vn.mystudy.exams.dto.ExamListResponse;
import vn.mystudy.exams.service.ExamService;

@RestController
@RequestMapping("/api/exams")
class ExamController {

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
}
