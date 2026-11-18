package vn.mystudy.exams.dto;

import java.util.Map;

/** Đáp án theo số câu → số thứ tự lựa chọn. Thời gian làm bài do máy chủ tự tính, không nhận từ trình duyệt. */
public record SubmitAttemptRequest(Map<Integer, Integer> answers) {
}
