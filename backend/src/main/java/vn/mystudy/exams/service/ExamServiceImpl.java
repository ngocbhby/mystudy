package vn.mystudy.exams.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.mystudy.common.api.ErrorCode;
import vn.mystudy.common.exception.BusinessException;
import vn.mystudy.exams.dto.AttemptDetailResponse;
import vn.mystudy.exams.dto.AttemptSummaryResponse;
import vn.mystudy.exams.dto.ExamDetailResponse;
import vn.mystudy.exams.dto.ExamListResponse;
import vn.mystudy.exams.dto.ExamSummaryResponse;
import vn.mystudy.exams.dto.OptionResponse;
import vn.mystudy.exams.dto.QuestionResponse;
import vn.mystudy.exams.dto.QuestionReviewResponse;
import vn.mystudy.exams.dto.SubmitAttemptRequest;
import vn.mystudy.exams.entity.Exam;
import vn.mystudy.exams.entity.ExamAnswerKey;
import vn.mystudy.exams.entity.ExamAttempt;
import vn.mystudy.exams.entity.ExamAttemptAnswer;
import vn.mystudy.exams.entity.ExamOption;
import vn.mystudy.exams.entity.ExamQuestion;
import vn.mystudy.exams.entity.ExamVersion;
import vn.mystudy.exams.mapper.ExamMapper;
import vn.mystudy.exams.repository.ExamAnswerKeyRepository;
import vn.mystudy.exams.repository.ExamAttemptAnswerRepository;
import vn.mystudy.exams.repository.ExamAttemptRepository;
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
    private final ExamAttemptRepository attempts;
    private final ExamAttemptAnswerRepository attemptAnswers;
    private final ExamMapper mapper;

    ExamServiceImpl(ExamRepository exams, ExamVersionRepository versions, ExamQuestionRepository questions,
            ExamOptionRepository options, ExamAnswerKeyRepository answerKeys,
            ExamAttemptRepository attempts, ExamAttemptAnswerRepository attemptAnswers,
            ExamMapper mapper) {
        this.exams = exams;
        this.versions = versions;
        this.questions = questions;
        this.options = options;
        this.answerKeys = answerKeys;
        this.attempts = attempts;
        this.attemptAnswers = attemptAnswers;
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

    @Override
    @Transactional
    public AttemptDetailResponse submitAttempt(UUID examId, SubmitAttemptRequest request, UUID profileId) {
        Exam exam = exams.findById(examId).orElseThrow(ExamServiceImpl::notFound);
        ExamVersion version = latestPublished(examId);
        UUID versionId = version.getId();

        List<ExamQuestion> qList = questions.findByIdVersionIdOrderByIdQuestionNumber(versionId);
        if (qList.isEmpty()) throw notFound();

        Map<Integer, Integer> keys = answerKeys.findByIdVersionId(versionId).stream()
                .collect(Collectors.toMap(k -> k.getId().questionNumber(), ExamAnswerKey::getCorrectOptionNumber));
        Map<Integer, List<OptionResponse>> optionsByQuestion = options
                .findByIdVersionIdOrderByIdQuestionNumberAscIdOptionNumberAsc(versionId).stream()
                .collect(Collectors.groupingBy(o -> o.getId().questionNumber(),
                        Collectors.mapping(ExamServiceImpl::toOption, Collectors.toList())));

        Map<Integer, Integer> answers = request.answers() != null ? request.answers() : Map.of();
        int total = qList.size();
        int correct = 0;
        int incorrect = 0;
        int blank = 0;

        List<QuestionReviewResponse> reviews = new ArrayList<>();
        for (ExamQuestion q : qList) {
            int qNum = q.getId().questionNumber();
            int correctOpt = keys.getOrDefault(qNum, 1);
            Integer userOpt = answers.get(qNum);
            boolean isCorrect = userOpt != null && userOpt == correctOpt;
            if (userOpt == null) {
                blank++;
            } else if (isCorrect) {
                correct++;
            } else {
                incorrect++;
            }
            reviews.add(new QuestionReviewResponse(
                    qNum,
                    q.getPrompt(),
                    optionsByQuestion.getOrDefault(qNum, List.of()),
                    correctOpt,
                    userOpt,
                    isCorrect,
                    q.getExplanation()
            ));
        }

        BigDecimal score = BigDecimal.valueOf((correct * 10.0) / total).setScale(2, RoundingMode.HALF_UP);
        Instant now = Instant.now();
        int elapsed = Math.max(0, request.elapsedSeconds());
        Instant startedAt = now.minusSeconds(elapsed);
        UUID attemptId = UUID.randomUUID();

        ExamAttempt attempt = new ExamAttempt(
                attemptId, versionId, profileId, startedAt, null,
                total, now, "manual", correct, incorrect, blank, elapsed, score
        );
        attempts.save(attempt);

        for (Map.Entry<Integer, Integer> entry : answers.entrySet()) {
            if (entry.getValue() != null) {
                attemptAnswers.save(new ExamAttemptAnswer(
                        attemptId, versionId, entry.getKey(), entry.getValue()
                ));
            }
        }

        return new AttemptDetailResponse(
                attemptId, examId, score, correct, incorrect, blank,
                total, elapsed, now, answers, reviews
        );
    }

    @Override
    public Optional<AttemptDetailResponse> getLatestAttempt(UUID examId, UUID profileId) {
        if (profileId == null) return Optional.empty();
        ExamVersion version = latestPublished(examId);
        return attempts.findFirstByProfileIdAndVersionIdOrderBySubmittedAtDesc(profileId, version.getId())
                .map(attempt -> toDetailResponse(examId, version.getId(), attempt));
    }

    @Override
    public AttemptDetailResponse getAttempt(UUID examId, UUID attemptId, UUID profileId) {
        ExamAttempt attempt = attempts.findById(attemptId)
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy kết quả bài thi."));
        if (attempt.getProfileId() != null && profileId != null && !attempt.getProfileId().equals(profileId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Bạn không có quyền xem kết quả này.");
        }
        return toDetailResponse(examId, attempt.getVersionId(), attempt);
    }

    @Override
    public List<AttemptSummaryResponse> listAttempts(UUID examId, UUID profileId) {
        if (profileId == null) return List.of();
        ExamVersion version = latestPublished(examId);
        return attempts.findByProfileIdAndVersionIdOrderBySubmittedAtDesc(profileId, version.getId()).stream()
                .map(a -> new AttemptSummaryResponse(
                        a.getId(), examId, a.getScore(),
                        a.getCorrectCount() != null ? a.getCorrectCount() : 0,
                        a.getIncorrectCount() != null ? a.getIncorrectCount() : 0,
                        a.getBlankCount() != null ? a.getBlankCount() : 0,
                        a.getQuestionCount(),
                        a.getElapsedSeconds() != null ? a.getElapsedSeconds() : 0,
                        a.getSubmittedAt()
                ))
                .toList();
    }

    private AttemptDetailResponse toDetailResponse(UUID examId, UUID versionId, ExamAttempt attempt) {
        List<ExamQuestion> qList = questions.findByIdVersionIdOrderByIdQuestionNumber(versionId);
        Map<Integer, Integer> keys = answerKeys.findByIdVersionId(versionId).stream()
                .collect(Collectors.toMap(k -> k.getId().questionNumber(), ExamAnswerKey::getCorrectOptionNumber));
        Map<Integer, List<OptionResponse>> optionsByQuestion = options
                .findByIdVersionIdOrderByIdQuestionNumberAscIdOptionNumberAsc(versionId).stream()
                .collect(Collectors.groupingBy(o -> o.getId().questionNumber(),
                        Collectors.mapping(ExamServiceImpl::toOption, Collectors.toList())));
        Map<Integer, Integer> answers = attemptAnswers.findByIdAttemptIdOrderByIdQuestionNumberAsc(attempt.getId()).stream()
                .collect(Collectors.toMap(a -> a.getId().questionNumber(), ExamAttemptAnswer::getOptionNumber));

        List<QuestionReviewResponse> reviews = qList.stream().map(q -> {
            int qNum = q.getId().questionNumber();
            int correctOpt = keys.getOrDefault(qNum, 1);
            Integer userOpt = answers.get(qNum);
            boolean isCorrect = userOpt != null && userOpt == correctOpt;
            return new QuestionReviewResponse(
                    qNum,
                    q.getPrompt(),
                    optionsByQuestion.getOrDefault(qNum, List.of()),
                    correctOpt,
                    userOpt,
                    isCorrect,
                    q.getExplanation()
            );
        }).toList();

        return new AttemptDetailResponse(
                attempt.getId(),
                examId,
                attempt.getScore(),
                attempt.getCorrectCount() != null ? attempt.getCorrectCount() : 0,
                attempt.getIncorrectCount() != null ? attempt.getIncorrectCount() : 0,
                attempt.getBlankCount() != null ? attempt.getBlankCount() : 0,
                attempt.getQuestionCount(),
                attempt.getElapsedSeconds() != null ? attempt.getElapsedSeconds() : 0,
                attempt.getSubmittedAt(),
                answers,
                reviews
        );
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
                        keys.get(q.getId().questionNumber()),
                        includeAnswers ? q.getExplanation() : null))
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
