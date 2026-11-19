package vn.mystudy.exams.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.time.Year;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import vn.mystudy.common.api.ErrorCode;
import vn.mystudy.common.exception.BusinessException;
import vn.mystudy.exams.dto.CreateExamRequest;
import vn.mystudy.exams.dto.ExamSummaryResponse;
import vn.mystudy.exams.entity.Exam;
import vn.mystudy.exams.entity.ExamAnswerKey;
import vn.mystudy.exams.entity.ExamOption;
import vn.mystudy.exams.entity.ExamQuestion;
import vn.mystudy.exams.entity.ExamVersion;
import vn.mystudy.exams.entity.OptionId;
import vn.mystudy.exams.entity.QuestionId;
import vn.mystudy.exams.entity.UploadedDocument;
import vn.mystudy.exams.mapper.ExamMapper;
import vn.mystudy.exams.repository.ExamAnswerKeyRepository;
import vn.mystudy.exams.repository.ExamOptionRepository;
import vn.mystudy.exams.repository.ExamQuestionRepository;
import vn.mystudy.exams.repository.ExamRepository;
import vn.mystudy.exams.repository.ExamVersionRepository;
import vn.mystudy.exams.repository.UploadedDocumentRepository;
import vn.mystudy.study.StudyCatalog;

@Service
@Transactional
class AdminExamServiceImpl implements AdminExamService {

    private final ExamRepository exams;
    private final ExamVersionRepository versions;
    private final ExamQuestionRepository questions;
    private final ExamOptionRepository options;
    private final ExamAnswerKeyRepository answerKeys;
    private final UploadedDocumentRepository uploadedDocuments;
    private final ExamService examService;
    private final ExamMapper mapper;

    AdminExamServiceImpl(ExamRepository exams, ExamVersionRepository versions, ExamQuestionRepository questions,
            ExamOptionRepository options, ExamAnswerKeyRepository answerKeys,
            UploadedDocumentRepository uploadedDocuments, ExamService examService,
            ExamMapper mapper) {
        this.exams = exams;
        this.versions = versions;
        this.questions = questions;
        this.options = options;
        this.answerKeys = answerKeys;
        this.uploadedDocuments = uploadedDocuments;
        this.examService = examService;
        this.mapper = mapper;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExamSummaryResponse> listAllExams() {
        return examService.list(null, null).exams();
    }

    @Override
    public ExamSummaryResponse createExam(CreateExamRequest request) {
        String subject = request.subjectCode().trim().toLowerCase();
        if (!StudyCatalog.SUBJECTS.containsKey(subject)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Mã môn học không hợp lệ: " + subject);
        }

        String kind = request.kind().trim();
        if (!"past_paper".equals(kind) && !"mystudy_practice".equals(kind)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Loại đề thi không hợp lệ: " + kind);
        }

        UUID examId = UUID.randomUUID();
        int year = request.examYear() != null ? request.examYear() : Year.now().getValue();
        String source = request.sourceName() != null && !request.sourceName().isBlank()
                ? request.sourceName().trim()
                : ("mystudy_practice".equals(kind) ? "MyStudy biên soạn" : "Bộ GD&ĐT");

        if ("past_paper".equals(kind)) {
            if (request.paperUrl() == null || request.paperUrl().isBlank()) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "Đề tải về cần có đường dẫn file đề thi (PDF).");
            }
            String paperUrl = request.paperUrl().trim();
            String answerUrl = request.answerGuideUrl() != null && !request.answerGuideUrl().isBlank()
                    ? request.answerGuideUrl().trim()
                    : paperUrl;

            Exam exam = new Exam(examId, subject, request.title().trim(), kind, year,
                    request.durationMinutes(), source, paperUrl, answerUrl);
            exams.save(exam);
            return mapper.toSummary(exam, 0);
        }

        // mystudy_practice:
        List<CreateExamRequest.CreateQuestionRequest> qs = request.questions();
        if (qs == null || qs.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Đề thi trực tuyến cần ít nhất 1 câu hỏi.");
        }

        String paperUrl = "/thi-thu/" + examId + "/de";
        String answerUrl = "/thi-thu/" + examId + "/dap-an";

        Exam exam = new Exam(examId, subject, request.title().trim(), kind, year,
                request.durationMinutes(), source, paperUrl, answerUrl);
        exams.save(exam);

        UUID versionId = UUID.randomUUID();
        ExamVersion version = new ExamVersion(versionId, examId, 1, Instant.now());
        versions.save(version);

        for (int i = 0; i < qs.size(); i++) {
            int qNum = i + 1;
            CreateExamRequest.CreateQuestionRequest q = qs.get(i);
            if (q.prompt() == null || q.prompt().isBlank()) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "Nội dung câu " + qNum + " không được để trống.");
            }
            String explanation = q.explanation() != null && !q.explanation().isBlank() ? q.explanation().trim() : null;
            questions.save(new ExamQuestion(new QuestionId(versionId, qNum), q.prompt().trim(), explanation, q.topicId()));

            List<String> opts = q.options();
            if (opts == null || opts.size() < 2) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "Câu " + qNum + " cần ít nhất 2 đáp án lựa chọn.");
            }
            for (int j = 0; j < opts.size(); j++) {
                int optNum = j + 1;
                options.save(new ExamOption(new OptionId(versionId, qNum, optNum), opts.get(j).trim()));
            }

            int correctOpt = q.correctOptionNumber() >= 1 && q.correctOptionNumber() <= opts.size()
                    ? q.correctOptionNumber()
                    : 1;
            answerKeys.save(new ExamAnswerKey(new QuestionId(versionId, qNum), correctOpt));
        }

        return mapper.toSummary(exam, qs.size());
    }

    @Override
    public ExamSummaryResponse updateExam(UUID examId, vn.mystudy.exams.dto.UpdateExamRequest request) {
        Exam exam = exams.findById(examId)
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy đề thi cần cập nhật."));

        if (request.subjectCode() != null && !request.subjectCode().isBlank()) {
            String subject = request.subjectCode().trim().toLowerCase();
            if (!StudyCatalog.SUBJECTS.containsKey(subject)) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "Mã môn học không hợp lệ: " + subject);
            }
        }

        exam.update(
                request.title(),
                request.subjectCode(),
                request.examYear(),
                request.durationMinutes(),
                request.sourceName(),
                request.paperUrl(),
                request.answerGuideUrl()
        );

        exams.save(exam);

        int qCount = 0;
        List<ExamVersion> vList = versions.findByExamId(examId);
        if (!vList.isEmpty()) {
            qCount = questions.findByIdVersionIdOrderByIdQuestionNumber(vList.get(0).getId()).size();
        }
        return mapper.toSummary(exam, qCount);
    }

    @Override
    public void deleteExam(UUID examId) {
        Exam exam = exams.findById(examId)
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy đề thi cần xóa."));
        List<ExamVersion> vList = versions.findByExamId(examId);
        for (ExamVersion v : vList) {
            answerKeys.deleteByIdVersionId(v.getId());
            options.deleteByIdVersionId(v.getId());
            questions.deleteByIdVersionId(v.getId());
        }
        versions.deleteAll(vList);
        exams.delete(exam);
    }

    @Override
    public String uploadPdf(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Vui lòng chọn file tải lên.");
        }
        String originalName = Objects.requireNonNullElse(file.getOriginalFilename(), "de-thi.pdf");
        if (!originalName.toLowerCase().endsWith(".pdf")) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Hệ thống chỉ chấp nhận file định dạng .pdf.");
        }
        try {
            byte[] bytes = file.getBytes();
            // Kiểm tra chữ ký thật của file thay vì tin đuôi .pdf hay Content-Type do trình duyệt gửi.
            if (!isPdf(bytes)) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "File tải lên không phải PDF hợp lệ.");
            }
            UploadedDocument doc = new UploadedDocument(originalName, "application/pdf", bytes.length, bytes);
            doc = uploadedDocuments.saveAndFlush(doc);
            return "/api/documents/" + doc.getId();
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Không thể lưu file tải lên: " + e.getMessage());
        }
    }

    static boolean isPdf(byte[] bytes) {
        return bytes != null && bytes.length >= 5 && bytes[0] == '%' && bytes[1] == 'P' && bytes[2] == 'D'
                && bytes[3] == 'F' && bytes[4] == '-';
    }
}
