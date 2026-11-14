package vn.mystudy.common.time;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import org.springframework.stereotype.Component;

/** Mọi tính toán "ngày học" đều theo múi giờ Việt Nam; tiêm {@link Clock} để kiểm thử dễ dàng. */
@Component
public class VietnamClock {

    public static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final Clock clock;

    public VietnamClock(Clock clock) {
        this.clock = clock;
    }

    public LocalDate today() {
        return LocalDate.now(clock.withZone(ZONE));
    }

    public Instant now() {
        return clock.instant();
    }
}
