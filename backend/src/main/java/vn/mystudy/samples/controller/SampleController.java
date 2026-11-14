package vn.mystudy.samples.controller;

import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.mystudy.common.api.ApiResponse;
import vn.mystudy.samples.dto.SampleListResponse;
import vn.mystudy.samples.service.SampleService;

@RestController
@RequestMapping("/api/samples")
class SampleController {

    private final SampleService service;

    SampleController(SampleService service) {
        this.service = service;
    }

    @GetMapping
    ApiResponse<SampleListResponse> list(@RequestParam(required = false) String subject,
            @RequestParam(required = false) UUID topic) {
        return ApiResponse.ok(service.list(subject, topic));
    }
}
