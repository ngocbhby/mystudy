package vn.mystudy.exams.dto;

import java.util.List;

public record QuestionReviewResponse(
        int number,
        String prompt,
        List<OptionResponse> options,
        int correctOption,
        Integer userOption,
        boolean isCorrect,
        String explanation
) {}
