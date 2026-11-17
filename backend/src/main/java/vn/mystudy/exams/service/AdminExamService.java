package vn.mystudy.exams.service;

import java.util.List;
import java.util.UUID;
import org.springframework.web.multipart.MultipartFile;
import vn.mystudy.exams.dto.CreateExamRequest;
import vn.mystudy.exams.dto.ExamSummaryResponse;

public interface AdminExamService {

    List<ExamSummaryResponse> listAllExams();

    ExamSummaryResponse createExam(CreateExamRequest request);

    void deleteExam(UUID examId);

    String uploadPdf(MultipartFile file);
}
