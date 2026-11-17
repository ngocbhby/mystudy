package vn.mystudy.exams.dto;

import java.util.Map;

public record SubmitAttemptRequest(
        int elapsedSeconds,
        Map<Integer, Integer> answers
) {}
