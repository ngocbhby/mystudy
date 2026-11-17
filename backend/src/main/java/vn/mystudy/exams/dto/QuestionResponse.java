package vn.mystudy.exams.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

/** {@code correctOption} và {@code explanation} chỉ có mặt khi người dùng yêu cầu xem đáp án hoặc kết quả. */
public record QuestionResponse(
        int number,
        String prompt,
        List<OptionResponse> options,
        @JsonInclude(JsonInclude.Include.NON_NULL) Integer correctOption,
        @JsonInclude(JsonInclude.Include.NON_NULL) String explanation) {
}
