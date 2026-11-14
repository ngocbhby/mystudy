package vn.mystudy.study.dto;

import java.util.UUID;

public record TaskResponse(
        UUID id,
        String subjectCode,
        String topic,
        String date,
        int minutes,
        String content,
        boolean completed) {
}
