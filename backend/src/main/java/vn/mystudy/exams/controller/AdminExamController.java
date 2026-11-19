package vn.mystudy.exams.controller;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import vn.mystudy.common.api.ApiResponse;
import vn.mystudy.exams.dto.CreateExamRequest;
import vn.mystudy.exams.dto.ExamSummaryResponse;
import vn.mystudy.exams.service.AdminExamService;

@RestController
@RequestMapping("/api/admin/exams")
@PreAuthorize("hasRole('ADMIN')")
public class AdminExamController {

    private final AdminExamService service;

    public AdminExamController(AdminExamService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<List<ExamSummaryResponse>> list() {
        return ApiResponse.ok(service.listAllExams());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ExamSummaryResponse>> create(@Valid @RequestBody CreateExamRequest request) {
        ExamSummaryResponse created = service.createExam(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created));
    }

    @org.springframework.web.bind.annotation.PutMapping("/{id}")
    public ApiResponse<ExamSummaryResponse> update(@PathVariable UUID id, @Valid @RequestBody vn.mystudy.exams.dto.UpdateExamRequest request) {
        ExamSummaryResponse updated = service.updateExam(id, request);
        return ApiResponse.ok("Cập nhật đề thi thành công.", updated);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Map<String, Object>> delete(@PathVariable UUID id) {
        service.deleteExam(id);
        return ApiResponse.ok(Map.of("deleted", true, "id", id));
    }

    @PostMapping(value = "/upload-pdf", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Map<String, String>> uploadPdf(@RequestParam("file") MultipartFile file) {
        String url = service.uploadPdf(file);
        return ApiResponse.ok(Map.of("url", url));
    }
}
