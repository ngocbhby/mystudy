package vn.mystudy.exams.repository;

import java.util.UUID;

public record VersionQuestionCount(UUID versionId, long count) {
}
