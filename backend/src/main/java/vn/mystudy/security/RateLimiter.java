package vn.mystudy.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;

/** Bộ đếm cửa sổ cố định trong bộ nhớ, giới hạn số khóa để không bị làm tràn bộ nhớ. */
public final class RateLimiter {

    private final Cache<String, AtomicInteger> counters;
    private final int limit;
    private final Duration window;

    public RateLimiter(int limit, Duration window, long maxKeys) {
        this.limit = limit;
        this.window = window;
        this.counters = Caffeine.newBuilder().expireAfterWrite(window).maximumSize(maxKeys).build();
    }

    /** Ghi nhận một lần thử và trả về {@code true} nếu vẫn trong giới hạn. */
    public boolean tryAcquire(String key) {
        return counters.get(key, k -> new AtomicInteger()).incrementAndGet() <= limit;
    }

    public boolean isBlocked(String key) {
        AtomicInteger counter = counters.getIfPresent(key);
        return counter != null && counter.get() >= limit;
    }

    /** Ghi nhận một lần thất bại mà không chặn ngay. */
    public void record(String key) {
        counters.get(key, k -> new AtomicInteger()).incrementAndGet();
    }

    public void reset(String key) {
        counters.invalidate(key);
    }

    public long windowSeconds() {
        return window.toSeconds();
    }
}
