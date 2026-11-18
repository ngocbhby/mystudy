package vn.mystudy.ai;

import com.fasterxml.jackson.annotation.JsonPropertyDescription;

/** Ghi chú kiến thức do AI soạn cho một chuyên đề. */
public record TopicNoteDraft(
        @JsonPropertyDescription("Nội dung Markdown: các mục '## Kiến thức trọng tâm', '## Công thức / ý chính', "
                + "'## Ví dụ minh họa', '## Lỗi thường gặp'. Công thức viết bằng LaTeX trong $...$")
        String markdown) {
}
