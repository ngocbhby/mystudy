package vn.mystudy.exams.service;

import java.util.UUID;
import vn.mystudy.exams.dto.ExamDetailResponse;
import vn.mystudy.exams.dto.ExamListResponse;

public interface ExamService {

    /** Liệt kê đề theo bộ lọc tùy chọn (mã môn, năm); đề trực tuyến xếp trước. */
    ExamListResponse list(String subject, String year);

    /** Chi tiết đề trực tuyến; {@code includeAnswers} kèm khóa đáp án. */
    ExamDetailResponse detail(UUID examId, boolean includeAnswers);
}
