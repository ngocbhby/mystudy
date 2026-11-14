package vn.mystudy.samples.dto;

import java.util.UUID;

public record SampleResponse(
        UUID id,
        String title,
        String subjectCode,
        UUID topicId,
        String topic,
        String exerciseType,
        String prompt,
        String modelSolution,
        String solutionNote,
        String source) {
}
