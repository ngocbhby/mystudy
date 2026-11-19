package vn.mystudy.exams.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Lượt thi vừa bắt đầu. Đồng hồ trên trình duyệt đếm theo {@code expiresAt} của máy chủ ({@code serverTime} giúp
 * bù lệch giờ máy). {@code attemptToken} chỉ có với khách, phải gửi lại ở header {@code X-Attempt-Token}.
 */
public record StartAttemptResponse(UUID attemptId, Instant startedAt, Instant expiresAt, Instant serverTime,
        String attemptToken) {
}
