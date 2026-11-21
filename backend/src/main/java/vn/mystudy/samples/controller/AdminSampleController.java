package vn.mystudy.samples.controller;

import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.mystudy.common.api.ApiResponse;
import vn.mystudy.samples.dto.CreateSampleRequest;
import vn.mystudy.samples.dto.SampleResponse;
import vn.mystudy.samples.service.AdminSampleService;

@RestController
@RequestMapping("/api/admin/samples")
public class AdminSampleController {

    private final AdminSampleService service;

    public AdminSampleController(AdminSampleService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SampleResponse>> create(@Valid @RequestBody CreateSampleRequest request) {
        SampleResponse created = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Tạo bài mẫu thành công.", created));
    }

    @PutMapping("/{id}")
    public ApiResponse<SampleResponse> update(@PathVariable UUID id,
            @Valid @RequestBody CreateSampleRequest request) {
        SampleResponse updated = service.update(id, request);
        return ApiResponse.ok("Cập nhật bài mẫu thành công.", updated);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ApiResponse.ok("Xóa bài mẫu thành công.", null);
    }
}
