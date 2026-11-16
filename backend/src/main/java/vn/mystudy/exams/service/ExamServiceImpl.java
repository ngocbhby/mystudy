package vn.mystudy.exams.service;

import java.time.Instant;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.mystudy.common.api.ErrorCode;
import vn.mystudy.common.exception.BusinessException;
import vn.mystudy.exams.dto.ExamDetailResponse;
import vn.mystudy.exams.dto.ExamListResponse;
import vn.mystudy.exams.dto.ExamSummaryResponse;
import vn.mystudy.exams.dto.OptionResponse;
import vn.mystudy.exams.dto.QuestionResponse;
import vn.mystudy.exams.entity.Exam;
import vn.mystudy.exams.entity.ExamAnswerKey;
import vn.mystudy.exams.entity.ExamOption;
import vn.mystudy.exams.entity.ExamVersion;
import vn.mystudy.exams.mapper.ExamMapper;
import vn.mystudy.exams.repository.ExamAnswerKeyRepository;
import vn.mystudy.exams.repository.ExamOptionRepository;
import vn.mystudy.exams.repository.ExamQuestionRepository;
import vn.mystudy.exams.repository.ExamRepository;
import vn.mystudy.exams.repository.ExamVersionRepository;
import vn.mystudy.exams.repository.VersionQuestionCount;
import vn.mystudy.study.StudyCatalog;

@Service
@Transactional(readOnly = true)
class ExamServiceImpl implements ExamService {

    private static final List<String> SUBJECT_ORDER = List.of("math", "literature");

    private final ExamRepository exams;
    private final ExamVersionRepository versions;
    private final ExamQuestionRepository questions;
    private final ExamOptionRepository options;
    private final ExamAnswerKeyRepository answerKeys;
    private final ExamMapper mapper;

    ExamServiceImpl(ExamRepository exams, ExamVersionRepository versions, ExamQuestionRepository questions,
            ExamOptionRepository options, ExamAnswerKeyRepository answerKeys, ExamMapper mapper) {
        this.exams = exams;
        this.versions = versions;
        this.questions = questions;
        this.options = options;
        this.answerKeys = answerKeys;
        this.mapper = mapper;
    }

    @Override
    public ExamListResponse list(String subject, String year) {
        boolean validSubject = subject == null || subject.isBlank() || StudyCatalog.SUBJECTS.containsKey(subject);
        boolean validYear = year == null || year.isBlank() || year.matches("\\d{4}");
        if (!validSubject || !validYear) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Bộ lọc đề thi không hợp lệ.");
        }

        Specification<Exam> filter = (root, query, cb) -> cb.conjunction();
        if (subject != null && !subject.isBlank()) {
            filter = filter.and((root, query, cb) -> cb.equal(root.get("subjectCode"), subject));
        }
        if (year != null && !year.isBlank()) {
            int value = Integer.parseInt(year);
            filter = filter.and((root, query, cb) -> cb.equal(root.get("examYear"), value));
        }

        Map<UUID, Integer> counts = questionCounts(Instant.now());
        List<ExamSummaryResponse> result = exams.findAll(filter).stream()
                .map(exam -> mapper.toSummary(exam, counts.getOrDefault(exam.getId(), 0)))
                .sorted(EXAM_ORDER)
                .toList();

        List<String> subjects = exams.findDistinctSubjectCodes();
        List<Integer> years = exams.findDistinctExamYears();
        return new ExamListResponse(result, subjects, years);
    }

    @Override
    public ExamDetailResponse detail(UUID examId, boolean includeAnswers) {
        Exam exam = exams.findById(examId).orElseThrow(ExamServiceImpl::notFound);
        ExamVersion version = latestPublished(examId);
        List<QuestionResponse> content = questionsOf(version.getId(), includeAnswers);
        if (content.isEmpty()) throw notFound();
        return new ExamDetailResponse(mapper.toSummary(exam, content.size()), content);
    }

    private ExamVersion latestPublished(UUID examId) {
        return versions.findFirstByExamIdAndPublishedAtLessThanEqualOrderByVersionNumberDesc(examId, Instant.now())
                .orElseThrow(ExamServiceImpl::notFound);
    }

    private List<QuestionResponse> questionsOf(UUID versionId, boolean includeAnswers) {
        Map<Integer, List<OptionResponse>> optionsByQuestion = options
                .findByIdVersionIdOrderByIdQuestionNumberAscIdOptionNumberAsc(versionId).stream()
                .collect(Collectors.groupingBy(o -> o.getId().questionNumber(),
                        Collectors.mapping(ExamServiceImpl::toOption, Collectors.toList())));
        Map<Integer, Integer> keys = includeAnswers
                ? answerKeys.findByIdVersionId(versionId).stream().collect(
                        Collectors.toMap(k -> k.getId().questionNumber(), ExamAnswerKey::getCorrectOptionNumber))
                : Map.of();
        return questions.findByIdVersionIdOrderByIdQuestionNumber(versionId).stream()
                .map(q -> new QuestionResponse(q.getId().questionNumber(), q.getPrompt(),
                        optionsByQuestion.getOrDefault(q.getId().questionNumber(), List.of()),
                        keys.get(q.getId().questionNumber())))
                .toList();
    }

    /** Số câu hỏi của phiên bản mới nhất đã công bố theo từng đề. */
    private Map<UUID, Integer> questionCounts(Instant now) {
        Map<UUID, ExamVersion> latest = new HashMap<>();
        for (ExamVersion version : versions.findByPublishedAtLessThanEqual(now)) {
            latest.merge(version.getExamId(), version,
                    (a, b) -> a.getVersionNumber() >= b.getVersionNumber() ? a : b);
        }
        if (latest.isEmpty()) return Map.of();
        Map<UUID, Long> byVersion = questions.countByVersion(latest.values().stream().map(ExamVersion::getId).toList())
                .stream().collect(Collectors.toMap(VersionQuestionCount::versionId, VersionQuestionCount::count));
        Map<UUID, Integer> result = new HashMap<>();
        latest.forEach((examId, version) -> result.put(examId, byVersion.getOrDefault(version.getId(), 0L).intValue()));
        return result;
    }

    private static OptionResponse toOption(ExamOption option) {
        return new OptionResponse(option.getId().optionNumber(), option.getContent());
    }

    private static BusinessException notFound() {
        return BusinessException.notFound("Không tìm thấy đề thi trực tuyến.");
    }

    private static final Comparator<ExamSummaryResponse> EXAM_ORDER = Comparator
            .comparing((ExamSummaryResponse e) -> e.questionCount() > 0 ? 0 : 1)
            .thenComparing(ExamSummaryResponse::year, Comparator.nullsLast(Comparator.reverseOrder()))
            .thenComparingInt(e -> {
                int index = SUBJECT_ORDER.indexOf(e.subjectCode());
                return index < 0 ? SUBJECT_ORDER.size() : index;
            })
            .thenComparing(ExamSummaryResponse::title)
            .thenComparing(e -> e.id().toString());
}
