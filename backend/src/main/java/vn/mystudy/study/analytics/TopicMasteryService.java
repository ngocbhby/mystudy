package vn.mystudy.study.analytics;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

/**
 * Tính tỉ lệ đúng theo chuyên đề từ các lượt thi đã nộp trong 60 ngày gần nhất. Đây là phần "số liệu" của tính năng
 * phân tích điểm yếu: do mã chương trình tính (chính xác, kiểm chứng được), AI chỉ dùng kết quả này để viết nhận xét.
 */
@Service
public class TopicMasteryService {

    private static final String SQL = """
            SELECT q.topic_id, t.subject_code, t.name, t.curriculum_order,
                   count(*) AS total,
                   count(*) FILTER (WHERE a.option_number = k.correct_option_number) AS correct
            FROM exam_attempts at
            JOIN exam_questions q ON q.version_id = at.version_id
            JOIN topics t ON t.id = q.topic_id
            JOIN exam_answer_keys k ON k.version_id = q.version_id AND k.question_number = q.question_number
            LEFT JOIN exam_attempt_answers a ON a.attempt_id = at.id AND a.question_number = q.question_number
            WHERE at.profile_id = :profileId
              AND at.submitted_at IS NOT NULL
              AND at.submitted_at > now() - interval '60 days'
            GROUP BY q.topic_id, t.subject_code, t.name, t.curriculum_order
            ORDER BY t.subject_code, t.curriculum_order NULLS LAST, t.name
            """;

    private final NamedParameterJdbcTemplate jdbc;

    public TopicMasteryService(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<TopicMastery> forProfile(UUID profileId) {
        return jdbc.query(SQL, Map.of("profileId", profileId), (rs, i) -> new TopicMastery(
                rs.getObject("topic_id", UUID.class), rs.getString("subject_code"), rs.getString("name"),
                rs.getInt("correct"), rs.getInt("total")));
    }

    /** Số lượt thi đã nộp trong cùng khoảng thời gian (để biết nhận xét AI đã cũ chưa). */
    public int submittedAttempts(UUID profileId) {
        Integer count = jdbc.queryForObject("""
                SELECT count(*) FROM exam_attempts
                WHERE profile_id = :profileId AND submitted_at IS NOT NULL
                  AND submitted_at > now() - interval '60 days'
                """, Map.of("profileId", profileId), Integer.class);
        return count == null ? 0 : count;
    }

    public Map<UUID, Integer> scheduleWeights(UUID profileId) {
        return forProfile(profileId).stream()
                .filter(m -> m.scheduleWeight() > 1)
                .collect(Collectors.toMap(TopicMastery::topicId, TopicMastery::scheduleWeight));
    }
}
