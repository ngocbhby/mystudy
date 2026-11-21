package vn.mystudy.study.dto;

public record StreakInfoResponse(
        int currentStreak,
        boolean isBroken,
        String missedDate,
        int requiredExamsForRecovery,
        int availableExamsCount,
        boolean canRecover,
        int totalRecoveredDays
) {}
