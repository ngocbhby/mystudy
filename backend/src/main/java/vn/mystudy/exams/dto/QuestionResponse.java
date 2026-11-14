package vn.mystudy.exams.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

/** {@code correctOption} chỉ có mặt khi người dùng yêu cầu xem đáp án. */
public record QuestionResponse(
        int number,
        String prompt,
        List<OptionResponse> options,
        @JsonInclude(JsonInclude.Include.NON_NULL) Integer correctOption) {
}
