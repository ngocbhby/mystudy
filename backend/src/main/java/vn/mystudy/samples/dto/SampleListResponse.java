package vn.mystudy.samples.dto;

import java.util.List;

/** Bài mẫu đã lọc cùng các giá trị bộ lọc khả dụng (môn, chuyên đề). */
public record SampleListResponse(List<SampleResponse> samples, List<String> subjects, List<TopicOption> topics) {
}
