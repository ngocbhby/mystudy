package vn.mystudy.exams.dto;

import java.util.List;
import java.util.UUID;

public record QuestionReviewResponse(
        int number,
        String prompt,
        List<OptionResponse> options,
        int correctOption,
        Integer userOption,
        boolean isCorrect,
        String explanation,
        UUID topicId
) {}
