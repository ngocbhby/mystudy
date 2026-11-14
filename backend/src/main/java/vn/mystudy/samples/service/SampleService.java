package vn.mystudy.samples.service;

import java.util.UUID;
import vn.mystudy.samples.dto.SampleListResponse;

public interface SampleService {

    /** Liệt kê bài mẫu theo bộ lọc tùy chọn (mã môn, chuyên đề). */
    SampleListResponse list(String subject, UUID topicId);
}
