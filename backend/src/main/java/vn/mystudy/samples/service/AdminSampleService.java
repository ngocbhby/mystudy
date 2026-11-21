package vn.mystudy.samples.service;

import java.util.UUID;
import vn.mystudy.samples.dto.CreateSampleRequest;
import vn.mystudy.samples.dto.SampleResponse;

public interface AdminSampleService {

    SampleResponse create(CreateSampleRequest request);

    SampleResponse update(UUID id, CreateSampleRequest request);

    void delete(UUID id);
}
