package vn.mystudy.exams.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record AttemptSummaryResponse(
        UUID id,
        UUID examId,
        BigDecimal score,
        int correctCount,
        int incorrectCount,
        int blankCount,
        int questionCount,
        int elapsedSeconds,
        Instant submittedAt
) {}
