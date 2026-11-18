package vn.mystudy.ai;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;
import java.util.function.Supplier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import vn.mystudy.common.api.ErrorCode;
import vn.mystudy.common.exception.BusinessException;
import vn.mystudy.common.time.VietnamClock;

/** Hạn mức số lần gọi AI mỗi ngày của từng người học, lưu trong CSDL để không reset khi khởi động lại. */
@Service
public class AiQuotaService {

    private final NamedParameterJdbcTemplate jdbc;
    private final VietnamClock clock;
    private final int dailyLimit;

    AiQuotaService(NamedParameterJdbcTemplate jdbc, VietnamClock clock,
            @Value("${app.ai.daily-limit:30}") int dailyLimit) {
        this.jdbc = jdbc;
        this.clock = clock;
        this.dailyLimit = dailyLimit;
    }

    /** Ghi nhận một lượt gọi; vượt hạn mức thì báo lỗi trước khi tốn tiền gọi AI. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void consume(UUID profileId) {
        LocalDate today = clock.today();
        Integer used = jdbc.queryForObject("""
                INSERT INTO ai_usage (profile_id, usage_date, request_count) VALUES (:p, :d, 1)
                ON CONFLICT (profile_id, usage_date)
                DO UPDATE SET request_count = ai_usage.request_count + 1
                RETURNING request_count
                """, Map.of("p", profileId, "d", today), Integer.class);
        if (used != null && used > dailyLimit) {
            // Ném lỗi làm giao dịch riêng (REQUIRES_NEW) này rollback, nên lượt vượt hạn mức không bị cộng.
            throw new BusinessException(ErrorCode.RATE_LIMITED,
                    "Bạn đã dùng hết " + dailyLimit + " lượt hỏi AI hôm nay. Hãy quay lại vào ngày mai nhé.");
        }
    }

    /**
     * Gọi AI có tính lượt: trừ lượt trước (vượt hạn mức thì dừng trước khi tốn tiền), và hoàn lại lượt nếu lần gọi
     * thất bại (AI quá tải, hết thời gian chờ, từ chối trả lời...) để học sinh không mất lượt vì lỗi của hệ thống.
     */
    public <T> T metered(UUID profileId, Supplier<T> call) {
        consume(profileId);
        try {
            return call.get();
        } catch (RuntimeException e) {
            refund(profileId);
            throw e;
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void refund(UUID profileId) {
        jdbc.update("""
                UPDATE ai_usage SET request_count = request_count - 1
                WHERE profile_id = :p AND usage_date = :d AND request_count > 0
                """, Map.of("p", profileId, "d", clock.today()));
    }

    public int remaining(UUID profileId) {
        Integer used = jdbc.query("""
                SELECT request_count FROM ai_usage WHERE profile_id = :p AND usage_date = :d
                """, Map.of("p", profileId, "d", clock.today()), rs -> rs.next() ? rs.getInt(1) : 0);
        return Math.max(0, dailyLimit - (used == null ? 0 : used));
    }

    public int dailyLimit() {
        return dailyLimit;
    }
}
