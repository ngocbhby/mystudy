-- V18: Bảng lưu trữ lịch sử khôi phục chuỗi học tập (Streak Recovery)
CREATE TABLE IF NOT EXISTS streak_recoveries (
    id UUID PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    recovered_date DATE NOT NULL,
    attempt_id_1 UUID REFERENCES exam_attempts(id) ON DELETE SET NULL,
    attempt_id_2 UUID REFERENCES exam_attempts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_streak_recoveries_profile_date UNIQUE (profile_id, recovered_date)
);

CREATE INDEX IF NOT EXISTS idx_streak_recoveries_profile ON streak_recoveries(profile_id);
