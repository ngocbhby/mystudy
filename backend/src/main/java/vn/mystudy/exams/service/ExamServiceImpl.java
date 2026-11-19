package vn.mystudy.exams.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;
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
import vn.mystudy.exams.dto.StartAttemptResponse;
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
    /** Thời gian ân hạn cho độ trễ mạng khi tự nộp lúc hết giờ. */
    static final Duration SUBMIT_GRACE = Duration.ofSeconds(60);
    private static final SecureRandom RANDOM = new SecureRandom();

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
    public StartAttemptResponse startAttempt(UUID examId, UUID profileId) {
        Exam exam = exams.findById(examId).orElseThrow(ExamServiceImpl::notFound);
        ExamVersion version = latestPublished(examId);
        int total = questions.findByIdVersionIdOrderByIdQuestionNumber(version.getId()).size();
        if (total == 0) throw notFound();

        Instant now = Instant.now();
        Instant expiresAt = now.plus(Duration.ofMinutes(exam.getDurationMinutes()));
        String token = null;
        byte[] tokenHash = null;
        if (profileId == null) {
            // Khách: cấp token ngẫu nhiên, chỉ lưu hash để không ai đọc CSDL mà mạo danh được lượt thi.
            byte[] raw = new byte[32];
            RANDOM.nextBytes(raw);
            token = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
            tokenHash = sha256(token);
        }
        ExamAttempt attempt = attempts.save(
                ExamAttempt.start(UUID.randomUUID(), version.getId(), profileId, tokenHash, now, expiresAt, total));
        return new StartAttemptResponse(attempt.getId(), now, expiresAt, now, token);
    }

    @Override
    @Transactional
    public AttemptDetailResponse submitAttempt(UUID examId, UUID attemptId, SubmitAttemptRequest request,
            UUID profileId, String attemptToken) {
        ExamAttempt attempt = attempts.lockById(attemptId)
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy lượt thi."));
        authorize(attempt, profileId, attemptToken);
        ExamVersion version = versions.findById(attempt.getVersionId()).orElseThrow(ExamServiceImpl::notFound);
        if (!version.getExamId().equals(examId)) throw notFound();
        // Gửi lại (mạng chập chờn, bấm hai lần) thì trả kết quả đã chốt.
        if (attempt.getSubmittedAt() != null) return toDetailResponse(examId, attempt);

        Instant now = Instant.now();
        Instant expiresAt = attempt.getExpiresAt();
        boolean late = expiresAt != null && now.isAfter(expiresAt);
        boolean tooLate = expiresAt != null && now.isAfter(expiresAt.plus(SUBMIT_GRACE));
        // Quá hạn cộng thời gian ân hạn thì không nhận đáp án (tránh kéo dài giờ làm bằng cách giữ request).
        Map<Integer, Integer> submitted = tooLate || request == null || request.answers() == null
                ? Map.of() : request.answers();

        VersionContent content = load(attempt.getVersionId());
        Map<Integer, Integer> accepted = new HashMap<>();
        submitted.forEach((number, option) -> {
            if (number != null && option != null
                    && content.optionsByQuestion().getOrDefault(number, List.of()).stream()
                            .anyMatch(o -> o.number() == option)) {
                accepted.put(number, option);
            }
        });
        Grade grade = grade(content, accepted);

        Instant endedAt = late ? expiresAt : now;
        int elapsed = (int) Math.max(1, Duration.between(attempt.getStartedAt(), endedAt).toSeconds());
        attempt.submit(now, late ? "time_expired" : "manual", grade.correct(), grade.incorrect(), grade.blank(),
                elapsed, grade.score());
        accepted.forEach((number, option) ->
                attemptAnswers.save(new ExamAttemptAnswer(attempt.getId(), attempt.getVersionId(), number, option)));
        return toDetailResponse(examId, attempt, accepted, grade);
    }

    @Override
    public Optional<AttemptDetailResponse> getLatestAttempt(UUID examId, UUID profileId) {
        if (profileId == null) return Optional.empty();
        ExamVersion version = latestPublished(examId);
        return attempts.findFirstByProfileIdAndVersionIdAndSubmittedAtIsNotNullOrderBySubmittedAtDesc(
                        profileId, version.getId())
                .map(attempt -> toDetailResponse(examId, attempt));
    }

    @Override
    public AttemptDetailResponse getAttempt(UUID examId, UUID attemptId, UUID profileId, String attemptToken) {
        ExamAttempt attempt = attempts.findById(attemptId)
                .orElseThrow(() -> BusinessException.notFound("Không tìm thấy kết quả bài thi."));
        authorize(attempt, profileId, attemptToken);
        if (attempt.getSubmittedAt() == null) {
            throw BusinessException.notFound("Lượt thi này chưa được nộp.");
        }
        return toDetailResponse(examId, attempt);
    }

    @Override
    public List<AttemptSummaryResponse> listAttempts(UUID examId, UUID profileId) {
        if (profileId == null) return List.of();
        ExamVersion version = latestPublished(examId);
        return attempts.findByProfileIdAndVersionIdAndSubmittedAtIsNotNullOrderBySubmittedAtDesc(
                        profileId, version.getId()).stream()
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

    /** Chủ lượt thi: tài khoản sở hữu, hoặc khách cầm đúng token đã cấp khi bắt đầu. */
    private static void authorize(ExamAttempt attempt, UUID profileId, String attemptToken) {
        boolean allowed;
        if (attempt.getProfileId() != null) {
            allowed = attempt.getProfileId().equals(profileId);
        } else {
            allowed = attemptToken != null && attempt.getGuestTokenHash() != null
                    && MessageDigest.isEqual(attempt.getGuestTokenHash(), sha256(attemptToken));
        }
        if (!allowed) throw new BusinessException(ErrorCode.FORBIDDEN, "Bạn không có quyền với lượt thi này.");
    }

    private AttemptDetailResponse toDetailResponse(UUID examId, ExamAttempt attempt) {
        VersionContent content = load(attempt.getVersionId());
        Map<Integer, Integer> answers = attemptAnswers.findByIdAttemptIdOrderByIdQuestionNumberAsc(attempt.getId())
                .stream().collect(Collectors.toMap(a -> a.getId().questionNumber(), ExamAttemptAnswer::getOptionNumber));
        return toDetailResponse(examId, attempt, answers, grade(content, answers));
    }

    private static AttemptDetailResponse toDetailResponse(UUID examId, ExamAttempt attempt,
            Map<Integer, Integer> answers, Grade grade) {
        return new AttemptDetailResponse(
                attempt.getId(),
                examId,
                attempt.getScore() != null ? attempt.getScore() : grade.score(),
                attempt.getCorrectCount() != null ? attempt.getCorrectCount() : grade.correct(),
                attempt.getIncorrectCount() != null ? attempt.getIncorrectCount() : grade.incorrect(),
                attempt.getBlankCount() != null ? attempt.getBlankCount() : grade.blank(),
                attempt.getQuestionCount(),
                attempt.getElapsedSeconds() != null ? attempt.getElapsedSeconds() : 0,
                attempt.getSubmittedAt(),
                answers,
                grade.reviews());
    }

    /** Câu hỏi, lựa chọn và khóa đáp án của một phiên bản đề. */
    private record VersionContent(List<ExamQuestion> questions, Map<Integer, Integer> keys,
            Map<Integer, List<OptionResponse>> optionsByQuestion) {}

    private record Grade(int correct, int incorrect, int blank, BigDecimal score, List<QuestionReviewResponse> reviews) {}

    private VersionContent load(UUID versionId) {
        List<ExamQuestion> qList = questions.findByIdVersionIdOrderByIdQuestionNumber(versionId);
        Map<Integer, Integer> keys = answerKeys.findByIdVersionId(versionId).stream()
                .collect(Collectors.toMap(k -> k.getId().questionNumber(), ExamAnswerKey::getCorrectOptionNumber));
        Map<Integer, List<OptionResponse>> optionsByQuestion = options
                .findByIdVersionIdOrderByIdQuestionNumberAscIdOptionNumberAsc(versionId).stream()
                .collect(Collectors.groupingBy(o -> o.getId().questionNumber(),
                        Collectors.mapping(ExamServiceImpl::toOption, Collectors.toList())));
        return new VersionContent(qList, keys, optionsByQuestion);
    }

    private static Grade grade(VersionContent content, Map<Integer, Integer> answers) {
        int correct = 0;
        int incorrect = 0;
        int blank = 0;
        List<QuestionReviewResponse> reviews = new ArrayList<>();
        for (ExamQuestion q : content.questions()) {
            int qNum = q.getId().questionNumber();
            Integer key = content.keys().get(qNum);
            if (key == null) {
                // Không mặc định đáp án A: thiếu khóa là lỗi dữ liệu, cần báo để quản trị sửa.
                throw new IllegalStateException("Missing answer key for question " + qNum);
            }
            Integer userOpt = answers.get(qNum);
            boolean isCorrect = userOpt != null && userOpt.intValue() == key;
            if (userOpt == null) blank++;
            else if (isCorrect) correct++;
            else incorrect++;
            reviews.add(new QuestionReviewResponse(qNum, q.getPrompt(),
                    content.optionsByQuestion().getOrDefault(qNum, List.of()), key, userOpt, isCorrect,
                    q.getExplanation(), q.getTopicId()));
        }
        int total = content.questions().size();
        BigDecimal score = total == 0 ? BigDecimal.ZERO
                : BigDecimal.valueOf(correct * 10.0 / total).setScale(2, RoundingMode.HALF_UP);
        return new Grade(correct, incorrect, blank, score, reviews);
    }

    private static byte[] sha256(String value) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
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
