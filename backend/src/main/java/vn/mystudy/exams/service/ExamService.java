package vn.mystudy.exams.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import vn.mystudy.exams.dto.AttemptDetailResponse;
import vn.mystudy.exams.dto.AttemptSummaryResponse;
import vn.mystudy.exams.dto.ExamDetailResponse;
import vn.mystudy.exams.dto.ExamListResponse;
import vn.mystudy.exams.dto.SubmitAttemptRequest;

public interface ExamService {

    /** Liệt kê đề theo bộ lọc tùy chọn (mã môn, năm); đề trực tuyến xếp trước. */
    ExamListResponse list(String subject, String year);

    /** Chi tiết đề trực tuyến; {@code includeAnswers} kèm khóa đáp án và lời giải. */
    ExamDetailResponse detail(UUID examId, boolean includeAnswers);

    /** Nộp bài làm thi thử, chấm điểm và lưu kết quả. */
    AttemptDetailResponse submitAttempt(UUID examId, SubmitAttemptRequest request, UUID profileId);

    /** Lấy kết quả bài thi gần nhất của người dùng cho đề thi này. */
    Optional<AttemptDetailResponse> getLatestAttempt(UUID examId, UUID profileId);

    /** Xem chi tiết một bài làm thi thử cụ thể. */
    AttemptDetailResponse getAttempt(UUID examId, UUID attemptId, UUID profileId);

    /** Danh sách lịch sử các lần thi thử đề này của người dùng. */
    List<AttemptSummaryResponse> listAttempts(UUID examId, UUID profileId);
}
